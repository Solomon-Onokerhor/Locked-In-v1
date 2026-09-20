import type { Metadata } from 'next';
import { LeaderboardClient } from './LeaderboardClient';
import { getGlobalLeaderboard } from '@/lib/leaderboard';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { Profile } from '@/types';

export const metadata: Metadata = {
    title: 'Leaderboard - Top Focused Students on Campus | Locked In',
    description: 'See who is leading the focus streaks at UMaT Tarkwa. Compete with engineering and science classmates, climb the campus leaderboard, and prove your study dedication.',
    keywords: ['UMaT campus leaderboard', 'study streak UMaT', 'top students Tarkwa', 'focus challenge Ghana university'],
};

export default async function LeaderboardPage() {
    let topStudents: (Profile & { combined_score: number })[] = [];
    
    try {
        const topRedis = await getGlobalLeaderboard(50);
        if (topRedis.length > 0) {
            const userIds = topRedis.map(r => r.member);
            const supabase = await getSupabaseServer();
            const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
            
            if (profiles) {
                // Map the scores back to the profiles and sort them exactly as Redis did
                topStudents = topRedis.map(r => {
                    const profile = profiles.find(p => p.id === r.member);
                    return profile ? { ...profile, combined_score: r.score } : null;
                }).filter(Boolean) as (Profile & { combined_score: number })[];
            }
        } else {
            // Fallback to Supabase if Redis is empty (first run)
            const supabase = await getSupabaseServer();
            const { data } = await supabase.from('profiles').select('*').limit(100);
            if (data) {
                topStudents = data.map((p: Profile) => ({
                    ...p,
                    combined_score: (p.focus_score || 0) + (p.current_streak || 0) * 10
                })).sort((a, b) => b.combined_score - a.combined_score).slice(0, 50);
            }
        }
    } catch (e) {
        console.error('Failed to fetch leaderboard server-side', e);
    }

    return <LeaderboardClient initialTopStudents={topStudents} />;
}
