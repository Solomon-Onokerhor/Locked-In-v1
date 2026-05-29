import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from '@clerk/nextjs/server';
import { normalizePhoneNumber } from '@/lib/whatsapp';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phoneNumber } = await req.json();
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
        }

        const cleanPhone = normalizePhoneNumber(phoneNumber);

        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Phone number is too short' }, { status: 400 });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Expiration (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // 1. Store the OTP in Supabase
        const { error: dbError } = await supabaseAdmin
            .from('whatsapp_otps')
            .upsert(
                {
                    phone_number: cleanPhone,
                    otp,
                    expires_at: expiresAt.toISOString(),
                    verified: false,
                },
                { onConflict: 'phone_number' }
            );

        if (dbError) {
            console.error('[send-otp] Supabase Error:', dbError);
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // 2. Call the WhatsApp Service
        const whatsappUrl = process.env.WHATSAPP_SERVICE_URL;
        const apiKey = process.env.WHATSAPP_API_KEY;

        if (!whatsappUrl || !apiKey) {
            console.error('[send-otp] Missing WhatsApp Service configuration');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const messageText = `Your Locked In verification code is: *${otp}*\n\nThis code will expire in 10 minutes.`;

        const waResponse = await fetch(`${whatsappUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: cleanPhone,
                message_text: messageText,
                api_key: apiKey,
            }),
        });

        if (!waResponse.ok) {
            const errorText = await waResponse.text();
            console.error('[send-otp] WhatsApp Service Error:', errorText);
            return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
        console.error('[send-otp] Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
