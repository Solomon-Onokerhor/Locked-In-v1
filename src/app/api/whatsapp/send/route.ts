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
    const { event_type, payload } = body;

    if (!event_type) {
      return NextResponse.json({ error: "event_type is required" }, { status: 400 });
    }

    // Get user's phone number
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', userId)
        .single();
    
    if (profileError || !profile?.whatsapp_number) {
        return NextResponse.json({ error: "User has no verified WhatsApp number" }, { status: 400 });
    }

    const phone_number = profile.whatsapp_number;
    let message = '';

    switch (event_type) {
        case 'SOLO_SESSION_COMPLETE':
            message = `🔒 Locked In! Awesome job completing ${payload.duration} minutes working on: ${payload.goal}. Keep up the momentum!`;
            break;
        case 'ROOM_CREATED':
            message = `📅 Room Submitted! Your study room '${payload.title}' is pending admin approval. We'll notify you when it's live.`;
            break;
        default:
            return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone_number, message);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp API Route] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
