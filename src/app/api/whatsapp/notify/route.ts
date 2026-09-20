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

    const body = await req.json();
    const { event_type, target_user_id, payload } = body;

    if (!event_type || !target_user_id) {
      return NextResponse.json({ error: "event_type and target_user_id are required" }, { status: 400 });
    }

    // Get target user's email
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', target_user_id)
        .single();
    
    if (profileError || !profile?.email) {
        return NextResponse.json({ error: "Target user has no verified email" }, { status: 400 });
    }

    const emailAddress = profile.email;
    let message = '';
    let subject = '';

    switch (event_type) {
        case 'ROOM_APPROVED':
            subject = '✅ Room Approved';
            message = `Good news! Your room '${payload.title}' has been approved and is now live on the dashboard.`;
            break;
        case 'ROOM_JOINED':
            subject = '👥 New Room Member';
            message = `Heads up! ${payload.joiner_name} just locked in to your session '${payload.title}'!`;
            break;
        case 'JOINER_CONFIRMATION':
            subject = '📅 You are Locked In!';
            message = `You're officially locked into '${payload.title}'! We'll email you 15 mins before the session starts.`;
            break;
        default:
            return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
        from: 'Locked In <hello@contact.lockedinumat.tech>',
        to: [emailAddress],
        subject,
        text: message
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp Notify Route] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
