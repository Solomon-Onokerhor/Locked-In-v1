import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { Resend } from 'resend';
import { SessionReminderEmail } from '@/components/emails/SessionReminderEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date();
        let totalWhatsAppSent = 0;
        let totalEmailsSent = 0;

        // ----------------------------------------------------------------
        // BLOCK 1: 15-minute WhatsApp reminders
        // Rooms starting in 10–20 minutes (safe window for 5-min cron)
        // ----------------------------------------------------------------
        const minTime15 = new Date(now.getTime() + 10 * 60 * 1000);
        const maxTime15 = new Date(now.getTime() + 20 * 60 * 1000);

        const { data: upcomingRooms } = await supabaseAdmin
            .from('rooms')
            .select('room_id, title, date_time, session_mode, meeting_link, physical_location')
            .eq('status', 'active')
            .gte('date_time', minTime15.toISOString())
            .lte('date_time', maxTime15.toISOString());

        for (const room of upcomingRooms || []) {
            const { data: members } = await supabaseAdmin
                .from('room_members')
                .select('user_id, profiles(whatsapp_number)')
                .eq('room_id', room.room_id);

            for (const member of members || []) {
                // @ts-ignore
                const phone = member.profiles?.whatsapp_number;
                if (!phone) continue;

                const isVirtual = room.session_mode === 'virtual';
                const locationStr = isVirtual
                    ? `Join here: ${room.meeting_link || 'Link on dashboard'}`
                    : `Location: ${room.physical_location || 'See dashboard for details'}`;

                const message = `🚨 Reminder: '${room.title}' starts in 15 minutes!\n\n${locationStr}\n\nLock in: https://lockedinumat.tech/room/${room.room_id}`;

                try {
                    await sendWhatsAppMessage(phone, message);
                    totalWhatsAppSent++;
                } catch (e) {
                    console.error(`[Cron/15min] Failed to WhatsApp ${phone}:`, e);
                }
            }
        }

        // ----------------------------------------------------------------
        // BLOCK 2: 24-hour Email reminders
        // Rooms starting in 23h 55m – 24h 05m (safe 10-min window)
        // ----------------------------------------------------------------
        const min24h = new Date(now.getTime() + (24 * 60 - 5) * 60 * 1000);
        const max24h = new Date(now.getTime() + (24 * 60 + 5) * 60 * 1000);

        const { data: tomorrowRooms } = await supabaseAdmin
            .from('rooms')
            .select('room_id, title, date_time, duration_minutes, session_mode, meeting_link, physical_location')
            .eq('status', 'active')
            .gte('date_time', min24h.toISOString())
            .lte('date_time', max24h.toISOString());

        for (const room of tomorrowRooms || []) {
            const { data: members } = await supabaseAdmin
                .from('room_members')
                .select('user_id, profiles(email, name)')
                .eq('room_id', room.room_id);

            const startDate = new Date(room.date_time);
            const humanDate = startDate.toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra',
            });
            const durationStr = room.duration_minutes >= 60
                ? `${Math.floor(room.duration_minutes / 60)}h${room.duration_minutes % 60 > 0 ? ` ${room.duration_minutes % 60}m` : ''}`
                : `${room.duration_minutes} minutes`;
            const locationStr = room.session_mode === 'virtual'
                ? `Virtual — ${room.meeting_link ?? 'Link on room page'}`
                : `In-Person — ${room.physical_location ?? 'See room for details'}`;

            for (const member of members || []) {
                // @ts-ignore
                const email = member.profiles?.email;
                // @ts-ignore
                const name = member.profiles?.name ?? 'Scholar';
                if (!email) continue;

                try {
                    await resend.emails.send({
                        from: 'Locked In <hello@contact.lockedinumat.tech>',
                        to: [email],
                        subject: `⏰ Reminder: "${room.title}" is tomorrow!`,
                        react: SessionReminderEmail({
                            attendeeName: name,
                            roomTitle: room.title,
                            dateTime: humanDate,
                            duration: durationStr,
                            location: locationStr,
                            roomUrl: `https://lockedinumat.tech/room/${room.room_id}`,
                        }) as React.ReactElement,
                    });
                    totalEmailsSent++;
                } catch (e) {
                    console.error(`[Cron/24h] Failed to email ${email}:`, e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            whatsapp_sent: totalWhatsAppSent,
            emails_sent: totalEmailsSent,
        });
    } catch (error: any) {
        console.error('[Cron/reminders] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
