const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

// List lectures for a school
router.get('/:school_id', async (req, res) => {
  const { school_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('school_id', school_id);
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    console.error('Error fetching lectures:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch lectures' });
  }
});

// Create a new lecture
router.post('/', async (req, res) => {
  const { lecture_name, school_id, teacher_id, subject_id, standard_id, division_id, standard, div } = req.body;
  if (!lecture_name || !school_id || !teacher_id || !subject_id || !(standard_id || standard) || !(division_id || div)) {
    return res.status(400).json({ error: 'lecture_name, school_id, teacher_id, subject_id and standard/division are required' });
  }

  // Prefer canonical column names observed in schema (standard, div)
  const insertPayload = {
    lecture_name,
    school_id,
    teacher_id,
    subject_id,
    standard: standard_id || standard,
    div: division_id || div
  };

  try {
    const { data, error } = await supabase
      .from('lectures')
      .insert([insertPayload])
      .select();
    if (error) throw error;
    res.status(201).json(data?.[0] || insertPayload);
  } catch (err) {
    console.error('Error creating lecture:', err);
    res.status(500).json({ error: err.message || 'Failed to create lecture' });
  }
});

// Update an existing lecture
router.put('/:lecture_id', async (req, res) => {
  const { lecture_id } = req.params;
  const { lecture_name, teacher_id, subject_id, standard_id, division_id, standard, div } = req.body;

  const updatePayload = {
    lecture_name,
    teacher_id,
    subject_id,
    standard: standard_id || standard,
    div: division_id || div
  };

  try {
    const { data, error } = await supabase
      .from('lectures')
      .update(updatePayload)
      .eq('lecture_id', lecture_id)
      .select();
    if (error) throw error;
    res.status(200).json(data?.[0]);
  } catch (err) {
    console.error('Error updating lecture:', err);
    res.status(500).json({ error: err.message || 'Failed to update lecture' });
  }
});

// Delete a lecture
router.delete('/:lecture_id', async (req, res) => {
  const { lecture_id } = req.params;
  try {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('lecture_id', lecture_id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting lecture:', err);
    res.status(500).json({ error: err.message || 'Failed to delete lecture' });
  }
});

module.exports = router;