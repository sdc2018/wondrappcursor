import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { exportToCSV } from '../utils/csvUtils';

interface CSVFormatHelperProps {
  open: boolean;
  onClose: () => void;
  type: 'clients' | 'services' | 'opportunities' | 'tasks';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`csv-tabpanel-${index}`}
      aria-labelledby={`csv-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CSVFormatHelper: React.FC<CSVFormatHelperProps> = ({ open, onClose, type }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadTemplate = () => {
    const templates: Record<'clients' | 'services' | 'opportunities' | 'tasks', any[]> = {
      clients: [
        {
          name: 'Example Client Corp',
          industry: 'Technology',
          contact_name: 'John Doe',
          contact_email: 'john.doe@example.com',
          contact_phone: '+1-555-0123',
          address: '123 Business St, City, State 12345',
          account_owner_id: 1,
          services_used: '1;2',
          crm_link: 'https://crm.example.com/client/123',
          notes: 'Important client with high potential',
          status: 'active'
        }
      ],
      services: [
        {
          name: 'Digital Marketing Strategy',
          description: 'Comprehensive digital marketing planning and execution',
          business_unit: 'Digital Marketing',
          pricing_model: 'Project-based',
          pricing_details: '$5,000 - $15,000 per project',
          applicable_industries: 'Technology;Healthcare;Finance',
          client_role: 'CMO',
          status: 'active'
        }
      ],
      opportunities: [
        {
          name: 'Q1 Marketing Campaign',
          client_id: 1,
          service_id: 1,
          assigned_user_id: 1,
          status: 'new',
          priority: 'high',
          estimated_value: 10000,
          due_date: '2024-03-31',
          notes: 'High priority opportunity for Q1'
        }
      ],
      tasks: [
        {
          name: 'Review Marketing Proposal',
          opportunity_name: 'Q1 Marketing Campaign',
          assigned_user_name: 'admin',
          due_date: '2024-02-15',
          status: 'pending',
          description: 'Review and approve the marketing proposal for Q1 campaign'
        }
      ]
    };

    exportToCSV(templates[type], `${type}_import_template.csv`);
  };

  const getFormatData = () => {
    switch (type) {
      case 'clients':
        return {
          title: 'Clients CSV Format',
          description: 'Import format for client data. Do not include the "id" field when importing new clients.',
          required: ['name', 'industry', 'contact_name', 'contact_email', 'contact_phone', 'address', 'account_owner_id', 'status'],
          optional: ['services_used', 'crm_link', 'notes'],
          fields: [
            { name: 'name', type: 'Text', description: 'Client company name', example: 'Acme Corporation' },
            { name: 'industry', type: 'Text', description: 'Industry sector', example: 'Technology' },
            { name: 'contact_name', type: 'Text', description: 'Primary contact person', example: 'John Smith' },
            { name: 'contact_email', type: 'Email', description: 'Contact email address', example: 'john@acme.com' },
            { name: 'contact_phone', type: 'Text', description: 'Contact phone number', example: '+1-555-0123' },
            { name: 'address', type: 'Text', description: 'Company address', example: '123 Main St, City, State' },
            { name: 'account_owner_id', type: 'Number', description: 'ID of the account owner (user)', example: '1' },
            { name: 'services_used', type: 'Array', description: 'Service IDs separated by semicolons', example: '1;2;3' },
            { name: 'crm_link', type: 'URL', description: 'Link to CRM system', example: 'https://crm.example.com/123' },
            { name: 'notes', type: 'Text', description: 'Additional notes', example: 'Important client notes' },
            { name: 'status', type: 'Text', description: 'Client status', example: 'active' }
          ]
        };
      case 'services':
        return {
          title: 'Services CSV Format',
          description: 'Import format for service data. Do not include the "id" field when importing new services.',
          required: ['name', 'description', 'business_unit', 'pricing_model', 'client_role', 'status'],
          optional: ['pricing_details', 'applicable_industries'],
          fields: [
            { name: 'name', type: 'Text', description: 'Service name', example: 'Digital Marketing' },
            { name: 'description', type: 'Text', description: 'Service description', example: 'Complete digital marketing solution' },
            { name: 'business_unit', type: 'Text', description: 'Business unit name', example: 'Digital Marketing' },
            { name: 'pricing_model', type: 'Text', description: 'Pricing model', example: 'Project-based' },
            { name: 'pricing_details', type: 'Text', description: 'Pricing details', example: '$5,000 - $15,000' },
            { name: 'applicable_industries', type: 'Array', description: 'Industries separated by semicolons', example: 'Technology;Healthcare' },
            { name: 'client_role', type: 'Text', description: 'Target client role', example: 'CMO' },
            { name: 'status', type: 'Text', description: 'Service status', example: 'active' }
          ]
        };
      case 'opportunities':
        return {
          title: 'Opportunities CSV Format',
          description: 'Import format for opportunity data. Do not include the "id" field when importing new opportunities.',
          required: ['name', 'client_id', 'service_id', 'assigned_user_id', 'status', 'priority', 'estimated_value', 'due_date'],
          optional: ['notes'],
          fields: [
            { name: 'name', type: 'Text', description: 'Opportunity name', example: 'Q1 Marketing Campaign' },
            { name: 'client_id', type: 'Number', description: 'Client ID', example: '1' },
            { name: 'service_id', type: 'Number', description: 'Service ID', example: '1' },
            { name: 'assigned_user_id', type: 'Number', description: 'Assigned user ID', example: '1' },
            { name: 'status', type: 'Text', description: 'Opportunity status', example: 'new' },
            { name: 'priority', type: 'Text', description: 'Priority level', example: 'high' },
            { name: 'estimated_value', type: 'Number', description: 'Estimated value in dollars', example: '10000' },
            { name: 'due_date', type: 'Date', description: 'Due date (YYYY-MM-DD)', example: '2024-03-31' },
            { name: 'notes', type: 'Text', description: 'Additional notes', example: 'High priority opportunity' }
          ]
        };
      case 'tasks':
        return {
          title: 'Tasks CSV Format',
          description: 'Import format for task data. Use opportunity names and usernames for easier imports - the system will automatically resolve them to IDs.',
          required: ['name'],
          optional: ['opportunity_name', 'assigned_user_name', 'due_date', 'status', 'description'],
          fields: [
            { name: 'name', type: 'Text', description: 'Task name', example: 'Review Marketing Proposal' },
            { name: 'opportunity_name', type: 'Text', description: 'Opportunity name (will be resolved to ID)', example: 'Q1 Marketing Campaign' },
            { name: 'assigned_user_name', type: 'Text', description: 'Username (will be resolved to ID)', example: 'admin' },
            { name: 'due_date', type: 'Date', description: 'Due date (YYYY-MM-DD)', example: '2024-02-15' },
            { name: 'status', type: 'Text', description: 'Task status (pending, in_progress, completed, on_hold, cancelled)', example: 'pending' },
            { name: 'description', type: 'Text', description: 'Task description', example: 'Review and approve the marketing proposal' }
          ]
        };
      default:
        return { title: '', description: '', required: [], optional: [], fields: [] };
    }
  };

  const formatData = getFormatData();

  const csvExample = () => {
    const headers = formatData.fields.map(field => field.name).join(',');
    const exampleRow = formatData.fields.map(field => field.example).join(',');
    return `${headers}\n${exampleRow}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {formatData.title}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            size="small"
          >
            Download Template
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {formatData.description}
        </Alert>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Field Reference" />
          <Tab label="CSV Example" />
          <Tab label="Import Tips" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Field Reference
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary">Required Fields:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {formatData.required.map((field) => (
                <Chip key={field} label={field} color="error" size="small" />
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary">Optional Fields:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {formatData.optional.map((field) => (
                <Chip key={field} label={field} color="default" size="small" />
              ))}
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Field Name</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Example</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formatData.fields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <code>{field.name}</code>
                        {formatData.required.includes(field.name) && (
                          <Chip label="Required" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{field.type}</TableCell>
                    <TableCell>{field.description}</TableCell>
                    <TableCell><code>{field.example}</code></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            CSV Example
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {csvExample()}
              </pre>
            </Paper>
            <Tooltip title="Copy to clipboard">
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => copyToClipboard(csvExample())}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Import Tips
          </Typography>
          <Box sx={{ '& > *': { mb: 2 } }}>
            <Alert severity="warning">
              <strong>Important:</strong> Do not include the "id" field when importing new records. The system will automatically assign IDs.
            </Alert>
            
            <Alert severity="info">
              <strong>Array Fields:</strong> For fields that accept multiple values (like services_used or applicable_industries), separate values with semicolons (;).
              <br />
              Example: <code>Technology;Healthcare;Finance</code>
            </Alert>
            
            <Alert severity="info">
              <strong>Date Format:</strong> Use YYYY-MM-DD format for dates.
              <br />
              Example: <code>2024-03-31</code>
            </Alert>
            
            <Alert severity="info">
              <strong>Numbers:</strong> Use plain numbers without currency symbols or commas.
              <br />
              Example: <code>10000</code> (not $10,000)
            </Alert>
            
            <Alert severity="success">
              <strong>Tip:</strong> Download the template file above to get started with the correct format.
            </Alert>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVFormatHelper;
