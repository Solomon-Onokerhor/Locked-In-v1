import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { ImpeccableEmail } from '@/components/emails/ImpeccableEmail';
import { render } from '@react-email/render';
import * as React from 'react';

/**
 * Webhook handler for Clerk events.
 * Listens for user.created, user.updated, user.deleted, email.created
 * 
 * Required ENV vars:
 *   - CLERK_WEBHOOK_SECRET
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(req: NextRequest) {
    // --- 1. Verify Svix signature ---
    let event: any;
    try {
        event = await verifyWebhook(req, {
            signingSecret: process.env.CLERK_WEBHOOK_SECRET
        }); // pass explicitly because env var name differs
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
        } else if (type === 'email.created') {
            await handleEmailCreated(data);
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
    const email: string = data.email_addresses?.[0]?.email_address || `${userId}@dummy.lockedin.local`;
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
    const email: string = data.email_addresses?.[0]?.email_address || `${userId}@dummy.lockedin.local`;
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
        .update({ email: `[deleted-${userId}]`, name: '[deleted]', avatar_url: null })
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

async function handleEmailCreated(data: any) {
    const toEmailAddress = data.to_email_address;
    const subject = data.subject || '';
    let body = data.body;
    let bodyPlain = data.body_plain || '';
    
    // Always use 'Locked In' instead of Clerk's default which is often 'noreply'
    const fromEmailName = 'Locked In';

    if (!toEmailAddress) {
        console.error('[clerk-webhook] email.created → missing to_email_address');
        return;
    }

    // --- Custom Template Overrides ---
    const subjectLower = subject.toLowerCase();
    
    // Extract a 6-digit code if it exists
    const codeMatch = bodyPlain.match(/\b\d{6}\b/);
    const code = codeMatch ? codeMatch[0] : undefined;

    // Extract a URL if it exists (for magic links or reset links)
    const urlMatch = bodyPlain.match(/(https?:\/\/[^\s]+)/);
    const linkUrl = urlMatch ? urlMatch[0] : undefined;
    
    let type: any = null;
    let customSubject = subject; // default to original subject

    if (subjectLower.includes('verification') || subjectLower.includes('verify')) {
        type = 'verification';
        customSubject = 'Verify your email address for Locked In';
    } else if ((subjectLower.includes('reset') || subjectLower.includes('forgot')) && subjectLower.includes('password')) {
        type = 'reset';
        customSubject = 'Reset your Locked In password';
    } else if (subjectLower.includes('password changed') || subjectLower.includes('password has been changed')) {
        type = 'password_changed';
        customSubject = 'Security Update: Your password was changed';
    } else if (subjectLower.includes('password removed')) {
        type = 'password_removed';
        customSubject = 'Security Update: Your password was removed';
    } else if (subjectLower.includes('email') && (subjectLower.includes('changed') || subjectLower.includes('primary'))) {
        type = 'email_changed';
        customSubject = 'Security Update: Your primary email was changed';
    } else if (subjectLower.includes('new device') || subjectLower.includes('sign in from')) {
        type = 'new_device';
        customSubject = 'Security Alert: Sign-in from a new device';
    } else if (subjectLower.includes('invitation') || subjectLower.includes('invited')) {
        type = 'invitation';
        customSubject = "You've been invited to join Locked In";
    } else if (subjectLower.includes('account locked') || subjectLower.includes('temporarily locked') || (subjectLower.includes('locked') && !subjectLower.includes('locked in'))) {
        // We ensure we don't accidentally match the app name "Locked In"
        type = 'locked';
        customSubject = 'Security Alert: Your Locked In account is locked';
    }

    if (type) {
        console.log(`[clerk-webhook] email.created → Intercepted '${type}', rendering custom ImpeccableEmail template.`);
        try {
            body = await render(React.createElement(ImpeccableEmail, { type, code, linkUrl }));
        } catch (renderErr) {
            console.error('[clerk-webhook] email.created → Failed to render custom template, falling back to Clerk HTML', renderErr);
        }
    }

    try {
        const { error } = await resend.emails.send({
            from: `${fromEmailName} <hello@contact.lockedinumat.tech>`,
            to: [toEmailAddress],
            subject: customSubject,
            html: body,
            text: bodyPlain,
        });

        if (error) {
            console.error('[clerk-webhook] email.created → Resend failed:', error);
            throw error;
        }

        console.log(`[clerk-webhook] email.created → sent email to ${toEmailAddress}`);
    } catch (err) {
        console.error('[clerk-webhook] email.created → error sending email:', err);
        throw err;
    }
}
