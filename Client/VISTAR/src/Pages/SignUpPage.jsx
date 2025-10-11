import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    Grid,
    Link as MuiLink,
    Avatar,
    Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [serverMessage, setServerMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const text = await res.text();

            if (!res.ok || text.toLowerCase().includes('error')) {
                setError(text || 'Failed to sign up');
                return;
            }

            setServerMessage(text);
            setSubmitted(true);
        } catch (err) {
            setError('Network error. Please try again.');
        }
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
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <PersonAddIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Sign Up
                        </Typography>
                    </Box>
                    
                    {submitted ? (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="info">
                                Weve sent a verification link to {email}. Please check your inbox and click the link to authenticate your account.
                            </Alert>
                            {serverMessage && (
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    {serverMessage}
                                </Typography>
                            )}
                            <MuiLink component={Link} to="/login" variant="body2" sx={{ mt: 2, display: 'inline-block' }}>
                                Go to Sign In
                            </MuiLink>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {error && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                    {error}
                                </Alert>
                            )}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="secondary"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                Sign Up
                            </Button>
                            <Grid container justifyContent="flex-end">
                                <Grid item>
                                    <MuiLink component={Link} to="/login" variant="body2">
                                        Already have an account? Sign in
                                    </MuiLink>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}