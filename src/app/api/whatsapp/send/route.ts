import { auth, currentUser } from "@clerk/nextjs/server";
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

    // Get user's email
    let { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
    // Fallback if the user is using a legacy ID not synced to Clerk ID
    if (!profile) {
        const cUser = await currentUser();
        const email = cUser?.primaryEmailAddress?.emailAddress;
        if (email) {
            const { data: profileByEmail } = await supabaseAdmin
                .from('profiles')
                .select('email')
                .eq('email', email)
                .single();
            if (profileByEmail) {
                profile = profileByEmail;
                profileError = null;
            }
        }
    }
    
    if (profileError || !profile?.email) {
        return NextResponse.json({ error: "User has no verified email" }, { status: 400 });
    }

    const emailAddress = profile.email;
    let message = '';
    let subject = '';

    switch (event_type) {
        case 'SOLO_SESSION_COMPLETE':
            subject = '🔥 Locked In Complete!';
            message = `Awesome job completing ${payload.duration} minutes working on: ${payload.goal}. Keep up the momentum!`;
            break;
        case 'ROOM_CREATED':
            // Room creation emails are already handled directly in create-room via /api/send-email/room-submitted
            return NextResponse.json({ success: true, skipped: true });
        default:
            return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const { Resend } = await import('resend');
    const { NotificationEmail } = await import('@/components/emails/NotificationEmail');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
        from: 'Locked In <hello@contact.lockedinumat.tech>',
        to: [emailAddress],
        subject,
        react: NotificationEmail({
            previewText: 'Session Complete!',
            title: 'LOCKED IN',
            heading: 'Locked In! 🔥',
            bodyParagraphs: [
                `Awesome job completing ${payload.duration} minutes of focus.`,
                'Keep up the momentum and log back in to maintain your streak!'
            ],
            metadata: [
                { label: 'Session Goal', value: payload.goal },
                { label: 'Duration', value: `${payload.duration} minutes` }
            ],
            primaryAction: {
                text: 'View Leaderboard',
                url: 'https://lockedinumat.tech/leaderboard'
            }
        }) as React.ReactElement
    });
    
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp API Route] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
