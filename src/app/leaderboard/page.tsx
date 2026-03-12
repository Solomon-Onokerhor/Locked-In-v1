import type { Metadata } from 'next';
import { LeaderboardClient } from './LeaderboardClient';

export const metadata: Metadata = {
    title: 'Leaderboard — Top Focused Students on Campus | Locked In',
    description: 'See who is leading the focus streaks at UMaT Tarkwa. Compete with engineering and science classmates, climb the campus leaderboard, and prove your study dedication.',
    keywords: ['UMaT campus leaderboard', 'study streak UMaT', 'top students Tarkwa', 'focus challenge Ghana university'],
};

export default function LeaderboardPage() {
    return <LeaderboardClient />;
}
