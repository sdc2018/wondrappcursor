import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Stack,
  Alert,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';

// Import notification service
import notificationService, { Notification } from '../services/notificationService';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Fetch notifications based on current filter
    const fetchNotifications = async () => {
    setLoading(true);
    try {
      let data: Notification[];
      
      if (filter === 'all') {
        data = await notificationService.getUserNotifications();
      } else {
        data = await notificationService.getUnreadNotifications();
      }
      
      setNotifications(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  // Fetch notifications when component mounts or filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    handleFilterClose();
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read. Please try again.');
    }
  };

  const handleDeleteClick = (id: number) => {
    setNotificationToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete === null) return;
    
    try {
      await notificationService.deleteNotification(notificationToDelete);
      
      // Update local state
      setNotifications(notifications.filter(notification => notification.id !== notificationToDelete));
      setOpenDeleteDialog(false);
      setNotificationToDelete(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification. Please try again.');
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    try {
      await notificationService.deleteAllNotifications();
      
      // Update local state
      setNotifications([]);
      setDeleteAllDialogOpen(false);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError('Failed to delete all notifications. Please try again.');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_opportunity':
      case 'opportunity_status_change':
      case 'opportunity_won':
        return <TrendingUpIcon color="primary" />;
      case 'task_assigned':
      case 'task_overdue':
      case 'task_overdue_escalation':
        return <AssignmentIcon color={type.includes('overdue') ? "error" : "info"} />;
      case 'new_client':
        return <BusinessIcon color="secondary" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationTypeChip = (type: string) => {
    let label = '';
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (type) {
      case 'new_opportunity':
        label = 'New Opportunity';
        color = 'primary';
        break;
      case 'opportunity_status_change':
        label = 'Status Change';
        color = 'info';
        break;
      case 'opportunity_won':
        label = 'Opportunity Won';
        color = 'success';
        break;
      case 'task_assigned':
        label = 'Task Assigned';
        color = 'secondary';
        break;
      case 'task_overdue':
      case 'task_overdue_escalation':
        label = 'Task Overdue';
        color = 'error';
        break;
      case 'new_client':
        label = 'New Client';
        color = 'warning';
        break;
      default:
        label = type.replace(/_/g, ' ');
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications;
  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h4">Notifications</Typography>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon color="action" />
          </Badge>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
          >
            {filter === 'all' ? 'All Notifications' : 'Unread Notifications'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAllClick}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </Stack>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleFilterChange('all')}>All Notifications</MenuItem>
        <MenuItem onClick={() => handleFilterChange('unread')}>Unread Notifications</MenuItem>
      </Menu>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        {filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: notification.is_read ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                    transition: 'background-color 0.3s',
                    position: 'relative',
                    pr: 12 // Add padding for action buttons
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography 
                          variant="subtitle1" 
                          component="span"
                          sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Chip label="New" size="small" color="primary" />
                        )}
                        {getNotificationTypeChip(notification.type)}
                      </Stack>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', my: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDate(notification.created_at)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  {/* Action buttons positioned absolutely */}
                  <Box sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      {!notification.is_read && (
                        <Tooltip title="Mark as read">
                          <IconButton 
                            aria-label="mark as read"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <MarkEmailReadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton 
                          aria-label="delete"
                          onClick={() => handleDeleteClick(notification.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
      >
        <DialogTitle>Clear All Notifications</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all notifications? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAllConfirm} color="error" autoFocus>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;