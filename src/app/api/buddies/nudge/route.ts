import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Rate limit: 1 poke per receiver per 15 minutes
const RATE_LIMIT_MINUTES = 15;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { receiver_id } = body;

        if (!receiver_id) {
            return NextResponse.json({ error: "receiver_id is required" }, { status: 400 });
        }

        if (userId === receiver_id) {
            return NextResponse.json({ error: "Cannot nudge yourself" }, { status: 400 });
        }

        // 1. Check Rate Limit (when was the last poke sent from this sender to this receiver)
        const { data: lastPokes, error: pokeCheckError } = await supabaseAdmin
            .from('buddy_pokes')
            .select('created_at')
            .eq('sender_id', userId)
            .eq('receiver_id', receiver_id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (pokeCheckError) throw pokeCheckError;

        if (lastPokes && lastPokes.length > 0) {
            const lastPokeTime = new Date(lastPokes[0].created_at).getTime();
            const now = new Date().getTime();
            const diffMinutes = Math.floor((now - lastPokeTime) / (1000 * 60));

            if (diffMinutes < RATE_LIMIT_MINUTES) {
                return NextResponse.json({ 
                    error: `Rate limited. You can poke this buddy again in ${RATE_LIMIT_MINUTES - diffMinutes} minutes.` 
                }, { status: 429 });
            }
        }

        // 2. Fetch sender and receiver profiles for notification
        const [senderRes, receiverRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('name').eq('id', userId).single(),
            supabaseAdmin.from('profiles').select('name, whatsapp_number').eq('id', receiver_id).single()
        ]);

        if (senderRes.error || !senderRes.data) throw new Error('Sender not found');
        if (receiverRes.error || !receiverRes.data) throw new Error('Receiver not found');

        const senderName = senderRes.data.name;
        const receiverPhone = receiverRes.data.whatsapp_number;
        const receiverName = receiverRes.data.name;

        // 3. Insert the new poke record
        const { error: insertError } = await supabaseAdmin
            .from('buddy_pokes')
            .insert([{ sender_id: userId, receiver_id }]);

        if (insertError) throw insertError;

        // 4. Send WhatsApp Notification (if available)
        if (receiverPhone) {
            const message = `🔥 Hey ${receiverName}! ${senderName} just sent you a Nudge! Lock in and keep up the great work!`;
            await sendWhatsAppMessage(receiverPhone, message);
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Buddy Nudge API] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
