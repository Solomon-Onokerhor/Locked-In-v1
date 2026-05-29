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

        const { phoneNumber, otp } = await req.json();
        if (!phoneNumber || !otp || typeof phoneNumber !== 'string' || typeof otp !== 'string') {
            return NextResponse.json({ error: 'Valid phone number and OTP are required' }, { status: 400 });
        }

        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        // 1. Fetch the OTP record
        const { data: otpRecord, error: dbError } = await supabaseAdmin
            .from('whatsapp_otps')
            .select('*')
            .eq('phone_number', normalizedPhone)
            .single();

        if (dbError || !otpRecord) {
            return NextResponse.json({ error: 'No OTP found for this number' }, { status: 404 });
        }

        // 2. Validate the OTP
        if (otpRecord.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // 3. Check expiration
        const now = new Date();
        const expiresAt = new Date(otpRecord.expires_at);
        if (now > expiresAt) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // 4. Check if already verified
        if (otpRecord.verified) {
            return NextResponse.json({ success: true, message: 'Already verified' });
        }

        // 5. Mark as verified
        const { error: updateError } = await supabaseAdmin
            .from('whatsapp_otps')
            .update({ verified: true })
            .eq('phone_number', normalizedPhone);

        if (updateError) {
            console.error('[verify-otp] Failed to update verification status:', updateError);
            return NextResponse.json({ error: 'Failed to complete verification' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('[verify-otp] Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
