const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const env = {};
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // This is a trick to list tables via RPC if available, or just guess common ones
    // But since we are using the anon key, we might have restricted access.
    // Let's try to query a few likely ones.
    const tables = ['profiles', 'users', 'rooms', 'members', 'room_members'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`Table ${table}: Error - ${error.message}`);
      } else {
        console.log(`Table ${table}: Count - ${count}`);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

listTables();
