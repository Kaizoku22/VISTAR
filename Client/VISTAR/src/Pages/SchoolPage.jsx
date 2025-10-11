import { useParams, Link, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.jsx';
import Header from '../components/Header';
import ManageSchoolPage from './ManageSchoolPage';
import ManageLecturesPage from './ManageLecturesPage';
import StudentsPage from './StudentsPage';
import ManageStandardsPage from './ManageStandardsPage'; // if you have it
import { Typography, Box, Paper, IconButton, InputAdornment, TextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import studentsPng from '../assets/students.png';
import attendancePng from '../assets/attendance.png';
import marksheetPng from '../assets/marksheet.png';
import managePng from '../assets/manage.png';

export default function SchoolPage() {
    const { id: schoolId } = useParams(); // Get school_id from the URL
    const { user } = useAuth();
    const [schoolData, setSchoolData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCode, setShowCode] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const isCreator = !!(user && schoolData && String(schoolData.creator) === String(user.id));

    useEffect(() => {
        // Fetch school data when component mounts
        const fetchSchoolData = async () => {
            if (!schoolId) {
                setLoading(false);
                return;
            }
            
            try {
                // Try direct endpoint first since we have the school ID from homepage
                const response = await fetch(`http://localhost:8000/school/${schoolId}`);
                
                if (response.ok) {
                    const data = await response.json();
                    setSchoolData(data);
                    setLoading(false);
                    return;
                } else {
                    // Fallback: fetch all schools and find the matching one
                    const allSchoolsResponse = await fetch(`http://localhost:8000/school`);
                    const allSchools = await allSchoolsResponse.json();
                    
                    // Find the school by ID - convert both to strings for reliable comparison
                    const school = allSchools.find(s => String(s.school_id) === String(schoolId));
                    
                    if (school) {
                        setSchoolData(school);
                    }
                }
                
                setLoading(false);
            } catch (error) {
                if (error.message.includes('Failed to fetch')) {
                    setConnectionError(true);
                }
                setLoading(false);
            }
        };

        fetchSchoolData();
    }, [schoolId]);

    const handleToggleCodeVisibility = () => {
        setShowCode(!showCode);
    };

    const CreatorGuard = ({ children }) => {
        if (isCreator) return children;
        return (
            <Box sx={{ p: 2 }}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f9f9f9' }} title="you can not manage joined schools">
                    you can not manage joined schools.
                </Paper>
            </Box>
        );
    };

    return (
        <>
            <Header />
            <Box sx={{ pt: 1 }}>
                <Paper elevation={2} sx={{ m: 2, p: 3 }}>
                {loading ? (
                    <Typography variant="h6">Loading school information...</Typography>
                ) : connectionError ? (
                    <Box>
                        <Typography variant="h6" color="error" gutterBottom>
                            Unable to connect to server
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Please make sure the backend server is running on localhost:8000
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            To start the server, run: <code>npm start</code> in the Server directory
                        </Typography>
                    </Box>
                ) : schoolData ? (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
                                {schoolData.school_name || "School Name Not Available"}
                            </Typography>
                            {isCreator && (
                                <Box sx={{ ml: 'auto' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)', fontSize: '0.875rem' }}>School Join Code</p>
                                        <TextField
                                            value={schoolData.school_code || "Code not available"}
                                            variant="outlined"
                                            size="small"
                                            sx={{ 
                                                minWidth: '250px',
                                                '& .MuiOutlinedInput-root': {
                                                    height: '40px',
                                                    padding: 0
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: 0,
                                                    height: '40px',
                                                    lineHeight: '40px'
                                                },
                                                // Ensure the adornment area matches the input height
                                                '& .MuiInputAdornment-root': {
                                                    height: '40px',
                                                    margin: 0,
                                                    display: 'flex',
                                                    
                                                    alignItems: 'stretch',
                                                    overflow: 'hidden'
                                                },
                                                '& .MuiInputAdornment-root .MuiIconButton-root': {
                                                    padding: 0,
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                    
                                                }
                                            }}
                                            type={showCode ? 'text' : 'password'}
                                            InputProps={{
                                                readOnly: true,
                                                style: { 
                                                    cursor: 'default',
                                                    fontFamily: 'monospace',
                                                    letterSpacing: '0.1em'
                                                },
                                                endAdornment: (
                                                <InputAdornment position="end" sx={{ height: '40px', m: 0, overflow: 'hidden' }}>
                                                    <IconButton
                                                        aria-label="toggle code visibility"
                                                        onClick={handleToggleCodeVisibility}
                                                        edge="end"
                                                        sx={{ 
                                                            width: '40px', 
                                                            height: '40px', 
                                                            p: 0, borderRadius: 0, 
                                                            overflow: 'hidden', 
                                                            marginRight: '8px',
                                                            marginBottom: '8px' }}
                                                    >
                                                        {showCode ? <VisibilityOff sx={{ fontSize: 28 }} /> : <Visibility sx={{ fontSize: 28 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="h6" color="error">School not found</Typography>
                )}
            </Paper>
            </Box>

            <div className="school-page-content flex">
                <div className="school-sidebar w-1/4 p-4 border-r">
                <div className="nav-items">
                        <div className="nav-box">
                            <Link to={`/school/${schoolId}/students`}>Students
                                <img src={studentsPng}></img>
                            </Link>
                        </div>
                        <div className="nav-box">
                            <Link to={`/school/${schoolId}/attendance`}>Attendance
                                <img src={attendancePng}></img>
                            </Link>
                        </div>
                        <div className="nav-box">
                            <Link to={`/school/${schoolId}/marksheets`}>Marksheets
                                <img src={marksheetPng}></img>
                            </Link>
                        </div>
                        <div className="nav-box">
                            {isCreator ? (
                                <Link to={`/school/${schoolId}/manage`}>Manage School
                                    <img src={managePng}></img>
                                </Link>
                            ) : (
                                <div
                                    title="you can not manage joined schools"
                                    style={{
                                        color: '#777',
                                        cursor: 'not-allowed',
                                        opacity: 0.6,
                                        display: 'flex',
                                        flexDirection:'column',
                                        overflow:'hidden',
                                        objectFit:'contain'
                                        
                                    }}
                                >
                                    Manage School
                                    <img src={managePng} style={{ filter: 'grayscale(100%)', opacity: 0.8,objectFit:'contain',overflow:'hidden',marginLeft:'20px'}}></img>
                                </div>
                            )}
                        </div>
                        </div>

                </div>

                <div className="main-content w-3/4 p-4">
                    {/* Nested Routes rendered here */}
                    <Routes>
                        <Route path="students" element={<StudentsPage />} />
                        <Route path="manage" element={<CreatorGuard><ManageSchoolPage /></CreatorGuard>} />
                        <Route path="manage/standards" element={<CreatorGuard><ManageStandardsPage /></CreatorGuard>} />
                        <Route path="manage/lectures" element={<CreatorGuard><ManageLecturesPage /></CreatorGuard>} />
                        {/* Add more nested routes if needed */}
                    </Routes>
                </div>
            </div>
        </>
    );
}
