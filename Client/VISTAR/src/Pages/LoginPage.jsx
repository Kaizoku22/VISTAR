import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
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
    Snackbar,
    Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailForPasswordReset, setEmailForPasswordReset] = useState("");
    const [error, setError] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("error");
    
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || "Login failed");
                setAlertMessage("Login failed. Please check your credentials.");
                setAlertSeverity("error");
                setShowAlert(true);
                return;
            }
                
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            navigate("/");
        } catch (error) {
            console.error("Login error:", error);
            setError("Login failed. Please check your credentials.");
            setAlertMessage("Login failed. Please check your credentials.");
            setAlertSeverity("error");
            setShowAlert(true);
        }
    };

    const handleForgotPassword = async () => {
        if (!emailForPasswordReset) {
            setAlertMessage("Please enter your email address");
            setAlertSeverity("warning");
            setShowAlert(true);
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: emailForPasswordReset }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error sending password reset link");
            }

            setAlertMessage("A password reset link has been sent to your email.");
            setAlertSeverity("success");
            setShowAlert(true);
            setEmailForPasswordReset("");
        } catch (error) {
            console.error("Error:", error);
            setAlertMessage("Error sending password reset link. Please try again.");
            setAlertSeverity("error");
            setShowAlert(true);
        }
    };

    const handleCloseAlert = () => {
        setShowAlert(false);
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
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Sign in
                        </Typography>
                    </Box>
                    
                    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
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
                            error={!!error}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={!!error}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <MuiLink 
                                    component="button" 
                                    variant="body2" 
                                    onClick={() => {
                                        const resetEmail = prompt("Enter your email for password reset:");
                                        if (resetEmail) {
                                            setEmailForPasswordReset(resetEmail);
                                            handleForgotPassword();
                                        }
                                    }}
                                >
                                    Forgot password?
                                </MuiLink>
                            </Grid>
                            <Grid item>
                                <MuiLink component={Link} to="/signup" variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </MuiLink>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
            
            <Snackbar open={showAlert} autoHideDuration={6000} onClose={handleCloseAlert}>
                <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}
