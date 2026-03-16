'use client';

import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { TourProvider, useTour } from "@/components/tour/TourProvider";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { SoloTimerProvider } from '@/lib/SoloTimerContext';
import { FloatingTimer } from '@/components/FloatingTimer';
import { Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function OnboardingEnforcer() {
    const { profile, loading, session } = useAuth();
    const { isTourActive } = useTour();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip redirect entirely while the tour is running
        if (isTourActive) return;

        if (!loading && session && profile) {
            const isProfileComplete = profile.faculty && profile.programme && profile.level && profile.whatsapp_number;
            
            if (!isProfileComplete && pathname !== '/onboarding' && pathname !== '/auth') {
                router.replace('/onboarding');
            }
        }
    }, [loading, session, profile, pathname, router, isTourActive]);

    return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SoloTimerProvider>
                <Suspense fallback={null}>
                    <TourProvider>
                        <OnboardingEnforcer />
                        {children}
                        <FloatingTimer />
                        <TourOverlay />
                    </TourProvider>
                </Suspense>
            </SoloTimerProvider>
        </AuthProvider>
    );
}
