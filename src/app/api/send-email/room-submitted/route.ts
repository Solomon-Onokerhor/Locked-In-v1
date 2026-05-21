import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { RoomSubmittedEmail } from '@/components/emails/RoomSubmittedEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, roomTitle } = await req.json();

    if (!email || !roomTitle) {
      return NextResponse.json({ error: 'Missing email or roomTitle' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Locked In <hello@contact.lockedinumat.tech>',
      to: [email],
      subject: 'Room Submitted Successfully - Locked In',
      react: RoomSubmittedEmail({ roomTitle }) as React.ReactElement,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[RoomSubmittedEmail] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
