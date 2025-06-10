import { Request, Response } from 'express';
import TaskModel, { TaskStatus, TaskInput } from '../models/Task';
import OpportunityModel from '../models/Opportunity';
import NotificationModel, { NotificationType } from '../models/Notification';
import { UserRole } from '../models/User';

export class TaskController {
  // Create a new task
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData: TaskInput = req.body;
      
      // Validate required fields
      if (!taskData.name || !taskData.opportunity_id || !taskData.assigned_user_id || !taskData.due_date) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      // Validate opportunity exists
      const opportunity = await OpportunityModel.findById(taskData.opportunity_id);
      if (!opportunity) {
        res.status(404).json({ message: 'Opportunity not found' });
        return;
      }

      // Set default status if not provided
      if (!taskData.status) {
        taskData.status = TaskStatus.PENDING;
      }

      // Create task
      const task = await TaskModel.create(taskData);

      // Create notification for assigned user
      if (req.user && task.assigned_user_id !== req.user.userId) {
        await NotificationModel.create({
          user_id: task.assigned_user_id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${task.name}`,
          related_to: 'task',
          related_id: task.id
        });
      }

      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Server error while creating task' });
    }
  }

  // Get all tasks with optional filters
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const { status, opportunity_id } = req.query;
      let tasks;

      if (opportunity_id) {
        tasks = await TaskModel.findByOpportunity(Number(opportunity_id));
      } else if (status) {
        // Get all tasks first, then filter by status
        const allTasks = await TaskModel.findAllTasks();
        tasks = allTasks.filter((task: any) => task.status === status);
      } else {
        // Return ALL tasks (not just current user's tasks)
        tasks = await TaskModel.findAllTasks();
      }

      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ message: 'Server error while retrieving tasks' });
    }
  }

  // Get task by ID
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const taskId = parseInt(req.params.id);
      const task = await TaskModel.findById(taskId);

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      res.status(200).json(task);
    } catch (error) {
      console.error('Error getting task by ID:', error);
      res.status(500).json({ message: 'Server error while retrieving task' });
    }
  }

  // Get tasks for current user
  async getMyTasks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const tasks = await TaskModel.findByAssignedUser(req.user.userId);
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting user tasks:', error);
      res.status(500).json({ message: 'Server error while retrieving your tasks' });
    }
  }

  // Get tasks by assigned user ID (for frontend service compatibility)
  async getTasksByAssignedUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const userId = parseInt(req.params.userId);
      
      // Only allow users to see their own tasks unless they're admin/bu_head
      if (req.user.userId !== userId && req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.BU_HEAD) {
        res.status(403).json({ message: 'Access denied: You can only view your own tasks' });
        return;
      }
      
      const tasks = await TaskModel.findByAssignedUser(userId);
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting tasks by assigned user:', error);
      res.status(500).json({ message: 'Server error while retrieving tasks' });
    }
  }

  // Get overdue tasks
  async getOverdueTasks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      // Check if user is admin or BU head
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.BU_HEAD) {
        res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required' });
        return;
      }

      const tasks = await TaskModel.findOverdueTasks();
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      res.status(500).json({ message: 'Server error while retrieving overdue tasks' });
    }
  }

  // Update task
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const taskId = parseInt(req.params.id);
      const taskData: Partial<TaskInput> = req.body;
      
      // Verify task exists
      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      // Check if user has permission to update this task
      const isAssignedUser = existingTask.assigned_user_id === req.user.userId;
      const isAdmin = req.user.role === UserRole.ADMIN;
      const isBUHead = req.user.role === UserRole.BU_HEAD;
      
      if (!isAssignedUser && !isAdmin && !isBUHead) {
        res.status(403).json({ message: 'Access denied: You cannot update this task' });
        return;
      }

      // Update task
      const updatedTask = await TaskModel.update(taskId, taskData);
      
      // Create notification if status changed to completed
      if (taskData.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
        // Find the opportunity to get client owner and BU head
        const opportunity = await OpportunityModel.findById(existingTask.opportunity_id);
        if (opportunity) {
          // Notify opportunity owner
          if (opportunity.assigned_user_id !== req.user.userId) {
            await NotificationModel.create({
              user_id: opportunity.assigned_user_id,
              type: NotificationType.TASK_ASSIGNED,
              title: 'Task Completed',
              message: `Task "${existingTask.name}" has been marked as completed`,
              related_to: 'task',
              related_id: taskId
            });
          }
        }
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Server error while updating task' });
    }
  }

  // Update task status
  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
        res.status(400).json({ message: 'Invalid status value' });
        return;
      }

      // Verify task exists
      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      // Check if user has permission to update this task
      const isAssignedUser = existingTask.assigned_user_id === req.user.userId;
      const isAdmin = req.user.role === UserRole.ADMIN;
      const isBUHead = req.user.role === UserRole.BU_HEAD;
      
      if (!isAssignedUser && !isAdmin && !isBUHead) {
        res.status(403).json({ message: 'Access denied: You cannot update this task' });
        return;
      }

      // Update task status
      const updatedTask = await TaskModel.updateStatus(taskId, status as TaskStatus);
      
      // Create notification if status changed to completed
      if (status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
        // Find the opportunity to get client owner and BU head
        const opportunity = await OpportunityModel.findById(existingTask.opportunity_id);
        if (opportunity) {
          // Notify opportunity owner
          if (opportunity.assigned_user_id !== req.user.userId) {
            await NotificationModel.create({
              user_id: opportunity.assigned_user_id,
              type: NotificationType.TASK_ASSIGNED,
              title: 'Task Completed',
              message: `Task "${existingTask.name}" has been marked as completed`,
              related_to: 'task',
              related_id: taskId
            });
          }
        }
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ message: 'Server error while updating task status' });
    }
  }

  // Delete task
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const taskId = parseInt(req.params.id);
      
      // Verify task exists
      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      // Check if user has permission to delete this task
      const isAdmin = req.user.role === UserRole.ADMIN;
      const isBUHead = req.user.role === UserRole.BU_HEAD;
      
      if (!isAdmin && !isBUHead) {
        res.status(403).json({ message: 'Access denied: Admin or BU Head privileges required to delete tasks' });
        return;
      }

      // Delete task
      const deleted = await TaskModel.delete(taskId);
      
      if (deleted) {
        res.status(200).json({ message: 'Task deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete task' });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Server error while deleting task' });
    }
  }

  // Get task statistics
  async getTaskStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await TaskModel.getTasksStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting task statistics:', error);
      res.status(500).json({ message: 'Server error while retrieving task statistics' });
    }
  }
}

export default new TaskController();