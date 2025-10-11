const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.get('/',async(req,res) =>{
    res.send('user data')
})

router.get('/:id/schools/joined',async (req,res) =>{
    const joinedSchools= [];
    console.log(req.params.id);

    //fetching data for joined schools
    let { data: school_joined, error } = await supabase
    .from('school_joined')
    .select("*")
    .eq('user_id',req.params.id);
    console.log(school_joined);

    if(error){
        console.log(`error fetching joined schools Error: ${error}`);
    }
    else{

            //fetching school objects  for joined schools
            const fetchSchoolData = school_joined.map(async (school) => {
                let { data, error } = await supabase
                    .from("schools")
                    .select("*")
                    .eq("school_id", school.school_id);
            
                if (error) {
                    console.error(`Error fetching school_id ${school.school_id}: ${error.message}`);
                    return null;
                }
                return data[0];
            });
            
            const results = await Promise.all(fetchSchoolData);
            const joinedSchools = results.filter(Boolean); // remove any nulls due to error
                  
        res.json(joinedSchools);
    }
})

router.post('/:id/schools/joined', async (req, res) => {
    try {
        const userId = req.params.id;
        const code = req.body?.school_code;

        console.log('Join request for user:', userId, 'with code:', code);

        if (!code) {
            return res.status(400).send('school_code is required');
        }

        // Find school by code
        const { data: schools, error: schoolErr } = await supabase
            .from('schools')
            .select('school_id')
            .eq('school_code', code)
            .limit(1);

        if (schoolErr) {
            console.error('Error looking up school by code:', schoolErr);
            return res.status(500).send('Error looking up school');
        }

        const school = schools && schools[0];
        if (!school) {
            return res.status(404).send('Invalid school code');
        }

        // Check if already joined
        const { data: existing, error: existErr } = await supabase
            .from('school_joined')
            .select('id')
            .eq('school_id', school.school_id)
            .eq('user_id', userId)
            .limit(1);

        if (existErr) {
            console.error('Error checking existing membership:', existErr);
            return res.status(500).send('Error checking membership');
        }

        // Insert only if not already joined
        if (!existing || existing.length === 0) {
            const { error: insertErr } = await supabase
                .from('school_joined')
                .insert([{ 
                    school_id: school.school_id, 
                    user_id: userId, 
                    role: 'teacher',
                    joined_at: new Date().toISOString()
                }])
                .select('id, school_id, user_id, role, joined_at');

            if (insertErr) {
                console.error('Error joining school:', insertErr);
                return res.status(500).json({ message: 'Failed to join school', error: insertErr.message });
            }
        }

        // Redirect to the client school page
        return res.redirect(`http://localhost:5173/school/${school.school_id}`);
    } catch (err) {
        console.error('Unexpected error in join route:', err);
        return res.status(500).send('Unexpected error joining school');
    }
});

// Get user profile from public.app_users
router.get('/:user_id/profile', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', req.params.user_id)
            .single();
        if (error) return res.status(404).send(error.message);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).send('Error fetching profile: ' + err.message);
    }
});

// Update user profile in public.app_users
router.put('/:user_id/profile', async (req, res) => {
    try {
        const payload = {
            first_name: req.body.first_name ?? null,
            last_name: req.body.last_name ?? null,
            phone: req.body.phone ?? null,
            address: req.body.address ?? null,
            avatar_url: req.body.avatar_url ?? null,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('app_users')
            .update(payload)
            .eq('id', req.params.user_id)
            .select()
            .single();
        if (error) return res.status(400).send(error.message);
        res.status(200).json(data);
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Error updating profile: ' + err.message);
    }
});

module.exports = router;