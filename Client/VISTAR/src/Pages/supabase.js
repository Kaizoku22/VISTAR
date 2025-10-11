let client = require('@supabase/supabase-js');


// Create a single supabase client for interacting with your database
const supabase = client.createClient('https://zwqajlbzmrkdvfdchwcr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cWFqbGJ6bXJrZHZmZGNod2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5Mzc4OTcsImV4cCI6MjA0OTUxMzg5N30.go182nsOfvzb1BNc-JFMGgvOUX1suVX9NQVJHjJLoyo')

module.exports = {supabase,}