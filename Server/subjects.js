const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.get('/',async(req,res)=>{
    const {data,error} = await supabase
        .from('subjects')
        .select('*')  
    if(error){
        console.log(error);
        return res.status(500).json({error:`Error fetching the subjects`});
    }  
    console.log(data);
    res.json(data);
});

router.get('/:school_id',async(req,res)=>{
    let school_id = req.params.school_id;
    const {data:subjects,error} = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id',`${school_id}`);
    
    if(error){
        console.log(`Error Fetching subjects for school_id : ${school_id} error : ${error}`);
        return res.status(500).json({error:'Error fetching subjects'});
    }
    console.log(subjects);
    res.json(subjects);
});

router.post('/', async (req, res) => {
    const { subject_name, school_id } = req.body;

    if (!subject_name || !school_id) {
        return res.status(400).json({ error: "subject_name and school_id are required" });
    }

    const { data, error } = await supabase
        .from('subjects')
        .insert([
            { subject_name, school_id }
        ])
        .select();

    if (error) {
        console.error('Error inserting subject:', error);
        return res.status(500).json({ error: "Failed to add subject" });
    }

    res.status(201).json(data[0]); // Return the inserted subject
});

router.put('/:school_id/:subject_id', async (req, res) => {
    const { school_id, subject_id } = req.params;
    const { subject_name } = req.body;

    if (!subject_name) {
        return res.status(400).json({ error: "subject_name is required" });
    }

    const { data, error } = await supabase
        .from('subjects')
        .update({ subject_name })
        .eq('subject_id', subject_id)
        .eq('school_id', school_id)
        .select();

    if (error) {
        console.error('Error updating subject:', error);
        return res.status(500).json({ error: "Failed to update subject" });
    }

    res.status(200).json(data[0]);
});

router.delete('/:subject_id', async (req, res) => {
    const { subject_id } = req.params;

    const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('subject_id', subject_id);

    if (error) {
        console.error('Error deleting subject:', error);
        return res.status(500).json({ error: "Failed to delete subject" });
    }

    res.status(204).send(); // No content on successful deletion
});


module.exports = router;