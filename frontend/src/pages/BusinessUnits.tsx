import React, { useState, useEffect } from 'react';
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
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Import services
import businessUnitService, { BusinessUnit, BusinessUnitInput } from '../services/businessUnitService';
import userService from '../services/userService';

const BusinessUnits: React.FC = () => {
  // State for business units
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [buHeads, setBuHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBusinessUnit, setCurrentBusinessUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState<BusinessUnitInput>({
    name: '',
    description: '',
    status: 'active',
    owner_id: undefined
  });

  // Fetch business units and BU heads on component mount
  useEffect(() => {
    fetchBusinessUnits();
    fetchBuHeads();
  }, []);

  // Fetch business unit heads from API
  const fetchBuHeads = async () => {
    try {
      const heads = await userService.getUsersByRole('bu_head');
      console.log('Business Unit Heads:', heads);
      setBuHeads(heads);
    } catch (err) {
      console.error('Error fetching business unit heads:', err);
    }
  };

  // Fetch business units from API
  const fetchBusinessUnits = async () => {
    try {
      setLoading(true);
      const response = await businessUnitService.getAllBusinessUnits();
      
      // Log the response for debugging
      console.log('Business Units API response:', response);
      
      // Ensure we have an array of business units
      let data: BusinessUnit[] = [];
      
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
      
      setBusinessUnits(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching business units:', err);
      setError('Failed to load business units. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for adding/editing business unit
  const handleOpenDialog = async (businessUnitId?: number) => {
    if (businessUnitId) {
      // Edit existing business unit
      setLoading(true);
      
      try {
        const businessUnit = await businessUnitService.getBusinessUnitById(businessUnitId);
        setCurrentBusinessUnit(businessUnit);
        
        setFormData({
          name: businessUnit.name,
          description: businessUnit.description || '',
          status: businessUnit.status,
          owner_id: businessUnit.owner_id
        });
          
        setLoading(false);
      } catch (err) {
        console.error('Error fetching business unit details:', err);
        setError('Failed to load business unit details. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // New business unit
      setCurrentBusinessUnit(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
        owner_id: undefined
      });
    }
    
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBusinessUnit(null);
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
      [name]: value === '' ? undefined : Number(value)
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name) {
      setError('Please fill in the business unit name');
      return;
    }

    try {
      setSubmitting(true);
      
      if (currentBusinessUnit) {
        // Update existing business unit
        const updatedBusinessUnit = await businessUnitService.updateBusinessUnit(currentBusinessUnit.id, formData);
        setBusinessUnits(businessUnits.map(bu => bu.id === currentBusinessUnit.id ? updatedBusinessUnit : bu));
      } else {
        // Create new business unit
        const newBusinessUnit = await businessUnitService.createBusinessUnit(formData);
        setBusinessUnits([...businessUnits, newBusinessUnit]);
      }
      
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving business unit:', err);
      setError('Failed to save business unit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle business unit deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this business unit?')) {
      return;
    }
    
    try {
      setLoading(true);
      await businessUnitService.deleteBusinessUnit(id);
      setBusinessUnits(businessUnits.filter(bu => bu.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting business unit:', err);
      setError('Failed to delete business unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while fetching data
  if (loading && businessUnits.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Business Units</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Business Unit
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businessUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No business units found. Create your first business unit by clicking "Add Business Unit".
                </TableCell>
              </TableRow>
            ) : (
              businessUnits.map((businessUnit) => (
              <TableRow key={businessUnit.id}>
                <TableCell>{businessUnit.name}</TableCell>
                <TableCell>{businessUnit.description}</TableCell>
                <TableCell>
                  {businessUnit.owner_id ? 
                    buHeads.find(head => head.id === businessUnit.owner_id)?.username || 'Unknown' 
                    : 'None'}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(businessUnit.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(businessUnit.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Business Unit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{currentBusinessUnit ? 'Edit Business Unit' : 'Add New Business Unit'}</DialogTitle>
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
              label="Business Unit Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="owner-select-label">Business Unit Owner</InputLabel>
              <Select
                labelId="owner-select-label"
                id="owner-select"
                name="owner_id"
                value={formData.owner_id?.toString() || ''}
                label="Business Unit Owner"
                onChange={handleSelectChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {buHeads.map((head) => (
                  <MenuItem key={head.id} value={head.id.toString()}>
                    {head.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              currentBusinessUnit ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessUnits;
