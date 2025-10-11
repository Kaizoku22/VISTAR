const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.post('/',async(req,res)=>{
    console.log(req.body);
    let { data, error } = await supabase.auth.signInWithPassword({
        email:req.body.email,
        password:req.body.password
      })
    
    if(error){
        res.send('error logging in');
        console.log(error);
    }
    else{
        console.log(data.user);
        console.log(data.session);
        res.json(data);
    }
});

module.exports = router;