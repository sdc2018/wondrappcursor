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
import industryService, { Industry, IndustryInput } from '../services/industryService';

const Industries: React.FC = () => {
  // State for industries
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState<IndustryInput>({
    name: '',
    description: '',
    status: 'active'
  });

  // Fetch industries on component mount
  useEffect(() => {
    fetchIndustries();
  }, []);

  // Fetch industries from API
  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const response = await industryService.getAllIndustries();
      
      // Log the response for debugging
      console.log('Industries API response:', response);
      
      setIndustries(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching industries:', err);
      setError('Failed to load industries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for adding/editing industry
  const handleOpenDialog = async (industryId?: number) => {
    if (industryId) {
      // Edit existing industry
      setLoading(true);
      
      try {
        const industry = await industryService.getIndustryById(industryId);
        if (industry) {
          setCurrentIndustry(industry);
          
          setFormData({
            name: industry.name,
            description: industry.description || '',
            status: industry.status
          });
        } else {
          throw new Error('Industry not found');
        }
          
        setLoading(false);
      } catch (err) {
        console.error('Error fetching industry details:', err);
        setError('Failed to load industry details. Please try again.');
        setLoading(false);
        return;
      }
    } else {
      // New industry
      setCurrentIndustry(null);
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
    
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentIndustry(null);
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

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.name) {
      setError('Please fill in the industry name');
      return;
    }

    try {
      setSubmitting(true);
      
      if (currentIndustry) {
        // Update existing industry
        const updatedIndustry = await industryService.updateIndustry(currentIndustry.id, formData);
        setIndustries(industries.map(ind => ind.id === currentIndustry.id ? updatedIndustry : ind));
      } else {
        // Create new industry
        const newIndustry = await industryService.createIndustry(formData);
        setIndustries([...industries, newIndustry]);
      }
      
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error saving industry:', err);
      setError('Failed to save industry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle industry deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this industry?')) {
      return;
    }
    
    try {
      setLoading(true);
      await industryService.deleteIndustry(id);
      setIndustries(industries.filter(ind => ind.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting industry:', err);
      setError('Failed to delete industry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while fetching data
  if (loading && industries.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Industries</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Industry
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
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {industries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No industries found. Create your first industry by clicking "Add Industry".
                </TableCell>
              </TableRow>
            ) : (
              industries.map((industry) => (
              <TableRow key={industry.id}>
                <TableCell>{industry.name}</TableCell>
                <TableCell>{industry.description}</TableCell>
                <TableCell>{industry.status}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(industry.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(industry.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Industry Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{currentIndustry ? 'Edit Industry' : 'Add New Industry'}</DialogTitle>
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
              label="Industry Name"
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
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleSelectChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
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
              currentIndustry ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Industries;
