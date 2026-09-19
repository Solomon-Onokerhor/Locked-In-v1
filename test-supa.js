require("dotenv").config({ path: ".env.local" });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) console.error(error);
  else console.log(JSON.stringify(data.users[0], null, 2));
}
test();
