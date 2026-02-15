# AWS Free Tier Deployment Guide

Deployment guide for the Wondrlab Cross-Selling Management System on AWS Free Tier.

## Architecture Overview

```
                    ┌──────────────┐
                    │  Route 53    │
                    │  (DNS)       │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐     ┌──────────▼──────────┐
     │  CloudFront     │     │  EC2 (t2.micro)     │
     │  Distribution   │     │  Backend API        │
     │                 │     │  Node.js + Express   │
     └────────┬────────┘     └──────────┬──────────┘
              │                         │
     ┌────────▼────────┐     ┌──────────▼──────────┐
     │  S3 Bucket      │     │  RDS (db.t3.micro)  │
     │  React Build    │     │  PostgreSQL          │
     │  Static Files   │     │  20 GB Storage       │
     └─────────────────┘     └─────────────────────┘
```

| Component | AWS Service | Free Tier Allocation |
|-----------|-------------|---------------------|
| Frontend  | S3 + CloudFront | 5 GB storage, 20K GET requests/mo, 1 TB CloudFront transfer (first 12 months) |
| Backend   | EC2 t2.micro | 750 hrs/mo (first 12 months) |
| Database  | RDS db.t3.micro | 750 hrs/mo, 20 GB SSD (first 12 months) |
| DNS       | Route 53 | $0.50/hosted zone (not free tier, but minimal cost) |

## Prerequisites

- AWS account with free tier eligibility
- AWS CLI installed and configured (`aws configure`)
- Domain name (optional, can use AWS-provided endpoints)
- Local builds verified working (backend compiles, frontend builds)

---

## Step 1: Set Up RDS PostgreSQL

### 1.1 Create the Database Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier wondrlab-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username wondrlab_admin \
  --master-user-password '<STRONG_PASSWORD>' \
  --allocated-storage 20 \
  --storage-type gp2 \
  --no-multi-az \
  --publicly-accessible \
  --backup-retention-period 7 \
  --db-name wondrlab \
  --vpc-security-group-ids <SECURITY_GROUP_ID>
```

### 1.2 Configure Security Group

Create a security group that allows inbound PostgreSQL traffic from your EC2 instance:

```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name wondrlab-rds-sg \
  --description "Security group for Wondrlab RDS PostgreSQL"

# Allow inbound PostgreSQL (port 5432) from EC2 security group
aws ec2 authorize-security-group-ingress \
  --group-name wondrlab-rds-sg \
  --protocol tcp \
  --port 5432 \
  --source-group wondrlab-ec2-sg
```

### 1.3 Note the Endpoint

Once the instance is available (~10 minutes):

```bash
aws rds describe-db-instances \
  --db-instance-identifier wondrlab-db \
  --query 'DBInstances[0].Endpoint'
```

Save the endpoint address (e.g., `wondrlab-db.xxxx.us-east-1.rds.amazonaws.com`).

---

## Step 2: Set Up EC2 for the Backend

### 2.1 Launch an EC2 Instance

```bash
# Launch Ubuntu 22.04 t2.micro instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t2.micro \
  --key-name wondrlab-key \
  --security-group-ids <EC2_SECURITY_GROUP_ID> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=wondrlab-backend}]'
```

### 2.2 Configure EC2 Security Group

```bash
# Create security group for EC2
aws ec2 create-security-group \
  --group-name wondrlab-ec2-sg \
  --description "Security group for Wondrlab backend"

# Allow SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-name wondrlab-ec2-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-name wondrlab-ec2-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-name wondrlab-ec2-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow backend API port (5000)
aws ec2 authorize-security-group-ingress \
  --group-name wondrlab-ec2-sg \
  --protocol tcp --port 5000 --cidr 0.0.0.0/0
```

### 2.3 SSH and Install Dependencies

```bash
ssh -i wondrlab-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx as reverse proxy
sudo apt install -y nginx
```

### 2.4 Deploy Backend Code

```bash
# On your local machine - build and transfer
cd backend
npm run build

# Transfer to EC2
scp -i wondrlab-key.pem -r dist/ package.json package-lock.json \
  ubuntu@<EC2_PUBLIC_IP>:~/wondrlab-backend/
```

### 2.5 Configure Backend Environment

On the EC2 instance:

```bash
cd ~/wondrlab-backend
npm install --production

# Create environment file
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://wondrlab_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/wondrlab
JWT_SECRET=<GENERATE_A_STRONG_SECRET>
CORS_ORIGIN=https://your-cloudfront-domain.cloudfront.net
EOF
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.6 Start with PM2

