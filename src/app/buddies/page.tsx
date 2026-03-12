import type { Metadata } from 'next';
import { BuddiesClient } from './BuddiesClient';

export const metadata: Metadata = {
    title: 'Study Buddies — Find Your Accountability Partners | Locked In',
    description: 'Connect with fellow UMaT students in Tarkwa, find study buddies for engineering and science courses, and build your accountability network to crush your academic goals.',
    keywords: ['UMaT study buddy', 'find study partners Tarkwa', 'UMaT accountability partners', 'engineering study group Ghana'],
};

export default function BuddiesPage() {
    return <BuddiesClient />;
}
