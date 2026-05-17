import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Complete Your Profile — Locked In',
    description: 'Set up your academic profile to get personalized study recommendations and connect with students in your faculty at UMaT.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    // Auth check is handled inside the page component using Supabase Auth
    return <>{children}</>;
}
