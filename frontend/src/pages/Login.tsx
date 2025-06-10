import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Use authentication context
  const { login, error, loading, isAuthenticated, clearError } = useAuth();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
    // Display API connection status message
    setStatusMessage('Checking connection to backend server...');
    
    // Check if backend is running using our configured API instance
    const checkBackendConnection = async () => {
      try {
        // Using the api instance which has proper CORS configuration
        // Use empty string to avoid trailing slash issues
        const response = await api.get('');
          setStatusMessage('Successfully connected to backend server');
        console.log('Backend connection successful:', response.data);
      } catch (err) {
        console.error('Backend connection error:', err);
        setStatusMessage('Cannot connect to backend server. Please ensure it is running.');
      }
    };
    
    checkBackendConnection();
  }, [clearError]);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Display login attempt message
    setStatusMessage(`Attempting to login with email: ${email}`);
    console.log('Login attempt with:', { email, password });
    
    try {
    // Use the login function from auth context
    await login({ email, password });
      console.log('Login function completed');
    } catch (err) {
      console.error('Login error caught in component:', err);
      setStatusMessage(`Login error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // For demo purposes - pre-fill with admin credentials
  const fillAdminCredentials = () => {
    setEmail('admin@wondrlab.com');
    setPassword('password123');
    setStatusMessage('Admin credentials filled. Try logging in with these.');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Wondrlab Cross-Selling Management System
          </Typography>
          <Typography component="h2" variant="h6" sx={{ mt: 1 }}>
            Sign In
          </Typography>
          
          {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
          {statusMessage && <Alert severity="info" sx={{ mt: 2, width: '100%' }}>{statusMessage}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 2 }}>
              For testing purposes, you can use the admin credentials from the seeded database.
            </Typography>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={fillAdminCredentials}
              disabled={loading}
            >
              Fill Admin Credentials
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;