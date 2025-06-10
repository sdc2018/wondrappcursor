import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stack,
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TaskIcon from '@mui/icons-material/Task';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// Import services
import clientService, { Client } from '../services/clientService';
import serviceService, { Service } from '../services/serviceService';
import opportunityService, { Opportunity } from '../services/opportunityService';
import taskService, { TaskStats, TaskWithDetails } from '../services/taskService';

// Define types for dashboard stats
interface DashboardStats {
  clients: { total: number, active: number, new: number };
  services: { total: number, active: number };
  opportunities: { total: number, new: number, inProgress: number, won: number, lost: number };
  tasks: { total: number, pending: number, inProgress: number, completed: number, overdue: number };
}

// Define types for recent opportunities with client name
interface RecentOpportunityWithClient {
  id: number;
  name: string;
  client: string;
  status: string;
  value: number;
}

const Dashboard: React.FC = () => {
  // State variables for loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State variables for dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    clients: { total: 0, active: 0, new: 0 },
    services: { total: 0, active: 0 },
    opportunities: { total: 0, new: 0, inProgress: 0, won: 0, lost: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 }
  });
  
  const [recentOpportunities, setRecentOpportunities] = useState<RecentOpportunityWithClient[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskWithDetails[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch client data
        const clients = await clientService.getAllClients();
        const activeClients = clients.filter(client => client.status === 'active');
        // Assuming clients created in the last 30 days are "new"
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newClients = clients.filter(client => 
          new Date(client.created_at) >= thirtyDaysAgo
        );
        
        // Fetch service data
        const services = await serviceService.getAllServices();
        const activeServices = services.filter(service => service.status === 'active');
        
        // Fetch opportunity data
        const opportunities = await opportunityService.getAllOpportunities();
        const newOpportunities = opportunities.filter(opp => opp.status === 'new');
        const inProgressOpportunities = opportunities.filter(opp => opp.status === 'in_progress');
        const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
        const lostOpportunities = opportunities.filter(opp => opp.status === 'lost');
        
        // Fetch task stats
        const taskStats = await taskService.getTaskStats();
        
        // Calculate total tasks
        const totalTasks = taskStats.pending_count + taskStats.in_progress_count + 
                          taskStats.completed_count + taskStats.overdue_count;
        
        // Update stats state
        setStats({
          clients: { 
            total: clients.length, 
            active: activeClients.length, 
            new: newClients.length 
          },
          services: { 
            total: services.length, 
            active: activeServices.length 
          },
          opportunities: {
            total: opportunities.length,
            new: newOpportunities.length,
            inProgress: inProgressOpportunities.length,
            won: wonOpportunities.length,
            lost: lostOpportunities.length
          },
          tasks: {
            total: totalTasks,
            pending: taskStats.pending_count,
            inProgress: taskStats.in_progress_count,
            completed: taskStats.completed_count,
            overdue: taskStats.overdue_count
          }
        });
        
        // Create client lookup map for recent opportunities
        const clientMap = new Map<number, string>();
        clients.forEach(client => {
          clientMap.set(client.id, client.name);
        });
        
        // Prepare recent opportunities data (5 most recent)
        const sortedOpportunities = [...opportunities].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5);
        
        const recentOppsWithClient = sortedOpportunities.map(opp => ({
          id: opp.id,
          name: opp.name,
          client: clientMap.get(opp.client_id) || 'Unknown Client',
          status: opp.status,
          value: opp.estimated_value
        }));
        
        setRecentOpportunities(recentOppsWithClient);
        
        // Fetch overdue tasks
        const overdueTasks = await taskService.getOverdueTasks();
        setOverdueTasks(overdueTasks);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <HourglassEmptyIcon color="info" />;
      case 'in_progress':
        return <HourglassEmptyIcon color="primary" />;
      case 'won':
        return <CheckCircleIcon color="success" />;
      case 'lost':
        return <PriorityHighIcon color="error" />;
      default:
        return <HourglassEmptyIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }} useFlexGap flexWrap="wrap">
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BusinessIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Clients</Typography>
            </Box>
            <Typography variant="h4">{stats.clients.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.clients.active} active, {stats.clients.new} new this month
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CategoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Services</Typography>
            </Box>
            <Typography variant="h4">{stats.services.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.services.active} active services
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Opportunities</Typography>
            </Box>
            <Typography variant="h4">{stats.opportunities.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.opportunities.new} new, {stats.opportunities.inProgress} in progress
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TaskIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Tasks</Typography>
            </Box>
            <Typography variant="h4">{stats.tasks.total}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ color: stats.tasks.overdue > 0 ? 'error.main' : 'text.secondary' }}>
              {stats.tasks.overdue} overdue tasks
            </Typography>
          </Paper>
        </Box>
      </Stack>
      
      {/* Recent Opportunities and Overdue Tasks */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} useFlexGap>
        <Box sx={{ flex: { xs: '1 1 100%', md: '7 7 calc(58.33% - 12px)' } }}>
          <Card>
            <CardHeader title="Recent Opportunities" />
            <Divider />
            <CardContent>
              {recentOpportunities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No recent opportunities found
                </Typography>
              ) : (
              <List>
                {recentOpportunities.map((opportunity) => (
                  <React.Fragment key={opportunity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(opportunity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={opportunity.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {opportunity.client}
                            </Typography>
                            {' — $'}
                            {opportunity.value.toLocaleString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
              )}
            </CardContent>
          </Card>
        </Box>
        
        {/* Overdue Tasks */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '5 5 calc(41.67% - 12px)' } }}>
          <Card>
            <CardHeader 
              title="Overdue Tasks" 
              sx={{ color: 'error.main' }}
              avatar={<PriorityHighIcon color="error" />}
            />
            <Divider />
            <CardContent>
              {overdueTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No overdue tasks
                </Typography>
              ) : (
              <List>
                {overdueTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem>
                      <ListItemIcon>
                        <TaskIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                                {task.opportunity_name}
                            </Typography>
                            {' — Due: '}
                              {new Date(task.due_date).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default Dashboard;