import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createEvent, DateArray } from 'ics';
import { RoomConfirmationEmail } from '@/components/emails/RoomConfirmationEmail';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // Fetch room details
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('title, date_time, duration_minutes, session_mode, meeting_link, physical_location')
      .eq('room_id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Fetch user profile for email and name
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // --- Build ICS Calendar Invite ---
    const startDate = new Date(room.date_time);
    const startArray: DateArray = [
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
    ];

    const { error: icsError, value: icsContent } = createEvent({
      title: room.title,
      start: startArray,
      duration: { minutes: room.duration_minutes },
      description: `Locked In study session: ${room.title}. View on platform: https://lockedinumat.tech/room/${roomId}`,
      location:
        room.session_mode === 'virtual'
          ? room.meeting_link ?? 'Virtual'
          : room.physical_location ?? 'On Campus',
      url: `https://lockedinumat.tech/room/${roomId}`,
    });

    if (icsError || !icsContent) {
      console.error('[RoomConfirmation] ICS generation failed:', icsError);
      return NextResponse.json({ error: 'Failed to generate calendar invite' }, { status: 500 });
    }

    // --- Build human-readable strings for email ---
    const humanDate = startDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Accra',
    });
    const durationStr =
      room.duration_minutes >= 60
        ? `${Math.floor(room.duration_minutes / 60)}h${room.duration_minutes % 60 > 0 ? ` ${room.duration_minutes % 60}m` : ''}`
        : `${room.duration_minutes} minutes`;
    const locationStr =
      room.session_mode === 'virtual'
        ? `Virtual — ${room.meeting_link ?? 'Link shared on room page'}`
        : `In-Person — ${room.physical_location ?? 'See room for details'}`;

    // --- Send Email with ICS Attachment ---
    const { data, error: sendError } = await resend.emails.send({
      from: 'Locked In <hello@contact.lockedinumat.tech>',
      to: [profile.email],
      subject: `✅ You're locked into "${room.title}"`,
      react: RoomConfirmationEmail({
        attendeeName: profile.name ?? 'Scholar',
        roomTitle: room.title,
        dateTime: humanDate,
        duration: durationStr,
        location: locationStr,
        roomUrl: `https://lockedinumat.tech/room/${roomId}`,
      }) as React.ReactElement,
      attachments: [
        {
          filename: 'session.ics',
          content: Buffer.from(icsContent).toString('base64'),
          contentType: 'text/calendar',
        },
      ],
    });

    if (sendError) {
      console.error('[RoomConfirmation] Resend error:', sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[RoomConfirmation] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
