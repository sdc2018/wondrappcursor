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
  Chip
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Import user service
import userService from '../services/userService';
import { User } from '../services/authService';

// User roles
const userRoles = [
  'admin',
  'sales',
  'bu_head',
  'senior_management'
];

// User input interface
interface UserInput {
  username: string;
  email: string;
  password: string;
  role: string;
}

const Users: React.FC = () => {
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserInput>({
    username: '',
    email: '',
    password: '',
    role: 'sales' // Default role
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
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
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open dialog for adding/editing user
  const handleOpenDialog = (userId?: number) => {
    if (userId) {
      // Edit existing user
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
        setFormData({
          username: user.username,
          email: user.email,
          password: '', // Don't populate password for security
          role: user.role
        });
      }
    } else {
      // New user
      setCurrentUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'sales' // Default role
      });
    }
    
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
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

  // Get color for role chip
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'bu_head':
        return 'warning';
      case 'sales':
        return 'success';
      case 'senior_management':
        return 'info';
      default:
        return 'default';
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form data
    if (!formData.username || !formData.email || (!currentUser && !formData.password) || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      if (currentUser) {
        // Update existing user
        console.log('Updating user:', { id: currentUser.id, ...formData });
        
        // Create update data object (omit password if empty)
        const updateData: Partial<UserInput> = {
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        
        // Only include password if it's not empty
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        // Call API to update user
        const updatedUser = await userService.updateUser(currentUser.id, updateData);
        
        // Update local state with the response from the API
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      } else {
        // Create new user
        console.log('Creating user:', formData);
        
        // Call API to create user
        const newUser = await userService.createUser(formData);
        
        // Update local state with the response from the API
        setUsers([...users, newUser]);
      }
      
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Failed to save user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call API to delete user
      console.log('Deleting user:', id);
      await userService.deleteUser(id);
      
      // Update local state after successful deletion
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while fetching data
  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
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
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No users found. Create your first user by clicking "Add User".
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={formatRole(user.role)} 
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(user.id)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{currentUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required={!currentUser}
              fullWidth
              label={currentUser ? "New Password (leave blank to keep current)" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleSelectChange}
              >
                {userRoles.map((role) => (
                  <MenuItem key={role} value={role}>{formatRole(role)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
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
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              currentUser ? 'Update' : 'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
