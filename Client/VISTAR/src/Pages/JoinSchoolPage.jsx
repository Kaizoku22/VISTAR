import Header from "../components/Header";
import { useAuth } from '../AuthContext.jsx';
import { useState } from 'react';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper,
    Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

export default function JoinSchoolPage(){
    const { user } = useAuth();
    const [schoolCode, setSchoolCode] = useState('');
    const url = `http://localhost:8000/user/${user?.id}/schools/joined`;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // Submit the form programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        
        const codeInput = document.createElement('input');
        codeInput.type = 'hidden';
        codeInput.name = 'school_code';
        codeInput.value = schoolCode;
        
        form.appendChild(codeInput);
        document.body.appendChild(form);
        form.submit();
    };
    
    return(
        <>
            <Header/>
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
                                <SchoolIcon />
                            </Avatar>
                            <Typography component="h1" variant="h5">
                                Join a School
                            </Typography>
                        </Box>
                        
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="school_code"
                                label="School Code"
                                name="school_code"
                                autoFocus
                                value={schoolCode}
                                onChange={(e) => setSchoolCode(e.target.value)}
                                helperText="Enter the code provided by your school"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                Join School
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    )
}
