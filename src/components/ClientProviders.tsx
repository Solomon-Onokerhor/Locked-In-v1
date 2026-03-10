'use client';

import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function OnboardingEnforcer() {
    const { profile, loading, session } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && session && profile) {
            // Require these fields for a complete profile
            const isProfileComplete = profile.faculty && profile.programme && profile.level;
            
            if (!isProfileComplete && pathname !== '/onboarding' && pathname !== '/auth') {
                router.replace('/onboarding');
            }
        }
    }, [loading, session, profile, pathname, router]);

    return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <Suspense fallback={null}>
                <OnboardingEnforcer />
                <TourProvider>
                    {children}
                    <TourOverlay />
                </TourProvider>
            </Suspense>
        </AuthProvider>
    );
}
