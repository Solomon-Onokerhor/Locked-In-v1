import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Anti-spam configuration
const MAX_REQUESTS_PER_DAY = 10;

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
            return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
        }

        // 1. Guardrail: Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: dailyRequests, error: dailyLimitError } = await supabaseAdmin
            .from('buddy_connections')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        if (dailyLimitError) throw dailyLimitError;

        if (dailyRequests && dailyRequests.length >= MAX_REQUESTS_PER_DAY) {
            return NextResponse.json({ error: `Daily limit reached. You can only send ${MAX_REQUESTS_PER_DAY} friend requests per day to prevent spam.` }, { status: 429 });
        }

        // 2. Guardrail: Check if already friends or if request is pending
        const { data: existingConns, error: connCheckError } = await supabaseAdmin
            .from('buddy_connections')
            .select('status')
            .or(`and(user_id.eq.${userId},buddy_id.eq.${receiver_id}),and(user_id.eq.${receiver_id},buddy_id.eq.${userId})`);

        if (connCheckError) throw connCheckError;

        if (existingConns && existingConns.length > 0) {
            const hasAccepted = existingConns.some(c => c.status === 'accepted');
            const hasPending = existingConns.some(c => c.status === 'pending');
            
            if (hasAccepted) return NextResponse.json({ error: "Already connected with this buddy." }, { status: 400 });
            if (hasPending) return NextResponse.json({ error: "A buddy request is already pending." }, { status: 400 });
        }

        // 3. Fetch profiles for Whatsapp msg
        const [senderRes, receiverRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('name').eq('id', userId).single(),
            supabaseAdmin.from('profiles').select('name, whatsapp_number').eq('id', receiver_id).single()
        ]);

        if (senderRes.error || !senderRes.data) throw new Error('Sender not found');
        if (receiverRes.error || !receiverRes.data) throw new Error('Receiver not found');

        const senderName = senderRes.data.name;
        const receiverPhone = receiverRes.data.whatsapp_number;
        const receiverName = receiverRes.data.name;

        // 4. Insert the request
        const { error: insertError } = await supabaseAdmin
            .from('buddy_connections')
            .insert([{ user_id: userId, buddy_id: receiver_id, status: 'pending' }]);

        if (insertError) throw insertError;

        // 5. Send WhatsApp safely
        if (receiverPhone) {
            const message = `🤝 Hey ${receiverName}! ${senderName} just sent you a Study Buddy request on Locked-In!\n\nLog in now to accept their request so you can start tracking each other's progress.`;
            await sendWhatsAppMessage(receiverPhone, message);
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Buddy Request API] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
