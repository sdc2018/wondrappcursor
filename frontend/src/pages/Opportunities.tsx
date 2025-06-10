import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Alert,
  SelectChangeEvent,
  Checkbox,
  DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import InputAdornment from '@mui/material/InputAdornment';
import TableSortLabel from '@mui/material/TableSortLabel';

// Import services
import opportunityService, { Opportunity, OpportunityInput } from '../services/opportunityService';
import clientService, { Client } from '../services/clientService';
import serviceService, { Service } from '../services/serviceService';
import userService from '../services/userService';
import { User } from '../services/authService';
import { exportToCSV, parseCSVFile, validateCSVData, prepareDataForImport, exportForImport } from '../utils/csvUtils';
import CSVFormatHelper from '../components/CSVFormatHelper';

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

// Extended Opportunity interface with additional properties for display
interface OpportunityWithDetails extends Opportunity {
  client_name?: string;
  service_name?: string;
  service_business_unit?: string;
  assigned_user_name?: string;
}

// Type for sort direction
type SortDirection = 'asc' | 'desc';

// Type for sort field
type SortField = 'name' | 'client_name' | 'service_name' | 'status' | 'priority' | 'estimated_value' | 'due_date' | 'assigned_user_name';

// Interface for sort configuration
interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const Opportunities: React.FC = () => {
  // File input reference for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for opportunities
  const [opportunities, setOpportunities] = useState<OpportunityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State for related data
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  });
  
  // Multi-select state
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState<Set<number>>(new Set());
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState<OpportunityWithDetails | null>(null);
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
  const [error, setError] = useState<string | null>(null);
  const [showFormatHelper, setShowFormatHelper] = useState(false);

  useEffect(() => {
    fetchOpportunities();
    fetchClients();
    fetchServices();
    fetchUsers();
  }, []);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort opportunities
  const filteredAndSortedOpportunities = React.useMemo(() => {
    // First filter by search term
    const filtered = opportunities.filter(opportunity => {
      const searchLower = searchTerm.toLowerCase();
      return (
        opportunity.name.toLowerCase().includes(searchLower) ||
        (opportunity.client_name || '').toLowerCase().includes(searchLower) ||
        (opportunity.service_name || '').toLowerCase().includes(searchLower) ||
        (opportunity.service_business_unit || '').toLowerCase().includes(searchLower) ||
        (opportunity.assigned_user_name || '').toLowerCase().includes(searchLower) ||
        opportunity.status.toLowerCase().includes(searchLower) ||
        opportunity.priority.toLowerCase().includes(searchLower) ||
        (opportunity.notes || '').toLowerCase().includes(searchLower)
      );
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.field) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'client_name':
          return direction * ((a.client_name || '').localeCompare(b.client_name || ''));
        case 'service_name':
          return direction * ((a.service_name || '').localeCompare(b.service_name || ''));
        case 'status':
          return direction * a.status.localeCompare(b.status);
        case 'priority':
          return direction * a.priority.localeCompare(b.priority);
        case 'estimated_value':
          return direction * (a.estimated_value - b.estimated_value);
        case 'due_date':
          return direction * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        case 'assigned_user_name':
          return direction * ((a.assigned_user_name || '').localeCompare(b.assigned_user_name || ''));
        default:
          return 0;
      }
    });
  }, [opportunities, searchTerm, sortConfig]);

  // Multi-select handlers (defined after filteredAndSortedOpportunities to avoid dependency issues)
  const handleSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Select all checkbox changed. Checked: ${event.target.checked}`);
    
    if (event.target.checked) {
      // Select all opportunities
      const newSelectedIds = new Set(filteredAndSortedOpportunities.map((opportunity) => opportunity.id));
      console.log(`Selecting all opportunities: ${Array.from(newSelectedIds).join(', ')}`);
      setSelectedOpportunityIds(newSelectedIds);
    } else {
      // Unselect all opportunities
      console.log('Clearing all selections');
      setSelectedOpportunityIds(new Set());
    }
  }, [filteredAndSortedOpportunities]);

  const handleCheckboxClick = useCallback((event: React.ChangeEvent<HTMLInputElement>, opportunityId: number) => {
    // Stop event propagation to prevent any parent handlers from firing
    event.stopPropagation();
    
    console.log(`Checkbox for opportunity ${opportunityId} changed. Checked: ${event.target.checked}`);
    
    // Create a new Set from the current one to avoid mutation
    const newSelectedOpportunityIds = new Set(selectedOpportunityIds);
    
    if (event.target.checked) {
      newSelectedOpportunityIds.add(opportunityId);
    } else {
      newSelectedOpportunityIds.delete(opportunityId);
    }
    
    console.log(`New selected opportunities: ${Array.from(newSelectedOpportunityIds).join(', ')}`);
    
    // Update state with the new Set
    setSelectedOpportunityIds(newSelectedOpportunityIds);
  }, [selectedOpportunityIds]);

  const handleDeleteSelectedOpportunities = async () => {
    if (selectedOpportunityIds.size === 0) return;
    
    setDeleteConfirmationOpen(false);
    setLoading(true); 
    try {
      const deletePromises: Promise<boolean>[] = [];
      selectedOpportunityIds.forEach(opportunityId => {
        deletePromises.push(opportunityService.deleteOpportunity(opportunityId));
      });
      await Promise.all(deletePromises);
      
      // Remove deleted opportunities from local state
      setOpportunities(prevOpportunities => 
        prevOpportunities.filter(opp => !selectedOpportunityIds.has(opp.id))
      );
      setSelectedOpportunityIds(new Set());
      setError(null); 
    } catch (err) {
      console.error('Failed to delete selected opportunities:', err);
      setError('Failed to delete one or more opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = () => {
    if (selectedOpportunityIds.size > 0) {
      setDeleteConfirmationOpen(true);
    }
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
  };

  // Fetch opportunities from API
  const fetchOpportunities = async () => {
      try {
        setLoading(true);
      const response = await opportunityService.getAllOpportunities();
      
      // Log the response for debugging
      console.log('Opportunities API response:', response);
      
      // Ensure we have an array of opportunities
      let data: Opportunity[] = [];
      
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
        
      // Enhance opportunities with related data
      const enhancedData = await Promise.all(data.map(async (opportunity) => {
        try {
          // Get client details
          const client = await clientService.getClientById(opportunity.client_id);
        
          // Get service details
          const service = await serviceService.getServiceById(opportunity.service_id);
          
          // Get user details
          const user = await userService.getUserById(opportunity.assigned_user_id);
          
          return {
            ...opportunity,
            client_name: client.name,
            service_name: service.name,
            service_business_unit: service.business_unit,
            assigned_user_name: user.username
          };
        } catch (err) {
          console.error('Error enhancing opportunity data:', err);
          return {
            ...opportunity,
            client_name: 'Unknown',
            service_name: 'Unknown',
            service_business_unit: 'Unknown',
            assigned_user_name: 'Unknown'
          };
        }
      }));
        
      setOpportunities(enhancedData);
        setError(null);
      } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load opportunities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  // Fetch clients from API
  const fetchClients = async () => {
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
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Fetch services from API
  const fetchServices = async () => {
    try {
      const response = await serviceService.getAllServices();
      
      // Log the response for debugging
      console.log('Services API response:', response);
      
      // Ensure we have an array of services
      let data: Service[] = [];
      
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
      
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      
      // Log the response for debugging
      console.log('Users API response:', response);
      
      // Ensure we have an array of users
      let data: User[] = [];
      
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
      
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleOpenDialog = async (opportunityId?: number) => {
    // Reset form
    if (opportunityId) {
      try {
        setLoading(true);
        const opportunity = await opportunityService.getOpportunityById(opportunityId);
        setCurrentOpportunity(opportunity as OpportunityWithDetails);
        
      setFormData({
        name: opportunity.name,
        client_id: opportunity.client_id,
        service_id: opportunity.service_id,
        assigned_user_id: opportunity.assigned_user_id,
        status: opportunity.status,
        priority: opportunity.priority,
        estimated_value: opportunity.estimated_value,
          due_date: opportunity.due_date.split('T')[0], // Format date for input
        notes: opportunity.notes || ''
      });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching opportunity details:', err);
        setError('Failed to load opportunity details. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // New opportunity
      setCurrentOpportunity(null);
      setFormData({
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
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentOpportunity(null);
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

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.client_id || !formData.service_id || !formData.assigned_user_id || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      let result: Opportunity;
      
      if (currentOpportunity) {
        // Update existing opportunity
        result = await opportunityService.updateOpportunity(currentOpportunity.id, formData);
      } else {
        // Create new opportunity
        result = await opportunityService.createOpportunity(formData);
      }
      
      // Get related data for display
      const client = clients.find(c => c.id === result.client_id);
      const service = services.find(s => s.id === result.service_id);
      const user = users.find(u => u.id === result.assigned_user_id);
      
      const enhancedOpportunity: OpportunityWithDetails = {
        ...result,
        client_name: client?.name || 'Unknown',
        service_name: service?.name || 'Unknown',
        service_business_unit: service?.business_unit || 'Unknown',
        assigned_user_name: user?.username || 'Unknown'
      };
      
      // Update local state
      if (currentOpportunity) {
        setOpportunities(opportunities.map(o => 
          o.id === currentOpportunity.id ? enhancedOpportunity : o
        ));
      } else {
        setOpportunities([...opportunities, enhancedOpportunity]);
      }
      
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving opportunity:', err);
      setError('Failed to save opportunity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }
    
    try {
      setLoading(true);
      await opportunityService.deleteOpportunity(id);
      setOpportunities(opportunities.filter(o => o.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      setError('Failed to delete opportunity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setLoading(true);
      const updatedOpportunity = await opportunityService.changeOpportunityStatus(id, newStatus);
      
      // Find the original opportunity to get the display properties
      const original = opportunities.find(o => o.id === id);
      
      if (original) {
        const enhanced: OpportunityWithDetails = {
          ...updatedOpportunity,
          client_name: original.client_name,
          service_name: original.service_name,
          service_business_unit: original.service_business_unit,
          assigned_user_name: original.assigned_user_name
        };
        
        setOpportunities(opportunities.map(o => o.id === id ? enhanced : o));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error changing opportunity status:', err);
      setError('Failed to update opportunity status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'in_progress':
        return 'primary';
      case 'qualified':
        return 'secondary';
      case 'proposal':
        return 'warning';
      case 'negotiation':
        return 'warning';
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      case 'on_hold':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Handle import button click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection for CSV import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    try {
      setLoading(true);
      
      // Parse CSV file
      const parsedData = await parseCSVFile(file);
      
      // Validate the CSV data - make most fields optional with smart defaults
      const requiredFields = ['name']; // Only name is truly required
      const validationResult = validateCSVData(parsedData, requiredFields, 'opportunities');
      
      if (!validationResult.valid) {
        setError(`CSV validation failed:\n${validationResult.errors.join('\n')}`);
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('CSV Import Warnings:', validationResult.warnings);
      }
      
      // Prepare data for import with lookup data for name-to-ID resolution
      const lookupData = {
        clients: clients,
        services: services,
        users: users
      };
      const processedData = prepareDataForImport(parsedData, 'opportunities', lookupData);
      
      // Process and create opportunities
      for (const opportunityData of processedData) {
        await opportunityService.createOpportunity(opportunityData as OpportunityInput);
      }
      
      // Refresh opportunities list
      await fetchOpportunities();
      setError(null);
    } catch (err) {
      console.error('Error importing opportunities:', err);
      setError('Failed to import opportunities. Please check the CSV format and try again.');
    } finally {
      setLoading(false);
      // Reset file input
      if (event.target.value) event.target.value = '';
    }
  };

  // Handle export button click
  const handleExportClick = () => {
    try {
      // Prepare data for export
      const exportData = opportunities.map(opportunity => ({
        id: opportunity.id,
        name: opportunity.name,
        client_id: opportunity.client_id,
        client_name: opportunity.client_name,
        service_id: opportunity.service_id,
        service_name: opportunity.service_name,
        assigned_user_id: opportunity.assigned_user_id,
        assigned_user_name: opportunity.assigned_user_name,
        status: opportunity.status,
        priority: opportunity.priority,
        estimated_value: opportunity.estimated_value,
        due_date: opportunity.due_date,
        notes: opportunity.notes,
        created_at: opportunity.created_at,
        updated_at: opportunity.updated_at
      }));
      
      // Export to CSV
      exportToCSV(exportData, 'opportunities_export.csv');
    } catch (err) {
      console.error('Error exporting opportunities:', err);
      setError('Failed to export opportunities. Please try again.');
    }
  };

  // Handler for export import template
  const handleExportTemplate = () => {
    try {
      const templateData = [{
        name: 'Q1 Marketing Campaign',
        client_name: 'Example Client Corp',
        service_name: 'Digital Marketing Strategy',
        assigned_user_name: 'admin',
        status: 'new',
        priority: 'high',
        estimated_value: 10000,
        due_date: '2024-03-31',
        notes: 'High priority opportunity for Q1 - you can use client names, service names, and usernames instead of IDs'
      }];
      
      exportForImport(templateData, 'opportunities_import_template.csv', 'opportunities');
    } catch (err) {
      console.error('Error exporting template:', err);
      setError('Failed to export template.');
    }
  };

  if (loading && opportunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1">
          Opportunities
        </Typography>
        <Stack direction="row" spacing={1}>
          {selectedOpportunityIds.size > 0 && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteConfirmation}
              size="small"
            >
              Delete Selected ({selectedOpportunityIds.size})
            </Button>
          )}
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
          Add Opportunity
        </Button>
        </Stack>
      </Stack>

      {/* Search field */}
      <Box mb={1.5}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search opportunities by name, client, service, status, etc."
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

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* CSV Format Helper Dialog */}
      <CSVFormatHelper
        open={showFormatHelper}
        onClose={() => setShowFormatHelper(false)}
        type="opportunities"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedOpportunityIds.size > 0 && selectedOpportunityIds.size < filteredAndSortedOpportunities.length}
                  checked={filteredAndSortedOpportunities.length > 0 && selectedOpportunityIds.size === filteredAndSortedOpportunities.length}
                  onChange={handleSelectAllClick}
                  aria-label="select all opportunities"
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'name'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'client_name'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('client_name')}
                >
                  Client
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'service_name'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('service_name')}
                >
                  Service
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'assigned_user_name'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('assigned_user_name')}
                >
                  Assigned To
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'status'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'priority'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'estimated_value'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('estimated_value')}
                >
                  Value
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'due_date'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('due_date')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {opportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No opportunities found. Create your first opportunity by clicking "Add Opportunity".
                </TableCell>
              </TableRow>
            ) : filteredAndSortedOpportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No opportunities match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedOpportunities.map((opportunity) => {
                const isSelected = selectedOpportunityIds.has(opportunity.id);
                return (
                <TableRow key={opportunity.id} selected={isSelected} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleCheckboxClick(e, opportunity.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-labelledby={`opportunity-${opportunity.id}`}
                    />
                  </TableCell>
                  <TableCell id={`opportunity-${opportunity.id}`}>{opportunity.name}</TableCell>
                  <TableCell>{opportunity.client_name}</TableCell>
                <TableCell>
                    {opportunity.service_name}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {opportunity.service_business_unit}
                    </Typography>
                </TableCell>
                  <TableCell>{opportunity.assigned_user_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={statusOptions.find(s => s.value === opportunity.status)?.label || opportunity.status} 
                    color={getStatusColor(opportunity.status) as any}
                    size="small"
                      onClick={() => {
                        const currentIndex = statusOptions.findIndex(s => s.value === opportunity.status);
                        const nextIndex = (currentIndex + 1) % statusOptions.length;
                        const newStatus = statusOptions[nextIndex].value;
                        handleStatusChange(opportunity.id, newStatus);
                      }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={priorityOptions.find(p => p.value === opportunity.priority)?.label || opportunity.priority} 
                    color={getPriorityColor(opportunity.priority) as any}
                    size="small"
                  />
                </TableCell>
                  <TableCell>{formatCurrency(opportunity.estimated_value)}</TableCell>
                  <TableCell>{formatDate(opportunity.due_date)}</TableCell>
                <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(opportunity.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(opportunity.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={closeDeleteConfirmation}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedOpportunityIds.size} selected opportunity{selectedOpportunityIds.size > 1 ? 's' : ''}?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmation}>Cancel</Button>
          <Button onClick={handleDeleteSelectedOpportunities} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Opportunity Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle>{currentOpportunity ? 'Edit Opportunity' : 'Add New Opportunity'}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Box component="form" sx={{ mt: 1 }}>
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
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    client_id: parseInt(e.target.value, 10)
                  });
                }}
              >
                <MenuItem value="0">Select Client</MenuItem>
                {clients.map((client) => (
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
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    service_id: parseInt(e.target.value, 10)
                  });
                }}
              >
                <MenuItem value="0">Select Service</MenuItem>
                {services.map((service) => (
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
                value={formData.assigned_user_id ? formData.assigned_user_id.toString() : '0'}
                  label="Assigned User"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    assigned_user_id: parseInt(e.target.value, 10)
                  });
                }}
              >
                <MenuItem value="0">Select User</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
              
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleSelectChange}
              >
                {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
              
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleSelectChange}
              >
                {priorityOptions.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ position: 'relative', mt: 2, mb: 1 }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    left: 14, 
                    top: 14, 
                    zIndex: 1,
                    color: 'action.active'
                  }}
                >
                  <AttachMoneyIcon fontSize="small" />
                </Box>
            <TextField
              fullWidth
              label="Estimated Value"
              name="estimated_value"
              type="number"
              value={formData.estimated_value}
              onChange={handleInputChange}
                  sx={{ 
                    '& input': { paddingLeft: '28px' }
              }}
            />
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Due Date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
              sx={{ 
                '& input': { paddingLeft: '10px' },
                '& label': { transform: 'translate(14px, -9px) scale(0.75)' } 
              }}
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
          </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting || loading}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              currentOpportunity ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Opportunities;