'use client';

import { AuthProvider } from "@/components/AuthProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { Suspense } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <Suspense fallback={null}>
                <TourProvider>
                    {children}
                    <TourOverlay />
                </TourProvider>
            </Suspense>
        </AuthProvider>
    );
}
