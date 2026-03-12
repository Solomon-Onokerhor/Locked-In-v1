import { supabaseServer } from '@/lib/supabaseServer';
import type { Room } from '@/types';
import { HomeSwitcher } from '@/components/HomeSwitcher';

export default async function Page() {
    // We still do the server-side room fetch to keep initial load fast
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

    // The HomeSwitcher (client component) will decide between
    // LandingPage vs DashboardClient based on the browser's auth session.
    // This fixes the 'Auth - Home' redirect loop.
    return <HomeSwitcher initialRooms={initialRooms} />;
}
