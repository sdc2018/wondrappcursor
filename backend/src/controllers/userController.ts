import { Request, Response } from 'express';
import UserModel from '../models/User';

/**
 * User Controller
 * Handles administrative operations on users
 * Note: This is different from authController which handles authentication
 */
export class UserController {
  /**
   * Get all users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.getAll();
      
      // Don't return password hashes
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Error getting all users:', error);
      res.status(500).json({ message: 'Server error while fetching users' });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      
      const user = await UserModel.findById(id);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Don't return password hash
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(`Error getting user by ID:`, error);
      res.status(500).json({ message: 'Server error while fetching user' });
    }
  }

  /**
   * Create a new user
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, role } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !role) {
        res.status(400).json({ message: 'Username, email, password, and role are required' });
        return;
      }
      
      // Check if username already exists
      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        res.status(409).json({ message: 'Username already in use' });
        return;
      }
      
      // Check if email already exists
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }
      
      // Create user
      const newUser = await UserModel.create({
        username,
        email,
        password,
        role
      });
      
      // Don't return password hash
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error while creating user' });
    }
  }

  /**
   * Update a user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      
      const { username, email, password, role } = req.body;
      
      // Ensure at least one field is provided
      if (!username && !email && !password && !role) {
        res.status(400).json({ message: 'At least one field (username, email, password, role) is required' });
        return;
      }
      
      // Check if user exists
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Check if username is being changed and if it's already in use
      if (username && username !== existingUser.username) {
        const userWithSameUsername = await UserModel.findByUsername(username);
        if (userWithSameUsername && userWithSameUsername.id !== id) {
          res.status(409).json({ message: 'Username already in use' });
          return;
        }
      }
      
      // Check if email is being changed and if it's already in use
      if (email && email !== existingUser.email) {
        const userWithSameEmail = await UserModel.findByEmail(email);
        if (userWithSameEmail && userWithSameEmail.id !== id) {
          res.status(409).json({ message: 'Email already in use' });
          return;
        }
      }
      
      // Update user
      const updatedUser = await UserModel.update(id, {
        username,
        email,
        password,
        role
      });
      
      if (!updatedUser) {
        res.status(500).json({ message: 'Failed to update user' });
        return;
      }
      
      // Don't return password hash
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(`Error updating user:`, error);
      res.status(500).json({ message: 'Server error while updating user' });
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      
      // Check if user exists
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Delete user
      const deleted = await UserModel.delete(id);
      
      if (!deleted) {
        res.status(500).json({ message: 'Failed to delete user' });
        return;
      }
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error(`Error deleting user:`, error);
      res.status(500).json({ message: 'Server error while deleting user' });
    }
  }
}

export default new UserController();
