import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Alert, 
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const Profile: React.FC = () => {
  const { user, loading: authLoading, updateUser } = useAuth();
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    username?: string;
  }>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear errors when typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    if (errors.username) {
      setErrors({
        ...errors,
        username: undefined
      });
    }
  };

  const startEditingUsername = () => {
    setNewUsername(user?.username || '');
    setIsEditingUsername(true);
    setUsernameMessage(null);
  };

  const cancelEditingUsername = () => {
    setIsEditingUsername(false);
    setErrors({
      ...errors,
      username: undefined
    });
  };

  const validateUsername = () => {
    if (!newUsername.trim()) {
      setErrors({
        ...errors,
        username: 'Username is required'
      });
      return false;
    }
    return true;
  };

  const saveUsername = async () => {
    if (!validateUsername()) {
      return;
    }

    setUpdatingUsername(true);
    setUsernameMessage(null);

    try {
      const updatedUser = await authService.updateProfile(newUsername);
      
      // Update the user in the auth context
      updateUser(updatedUser);
      
      setIsEditingUsername(false);
      setUsernameMessage({
        type: 'success',
        text: 'Username updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating username:', error);
      setUsernameMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update username. Please try again.'
      });
    } finally {
      setUpdatingUsername(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setMessage(null);
    
    try {
      // Call authService to change password
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setMessage({
        type: 'success',
        text: 'Password changed successfully'
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">You must be logged in to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          
          {usernameMessage && (
            <Alert 
              severity={usernameMessage.type} 
              sx={{ mb: 2 }}
              onClose={() => setUsernameMessage(null)}
            >
              {usernameMessage.text}
            </Alert>
          )}
          
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" color="text.secondary">
                Name
              </Typography>
                {isEditingUsername ? (
                  <TextField
                    fullWidth
                    value={newUsername}
                    onChange={handleUsernameChange}
                    error={!!errors.username}
                    helperText={errors.username}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                ) : (
              <Typography variant="body1">
                {user.username}
              </Typography>
                )}
              </Box>
              <Box>
                {isEditingUsername ? (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={saveUsername}
                      disabled={updatingUsername}
                    >
                      {updatingUsername ? <CircularProgress size={24} /> : <SaveIcon />}
                    </IconButton>
                    <IconButton 
                      color="default" 
                      onClick={cancelEditingUsername}
                      disabled={updatingUsername}
                    >
                      <CancelIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton color="primary" onClick={startEditingUsername}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Email (User ID)
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            
            {message && (
              <Alert 
                severity={message.type} 
                sx={{ mb: 2 }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )}
            
            <Stack spacing={2}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleInputChange}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                  margin="normal"
                />
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </CardActions>
        </form>
      </Card>
    </Box>
  );
};

export default Profile;