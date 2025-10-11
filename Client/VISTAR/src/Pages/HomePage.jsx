import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SchoolCard from "../components/SchoolCard.jsx";
import Header from '../components/Header.jsx';
import { useAuth } from '../AuthContext.jsx';
import { 
    Container, 
    Typography, 
    Box, 
    Grid, 
    CircularProgress, 
    Paper, 
    Divider,
    Button,
    Card,
    CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';

export default function Homepage() {
    const navigate = useNavigate();
    const { user } = useAuth(); // ✅ Destructure user from context

    const [schools, setSchools] = useState([]);
    const [joinedSchools, setJoinedSchools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        let isMounted = true;
        const URL = `http://localhost:8000/school/created_schools/${user.id}`;
        const joinedSchoolURL = `http://localhost:8000/user/${user.id}/schools/joined`
        
        const fetchSchools = async () => {
            try {
                const response = await fetch(URL);
                const result = await response.json();
                if (isMounted) {
                    setSchools(result);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchJoinedSchools = async () => {
            try {
                const response = await fetch(joinedSchoolURL);
                const result = await response.json();
                if(isMounted) {
                    console.log(`joinedSchools Data : ${result}`)
                    setJoinedSchools(result);
                }
            } catch(error) {
                console.error("Error fetching joinedSchools Data:", error);
            }
        }
        
        fetchJoinedSchools();
        fetchSchools();
        
        return () => {
            isMounted = false;
        };
    }, [user, navigate]);

    const handleClearSchools = () => {
        setSchools([]);
    };

    const createRouteLink = (school) => `/school/${school.school_id}`;

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <>
            <Header />
            
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" color="primary" gutterBottom>
                        Home
                    </Typography>
                    <Box>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<AddIcon />}
                            component={Link}
                            to="/createSchool"
                            sx={{ mr: 2 }}
                        >
                            Create School
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="primary"
                            component={Link}
                            to="/joinSchool"
                        >
                            Join School
                        </Button>
                    </Box>
                </Box>

                {schools.length > 0 ? (
                    <Box sx={{ mb: 4 }}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SchoolIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h5" component="h2" color="primary">
                                    Created Schools
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={3}>
                                {schools.map((school) => (
                                    <Grid item xs={12} sm={6} md={4} key={school.school_id}>
                                        <Link
                                            to={createRouteLink(school)}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <SchoolCard
                                                schoolName={school.school_name}
                                                role="Teacher"
                                                description={school.description}
                                            />
                                        </Link>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Box>
                ) : (
                    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No schools created yet!
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<AddIcon />}
                            component={Link}
                            to="/createSchool"
                            sx={{ mt: 2 }}
                        >
                            Create Your First School
                        </Button>
                    </Paper>
                )}
            {joinedSchools.length > 0 ? (
                <Box sx={{ mb: 4 }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <SchoolIcon color="secondary" sx={{ mr: 1 }} />
                            <Typography variant="h5" component="h2" color="secondary">
                                Joined Schools
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={3}>
                            {joinedSchools.map((school) => (
                                <Grid item xs={12} sm={6} md={4} key={school.school_id}>
                                    <Link
                                        to={createRouteLink(school)}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <SchoolCard
                                            schoolName={school.school_name}
                                            role="Teacher"
                                            description={school.description}
                                        />
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Box>
            ) : (
                <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        You haven't joined any schools yet!
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        component={Link}
                        to="/joinSchool"
                        sx={{ mt: 2 }}
                    >
                        Join a School
                    </Button>
                </Paper>
            )}
            </Container>
        </>
    );
}
