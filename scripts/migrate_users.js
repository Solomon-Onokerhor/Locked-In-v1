require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY || !CLERK_SECRET_KEY.startsWith('sk_live_')) {
  console.error('Error: CLERK_SECRET_KEY is missing or not a live production key.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateUsername(email) {
  const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const randomStr = Math.floor(Math.random() * 10000).toString();
  return `${prefix}${randomStr}`.slice(0, 15);
}

function generateFirstName(email) {
  const prefix = email.split('@')[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[^a-zA-Z]/g, '');
}

async function migrateUsers() {
  console.log('Fetching users from Supabase...');
  
  let allUsers = [];
  
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    console.error('Failed to fetch users from Supabase:', error);
    process.exit(1);
  }

  allUsers = data.users || [];
  console.log(`Found ${allUsers.length} users in Supabase.`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of allUsers) {
    if (!user.email) {
      console.log(`Skipping user ${user.id} because they have no email.`);
      continue;
    }

    const rawMeta = user.user_metadata || {};
    const firstName = rawMeta.first_name || generateFirstName(user.email);
    const lastName = rawMeta.last_name || 'User';
    const username = rawMeta.username || generateUsername(user.email);

    const payload = {
      external_id: user.id,
      email_address: [user.email],
      created_at: user.created_at,
      skip_password_requirement: true,
      first_name: firstName,
      last_name: lastName,
      username: username
    };

    if (user.encrypted_password) {
      payload.password_digest = user.encrypted_password;
      payload.password_hasher = 'bcrypt';
    }

    try {
      const response = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Migrated user: ${user.email}`);
        successCount++;
      } else {
        const errorData = await response.json();
        if (errorData.errors && errorData.errors.some(e => e.code === 'form_identifier_exists')) {
           console.log(`⚠️ User already exists in Clerk: ${user.email}`);
        } else {
           console.error(`❌ Failed to migrate ${user.email}:`, JSON.stringify(errorData));
           errorCount++;
        }
      }
    } catch (err) {
      console.error(`❌ Exception migrating ${user.email}:`, err.message);
      errorCount++;
    }

    await new Promise(res => setTimeout(res, 200));
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Total users found: ${allUsers.length}`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
}

migrateUsers();
