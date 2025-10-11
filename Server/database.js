let client = require('@supabase/supabase-js');
require('dotenv').config();

// Read Supabase configuration strictly from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment');
}
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!SUPABASE_KEY) {
  throw new Error('Missing Supabase key: set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
}

const supabase = client.createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = { supabase };