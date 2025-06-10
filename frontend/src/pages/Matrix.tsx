import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableContainer, 
  TableHead, 
  TableBody,
  TableRow, 
  TableCell,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  Autocomplete
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, useLocation } from 'react-router-dom';

// Services
import opportunityService, { MatrixData, Opportunity, OpportunityInput } from '../services/opportunityService';
import userService from '../services/userService';
import { User } from '../services/authService';

// Status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' }
];

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const Matrix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ clientId: number; serviceId: number } | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  // Search and filter state
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Legend filter state for interactive filtering
  const [legendFilter, setLegendFilter] = useState<string | null>(null); // 'existing', 'potential', or null for all
  
  // Form data for creating new opportunities
  const [formData, setFormData] = useState<OpportunityInput>({
    name: '',
    client_id: 0,
    service_id: 0,
    assigned_user_id: 0,
    status: 'new',
    priority: 'medium',
    estimated_value: 0,
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    // Fetch matrix data from API
    const fetchMatrixData = async () => {
      try {
        setLoading(true);
        // Get matrix data from the API
        const data = await opportunityService.getMatrixData();
        setMatrixData(data);
        
        // Get all opportunities for additional details
        const allOpportunities = await opportunityService.getAllOpportunities();
        setOpportunities(allOpportunities);
        
        // Get all users for the assigned user dropdown
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching matrix data:', err);
        setError('Failed to load matrix data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [location]); // Add location to dependency array to refetch data when navigating back to the page

  const handleCellClick = (clientId: number, serviceId: number) => {
    // Check if there's an opportunity for this client-service combination
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    if (cell && cell.status === 'opportunity' && cell.opportunity_id) {
      // Find the opportunity details
      const opportunity = opportunities.find(o => o.id === cell.opportunity_id);
      if (opportunity) {
        setSelectedOpportunity(opportunity);
        setOpenDetailsDialog(true);
        return;
      }
    }
    
    // If there's no opportunity, open the create dialog
    setSelectedCell({ clientId, serviceId });
    
    // Initialize form data with the selected client and service
    setFormData({
      name: '',
      client_id: clientId,
      service_id: serviceId,
      assigned_user_id: 0,
      status: 'new',
      priority: 'medium',
      estimated_value: 0,
      due_date: '',
      notes: ''
    });
    
    setOpenCreateDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedOpportunity(null);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setSelectedCell(null);
    setError(null);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'estimated_value' ? Number(value) : value
    });
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'estimated_value' ? Number(value) : value
    });
  };

  const handleCreateOpportunity = async () => {
    // Validate form data
    if (!formData.name || !formData.client_id || !formData.service_id || !formData.assigned_user_id || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Create new opportunity directly from the matrix
      const newOpportunity = await opportunityService.createOpportunity(formData);
      console.log('Opportunity created successfully:', newOpportunity);
      
      // Add the new opportunity to the local state
      setOpportunities([...opportunities, newOpportunity]);
      
      // Update the matrix data to reflect the new opportunity
      if (matrixData && selectedCell) {
        const updatedMatrix = { ...matrixData };
        
        // Ensure the matrix object has the client_id key
        if (!updatedMatrix.matrix[selectedCell.clientId]) {
          updatedMatrix.matrix[selectedCell.clientId] = {};
        }
        
        // Update the cell to show it now has an opportunity
        updatedMatrix.matrix[selectedCell.clientId][selectedCell.serviceId] = {
          status: 'opportunity',
          opportunity_id: newOpportunity.id
        };
        
        setMatrixData(updatedMatrix);
      }
      
      // Close the dialog
      handleCloseCreateDialog();
    } catch (err) {
      console.error('Error creating opportunity:', err);
      setError('Failed to create opportunity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCellStyle = (clientId: number, serviceId: number) => {
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    // Determine cell type for legend filtering
    let cellType = 'potential'; // default
    
    if (cell?.status === 'active') {
      cellType = 'active';
    } else if (cell && (cell.status === 'opportunity' || 
        (cell.status !== null && cell.status !== undefined && 
         ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'].includes(cell.status)))) {
      cellType = 'existing';
    }
    
    // Apply legend filter opacity
    let opacity = 1;
    if (legendFilter) {
      if (legendFilter === 'existing' && cellType !== 'existing') {
        opacity = 0.3;
      } else if (legendFilter === 'potential' && cellType !== 'potential') {
        opacity = 0.3;
      }
    }
    
    if (!cell) {
      return {
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        opacity: opacity,
        '&:hover': {
          backgroundColor: '#e0e0e0',
          opacity: 1,
        }
      };
    }
    
    if (cell.status === 'active') {
      return {
        backgroundColor: '#e8f5e9', // Light green
        cursor: 'default',
        opacity: opacity,
        '&:hover': {
          opacity: 1,
        }
      };
    }
    
    // Check if it's an opportunity - either explicitly marked as 'opportunity' or has any valid opportunity status
    if (cell.status === 'opportunity' || 
        (cell.status !== null && cell.status !== undefined && ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'].includes(cell.status))) {
      return {
        backgroundColor: '#fff8e1', // Light amber
        cursor: 'pointer',
        opacity: opacity,
        '&:hover': {
          backgroundColor: '#ffecb3',
          opacity: 1,
        }
      };
    }
    
    return {
      backgroundColor: '#f5f5f5',
      cursor: 'pointer',
      opacity: opacity,
      '&:hover': {
        backgroundColor: '#e0e0e0',
        opacity: 1,
      }
    };
  };

  const getCellContent = (clientId: number, serviceId: number) => {
    const cell = matrixData?.matrix[clientId]?.[serviceId];
    
    if (!cell) {
      return (
        <Tooltip title="Create opportunity">
          <AddIcon color="disabled" fontSize="small" />
        </Tooltip>
      );
    }
    
    if (cell.status === 'active') {
      return (
        <Tooltip title="Active service">
          <CheckCircleIcon color="success" fontSize="small" />
        </Tooltip>
      );
    }
    
    // Check if it's an opportunity - either explicitly marked as 'opportunity' or has any valid opportunity status
    if (cell.status === 'opportunity' || 
        (cell.status !== null && cell.status !== undefined && ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'].includes(cell.status))) {
      const opportunity = opportunities.find(o => o.id === cell.opportunity_id);
      return (
        <Tooltip title={`Opportunity: ${opportunity?.name || 'Unknown'} (${cell.status})`}>
          <PendingIcon color="warning" fontSize="small" />
        </Tooltip>
      );
    }
    
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusChip = (status: string) => {
    let color;
    let label = status;
    
    // Find the status option to get the label
    const statusOption = statusOptions.find(s => s.value === status);
    if (statusOption) {
      label = statusOption.label;
    }
    
    // Determine color based on status
    switch (status) {
      case 'new':
        color = 'info';
        break;
      case 'in_progress':
        color = 'primary';
        break;
      case 'qualified':
        color = 'secondary';
        break;
      case 'proposal':
      case 'negotiation':
        color = 'warning';
        break;
      case 'won':
        color = 'success';
        break;
      case 'lost':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={label} color={color as any} size="small" />;
  };

  // Get unique business units for filter
  const businessUnits = useMemo(() => {
    if (!matrixData?.services) return [];
    
    const uniqueBusinessUnits = Array.from(
      new Set(matrixData.services.map(service => service.business_unit))
    );
    
    return uniqueBusinessUnits;
  }, [matrixData?.services]);
  
  // Filter clients based on search term only (no legend filter here to avoid circular dependency)
  const filteredClients = useMemo(() => {
    if (!matrixData?.clients) return [];
    
    return matrixData.clients.filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [matrixData?.clients, clientSearchTerm]);
  
  // Filter services based on search term and selected business units only (no legend filter here to avoid circular dependency)
  const filteredServices = useMemo(() => {
    if (!matrixData?.services) return [];
    
    return matrixData.services.filter(service => {
      const matchesSearchTerm = service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase());
      const matchesBusinessUnit = selectedBusinessUnits.length === 0 || 
                                 selectedBusinessUnits.includes(service.business_unit);
      
      return matchesSearchTerm && matchesBusinessUnit;
    });
  }, [matrixData?.services, serviceSearchTerm, selectedBusinessUnits]);
    
  // Apply legend filtering to the display by filtering which clients and services are shown
  const displayClients = useMemo(() => {
    if (!legendFilter) return filteredClients;
    
    return filteredClients.filter(client => {
        // Check if this client has any cells that match the legend filter
        return filteredServices.some(service => {
          const cell = matrixData?.matrix[client.id]?.[service.id];
          
          if (legendFilter === 'existing') {
            // Show clients with existing opportunities (amber cells)
            return cell && (cell.status === 'opportunity' || 
                          (cell.status !== null && cell.status !== undefined && 
                           ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'].includes(cell.status)));
          } else if (legendFilter === 'potential') {
            // Show clients with potential opportunities (gray cells - no existing relationship)
            return !cell || (cell.status === null || cell.status === undefined);
          }
          
          return false;
        });
      });
  }, [filteredClients, filteredServices, legendFilter, matrixData?.matrix]);
  
  const displayServices = useMemo(() => {
    if (!legendFilter) return filteredServices;
      
    return filteredServices.filter(service => {
        // Check if this service has any cells that match the legend filter
      return displayClients.some(client => {
          const cell = matrixData?.matrix[client.id]?.[service.id];
          
          if (legendFilter === 'existing') {
            // Show services with existing opportunities (amber cells)
            return cell && (cell.status === 'opportunity' || 
                          (cell.status !== null && cell.status !== undefined && 
                           ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'].includes(cell.status)));
          } else if (legendFilter === 'potential') {
            // Show services with potential opportunities (gray cells - no existing relationship)
            return !cell || (cell.status === null || cell.status === undefined);
          }
          
          return false;
        });
      });
  }, [filteredServices, displayClients, legendFilter, matrixData?.matrix]);
  
  if (loading && !matrixData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cross-Sell Opportunity Matrix</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={() => {
              setLoading(true);
              const fetchMatrixData = async () => {
                try {
                  // Get matrix data from the API
                  const data = await opportunityService.getMatrixData();
                  setMatrixData(data);
                  
                  // Get all opportunities for additional details
                  const allOpportunities = await opportunityService.getAllOpportunities();
                  setOpportunities(allOpportunities);
                  
                  setError(null);
                } catch (err) {
                  console.error('Error refreshing matrix data:', err);
                  setError('Failed to refresh matrix data. Please try again.');
                } finally {
                  setLoading(false);
                }
              };
              fetchMatrixData();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Search and Filter Section - Font sizes reduced by 30% */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1.05rem' }}>Search & Filters</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Search Clients"
                variant="outlined"
                size="small"
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.875rem' }
                }}
                InputLabelProps={{
                  sx: { fontSize: '0.875rem' }
                }}
              />
              <TextField
                fullWidth
                label="Search Services"
                variant="outlined"
                size="small"
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.875rem' }
                }}
                InputLabelProps={{
                  sx: { fontSize: '0.875rem' }
                }}
              />
            </Stack>
            <Autocomplete
              multiple
              size="small"
              options={businessUnits}
              value={selectedBusinessUnits}
              onChange={(_, newValue) => setSelectedBusinessUnits(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Filter by Business Unit"
                  placeholder="Select Business Units"
                  InputProps={{
                    ...params.InputProps,
                    sx: { fontSize: '0.875rem' }
                  }}
                  InputLabelProps={{
                    sx: { fontSize: '0.875rem' }
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))
              }
              sx={{
                '& .MuiAutocomplete-option': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Stack>
        </Paper>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Interactive Legend</Typography>
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              border: legendFilter === null ? '2px solid #1976d2' : '1px solid transparent',
              backgroundColor: legendFilter === null ? '#e3f2fd' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={() => setLegendFilter(null)}
          >
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e8f5e9', mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: legendFilter === null ? 'bold' : 'normal' }}>
              Active Service
            </Typography>
          </Box>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              border: legendFilter === 'existing' ? '2px solid #1976d2' : '1px solid transparent',
              backgroundColor: legendFilter === 'existing' ? '#e3f2fd' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={() => setLegendFilter(legendFilter === 'existing' ? null : 'existing')}
          >
            <Box sx={{ width: 20, height: 20, backgroundColor: '#fff8e1', mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: legendFilter === 'existing' ? 'bold' : 'normal' }}>
              Existing Opportunities
            </Typography>
          </Box>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              border: legendFilter === 'potential' ? '2px solid #1976d2' : '1px solid transparent',
              backgroundColor: legendFilter === 'potential' ? '#e3f2fd' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
            onClick={() => setLegendFilter(legendFilter === 'potential' ? null : 'potential')}
          >
            <Box sx={{ width: 20, height: 20, backgroundColor: '#f5f5f5', mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: legendFilter === 'potential' ? 'bold' : 'normal' }}>
              Potential Opportunities
            </Typography>
          </Box>
        </Stack>
        {legendFilter && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
            Click on a legend item again to show all opportunities, or click "Active Service" to reset filter.
          </Typography>
        )}
      </Paper>

      <Paper>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                {displayServices.map(service => (
                  <TableCell key={service.id} align="center">
                    <Tooltip title={service.business_unit}>
                      <Typography variant="body2" noWrap>
                        {service.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {client.name}
                    </Typography>
                  </TableCell>
                  {displayServices.map(service => (
                    <TableCell 
                      key={service.id} 
                      align="center"
                      onClick={() => handleCellClick(client.id, service.id)}
                      sx={getCellStyle(client.id, service.id)}
                    >
                      {getCellContent(client.id, service.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Opportunity Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">
              Opportunity Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedOpportunity && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{selectedOpportunity.name}</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                      <Typography variant="body1">
                        {matrixData?.clients.find(c => c.id === selectedOpportunity.client_id)?.name}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                      <Typography variant="body1">
                        {(() => {
                          const service = matrixData?.services.find(s => s.id === selectedOpportunity.service_id);
                          return service ? `${service.name} (${service.business_unit})` : 'Unknown';
                        })()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1">
                        {users.find(u => u.id === selectedOpportunity.assigned_user_id)?.username || `ID: ${selectedOpportunity.assigned_user_id}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      {getStatusChip(selectedOpportunity.status)}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Estimated Value</Typography>
                      <Typography variant="body1">{formatCurrency(selectedOpportunity.estimated_value)}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                      <Typography variant="body1">
                        {new Date(selectedOpportunity.due_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
                
              <Box sx={{ width: '100%', mt: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedOpportunity.notes}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedOpportunity) {
                navigate(`/opportunities`, { 
                  state: { 
                    editId: selectedOpportunity.id 
                  } 
                });
              }
              handleCloseDetailsDialog();
            }}
          >
            Edit Opportunity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Opportunity Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle>Create New Opportunity</DialogTitle>
        <DialogContent>
          {selectedCell && (
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Opportunity Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Client</InputLabel>
                <Select
                  name="client_id"
                  value={formData.client_id ? formData.client_id.toString() : '0'}
                  label="Client"
                  disabled // Disabled because it's pre-selected from the matrix
                >
                  {matrixData?.clients.map((client) => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Service</InputLabel>
                <Select
                  name="service_id"
                  value={formData.service_id ? formData.service_id.toString() : '0'}
                  label="Service"
                  disabled // Disabled because it's pre-selected from the matrix
                >
                  {matrixData?.services.map((service) => (
                    <MenuItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.business_unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Assigned User</InputLabel>
                <Select
                  name="assigned_user_id"
                  value={formData.assigned_user_id ? formData.assigned_user_id.toString() : ''}
                  label="Assigned User"
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      assigned_user_id: parseInt(e.target.value, 10)
                    });
                  }}
                >
                  <MenuItem value="">Select User</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleSelectChange}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                fullWidth
                label="Estimated Value"
                name="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                label="Due Date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateOpportunity}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Opportunity'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Matrix;
