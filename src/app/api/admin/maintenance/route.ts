import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_USER_ID = process.env.ADMIN_CLERK_USER_ID;

async function getMaintenanceMode(): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_config?key=eq.maintenance_mode&select=value`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      cache: "no-store",
    }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return false;
  return rows[0].value === "true";
}

async function setMaintenanceMode(enabled: boolean): Promise<void> {
  // Upsert the value
  await fetch(`${SUPABASE_URL}/rest/v1/app_config`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ key: "maintenance_mode", value: String(enabled) }),
  });
}

export async function GET() {
  try {
    const enabled = await getMaintenanceMode();
    return NextResponse.json({ maintenance_mode: enabled });
  } catch (error) {
    console.error("[Maintenance GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Simple admin check via a secret header or Clerk userId
    // For now, check a hardcoded admin ID from env or a bearer token
    const authHeader = req.headers.get("x-admin-key");
    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_KEY || process.env.WHATSAPP_API_KEY;
    if (!authHeader || authHeader !== expectedKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { enabled } = body;
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    await setMaintenanceMode(enabled);
    return NextResponse.json({ maintenance_mode: enabled });
  } catch (error) {
    console.error("[Maintenance POST] Error:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
