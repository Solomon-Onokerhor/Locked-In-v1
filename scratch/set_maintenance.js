const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwiitcwutjjokkltqqlw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aWl0Y3d1dGpqb2trbHRxcWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI5MTE4MywiZXhwIjoyMDg3ODY3MTgzfQ.Ew98VTPAz035G5KeqvvkTGIGVQjBT4fxgKS4d3NVRFY';

async function enableMaintenance() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_config`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key: "maintenance_mode", value: "false" }),
  });
  
  if (res.ok) {
    console.log("Maintenance mode successfully enabled in Supabase.");
  } else {
    console.error("Failed to enable maintenance mode:", await res.text());
  }
}

enableMaintenance();
