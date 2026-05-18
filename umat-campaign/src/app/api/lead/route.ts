import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service role key so we can upsert into profiles without RLS blocking us
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: normalize a raw Ghanaian phone number to international format (233XXXXXXXXX)
function normalizeGhanaianNumber(raw: string): string {
    let num = raw.replace(/[\s\-().+]/g, '');
    if (num.startsWith('0') && num.length === 10) {
        num = '233' + num.slice(1);
    } else if (num.startsWith('233') && num.length === 12) {
        // already correct
    } else if (!num.startsWith('233')) {
        num = '233' + num;
    }
    return num;
}

export async function POST(request: NextRequest) {
    try {
        const { name, phone } = await request.json();

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
        }

        const normalized = normalizeGhanaianNumber(phone);

        // ─── 1. Upsert into a lead_captures table (simple log) ────────────────────
        // We don't require Supabase Auth here — this is a public lead form.
        // We'll save to a separate lean table so it doesn't pollute profiles.
        const { error: upsertError } = await supabaseAdmin
            .from('lead_captures')
            .upsert(
                { name: name.trim(), whatsapp_number: normalized, source: 'arsenal_page' },
                { onConflict: 'whatsapp_number' }
            );

        if (upsertError) {
            console.error('[Lead API] Supabase upsert error:', upsertError.message);
            // Don't block the user — just log and proceed to WhatsApp delivery
        }

        // ─── 2. Trigger WhatsApp delivery via the Python Brain ────────────────────
        const BRAIN_URL = process.env.BRAIN_API_URL || 'http://localhost:8000';
        const PDF_LINK = process.env.ARSENAL_PDF_LINK || 'https://lockedinumat.tech'; // Update once PDF is hosted

        const waMessage =
            `Hi ${name.trim()}! 👋 Solomon here from *Locked-In*.\n\n` +
            `Your *UMaT Academic Arsenal* is ready — download it now 👇\n\n` +
            `📥 ${PDF_LINK}\n\n` +
            `Here's what's inside:\n` +
            `🧠 4 AI engineering prompts (copy-paste into ChatGPT or Gemini)\n` +
            `📐 The Calculus Survival Kit — differentiation, integration, limits & DEs\n` +
            `🔥 The Locked-In Focus Protocol — the 50/10 study system\n` +
            `🤖 The AI Student Stack — NotebookLM, Claude, Perplexity & more\n\n` +
            `This is your semester to lock in. 💪\n\n` +
            `If you have any questions, just reply to this message — I read every one.`;

        try {
            await fetch(`${BRAIN_URL}/send_lead_message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipient: normalized, message: waMessage }),
            });
        } catch (sendError) {
            console.error('[Lead API] Failed to ping Brain for WhatsApp delivery:', sendError);
            // Non-blocking — the lead is still saved
        }

        return NextResponse.json({ success: true, message: 'Lead captured and WhatsApp delivery triggered.' });

    } catch (err: any) {
        console.error('[Lead API] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
