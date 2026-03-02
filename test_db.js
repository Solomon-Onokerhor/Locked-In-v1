const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rwiitcwutjjokkltqqlw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aWl0Y3d1dGpqb2trbHRxcWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTExODMsImV4cCI6MjA4Nzg2NzE4M30.wDCe5-8OvSA_NXcPOUDNco-FKsKZIVQlkQdF7sg0WKA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRooms() {
    const { data, error } = await supabase
        .from('rooms')
        .select('room_id, title, status, created_by')
        .limit(10);

    if (error) {
        console.error('Error fetching rooms:', error);
        return;
    }

    console.log('Recent Rooms:');
    console.table(data);
}

checkRooms();
