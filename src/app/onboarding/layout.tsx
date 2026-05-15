import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Complete Your Profile — Locked In',
    description: 'Set up your academic profile to get personalized study recommendations and connect with students in your faculty at UMaT.',
};

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
    if ((await auth()).sessionClaims?.metadata?.onboardingComplete === true) {
        redirect('/')
    }

    return <>{children}</>
}
