import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { NextResponse } from 'next/server';

import * as React from 'react';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Locked In <hello@contact.lockedinumat.tech>',
      to: [email],
      subject: 'Welcome to Locked In',
      react: WelcomeEmail({ name: name || 'Student' }) as React.ReactElement,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
