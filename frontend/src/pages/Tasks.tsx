import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import taskService, { Task, TaskWithDetails, TaskInput } from '../services/taskService';
import opportunityService, { Opportunity } from '../services/opportunityService';
import userService from '../services/userService';
import clientService, { Client } from '../services/clientService';
import serviceService, { Service } from '../services/serviceService';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../services/authService';
import { exportToCSV, parseCSVFile, validateCSVData, prepareDataForImport, exportForImport } from '../utils/csvUtils';
import CSVFormatHelper from '../components/CSVFormatHelper';

// Define status options for tasks
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);
  const [showFormatHelper, setShowFormatHelper] = useState(false);

  // Add Task Dialog State
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<TaskInput>({
    name: '',
    opportunity_id: 0,
    assigned_user_id: 0,
    due_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    status: 'pending',
    description: ''
  });

  // Mock filter state - actual filter logic would be more complex
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue'>('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: TaskWithDetails[];
      
      // Fetch all related data needed for enrichment
      const [fetchedOpportunities, fetchedUsers, fetchedClients, fetchedServices] = await Promise.all([
        opportunityService.getAllOpportunities(),
        userService.getAllUsers(),
        clientService.getAllClients(),
        serviceService.getAllServices()
      ]);
      
      // Create maps for quick lookup
      const opportunityMap = new Map(
        fetchedOpportunities.map(opp => [opp.id, opp])
      );
      
      const userMap = new Map(
        fetchedUsers.map(user => [user.id, user])
      );
      
      const clientMap = new Map(
        fetchedClients.map(client => [client.id, client])
      );
      
      const serviceMap = new Map(
        fetchedServices.map(service => [service.id, service])
      );
      
      // Helper function to enrich task data
      const enrichTask = (task: Task): TaskWithDetails => {
        const opportunity = opportunityMap.get(task.opportunity_id);
        const assignedUser = userMap.get(task.assigned_user_id);
        
        // Get client and service using the opportunity's references
        const client: Client | null = opportunity ? (clientMap.get(opportunity.client_id) || null) : null;
        const service: Service | null = opportunity ? (serviceMap.get(opportunity.service_id) || null) : null;
        
        return {
          ...task,
          opportunity_name: opportunity ? opportunity.name : 'Unknown Opportunity',
          client_name: client ? client.name : 'Unknown Client',
          service_name: service ? service.name : 'Unknown Service',
          assigned_user_name: assignedUser ? assignedUser.username : 'Unknown User',
          business_unit: service ? service.business_unit : 'N/A'
        };
      };
      
      if (filter === 'overdue') {
        data = await taskService.getOverdueTasks(); // Already returns TaskWithDetails[]
        console.log('Overdue tasks:', data.map(task => task.id));
      } else if (filter === 'my' && user) {
        // For 'my' tasks
        const basicTasks: Task[] = await taskService.getTasksByAssignedUser(user.id);
        console.log('My tasks (before mapping):', basicTasks.map(task => task.id));
        
        // Enrich basic tasks with opportunity and user details
        data = basicTasks.map(enrichTask);
      } else {
        // For 'all' tasks
        const basicTasks: Task[] = await taskService.getAllTasks();
        console.log('All tasks (before mapping):', basicTasks.map(task => task.id));
        
        // Enrich basic tasks with opportunity and user details
        data = basicTasks.map(enrichTask);
      }
      
      // Check for duplicate IDs
      const taskIds = data.map(task => task.id);
      const uniqueIds = new Set(taskIds);
      
      if (taskIds.length !== uniqueIds.size) {
        console.error('DUPLICATE TASK IDs DETECTED!');
        const idCounts = taskIds.reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
        
        const duplicates = Object.entries(idCounts)
          .filter(([_, count]) => count > 1)
          .map(([id, count]) => `ID ${id} appears ${count} times`);
        
        console.error('Duplicate IDs:', duplicates);
        console.log('Full task data with duplicates:', JSON.stringify(data, null, 2));
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

  // Fetch opportunities and users for the dialog dropdowns
  const fetchDropdownData = useCallback(async () => {
    try {
      const [fetchedOpportunities, fetchedUsers] = await Promise.all([
        opportunityService.getAllOpportunities(),
        userService.getAllUsers()
      ]);
      setOpportunities(fetchedOpportunities);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
      setError('Failed to load form data. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
  }, [fetchTasks, fetchDropdownData]);

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

  // Dialog functions
  const handleOpenDialog = (task?: Task) => {
    if (task) {
      // Edit mode
      setIsEditMode(true);
      setCurrentTask(task);
      setFormData({
        name: task.name,
        opportunity_id: task.opportunity_id,
        assigned_user_id: task.assigned_user_id,
        due_date: task.due_date.split('T')[0], // Format date for input
        status: task.status,
        description: task.description
      });
    } else {
      // Add mode
      setIsEditMode(false);
      setCurrentTask(null);
      setFormData({
        name: '',
        opportunity_id: opportunities.length > 0 ? opportunities[0].id : 0,
        assigned_user_id: user ? user.id : (users.length > 0 ? users[0].id : 0),
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentTask(null);
    setFormData({
      name: '',
      opportunity_id: 0,
      assigned_user_id: 0,
      due_date: '',
      status: 'pending',
      description: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number | string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTask = async () => {
    try {
      setLoading(true);
      if (isEditMode && currentTask) {
        await taskService.updateTask(currentTask.id, formData);
      } else {
        await taskService.createTask(formData);
      }
      handleCloseDialog();
      fetchTasks();
      setError(null);
    } catch (err) {
      console.error('Failed to save task:', err);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
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
      
      // Validate the CSV data - make most fields optional with smart defaults
      const requiredFields = ['name']; // Only name is truly required
      const validationResult = validateCSVData(parsedData, requiredFields, 'tasks');
      
      if (!validationResult.valid) {
        setError(`CSV validation failed:\n${validationResult.errors.join('\n')}`);
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('CSV Import Warnings:', validationResult.warnings);
      }
      
      // Prepare data for import with lookup data for name-to-ID resolution
      const lookupData = {
        opportunities: opportunities,
        users: users
      };
      const processedData = prepareDataForImport(parsedData, 'tasks', lookupData);
      
      // Process and create tasks
      const createdTasks = [];
      for (const taskData of processedData) {
        try {
          const newTask = await taskService.createTask(taskData as TaskInput);
          createdTasks.push(newTask);
        } catch (err) {
          console.error('Error creating task:', err);
        }
      }
      
      // Refresh tasks list
      await fetchTasks();
      setError(null);
      alert(`Successfully imported ${createdTasks.length} tasks`);
    } catch (err) {
      console.error('Error importing tasks:', err);
      setError('Failed to import tasks. Please check your CSV file format.');
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
    const dataToExport = tasks.map(task => ({
      id: task.id,
      name: task.name,
      opportunity_id: task.opportunity_id,
      opportunity_name: task.opportunity_name,
      assigned_user_id: task.assigned_user_id,
      assigned_user_name: task.assigned_user_name,
      due_date: task.due_date,
      status: task.status,
      description: task.description,
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
    
    exportToCSV(dataToExport, 'tasks_export.csv');
  };

  // Handler for export import template
  const handleExportTemplate = () => {
    try {
      const templateData = [{
        name: 'Review Marketing Proposal',
        opportunity_name: 'Q1 Marketing Campaign',
        assigned_user_name: 'admin',
        due_date: '2024-02-15',
        status: 'pending',
        description: 'Review and approve the marketing proposal for Q1 campaign - you can use opportunity names and usernames instead of IDs'
      }];
      
      exportForImport(templateData, 'tasks_import_template.csv', 'tasks');
    } catch (err) {
      console.error('Error exporting template:', err);
      setError('Failed to export template.');
    }
  };

  if (loading && tasks.length === 0) { 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          {selectedTaskIds.size > 0 && (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteConfirmation}
              size="small"
            >
              Delete Selected ({selectedTaskIds.size})
            </Button>
          )}
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
            Add Task
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Button 
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
          size="small"
        >
          All Tasks
        </Button>
        <Button 
          variant={filter === 'my' ? 'contained' : 'outlined'}
          onClick={() => setFilter('my')}
          size="small"
        >
          My Tasks
        </Button>
        <Button 
          variant={filter === 'overdue' ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setFilter('overdue')}
          size="small"
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
                  aria-label="select all tasks"
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
                // Compare only the date parts, not time, to avoid marking today's tasks as overdue
                const taskDate = new Date(task.due_date);
                const today = new Date();
                const isOverdue = (
                  taskDate.getFullYear() < today.getFullYear() || 
                  (taskDate.getFullYear() === today.getFullYear() && 
                   taskDate.getMonth() < today.getMonth()) ||
                  (taskDate.getFullYear() === today.getFullYear() && 
                   taskDate.getMonth() === today.getMonth() && 
                   taskDate.getDate() < today.getDate())
                ) && task.status !== 'completed';
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
                        aria-labelledby={`task-${task.id}`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(task);
                        }} 
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
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

      {/* Delete Confirmation Dialog */}
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
        type="tasks"
      />

      {/* Add/Edit Task Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Task Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="opportunity-select-label">Opportunity</InputLabel>
            <Select
              labelId="opportunity-select-label"
              name="opportunity_id"
              value={formData.opportunity_id}
              label="Opportunity"
              onChange={handleSelectChange}
              required
            >
              {opportunities.map((opp) => (
                <MenuItem key={opp.id} value={opp.id}>
                  {opp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="assigned-user-select-label">Assigned To</InputLabel>
            <Select
              labelId="assigned-user-select-label"
              name="assigned_user_id"
              value={formData.assigned_user_id}
              label="Assigned To"
              onChange={handleSelectChange}
              required
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="due_date"
            label="Due Date"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.due_date}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleSelectChange}
              required
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description || ''}
            onChange={handleInputChange}
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitTask} variant="contained" color="primary">
            {isEditMode ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
