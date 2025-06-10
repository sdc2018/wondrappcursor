import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper, 
  IconButton,
  CircularProgress, 
  Alert, 
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import serviceService, { Service, ServiceInput } from '../services/serviceService';
import businessUnitService, { BusinessUnit } from '../services/businessUnitService';
import industryService, { Industry } from '../services/industryService';
import { exportToCSV, parseCSVFile, validateCSVData, prepareDataForImport, exportForImport } from '../utils/csvUtils';
import CSVFormatHelper from '../components/CSVFormatHelper';

// Pricing models for dropdown
const pricingModels = [
  'Fixed Price',
  'Hourly Rate',
  'Retainer',
  'Project-based',
  'Commission',
  'Value-based'
];

// Status options
const statusOptions = ['active', 'inactive', 'deprecated'];

const Services: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFormatHelper, setShowFormatHelper] = useState(false);
  const [formData, setFormData] = useState<ServiceInput>({
    name: '',
    description: '',
    business_unit: '',
    pricing_model: '',
    pricing_details: '',
    applicable_industries: [],
    client_role: '',
    status: 'active'
  });

  useEffect(() => {
    fetchServices();
    fetchBusinessUnits();
    fetchIndustries();
  }, []);

  // Fetch industries from API
  const fetchIndustries = async () => {
    try {
      const data = await industryService.getActiveIndustries();
      console.log('Industries API response:', data);
      setIndustries(data);
    } catch (err) {
      console.error('Error fetching industries:', err);
      // Don't set error state here to avoid overriding service errors
    }
  };

  // Fetch business units from API
  const fetchBusinessUnits = async () => {
    try {
      const data = await businessUnitService.getAllBusinessUnits();
      console.log('Business Units API response:', data);
      
      // Ensure we have an array of business units
      let businessUnitsData: BusinessUnit[] = [];
      
      if (Array.isArray(data)) {
        businessUnitsData = data;
      } else if (data && typeof data === 'object') {
        // Handle case where API returns an object with data property
        const dataObj = data as { data?: any[] };
        businessUnitsData = Array.isArray(dataObj.data) ? dataObj.data : [];
      }
      
      setBusinessUnits(businessUnitsData);
    } catch (err) {
      console.error('Error fetching business units:', err);
      // Don't set error state here to avoid overriding service errors
    }
  };

  // Fetch services from API
    const fetchServices = async () => {
      try {
      setLoading(true);
      const response = await serviceService.getAllServices();
      
      // Log the response for debugging
      console.log('Services API response:', response);
      
      // Ensure we have an array of services
      let data: Service[] = [];
      
      if (Array.isArray(response)) {
          data = response;
        } else if (response && typeof response === 'object') {
        // Handle case where API returns an object with data property
        const responseObj = response as { data?: any[] };
        data = Array.isArray(responseObj.data) ? responseObj.data : [];
        }
      
      setServices(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  // Open dialog for adding/editing service
  const handleOpenDialog = async (serviceId?: number) => {
    if (serviceId) {
      try {
        setLoading(true);
        const service = await serviceService.getServiceById(serviceId);
      setCurrentService(service);
        
      setFormData({
        name: service.name,
        description: service.description,
        business_unit: service.business_unit,
        pricing_model: service.pricing_model,
          pricing_details: service.pricing_details || '',
          applicable_industries: service.applicable_industries,
        client_role: service.client_role,
        status: service.status
      });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // New service
      setCurrentService(null);
      setFormData({
        name: '',
        description: '',
        business_unit: '',
        pricing_model: '',
        pricing_details: '',
        applicable_industries: [],
        client_role: '',
        status: 'active'
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentService(null);
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
      setFormData({
        ...formData,
        [name]: value
      });
  };

  // Handle industries multi-select changes
  const handleIndustriesChange = (_event: React.SyntheticEvent, value: Industry[]) => {
    setFormData({
      ...formData,
      applicable_industries: value.map(industry => industry.name)
      });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name || !formData.business_unit || !formData.pricing_model) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data for API
      const serviceData: ServiceInput = {
        ...formData
      };
      
      if (currentService) {
        // Update existing service
        const updatedService = await serviceService.updateService(currentService.id, serviceData);
        setServices(services.map(s => s.id === currentService.id ? updatedService : s));
      } else {
        // Create new service
        const newService = await serviceService.createService(serviceData);
        setServices([...services, newService]);
      }
      
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle service deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      setLoading(true);
      await serviceService.deleteService(id);
      setServices(services.filter(s => s.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setLoading(true);
      const updatedService = await serviceService.changeServiceStatus(id, newStatus);
      setServices(services.map(s => s.id === id ? updatedService : s));
      setError(null);
    } catch (err) {
      console.error('Error changing service status:', err);
      setError('Failed to update service status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

// Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  // CSV Import/Export handlers
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    
    try {
      setLoading(true);
      const parsedData = await parseCSVFile(file);
      
      // Validate the CSV data - make some fields optional for easier imports
      const requiredFields = ['name', 'business_unit', 'pricing_model']; // Only essential fields required
      const validationResult = validateCSVData(parsedData, requiredFields, 'services');
      
      if (!validationResult.valid) {
        setError(`CSV validation failed:\n${validationResult.errors.join('\n')}`);
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('CSV Import Warnings:', validationResult.warnings);
      }
      
      // Prepare data for import
      const processedData = prepareDataForImport(parsedData, 'services');
      
      // Process and create services
      const createdServices = [];
      for (const serviceData of processedData) {
        try {
          const newService = await serviceService.createService(serviceData as ServiceInput);
          createdServices.push(newService);
        } catch (err) {
          console.error('Error creating service:', err);
        }
      }
      
      // Refresh services list
      await fetchServices();
      setError(null);
      alert(`Successfully imported ${createdServices.length} services`);
    } catch (err) {
      console.error('Error importing services:', err);
      setError('Failed to import services. Please check your CSV file format.');
    } finally {
      setLoading(false);
      // Reset the file input
      if (event.target.value) {
        event.target.value = '';
      }
    }
  };

  const handleExportClick = () => {
    // Prepare data for export
    const dataToExport = services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      business_unit: service.business_unit,
      pricing_model: service.pricing_model,
      pricing_details: service.pricing_details,
      applicable_industries: service.applicable_industries.join(';'),
      client_role: service.client_role,
      status: service.status,
      created_at: service.created_at,
      updated_at: service.updated_at
    }));
    
    exportToCSV(dataToExport, 'services_export.csv');
  };

  // Handler for export import template
  const handleExportTemplate = () => {
    try {
      const templateData = [{
        name: 'Digital Marketing Strategy',
        business_unit: 'Digital Marketing',
        pricing_model: 'Project-based',
        description: 'Comprehensive digital marketing planning and execution (optional)',
        pricing_details: '$5,000 - $15,000 per project (optional)',
        applicable_industries: 'Technology;Healthcare;Finance (optional)',
        client_role: 'CMO (optional - defaults to Decision Maker)',
        status: 'active (optional - defaults to active)'
      }];
      
      exportForImport(templateData, 'services_import_template.csv', 'services');
    } catch (err) {
      console.error('Error exporting template:', err);
      setError('Failed to export template.');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {loading && services.length === 0 ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}
          
          <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 1.5 }}>
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
          Add Service
        </Button>
            </Box>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Business Unit</TableCell>
              <TableCell>Pricing Model</TableCell>
              <TableCell>Industries</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No services found. Create your first service by clicking "Add Service".
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.business_unit}</TableCell>
                    <TableCell>{service.pricing_model}</TableCell>
                <TableCell>
                      {service.applicable_industries.map((industry, index) => (
                        <Chip 
                          key={index} 
                          label={industry} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={service.status} 
                    color={getStatusColor(service.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(service.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(service.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      )}

      {/* Add/Edit Service Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle>{currentService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
          <Box component="form" sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Service Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Business Unit</InputLabel>
              <Select
                name="business_unit"
                value={formData.business_unit}
                label="Business Unit"
                onChange={handleSelectChange}
              >
                {businessUnits.map((unit) => (
                  <MenuItem key={unit.id} value={unit.name}>{unit.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Pricing Model</InputLabel>
              <Select
                name="pricing_model"
                value={formData.pricing_model}
                label="Pricing Model"
                onChange={handleSelectChange}
              >
                {pricingModels.map((model) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Pricing Details"
              name="pricing_details"
              value={formData.pricing_details}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <Autocomplete
                multiple
                options={industries}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.name === value.name}
                value={industries.filter(industry => 
                  formData.applicable_industries.includes(industry.name)
                )}
                onChange={handleIndustriesChange}
                renderInput={(params) => (
            <TextField
                    {...params}
                    label="Applicable Industries"
                    placeholder="Select industries"
                  />
                )}
              />
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Client Role"
              name="client_role"
              value={formData.client_role}
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
              currentService ? 'Update' : 'Add'
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
        type="services"
      />
    </Box>
  );
};

export default Services;