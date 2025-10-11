const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;



router.get('/',async(req,res)=>{
    const{data,error} = await supabase.from('schools').select('*');
    console.log(data);
    res.json(data);
});

router.get('/created_schools/:id',async(req,res)=>{
    let creator_id = req.params.id;
    console.log(creator_id);
    let {data,error} = await supabase 
        .from('schools')
        .select('*')
        .eq('creator',`${creator_id}`);
    console.log(data);
    res.json(data);
});

// Get a single school by ID
router.get('/:id', async(req, res) => {
    const school_id = req.params.id;
    const {data, error} = await supabase
        .from('schools')
        .select('*')
        .eq('school_id', school_id)
        .single();
    
    if (error) {
        console.error("Error fetching school:", error);
        return res.status(404).json({ error: 'School not found' });
    }
    
    console.log("Fetched school:", data);
    res.json(data);
});




router.post('/',async(req,res)=>{
    let user_id = req.body.user_id;
    console.log(req.body);
    const {data,error} =  await supabase.from('schools').insert([{
        school_name:req.body.school_name,
        description:req.body.school_description,
        creator:user_id,
        school_code : createRandomString(6),
    },]).select(); 
    if(error){
        console.log('Error posting the school',error);
    }
    else{
        console.log("Posted school successfulliy");
        console.log(data);
        res.json(data);
    }

});

function createRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
//endpoints for CRUD Standards

router.get('/:id/standards', async (req, res) => {
    const school_id = req.params.id;
    const { data: standards, error } = await supabase
        .from('standards')
        .select("*")
        .eq('school_id', school_id);

    if (error) {
        console.error("Error fetching standards", error);
        return res.status(500).json({ error: 'Failed to fetch standards' });
    }

    res.json(standards);
});

// Create a standard
router.post('/:id/standards', async (req, res) => {
    const school_id = req.params.id;
    const { std } = req.body;

    const { data, error } = await supabase
        .from('standards')
        .insert([{ std, school_id }])
        .select();

    if (error) {
        console.error("Error inserting standard", error);
        return res.status(500).json({ error: 'Failed to create standard' });
    }

    res.json(data[0]);
});

// Update a standard
router.put('/:id/standards/:standard_id', async (req, res) => {
    const { standard_id } = req.params;
    const { std } = req.body;

    const { data, error } = await supabase
        .from('standards')
        .update({ std })
        .eq('id', standard_id)
        .select();

    if (error) {
        console.error("Error updating standard", error);
        return res.status(500).json({ error: 'Failed to update standard' });
    }

    res.json(data[0]);
});

// Delete a standard
router.delete('/standards/:standard_id', async (req, res) => {
    const { standard_id } = req.params;

    const { error } = await supabase
        .from('standards')
        .delete()
        .eq('id', standard_id);

    if (error) {
        console.error("Error deleting standard", error);
        return res.status(500).json({ error: 'Failed to delete standard' });
    }

    res.json({ message: 'Standard deleted successfully' });
});

//Endpoints for Divisions
// Get all divisions for a school
router.get("/:schoolId/divisions", async (req, res) => {
    const { schoolId } = req.params;

    const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .eq("school_id", schoolId);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Create a new division
router.post("/:schoolId/divisions", async (req, res) => {
    const { schoolId } = req.params;
    const { division } = req.body;

    if (!division) return res.status(400).json({ error: "Division name is required" });

    const { data, error } = await supabase
        .from("divisions")
        .insert([{ division, school_id: schoolId }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// Update an existing division
router.put("/:schoolId/divisions/:divisionId", async (req, res) => {
    const { schoolId, divisionId } = req.params;
    const { division } = req.body;

    if (!division) return res.status(400).json({ error: "Division name is required" });

    const { data, error } = await supabase
        .from("divisions")
        .update({ division })
        .eq("div_id", divisionId)
        .eq("school_id", schoolId)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Delete a division
router.delete("/divisions/:divisionId", async (req, res) => {
    const { divisionId } = req.params;

    const { error } = await supabase
        .from("divisions")
        .delete()
        .eq("div_id", divisionId);

    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
});

module.exports = router;
