import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { chatRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit the chat messages
    const { success } = await chatRateLimit.limit(`chat_${userId}`);
    if (!success) {
      return NextResponse.json({ error: 'You are sending messages too fast.' }, { status: 429 });
    }

    const { roomId, text } = await req.json();
    if (!roomId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing roomId or text' }, { status: 400 });
    }

    // Rate limit: max 500 chars
    if (text.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    // Insert message into Supabase
    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert([{ room_id: roomId, sender_id: userId, text: text.trim() }])
      .select()
      .single();

    if (insertError) throw insertError;

    // ── Check if this is a creator ANNOUNCEMENT ──────────────────────
    const isAnnouncement = text.trim().toUpperCase().startsWith('ANNOUNCEMENT:');

    if (isAnnouncement) {
      // Verify sender is the room creator
      const { data: room } = await supabaseAdmin
        .from('rooms')
        .select('created_by, title')
        .eq('room_id', roomId)
        .single();

      if (room && room.created_by === userId) {
        // Strip the prefix for the WhatsApp message
        const announcementBody = text.trim().replace(/^ANNOUNCEMENT:/i, '').trim();

        // Fetch all members with Emails (excluding the creator)
        const { data: members } = await supabaseAdmin
          .from('room_members')
          .select('user_id, profiles(email)')
          .eq('room_id', roomId)
          .neq('user_id', userId);

        const { Resend } = await import('resend');
        const { NotificationEmail } = await import('@/components/emails/NotificationEmail');
        const resend = new Resend(process.env.RESEND_API_KEY);

        for (const member of members || []) {
          // @ts-ignore
          const email = member.profiles?.email;
          if (!email) continue;
          resend.emails.send({
            from: 'Locked In <hello@contact.lockedinumat.tech>',
            to: [email],
            subject: `📢 Announcement from ${room.title}`,
            react: NotificationEmail({
                previewText: `New announcement in ${room.title}`,
                title: 'LOCKED IN',
                heading: `Announcement from ${room.title} 📢`,
                bodyParagraphs: [
                    'The room host just posted a new announcement:',
                    `"${announcementBody}"`
                ],
                primaryAction: {
                    text: 'View Room',
                    url: `https://lockedinumat.tech/room/${roomId}`
                }
            }) as React.ReactElement
          }).catch(e =>
            console.error(`[Chat/Announce] Failed to email ${email}:`, e)
          );
        }
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('[Chat/Send] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
