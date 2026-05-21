require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  // Check auth users
  const authRes = await supabase.auth.admin.listUsers();
  console.log('Auth users count:', authRes.data?.users?.length);
  
  // Check public.users
  const publicRes = await supabase.from('users').select('*').limit(2);
  console.log('Public users error:', publicRes.error?.message);
  console.log('Public users sample:', publicRes.data);
}
run();
