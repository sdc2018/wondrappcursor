import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  Menu,
  MenuItem,
  Badge,
  Collapse
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GridViewIcon from '@mui/icons-material/GridView';
import TaskIcon from '@mui/icons-material/Task';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DomainIcon from '@mui/icons-material/Domain';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface SubNavigationItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

interface NavigationItem {
  text: string;
  path?: string;
  icon: React.ReactNode;
  roles: string[];
  children?: SubNavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    text: 'Dashboard', 
    path: '/dashboard', 
    icon: <DashboardIcon />, 
    roles: ['admin', 'sales', 'bu_head', 'senior_management'] 
  },
  {
    text: 'Clients', 
    path: '/clients', 
    icon: <BusinessIcon />, 
    roles: ['admin', 'sales', 'bu_head', 'senior_management'] 
  },
  { 
    text: 'Services', 
    path: '/services', 
    icon: <CategoryIcon />, 
    roles: ['admin', 'bu_head', 'senior_management'] 
  },
  { 
    text: 'Opportunities', 
    path: '/opportunities', 
    icon: <TrendingUpIcon />, 
    roles: ['admin', 'sales', 'bu_head', 'senior_management'] 
  },
  { 
    text: 'Cross-Sell Matrix', 
    path: '/matrix', 
    icon: <GridViewIcon />, 
    roles: ['admin', 'sales', 'bu_head', 'senior_management'] 
  },
  { 
    text: 'Tasks', 
    path: '/tasks', 
    icon: <TaskIcon />, 
    roles: ['admin', 'sales', 'bu_head'] 
  },
  {
    text: 'Admin',
    icon: <AdminPanelSettingsIcon />,
    roles: ['admin'],
    children: [
      { 
        text: 'Users', 
        path: '/admin/users',
        icon: <PeopleIcon />, 
        roles: ['admin'] 
      },
      {
        text: 'Business Units',
        path: '/admin/business-units',
        icon: <DomainIcon />,
        roles: ['admin']
      },
      {
        text: 'Industries',
        path: '/admin/industries',
        icon: <CategoryIcon />,
        roles: ['admin']
      }
    ]
  }
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCount] = useState(5); // Placeholder for notification count
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Use the auth context to get user role and logout function
  const { userRole: authUserRole, logout } = useAuth();
  // Provide a default value for userRole when it might be null
  const userRole = authUserRole || 'guest';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    // No need to manually navigate as the logout method in AuthContext already handles this
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleSubMenuToggle = (text: string) => {
    setOpenSubMenu(openSubMenu === text ? null : text);
  };

  const isSubMenuOpen = (text: string) => {
    return openSubMenu === text;
  };

  // Check if a path is active, including child paths
  const isPathActive = (path: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if any child path is active
  const isAnyChildPathActive = (children?: SubNavigationItem[]) => {
    if (!children) return false;
    return children.some(child => isPathActive(child.path));
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Wondrlab
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems
          .filter(item => item.roles.includes(userRole))
          .map((item) => (
            <React.Fragment key={item.text}>
              {item.children ? (
                // Item with children (submenu)
                <>
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => handleSubMenuToggle(item.text)}
                      selected={isAnyChildPathActive(item.children)}
                    >
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {isSubMenuOpen(item.text) ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={isSubMenuOpen(item.text)} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children
                        .filter(child => child.roles.includes(userRole))
                        .map((child) => (
                          <ListItem key={child.text} disablePadding>
              <ListItemButton 
                              sx={{ pl: 4 }}
                              selected={isPathActive(child.path)}
                onClick={() => {
                                navigate(child.path);
                  setMobileOpen(false);
                              }}
                            >
                              <ListItemIcon>
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText primary={child.text} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                // Regular item (no children)
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={isPathActive(item.path!)}
                    onClick={() => {
                      if (item.path) {
                        navigate(item.path);
                        setMobileOpen(false);
                      }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
              )}
            </React.Fragment>
          ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Cross-Selling Management System
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleNotificationsClick}
            sx={{ mr: 2 }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={userMenuAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(userMenuAnchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={handleProfileClick}>
              <AccountCircle fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar sx={{ minHeight: '48px !important' }} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;