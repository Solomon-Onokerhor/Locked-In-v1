import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sender_id } = body; // The user who sent the request

        if (!sender_id) {
            return NextResponse.json({ error: "sender_id is required" }, { status: 400 });
        }

        // 1. Verify the request exists and is pending
        const { data: request, error: reqError } = await supabaseAdmin
            .from('buddy_connections')
            .select('id, status')
            .eq('user_id', sender_id)
            .eq('buddy_id', userId)
            .eq('status', 'pending')
            .single();

        if (reqError || !request) {
            return NextResponse.json({ error: "Request not found or already accepted" }, { status: 400 });
        }

        // 2. Update status to accepted
        const { error: updateError } = await supabaseAdmin
            .from('buddy_connections')
            .update({ status: 'accepted' })
            .eq('id', request.id);

        if (updateError) throw updateError;

        // 3. Fetch profiles for Whatsapp msg
        const cUser = await currentUser();
        const email = cUser?.primaryEmailAddress?.emailAddress;
        
        let receiverRes = await supabaseAdmin.from('profiles').select('name').eq('id', userId).single();
        if (receiverRes.error || !receiverRes.data) {
            if (email) {
                receiverRes = await supabaseAdmin.from('profiles').select('name').eq('email', email).single();
            }
        }
        
        const senderRes = await supabaseAdmin.from('profiles').select('name, email').eq('id', sender_id).single();

        if (senderRes.data && receiverRes.data) {
            const senderEmail = senderRes.data.email;
            const receiverName = receiverRes.data.name;

            // 4. Send Email Notification to the person who ORIGINALLY sent the request
            if (senderEmail) {
                const { Resend } = await import('resend');
                const { NotificationEmail } = await import('@/components/emails/NotificationEmail');
                const resend = new Resend(process.env.RESEND_API_KEY);
                // Fire and forget so we don't block
                resend.emails.send({
                    from: 'Locked In <hello@contact.lockedinumat.tech>',
                    to: [senderEmail],
                    subject: `✅ ${receiverName} accepted your buddy request!`,
                    react: NotificationEmail({
                        previewText: `${receiverName} is now your study buddy!`,
                        title: 'LOCKED IN',
                        heading: 'Request Accepted! ✅',
                        bodyParagraphs: [
                            `Great news! ${receiverName} accepted your Study Buddy request on Locked-In!`,
                            `You can now see their focus sessions and hold each other accountable.`
                        ],
                        primaryAction: {
                            text: 'View Buddies',
                            url: 'https://lockedinumat.tech/buddies'
                        }
                    }) as React.ReactElement
                }).catch(console.error);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Buddy Accept API] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
