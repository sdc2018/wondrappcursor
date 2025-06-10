import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { UserRole } from '../models/User';

// Generate JWT token
const generateToken = (userId: number, role: UserRole): string => {
  const payload = { userId, role };
  const secret = process.env.JWT_SECRET || 'default_jwt_secret_key';
  
  // Use a number for expiresIn (seconds) instead of a string
  const expiresIn = 86400; // 24 hours in seconds
  
  return jwt.sign(payload, secret, { expiresIn });
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    // Check if user already exists
    const existingUserByEmail = await UserModel.findByEmail(email);
    if (existingUserByEmail) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const existingUserByUsername = await UserModel.findByUsername(username);
    if (existingUserByUsername) {
      res.status(409).json({ message: 'Username already in use' });
      return;
    }

    // Create user
    const newUser = await UserModel.create({
      username,
      email,
      password,
      role: role as UserRole
    });

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Validate credentials
    const user = await UserModel.validateCredentials(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // The user ID is attached to the request by the auth middleware
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Return user data (excluding password)
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change user password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // The user ID is attached to the request by the auth middleware
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    // Get user
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await UserModel.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    await UserModel.updatePassword(userId, newPassword);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // The user ID is attached to the request by the auth middleware
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { username } = req.body;

    // Validate input
    if (!username) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }

    // Check if username is already taken by another user
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser && existingUser.id !== userId) {
      res.status(409).json({ message: 'Username already in use by another user' });
      return;
    }

    // Update user profile
    const updatedUser = await UserModel.update(userId, { username });
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found or no changes made' });
      return;
    }

    // Return updated user data (excluding password)
    res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};