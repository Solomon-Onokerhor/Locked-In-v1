import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { Resend } from 'resend';
import { SessionReminderEmail } from '@/components/emails/SessionReminderEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = verifySignatureAppRouter(async (req) => {
    try {
        const body = await req.json();
        const { roomId, type } = body;

        if (!roomId || !type) return NextResponse.json({ error: 'Missing roomId or type' }, { status: 400 });

        const { data: room } = await supabaseAdmin
            .from('rooms')
            .select('room_id, title, date_time, duration_minutes, session_mode, meeting_link, physical_location, status')
            .eq('room_id', roomId)
            .single();

        if (!room || room.status !== 'active') {
            console.log(`[QStash/Reminder] Room ${roomId} not active or not found.`);
            return NextResponse.json({ success: true, skipped: true });
        }

        const { data: members } = await supabaseAdmin
            .from('room_members')
            .select('user_id, profiles(email, name, whatsapp_number)')
            .eq('room_id', roomId);

        let sentCount = 0;

        if (type === '15m') {
            const isVirtual = room.session_mode === 'virtual';
            const locationStr = isVirtual ? `Join here: ${room.meeting_link || 'Link on dashboard'}` : `Location: ${room.physical_location || 'See dashboard for details'}`;
            const message = `Reminder: '${room.title}' starts in 15 minutes!\n\n${locationStr}\n\nLock in: https://lockedinumat.tech/room/${room.room_id}`;
            const { NotificationEmail } = await import('@/components/emails/NotificationEmail');

            for (const member of members || []) {
                const email = (member.profiles as any)?.email;
                if (!email) continue;
                try {
                    await resend.emails.send({
                        from: 'Locked In <hello@contact.lockedinumat.tech>',
                        to: [email],
                        subject: `🚨 Starting in 15 mins: ${room.title}`,
                        react: NotificationEmail({
                            previewText: `Your room "${room.title}" starts in 15 minutes!`,
                            title: 'LOCKED IN',
                            heading: 'Time to Lock In! ⏳',
                            bodyParagraphs: [
                                `Your study session "${room.title}" is starting in exactly 15 minutes.`,
                                'Get your setup ready, grab some water, and prepare for deep work.'
                            ],
                            metadata: [
                                { label: 'Session Mode', value: room.session_mode === 'virtual' ? 'Virtual' : 'In-Person' },
                                { label: 'Location/Link', value: room.session_mode === 'virtual' ? (room.meeting_link || 'Link on dashboard') : (room.physical_location || 'See dashboard for details') }
                            ],
                            primaryAction: {
                                text: 'Enter Room',
                                url: `https://lockedinumat.tech/room/${room.room_id}`
                            }
                        }) as React.ReactElement
                    });
                    sentCount++;
                } catch (e) {
                    console.error(`[QStash/15m] Failed email ${email}:`, e);
                }
            }
        } else if (type === '24h') {
            const startDate = new Date(room.date_time);
            const humanDate = startDate.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' });
            const durationStr = room.duration_minutes >= 60 ? `${Math.floor(room.duration_minutes / 60)}h${room.duration_minutes % 60 > 0 ? ` ${room.duration_minutes % 60}m` : ''}` : `${room.duration_minutes} minutes`;
            const locationStr = room.session_mode === 'virtual' ? `Virtual - ${room.meeting_link ?? 'Link on room page'}` : `In-Person - ${room.physical_location ?? 'See room for details'}`;
            const { NotificationEmail } = await import('@/components/emails/NotificationEmail');

            for (const member of members || []) {
                const email = (member.profiles as any)?.email;
                const name = (member.profiles as any)?.name ?? 'Scholar';
                if (!email) continue;
                try {
                    await resend.emails.send({ 
                        from: 'Locked In <hello@contact.lockedinumat.tech>', 
                        to: [email], 
                        subject: `⏳ Reminder: "${room.title}" is tomorrow!`, 
                        react: NotificationEmail({
                            previewText: `Your room "${room.title}" is happening tomorrow!`,
                            title: 'LOCKED IN',
                            heading: `Hey ${name}, ready for tomorrow? 📅`,
                            bodyParagraphs: [
                                `This is a reminder that your study session "${room.title}" is scheduled for tomorrow.`,
                                'Make sure you are well rested and ready to tackle your goals!'
                            ],
                            metadata: [
                                { label: 'Date & Time', value: humanDate },
                                { label: 'Duration', value: durationStr },
                                { label: 'Location', value: locationStr }
                            ],
                            primaryAction: {
                                text: 'View Room Details',
                                url: `https://lockedinumat.tech/room/${room.room_id}`
                            }
                        }) as React.ReactElement
                    });
                    sentCount++;
                } catch (e) {
                    console.error(`[QStash/24h] Failed email ${email}:`, e);
                }
            }
        }

        return NextResponse.json({ success: true, sent: sentCount });
    } catch (e: any) {
        console.error('[QStash/reminders] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
});
