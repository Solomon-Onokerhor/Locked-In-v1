import { supabaseServer } from '@/lib/supabaseServer';
import type { Room } from '@/types';
import { DashboardClient } from '@/components/DashboardClient';

export default async function DashboardPage() {
    // Fetch rooms on the server for instant initial load
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

    const initialRooms = (roomsData as Room[]) || [];

    return <DashboardClient initialRooms={initialRooms} />;
}
