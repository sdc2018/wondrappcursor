import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Stack,
  Autocomplete,
  TableSortLabel,
  InputAdornment,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import services
import clientService, { Client, ClientInput } from '../services/clientService';
import serviceService, { Service } from '../services/serviceService';
import userService from '../services/userService';
import { exportToCSV, parseCSVFile, validateCSVData, prepareDataForImport, exportForImport } from '../utils/csvUtils';
import CSVFormatHelper from '../components/CSVFormatHelper';

// Define User interface locally since it's not exported from userService
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Define industries
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Entertainment',
  'Automotive',
  'Food & Beverage',
  'Travel & Tourism',
  'Energy',
  'Telecommunications',
  'Construction',
  'Government',
  'Non-profit',
  'Other'
];

// Define status options
const statusOptions = ['active', 'inactive', 'prospect'];

// Define sort configuration type
type SortField = 'name' | 'industry' | 'account_owner_id' | 'services_used';
interface SortConfig {
  field: SortField;
  direction: 'asc' | 'desc';
}

const Clients: React.FC = () => {
  // State variables
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accountOwners, setAccountOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingAccountOwners, setLoadingAccountOwners] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormatHelper, setShowFormatHelper] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' });
  
  // Multi-select state
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  
  // File input ref for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    account_owner_id: 0,
    services_used: [] as number[],
    crm_link: '',
    notes: '',
    status: 'active'
  });

  // Handler for CSV import button click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handler for file selection and CSV import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    
    try {
      setLoading(true);
      setError(null);
      
      const parsedData = await parseCSVFile(file);
      
      // Validate the CSV data - account_owner_id is now optional (will default to admin)
      const requiredFields = ['name', 'industry', 'contact_name', 'contact_email', 'status'];
      const validationResult = validateCSVData(parsedData, requiredFields, 'clients');
      
      if (!validationResult.valid) {
        setError(`CSV validation failed:\n${validationResult.errors.join('\n')}`);
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('CSV Import Warnings:', validationResult.warnings);
      }
      
      // Prepare data for import
      const processedData = prepareDataForImport(parsedData, 'clients');
      
      // Create clients from CSV data
      for (let i = 0; i < processedData.length; i++) {
        const clientData = processedData[i];
        try {
        await clientService.createClient(clientData as ClientInput);
        } catch (clientErr) {
          console.error(`Error creating client at row ${i + 2}:`, clientErr);
          throw new Error(`Failed to create client at row ${i + 2}: ${clientErr instanceof Error ? clientErr.message : String(clientErr)}`);
        }
      }
      
      // Refresh client list
      const updatedClients = await clientService.getAllClients();
      setClients(updatedClients);
      
      // Reset file input
      if (event.target.value) {
        event.target.value = '';
      }
      
    } catch (err) {
      console.error('Error importing clients:', err);
      
      // Show more detailed error information
      let errorMessage = 'Failed to import clients. ';
      if (err instanceof Error) {
        errorMessage += `Error: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += err;
      } else {
        errorMessage += 'Please check your CSV file format and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handler for CSV export
  const handleExportClick = () => {
    try {
      // Prepare data for export
      const dataToExport = clients.map(client => ({
        id: client.id,
        name: client.name,
        industry: client.industry,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address || '',
        account_owner_id: client.account_owner_id,
        services_used: client.services_used.join(';'),
        crm_link: client.crm_link || '',
        notes: client.notes || '',
        status: client.status,
        created_at: client.created_at,
        updated_at: client.updated_at
      }));
      
      exportToCSV(dataToExport, 'clients_export.csv');
    } catch (err) {
      console.error('Error exporting clients:', err);
      setError('Failed to export clients.');
    }
  };

  // Handler for export import template
  const handleExportTemplate = () => {
    try {
      const templateData = [{
        name: 'Example Client Corp',
        industry: 'Technology',
        contact_name: 'John Doe',
        contact_email: 'john.doe@example.com',
        contact_phone: '+1-555-0123',
        address: '123 Business St, City, State 12345',
        account_owner_id: '',
        services_used: '',
        crm_link: '',
        notes: '',
        status: 'active'
      }];
      
      exportForImport(templateData, 'clients_import_template.csv', 'clients');
    } catch (err) {
      console.error('Error exporting template:', err);
      setError('Failed to export template.');
    }
  };

  useEffect(() => {
    // Fetch clients, services, and account owners when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingServices(true);
        setLoadingAccountOwners(true);
        
        // Fetch clients
        try {
          const response = await clientService.getAllClients();
          
          // Log the response for debugging
          console.log('Clients API response:', response);
          
          // Ensure we have an array of clients
          let data: Client[] = [];
          
          if (Array.isArray(response)) {
            // If response is already an array, use it directly
            data = response;
          } else if (response && typeof response === 'object') {
            // If response is an object with a data property that's an array
            const responseObj = response as any;
            if (responseObj.data && Array.isArray(responseObj.data)) {
              data = responseObj.data;
            }
          }
          
          setClients(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching clients:', err);
          setError('Failed to load clients. Please try again.');
        } finally {
          setLoading(false);
        }
        
        // Fetch services
        try {
          const response = await serviceService.getAllServices();
          
          // Log the response for debugging
          console.log('Services API response:', response);
          
          // Ensure we have an array of services
          let servicesData: Service[] = [];
          
          if (Array.isArray(response)) {
            // If response is already an array, use it directly
            servicesData = response;
          } else if (response && typeof response === 'object') {
            // If response is an object with a data property that's an array
            const responseObj = response as any;
            if (responseObj.data && Array.isArray(responseObj.data)) {
              servicesData = responseObj.data;
            }
          }
          
          setServices(servicesData);
        } catch (err) {
          console.error('Error fetching services:', err);
        } finally {
          setLoadingServices(false);
        }
        
        // Fetch account owners (sales users)
        try {
          const salesUsers = await userService.getSalesUsers();
          setAccountOwners(salesUsers);
        } catch (err) {
          console.error('Error fetching account owners:', err);
        } finally {
          setLoadingAccountOwners(false);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An error occurred while loading data.');
        setLoading(false);
        setLoadingServices(false);
        setLoadingAccountOwners(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (client: Client | null = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        name: client.name,
        industry: client.industry,
        contact_name: client.contact_name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        address: client.address || '',
        account_owner_id: client.account_owner_id,
        services_used: client.services_used,
        crm_link: client.crm_link || '',
        notes: client.notes || '',
        status: client.status
      });
    } else {
      setCurrentClient(null);
      setFormData({
        name: '',
        industry: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        account_owner_id: 0,
        services_used: [],
        crm_link: '',
        notes: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClient(null);
    setError(null);
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    const numericFields = ['account_owner_id'];
    const fieldValue = numericFields.includes(name) ? parseInt(value, 10) : value;
    
    setFormData({
      ...formData,
      [name]: fieldValue
    });
  };

  // Handle services multi-select
  const handleServicesChange = (_event: React.SyntheticEvent, value: Service[]) => {
    setFormData({
      ...formData,
      services_used: value.map(service => service.id)
    });
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.industry || !formData.account_owner_id) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting client with data:', formData);
      
      if (currentClient) {
        // Update existing client - store the response
        const updatedClient = await clientService.updateClient(currentClient.id, formData);
        console.log('Client updated successfully:', updatedClient);
        
        // Update the client in the local state immediately
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === currentClient.id ? { ...client, ...updatedClient } : client
          )
        );
        
        // Then refresh the full list to ensure consistency
        const updatedClients = await clientService.getAllClients();
        setClients(updatedClients);
      } else {
        // Add new client
        const newClient = await clientService.createClient(formData as ClientInput);
        console.log('Client created successfully:', newClient);
        
        // Refresh client list
        const updatedClients = await clientService.getAllClients();
        setClients(updatedClients);
      }
      
      // Close the dialog after state updates are complete
      setTimeout(() => {
        setOpenDialog(false);
        setCurrentClient(null);
      }, 100);
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }
    
    try {
      // First attempt to delete without force
      const result = await clientService.deleteClient(id, false);
      
      // If client has opportunities, ask for confirmation to delete both
      if (!result.success && result.hasOpportunities) {
        const confirmForceDelete = window.confirm(
          `This client has ${result.opportunityCount} related opportunities. ` +
          'Deleting this client will also delete all associated opportunities. ' +
          'Do you want to continue?'
        );
        
        if (confirmForceDelete) {
          // Delete with force=true if user confirmed
          const forceResult = await clientService.deleteClient(id, true);
          if (forceResult.success) {
            // Update local state
            setClients(clients.filter(c => c.id !== id));
            setError(null);
          } else {
            setError('Failed to delete client and its opportunities. Please try again.');
          }
        }
      } else if (result.success) {
        // Update local state if delete was successful
        setClients(clients.filter(c => c.id !== id));
        setError(null);
      } else {
        // Handle other error cases
        setError(result.message || 'Failed to delete client. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'prospect':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to get account owner name
  const getAccountOwnerName = (ownerId: number) => {
    const owner = accountOwners.find(o => o.id === ownerId);
    return owner ? owner.username : 'Unknown';
  };

  // Helper function to get service names for a client
  const getServiceNames = (serviceIds: number[]) => {
    return services
      .filter(service => serviceIds.includes(service.id))
      .map(service => service.name);
  };

  // Filter and sort clients based on search term and sort configuration
  const filteredAndSortedClients = useMemo(() => {
    // First, filter clients based on search term
    const filtered = clients.filter(client => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Search in multiple fields
      return (
        client.name.toLowerCase().includes(searchLower) ||
        client.industry.toLowerCase().includes(searchLower) ||
        client.contact_name?.toLowerCase().includes(searchLower) ||
        client.contact_email?.toLowerCase().includes(searchLower) ||
        getAccountOwnerName(client.account_owner_id).toLowerCase().includes(searchLower) ||
        getServiceNames(client.services_used).some(service => 
          service.toLowerCase().includes(searchLower)
        )
      );
    });
    
    // Then, sort the filtered clients
    return [...filtered].sort((a, b) => {
      const { field, direction } = sortConfig;
      let comparison = 0;
      
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'industry':
          comparison = a.industry.localeCompare(b.industry);
          break;
        case 'account_owner_id':
          comparison = getAccountOwnerName(a.account_owner_id).localeCompare(
            getAccountOwnerName(b.account_owner_id)
          );
          break;
        case 'services_used':
          // Compare by number of services used
          comparison = a.services_used.length - b.services_used.length;
          break;
        default:
          comparison = 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [clients, searchTerm, sortConfig, accountOwners, services]);
  
  // Multi-select handlers (defined after filteredAndSortedClients to avoid dependency issues)
  const handleSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Select all checkbox changed. Checked: ${event.target.checked}`);
    
    if (event.target.checked) {
      // Select all clients
      const newSelectedIds = new Set(filteredAndSortedClients.map((client) => client.id));
      console.log(`Selecting all clients: ${Array.from(newSelectedIds).join(', ')}`);
      setSelectedClientIds(newSelectedIds);
    } else {
      // Unselect all clients
      console.log('Clearing all selections');
      setSelectedClientIds(new Set());
    }
  }, [filteredAndSortedClients]);

  const handleCheckboxClick = useCallback((event: React.ChangeEvent<HTMLInputElement>, clientId: number) => {
    // Stop event propagation to prevent any parent handlers from firing
    event.stopPropagation();
    
    console.log(`Checkbox for client ${clientId} changed. Checked: ${event.target.checked}`);
    
    // Create a new Set from the current one to avoid mutation
    const newSelectedClientIds = new Set(selectedClientIds);
    
    if (event.target.checked) {
      newSelectedClientIds.add(clientId);
    } else {
      newSelectedClientIds.delete(clientId);
    }
    
    console.log(`New selected clients: ${Array.from(newSelectedClientIds).join(', ')}`);
    
    // Update state with the new Set
    setSelectedClientIds(newSelectedClientIds);
  }, [selectedClientIds]);

  const handleDeleteSelectedClients = async () => {
    if (selectedClientIds.size === 0) return;
    
    setDeleteConfirmationOpen(false);
    setLoading(true); 
    try {
      const deletePromises: Promise<any>[] = [];
      selectedClientIds.forEach(clientId => {
        deletePromises.push(clientService.deleteClient(clientId, true)); // Use force=true for bulk delete
      });
      await Promise.all(deletePromises);
      
      // Remove deleted clients from local state
      setClients(prevClients => 
        prevClients.filter(client => !selectedClientIds.has(client.id))
      );
      setSelectedClientIds(new Set());
      setError(null); 
    } catch (err) {
      console.error('Failed to delete selected clients:', err);
      setError('Failed to delete one or more clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = () => {
    if (selectedClientIds.size > 0) {
      setDeleteConfirmationOpen(true);
    }
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
  };
  
  // Handle sort request
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: 
        prevConfig.field === field && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };

  if (loading || loadingServices || loadingAccountOwners) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          {selectedClientIds.size > 0 && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteConfirmation}
              size="small"
            >
              Delete Selected ({selectedClientIds.size})
            </Button>
          )}
        </Stack>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            size="small"
          >
            Import CSV
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            onClick={handleExportClick}
            size="small"
          >
            Export CSV
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleExportTemplate}
            size="small"
          >
            Import Template
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setShowFormatHelper(true)}
            size="small"
          >
            CSV Format Help
          </Button>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
            size="small"
        >
          Add Client
        </Button>
        </Box>
      </Stack>

      {/* Search Box */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search clients by name, industry, contact, account owner, or services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {clients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No clients found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the "Add Client" button to create your first client.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedClientIds.size > 0 && selectedClientIds.size < filteredAndSortedClients.length}
                    checked={filteredAndSortedClients.length > 0 && selectedClientIds.size === filteredAndSortedClients.length}
                    onChange={handleSelectAllClick}
                    aria-label="select all clients"
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'name'}
                    direction={sortConfig.field === 'name' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'industry'}
                    direction={sortConfig.field === 'industry' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('industry')}
                  >
                    Industry
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'account_owner_id'}
                    direction={sortConfig.field === 'account_owner_id' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('account_owner_id')}
                  >
                    Account Owner
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'services_used'}
                    direction={sortConfig.field === 'services_used' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('services_used')}
                  >
                    Services Used
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedClients.map((client) => {
                const isSelected = selectedClientIds.has(client.id);
                return (
                <TableRow key={client.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleCheckboxClick(e, client.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`select client ${client.name}`}
                      />
                    </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BusinessIcon color="primary" fontSize="small" />
                      <div>
                        <Typography variant="body1">{client.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.contact_name}
                        </Typography>
                      </div>
                    </Stack>
                  </TableCell>
                  <TableCell>{client.industry}</TableCell>
                  <TableCell>{getAccountOwnerName(client.account_owner_id)}</TableCell>
                  <TableCell>
                    {client.services_used.length > 0 
                      ? getServiceNames(client.services_used).join(', ')
                      : <Typography variant="caption" color="text.secondary">No services</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={client.status} 
                      color={getStatusColor(client.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(client)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(client.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={closeDeleteConfirmation}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedClientIds.size} selected client{selectedClientIds.size > 1 ? 's' : ''}?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 1 }}>
            This action cannot be undone and will also delete all related opportunities.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmation}>Cancel</Button>
          <Button onClick={handleDeleteSelectedClients} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Client Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Industry</InputLabel>
              <Select
                name="industry"
                value={formData.industry}
                label="Industry"
                onChange={handleSelectChange}
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Account Owner</InputLabel>
              <Select
                name="account_owner_id"
                value={formData.account_owner_id.toString()}
                label="Account Owner"
                onChange={handleSelectChange}
              >
                <MenuItem value="0">Select Account Owner</MenuItem>
                {accountOwners.map((owner) => (
                  <MenuItem key={owner.id} value={owner.id.toString()}>{owner.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={services}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={services.filter(service => 
                  formData.services_used.includes(service.id)
                )}
                onChange={handleServicesChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Services Used"
                    placeholder="Select services"
                  />
                )}
              />
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="CRM Link"
              name="crm_link"
              value={formData.crm_link}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleSelectChange}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              currentClient ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".csv"
        onChange={handleFileChange}
      />

      {/* CSV Format Helper Dialog */}
      <CSVFormatHelper
        open={showFormatHelper}
        onClose={() => setShowFormatHelper(false)}
        type="clients"
      />
    </Box>
  );
};

export default Clients;