import React, { useEffect, useState } from 'react';
import Header from "../components/Header";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Avatar, 
  Button, 
  TextField, 
  Grid, 
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      address: ''
    });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) {
      setSnackbar({ open: true, message: 'Not logged in', severity: 'error' });
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/user/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          avatar_url: null
        })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update profile');
      }
      const updated = await res.json();
      // Update local context with merged data (keep id/email from auth)
      setUser({
        ...user,
        firstName: updated.first_name || formData.firstName || '',
        lastName: updated.last_name || formData.lastName || '',
        phone: updated.phone || formData.phone || '',
        address: updated.address || formData.address || ''
      });
      setEditing(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Update failed', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const clearAllCookies = () => {
    try {
      const cookies = document.cookie.split(';');
      for (const c of cookies) {
        const eqPos = c.indexOf('=');
        const name = (eqPos > -1 ? c.substr(0, eqPos) : c).trim();
        if (name) {
          // Best-effort delete for current domain and root path
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    } catch {}
  };

  const handleLogout = () => {
    try { clearAllCookies(); } catch {}
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    setUser(null);
    navigate('/login');
  };

  // Load profile from app_users
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:8000/user/${user.id}/profile`);
        if (!res.ok) return; // silently ignore
        const data = await res.json();
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: user.email || '',
          phone: data.phone || '',
          address: data.address || ''
        });
        // Also mirror into context for display mode consistency
        setUser({
          ...user,
          firstName: data.first_name || user.firstName || '',
          lastName: data.last_name || user.lastName || '',
          phone: data.phone || user.phone || '',
          address: data.address || user.address || ''
        });
      } catch {}
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {!user ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error">
              Please log in to view your profile
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  mr: 2
                }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}` 
                    : 'User Profile'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {editing ? (
                // Edit Mode
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </>
              ) : (
                // View Mode
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="text.secondary">First Name</Typography>
                    <Typography variant="body1">{user.firstName || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="text.secondary">Last Name</Typography>
                    <Typography variant="body1">{user.lastName || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{user.phone || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{user.address || 'Not provided'}</Typography>
                  </Grid>
                </>
              )}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {editing ? (
                <>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={handleCancel}
                    startIcon={<CancelIcon />}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSave}
                    startIcon={<SaveIcon />}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outlined"
                    color="secondary"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleEdit}
                    startIcon={<EditIcon />}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        )}

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}