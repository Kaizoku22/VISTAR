const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.post('/',async(req,res) => {
    console.log(req.body);
    let { data, error } = await supabase.auth.signUp({
        email: req.body.email,
        password: req.body.password
      })
    if(error){
        console.log(error);
        res.send('Error Signing up the user');
    }
    else{
        // Mirror user into public.app_users for application profile usage
        try {
            const insertPayload = {
                id: data.user.id,
                email: req.body.email,
                first_name: null,
                last_name: null,
                phone: null,
                address: null,
                avatar_url: null,
                user_metadata: data.user.user_metadata || null,
                last_sign_in_at: data.user.last_sign_in_at || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { error: appUserErr } = await supabase
                .from('app_users')
                .insert([insertPayload]);
            if (appUserErr) {
                console.error('Error inserting app_users record:', appUserErr);
            } else {
                console.log('Inserted app_users record for user:', data.user.id);
            }
        } catch (e) {
            console.error('Unexpected error inserting app_users record:', e);
        }

        // Legacy: insert into teachers table if present
        try {
            const { error: teacherErr } = await supabase.from('teachers').insert([{
                teacher_id : data.user.id,
                name:null,
            }]);
            if (teacherErr) {
                console.log(`Error inserting into teachers table (legacy): ${teacherErr}`);
            } else {
                console.log('Inserted into teachers table (legacy)');
            }
        } catch (e) {
            console.log('Skipping legacy teachers insert:', e?.message || e);
        }
        console.log(data);
        res.send('Signed In Successfully');
    }
});

router.get('/',async(req,res) =>{
    console.log(req.body);
    res.redirect('http://localhost:5173/');
});

module.exports = router;