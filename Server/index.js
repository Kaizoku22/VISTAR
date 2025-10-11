let express = require('express');
let app = express();
let bodyParser = require('body-parser');
const cors = require('cors');

const db = require('./database.js');
const school = require('./school.js')
const signup = require('./signup.js');
const login = require('./login.js');
const user = require('./user.js')
const teachers = require('./teachers.js')
const subjects = require('./subjects.js');
const lectures = require('./lectures.js');
const students = require('./students.js')
const attendance = require('./attendance.js');
const marksheets = require('./marksheets.js');

let supabase = db.supabase;
const PORT = 8000;

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow both frontend URLs
    methods: 'GET,POST,PUT,DELETE',  // Allowed HTTP methods
    allowedHeaders: 'Content-Type,Authorization', // Allowed headers
    credentials: true // Allow cookies if needed
};


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use('/signup',signup);
app.use('/login',login);
app.use('/user',user);
app.use('/school',school);
app.use('/teachers',teachers);
app.use('/subjects',subjects);
app.use('/lectures',lectures);
app.use('/students',students);
app.use('/attendance',attendance);
app.use('/marksheets', marksheets);

app.get('/', async(req,res) =>{
    const {data,error} = await supabase.from('students').select();
    res.json(data);
});

app.get('/students',async(req,res) =>{
    const{data,error} = await supabase.from('students').select().eq('div','A').eq('standard','7');
    res.send(data);
});

app.post('/attendance', async(req,res) =>{
    console.log(req.body[0]);
    const {data,error} =  await supabase.from('attendance').insert(req.body);
    if(error){
        console.log(error);
    }
    res.send("Attendance added successfully");
});

app.post('/student',async(req,res)=>{
    console.log(req.body);
    const {data,error} = await supabase.from('students').insert(req.body);
    if(error){
        console.log(error);
        res.send('Error posting student Data');
    }
    res.send(`Student added successfully data: ${data}`);
});

app.delete('/student',async(req,res)=>{
    console.log(req.body);
    const{data,error} =await supabase.from('students').delete().eq('student_id',req.body.student_id);
    if(error){
       console.log(`Error deleting student data ${error}`);
        res.send('Error deleting student');
    }
    res.send(`Student deleted successfully ${data}`);
});

app.put('/student',async(req,res)=>{
    console.log(req.body);
    const{data,error} = await supabase.from('students').update(req.body).eq('student_id',req.body.student_id);
    if(error){
        console.log(`Error updating student data ${error}`);
        res.send('Error updating student data`);');
    }
    res.send('student updated successfully');
});




app.listen(PORT,()=>{
    console.log(`Listening on ${PORT}`);
});