const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.get('/',async(req,res) =>{
    try {
        // Prefer admin API for auth users when service role key is available
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        const users = (data?.users || []).map(u => ({
            id: u.id,
            email: u.email,
            user_metadata: u.user_metadata,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at
        }));
        return res.json(users);
    } catch (adminErr) {
        console.error('Admin listUsers failed, attempting auth schema query:', adminErr?.message || adminErr);
        try {
            const { data: users, error } = await supabase
                .schema('auth')
                .from('users')
                .select('id, email, raw_user_meta_data, created_at, last_sign_in_at');
            if (error) throw error;
            const normalized = (users || []).map(u => ({
                id: u.id,
                email: u.email,
                user_metadata: u.raw_user_meta_data,
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at
            }));
            return res.json(normalized);
        } catch (schemaErr) {
            console.error('Auth schema users query failed:', schemaErr?.message || schemaErr);
            return res.status(500).json({ error: 'error fetching users' });
        }
    }
});

//get teachers joined to school
router.get('/:school_id', async (req, res) => {
    const { school_id } = req.params;

    try {
        // Get all teacher user_ids joined to this school
        const { data: joinedTeachers, error: joinError } = await supabase
            .from('school_joined')
            .select('user_id')
            .eq('school_id', school_id)
            .eq('role', 'teacher');

        if (joinError) {
            console.error('Error fetching teacher user_ids:', joinError);
            return res.status(500).json({ error: 'Failed to fetch joined teachers' });
        }

        const teacherUserIds = (joinedTeachers || []).map(jt => jt.user_id);
        if (teacherUserIds.length === 0) {
            return res.json([]);
        }

        // Fetch full profiles from public.app_users
        const { data: profiles, error: profileErr } = await supabase
            .from('app_users')
            .select('id, email, first_name, last_name, phone, address, avatar_url')
            .in('id', teacherUserIds);

        if (profileErr) {
            console.error('Error fetching app_users profiles:', profileErr);
            return res.status(500).json({ error: 'Failed to fetch teacher profiles' });
        }

        const normalized = (profiles || []).map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name || '',
            lastName: u.last_name || '',
            phone: u.phone || '',
            address: u.address || '',
            avatar_url: u.avatar_url || null
        }));

        return res.json(normalized);
    } catch (err) {
        console.error('Unexpected error fetching teachers:', err);
        return res.status(500).json({ error: 'Unexpected error fetching teachers' });
    }

});

// Remove a teacher from a school's joined list
router.delete('/:school_id/:user_id', async (req, res) => {
    const { school_id, user_id } = req.params;
    try {
        const { error } = await supabase
            .from('school_joined')
            .delete()
            .eq('school_id', school_id)
            .eq('user_id', user_id)
            .eq('role', 'teacher');

        if (error) {
            console.error('Error removing teacher from school_joined:', error);
            return res.status(500).json({ error: 'Failed to remove teacher from school' });
        }

        return res.status(204).send();
    } catch (err) {
        console.error('Unexpected error removing teacher:', err);
        return res.status(500).json({ error: 'Unexpected error removing teacher' });
    }
});


module.exports = router;