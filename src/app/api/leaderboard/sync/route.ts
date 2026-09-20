import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { updateLeaderboardScore } from '@/lib/leaderboard';

export async function POST(req: Request) {
    try {
        const { user_id } = await req.json();
        if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

        // Fetch current profile from Supabase
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('focus_score, current_streak, faculty')
            .eq('id', user_id)
            .single();

        if (profile) {
            await updateLeaderboardScore(
                user_id,
                profile.focus_score || 0,
                profile.current_streak || 0,
                profile.faculty || null
            );
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