```bash
# Start the application
pm2 start dist/server.js --name wondrlab-api

# Save PM2 process list and configure startup
pm2 save
pm2 startup
# Run the command it outputs (sudo env PATH=...)

# Seed the database (first time only)
# Transfer seed scripts and run with ts-node, or run SQL directly
```

### 2.7 Configure Nginx Reverse Proxy

```bash
sudo tee /etc/nginx/sites-available/wondrlab-api << 'EOF'
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/wondrlab-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 3: Deploy Frontend to S3 + CloudFront

### 3.1 Build the Frontend

```bash
cd frontend

# Set the API URL to point to your EC2 backend
REACT_APP_API_URL=https://<YOUR_API_DOMAIN>/api npm run build
```

### 3.2 Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://wondrlab-frontend

# Enable static website hosting
aws s3 website s3://wondrlab-frontend \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read access
aws s3api put-bucket-policy --bucket wondrlab-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::wondrlab-frontend/*"
  }]
}'
```

### 3.3 Upload Build Files

```bash
# Sync build output to S3
aws s3 sync build/ s3://wondrlab-frontend --delete

# Set cache headers for static assets
aws s3 sync build/static/ s3://wondrlab-frontend/static/ \
  --cache-control "max-age=31536000" --delete
```

### 3.4 Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name wondrlab-frontend.s3.amazonaws.com \
  --default-root-object index.html \
  --query 'Distribution.DomainName'
```

Configure a custom error response for SPA routing (React Router):
- Error code: 403 → Response: `/index.html`, Status: 200
- Error code: 404 → Response: `/index.html`, Status: 200

This can be done in the AWS Console under CloudFront > Distribution > Error Pages.

---

## Step 4: Database Seeding

SSH into the EC2 instance and seed the database:

```bash
cd ~/wondrlab-backend

# Option A: If you transferred the scripts directory with ts-node available
npx ts-node scripts/seedData.ts

# Option B: Connect directly to RDS and run SQL
psql postgresql://wondrlab_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/wondrlab
```

---

## Step 5: SSL/HTTPS Setup (Recommended)

### For Backend (EC2 + Nginx)

Use Let's Encrypt with Certbot (free SSL):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### For Frontend (CloudFront)

Request a free certificate via AWS Certificate Manager (ACM):

```bash
aws acm request-certificate \
  --domain-name app.yourdomain.com \
  --validation-method DNS
```

Then attach it to your CloudFront distribution.

---

## Step 6: Environment Variable Summary

### Backend `.env` (on EC2)

```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://wondrlab_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/wondrlab
JWT_SECRET=<64_BYTE_HEX_SECRET>
CORS_ORIGIN=https://app.yourdomain.com
```

### Frontend Build-Time Variables

```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## Post-Deployment Checklist

- [ ] RDS instance is running and accessible from EC2
- [ ] Backend starts without errors (`pm2 logs wondrlab-api`)
- [ ] Database tables are initialized on first boot
- [ ] Seed data is loaded (test login with `admin@wondrlab.com`)
- [ ] Frontend loads from CloudFront URL
- [ ] Frontend can reach backend API (check browser console)
- [ ] CORS is configured for the CloudFront domain
- [ ] SSL certificates are active
- [ ] PM2 is configured to restart on EC2 reboot

## Monitoring and Maintenance

### Logs

```bash
# Backend application logs
pm2 logs wondrlab-api

# Nginx access/error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updating the Application

```bash
# Backend
cd ~/wondrlab-backend
pm2 stop wondrlab-api
# Transfer new dist/ and package.json
npm install --production
pm2 start wondrlab-api

# Frontend
cd frontend
REACT_APP_API_URL=https://api.yourdomain.com/api npm run build
aws s3 sync build/ s3://wondrlab-frontend --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

### Free Tier Monitoring

Set up a billing alarm to avoid unexpected charges:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "FreeTierBillingAlarm" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 5.00 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions <SNS_TOPIC_ARN> \
  --dimensions Name=Currency,Value=USD
```

## Cost Estimate (Free Tier)

| Service | Monthly Cost (Free Tier) | After Free Tier |
|---------|--------------------------|-----------------|
| EC2 t2.micro | $0 (750 hrs) | ~$8.50/mo |
| RDS db.t3.micro | $0 (750 hrs) | ~$13/mo |
| S3 | $0 (5 GB) | ~$0.02/mo |
| CloudFront | $0 (1 TB) | ~$0.085/GB |
| Route 53 | ~$0.50/zone | ~$0.50/zone |
| **Total** | **~$0.50/mo** | **~$22/mo** |
