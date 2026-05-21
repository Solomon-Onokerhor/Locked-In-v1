import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (adminError || adminProfile?.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { message, target_user_ids } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let query = supabaseAdmin
        .from('profiles')
        .select('id, whatsapp_number')
        .not('whatsapp_number', 'is', null)
        .neq('whatsapp_number', '');

    // If specific user IDs are provided, filter to only those users
    if (target_user_ids && Array.isArray(target_user_ids) && target_user_ids.length > 0) {
        query = query.in('id', target_user_ids);
    }

    const { data: users, error: usersError } = await query;

    if (usersError || !users) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    let successCount = 0;
    let failCount = 0;

    // Send messages sequentially to avoid rate limits
    for (const user of users) {
        if (user.whatsapp_number) {
            try {
                await sendWhatsAppMessage(user.whatsapp_number, message);
                successCount++;
            } catch (err) {
                console.error(`Failed to broadcast to ${user.whatsapp_number}:`, err);
                failCount++;
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Broadcast complete. Success: ${successCount}, Failed: ${failCount}` 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Admin Broadcast Route] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
