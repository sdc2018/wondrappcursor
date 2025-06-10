import React, { useState, useEffect, useCallback } from 'react';
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
  Checkbox,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add'; // Keep if Add Task functionality is intended
import EditIcon from '@mui/icons-material/Edit';

import taskService, { Task, TaskWithDetails } from '../services/taskService';
// Assuming Opportunity and User types/services might be needed for Add/Edit Task dialog
import opportunityService from '../services/opportunityService';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

  // Mock filter state - actual filter logic would be more complex
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue'>('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: TaskWithDetails[];
      if (filter === 'overdue') {
        data = await taskService.getOverdueTasks(); // Returns TaskWithDetails[]
      } else if (filter === 'my' && user) {
        // For 'my' tasks
        const basicTasks: Task[] = await taskService.getTasksByAssignedUser(user.id); // Returns Task[]
        // Map Task[] to TaskWithDetails[] with placeholders for missing details
        data = basicTasks.map(task => ({
          ...task,
          opportunity_name: task.opportunity_id ? `Opp ID: ${task.opportunity_id}` : 'N/A',
          client_name: 'N/A', 
          service_name: 'N/A', 
          assigned_user_name: task.assigned_user_id ? `User ID: ${task.assigned_user_id}` : 'N/A',
          business_unit: 'N/A' 
        }));
      } else {
        // For 'all' tasks
        const basicTasks: Task[] = await taskService.getAllTasks(); // Returns Task[]
        // Map Task[] to TaskWithDetails[] with placeholders for missing details
        data = basicTasks.map(task => ({
          ...task,
          opportunity_name: task.opportunity_id ? `Opp ID: ${task.opportunity_id}` : 'N/A',
          client_name: 'N/A', 
          service_name: 'N/A', 
          assigned_user_name: task.assigned_user_id ? `User ID: ${task.assigned_user_id}` : 'N/A',
          business_unit: 'N/A' 
        }));
      }
      setTasks(data);
      // Clear selected tasks when filter changes
      setSelectedTaskIds(new Set());
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectAllClick = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Select all checkbox changed. Checked: ${event.target.checked}`);
    
    if (event.target.checked) {
      // Select all tasks
      const newSelectedIds = new Set(tasks.map((task) => task.id));
      console.log(`Selecting all tasks: ${Array.from(newSelectedIds).join(', ')}`);
      setSelectedTaskIds(newSelectedIds);
    } else {
      // Unselect all tasks
      console.log('Clearing all selections');
      setSelectedTaskIds(new Set());
    }
  }, [tasks]);

  const handleCheckboxClick = useCallback((event: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
    // Stop event propagation to prevent any parent handlers from firing
    event.stopPropagation();
    
    console.log(`Checkbox for task ${taskId} changed. Checked: ${event.target.checked}`);
    
    // Create a new Set from the current one to avoid mutation
    const newSelectedTaskIds = new Set(selectedTaskIds);
    
    if (event.target.checked) {
      newSelectedTaskIds.add(taskId);
    } else {
      newSelectedTaskIds.delete(taskId);
    }
    
    console.log(`New selected tasks: ${Array.from(newSelectedTaskIds).join(', ')}`);
    
    // Update state with the new Set
    setSelectedTaskIds(newSelectedTaskIds);
  }, [selectedTaskIds]);

  const handleDeleteSelectedTasks = async () => {
    if (selectedTaskIds.size === 0) return;
    
    setDeleteConfirmationOpen(false);
    setLoading(true); 
    try {
      const deletePromises: Promise<void>[] = [];
      selectedTaskIds.forEach(taskId => { // .forEach is fine for Set iteration
        deletePromises.push(taskService.deleteTask(taskId));
      });
      await Promise.all(deletePromises);
      
      fetchTasks(); 
      setSelectedTaskIds(new Set());
      setError(null); 
    } catch (err) {
      console.error('Failed to delete selected tasks:', err);
      setError('Failed to delete one or more tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = () => {
    if (selectedTaskIds.size > 0) {
      setDeleteConfirmationOpen(true);
    }
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
  };

  if (loading && tasks.length === 0) { 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Stack direction="row" spacing={2}>
          {selectedTaskIds.size > 0 && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteConfirmation}
            >
              Delete Selected ({selectedTaskIds.size})
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => alert('Add Task Clicked - Implement Dialog')}
          >
            Add Task
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
        >
          All Tasks
        </Button>
        <Button 
          variant={filter === 'my' ? 'contained' : 'outlined'}
          onClick={() => setFilter('my')}
        >
          My Tasks
        </Button>
        <Button 
          variant={filter === 'overdue' ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setFilter('overdue')}
        >
          Overdue Tasks
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && tasks.length > 0 && <CircularProgress size={24} sx={{ mb: 1 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length}
                  checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all tasks' }}
                />
              </TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Opportunity</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No tasks found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Map over tasks and render each row
              tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed';
                const isSelected = selectedTaskIds.has(task.id);
                
                return (
                  <TableRow 
                    key={task.id}
                    selected={isSelected}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleCheckboxClick(e, task.id)}
                        onClick={(e) => e.stopPropagation()}
                        inputProps={{
                          'aria-labelledby': `task-${task.id}`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" id={`task-${task.id}`}>{task.name}</Typography>
                    </TableCell>
                    <TableCell>{task.opportunity_name}</TableCell>
                    <TableCell>{task.assigned_user_name}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={isOverdue ? "error" : "inherit"}
                        sx={{ fontWeight: isOverdue ? 'bold' : 'normal' }}
                      >
                        {new Date(task.due_date).toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                      </Typography>
                    </TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => alert(`Edit task ${task.id}`)} 
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            taskService.deleteTask(task.id).then(() => {
                              fetchTasks();
                            });
                          }
                        }} 
                        size="small" 
                        color="error"
                      >
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

      <Dialog
        open={deleteConfirmationOpen}
        onClose={closeDeleteConfirmation}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedTaskIds.size} selected task{selectedTaskIds.size > 1 ? 's' : ''}?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmation}>Cancel</Button>
          <Button onClick={handleDeleteSelectedTasks} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
