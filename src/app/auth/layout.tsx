import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In — Locked In',
    description: 'Sign in or create an account to join study groups, track your focus streaks, and connect with UMaT students on Locked In.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
