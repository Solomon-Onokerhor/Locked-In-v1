import { getSupabaseServer } from '@/lib/supabaseServer';
import type { Metadata } from 'next';
import type { Room } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { DashboardClient } from '@/components/DashboardClient';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Locked In — Study Together, Level Up Together | UMaT',
    description: 'Locked In is the #1 study app for UMaT students in Tarkwa. Form study groups, use Pomodoro timers to track focus time, and stay accountable with your classmates at the University of Mines and Technology.',
    keywords: ['study app for UMaT students', 'UMaT Tarkwa study groups', 'pomodoro timer for engineering students Ghana', 'UMaT study rooms', 'Tarkwa campus study app'],
};

export default async function Page() {
    let userId: string | null = null;
    let initialRooms: Room[] = [];

    try {
        const authResult = await auth();
        userId = authResult.userId;
    } catch (e) {
        console.error('[page] Clerk auth() failed — rendering as guest:', e);
    }

    try {
        const supabaseServer = await getSupabaseServer();
        const { data: roomsData } = await supabaseServer
            .from('rooms')
            .select(`
                room_id, room_type, session_mode, title, description, image_url,
                created_by, date_time, duration_minutes, physical_location, 
                location_note, max_members, is_paid, price, commission_rate, 
                status, tags, course_code, created_at
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        initialRooms = (roomsData as Room[]) || [];
    } catch (e) {
        console.error('[page] Supabase rooms fetch failed:', e);
    }

    if (userId) {
        return <DashboardClient initialRooms={initialRooms} />;
    }

    return <LandingPage />;
}

