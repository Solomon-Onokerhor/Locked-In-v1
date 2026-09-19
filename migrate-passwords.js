require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

async function run() {
  const users = JSON.parse(fs.readFileSync("supabase-passwords.json", "utf8"));
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (!CLERK_SECRET_KEY) {
    console.error("No CLERK_SECRET_KEY found");
    return;
  }

  let success = 0;
  let errors = 0;

  for (const user of users) {
    const { email, encrypted_password } = user;
    if (!encrypted_password) continue;

    console.log(`Migrating password for ${email}...`);

    // First, try to fetch the user by email to see if they exist
    const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
    });
    const clerkUsers = await res.json();

    if (clerkUsers.length > 0) {
      // User exists, update them
      const userId = clerkUsers[0].id;
      const patchRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password_digest: encrypted_password,
          password_hasher: "bcrypt",
          skip_password_checks: true
        })
      });

      if (!patchRes.ok) {
        console.error(`Failed to update ${email}:`, await patchRes.text());
        errors++;
      } else {
        console.log(`Updated existing user ${email}`);
        success++;
      }
    } else {
      // User doesn't exist, create them
      const postRes = await fetch(`https://api.clerk.com/v1/users`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email_address: [email],
          password_digest: encrypted_password,
          password_hasher: "bcrypt",
          skip_password_checks: true
        })
      });

      if (!postRes.ok) {
        console.error(`Failed to create ${email}:`, await postRes.text());
        errors++;
      } else {
        console.log(`Created new user ${email}`);
        success++;
      }
    }
  }

  console.log(`Migration complete! Success: ${success}, Errors: ${errors}`);
}
run();
