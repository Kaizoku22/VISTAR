import schoolCardBg from "../assets/school_card_bg1.png";
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

export default function SchoolCard(props) {
    return (
        <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            }
        }}>
            <CardMedia
                component="img"
                height="140"
                image={schoolCardBg}
                alt={props.schoolName}
                sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {props.schoolName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip 
                        icon={<PersonIcon />} 
                        label={`Role: ${props.role}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {props.description}
                </Typography>
            </CardContent>
        </Card>
    );
}