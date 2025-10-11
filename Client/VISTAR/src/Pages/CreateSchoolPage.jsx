import Header from "../components/Header";
import { useAuth } from '../AuthContext.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper,
    Avatar,
    CircularProgress,
    Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CreateSchoolPage() {
    const {user} = useAuth();
    const [schoolName, setSchoolName] = useState('');
    const [schoolDescription, setSchoolDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const requestBody = {
            school_name: schoolName,
            school_description: schoolDescription,
            user_id: user.id
        };

        try {
            const response = await fetch('http://localhost:8000/school', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('School created:', data);
                setTimeout(() => navigate("/"), 500);
            } else {
                console.error('Failed to create school:', data);
                setError(data?.message || 'Failed to create school');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <Container component="main" maxWidth="sm">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                                <AddIcon />
                            </Avatar>
                            <Typography component="h1" variant="h5">
                                Create School
                            </Typography>
                        </Box>
                        
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="schoolName"
                                label="School Name"
                                name="schoolName"
                                autoFocus
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                disabled={loading}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="schoolDescription"
                                label="School Description"
                                name="schoolDescription"
                                multiline
                                rows={4}
                                value={schoolDescription}
                                onChange={(e) => setSchoolDescription(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={24} /> : <AddIcon />}
                            >
                                {loading ? "Creating..." : "Create School"}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}
