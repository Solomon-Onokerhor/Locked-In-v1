import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Fetch all members with WhatsApp numbers (excluding the creator)
        const { data: members } = await supabaseAdmin
          .from('room_members')
          .select('user_id, profiles(whatsapp_number)')
          .eq('room_id', roomId)
          .neq('user_id', userId);

        const whatsappMsg = `📢 *${room.title}* — Host just posted:\n\n"${announcementBody}"\n\nView room: https://lockedinumat.tech/room/${roomId}`;

        for (const member of members || []) {
          // @ts-ignore
          const phone = member.profiles?.whatsapp_number;
          if (!phone) continue;
          sendWhatsAppMessage(phone, whatsappMsg).catch(e =>
            console.error(`[Chat/Announce] Failed to WhatsApp ${phone}:`, e)
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
