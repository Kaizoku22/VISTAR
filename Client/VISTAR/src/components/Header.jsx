import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

export default function Header() {
    return (
        <AppBar position="static" color="primary" elevation={2}>
            <Container>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1 }} />
                        <Typography 
                            variant="h6" 
                            component={Link} 
                            to="/" 
                            sx={{ 
                                textDecoration: "none", 
                                color: "white", 
                                fontWeight: 'bold',
                                letterSpacing: '0.5px'
                            }}
                        >
                            VISTAR
                        </Typography>
                    </Box>
                    <Box>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/createSchool"
                            sx={{ mx: 1 }}
                        >
                            Create School
                        </Button>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/joinSchool"
                            sx={{ mx: 1 }}
                        >
                            Join School
                        </Button>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/profile"
                            sx={{ mx: 1 }}
                            variant="outlined"
                        >
                            Profile
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}