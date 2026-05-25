import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { render } from '@react-email/render';
import * as React from 'react';

/**
 * POST /api/webhooks/clerk
 *
 * Listens for Clerk user lifecycle events and keeps the Supabase `profiles`
 * table in sync. This route is public (listed in middleware) but protected
 * by Svix webhook signature verification.
 *
 * Required env vars:
 *   - CLERK_WEBHOOK_SECRET  (from Clerk Dashboard → Webhooks → Signing Secret)
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(req: Request) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // --- 1. Verify Svix signature ---
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    const body = await req.text();

    let event: any;
    try {
        const wh = new Webhook(webhookSecret);
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        });
    } catch (err) {
        console.error('[clerk-webhook] Signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { type, data } = event;
    console.log(`[clerk-webhook] Received event: ${type}`);

    // --- 2. Handle events ---
    try {
        if (type === 'user.created') {
            await handleUserCreated(data);
        } else if (type === 'user.updated') {
            await handleUserUpdated(data);
        } else if (type === 'user.deleted') {
            await handleUserDeleted(data);
        }
    } catch (err) {
        console.error(`[clerk-webhook] Error handling event ${type}:`, err);
        // Return 500 so Clerk retries the webhook
        return NextResponse.json({ error: 'Internal handler error' }, { status: 500 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleUserCreated(data: any) {
    const userId: string = data.id;
    const email: string = data.email_addresses?.[0]?.email_address ?? '';
    const firstName: string = data.first_name ?? '';
    const lastName: string = data.last_name ?? '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || data.username || 'Scholar';
    const avatarUrl: string = data.image_url ?? data.profile_image_url ?? '';

    // Public metadata may already have onboarding info if set before the webhook fires
    const meta = data.public_metadata ?? {};

    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert(
            {
                id: userId,
                email,
                name,
                avatar_url: avatarUrl || null,
                role: 'student',
                faculty: meta.faculty ?? null,
                programme: meta.programme ?? null,
                level: meta.level ?? null,
                joined_rooms: [],
                total_focus_time_minutes: 0,
                study_buddies: 0,
                current_streak: 0,
                last_active_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
            },
            { onConflict: 'id', ignoreDuplicates: false }
        );

    if (error) {
        console.error('[clerk-webhook] user.created → upsert failed:', error);
        throw error;
    }

    console.log(`[clerk-webhook] Profile created for user: ${userId}`);

    // Send Welcome Email
    if (email) {
        try {
            const emailHtml = await render(React.createElement(WelcomeEmail, { name: name || 'Student' }));
            const { error: resendError } = await resend.emails.send({
                from: 'Locked In <hello@contact.lockedinumat.tech>',
                to: [email],
                subject: 'Welcome to Locked In',
                html: emailHtml,
            });
            if (resendError) {
                console.error('[clerk-webhook] Failed to send welcome email via Resend:', resendError);
            } else {
                console.log(`[clerk-webhook] Welcome email sent to: ${email}`);
            }
        } catch (emailError) {
            console.error('[clerk-webhook] Error rendering or sending welcome email:', emailError);
        }
    }
}

async function handleUserUpdated(data: any) {
    const userId: string = data.id;
    const email: string = data.email_addresses?.[0]?.email_address ?? '';
    const firstName: string = data.first_name ?? '';
    const lastName: string = data.last_name ?? '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || data.username || undefined;
    const avatarUrl: string = data.image_url ?? data.profile_image_url ?? '';
    const meta = data.public_metadata ?? {};

    // Build the update payload — only include fields present in Clerk data
    const updatePayload: Record<string, any> = { email };
    if (name) updatePayload.name = name;
    if (avatarUrl) updatePayload.avatar_url = avatarUrl;
    if (meta.faculty !== undefined) updatePayload.faculty = meta.faculty;
    if (meta.programme !== undefined) updatePayload.programme = meta.programme;
    if (meta.level !== undefined) updatePayload.level = meta.level;

    const { error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

    if (error) {
        console.error('[clerk-webhook] user.updated → update failed:', error);
        throw error;
    }

    console.log(`[clerk-webhook] Profile updated for user: ${userId}`);
}

async function handleUserDeleted(data: any) {
    const userId: string = data.id;

    // Soft delete: clear PII rather than changing role or hard-deleting
    // This preserves referential integrity with rooms, sessions, etc.
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ email: '[deleted]', name: '[deleted]', avatar_url: null })
        .eq('id', userId);

    if (error) {
        // If the profile doesn't exist, that's fine — log and move on
        if (error.code === 'PGRST116') {
            console.warn(`[clerk-webhook] user.deleted → no profile found for ${userId}`);
            return;
        }
        console.error('[clerk-webhook] user.deleted → update failed:', error);
        throw error;
    }

    console.log(`[clerk-webhook] Profile soft-deleted for user: ${userId}`);
}
