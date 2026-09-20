import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
// Ensure we use the absolute URL for the webhook
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lockedinumat.tech';

export async function POST(req: Request) {
    try {
        const { room_id } = await req.json();
        if (!room_id) return NextResponse.json({ error: 'Missing room_id' }, { status: 400 });

        const { data: room, error } = await supabaseAdmin
            .from('rooms')
            .select('room_id, date_time')
            .eq('room_id', room_id)
            .single();

        if (error || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const roomTime = new Date(room.date_time).getTime();
        const now = Date.now();

        // 1. Schedule 24h reminder
        const time24h = roomTime - (24 * 60 * 60 * 1000);
        if (time24h > now) {
            await qstash.publishJSON({
                url: `${APP_URL}/api/webhooks/qstash/reminders`,
                body: { roomId: room.room_id, type: '24h' },
                notBefore: Math.floor(time24h / 1000)
            });
        }

        // 2. Schedule 15m reminder
        const time15m = roomTime - (15 * 60 * 1000);
        if (time15m > now) {
            await qstash.publishJSON({
                url: `${APP_URL}/api/webhooks/qstash/reminders`,
                body: { roomId: room.room_id, type: '15m' },
                notBefore: Math.floor(time15m / 1000)
            });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[Rooms/Schedule] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
