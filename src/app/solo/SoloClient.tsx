'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { SoloTimer } from '@/components/SoloTimer';

export function SoloClient() {
    const { session, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && !session) {
            router.push('/sign-in');
        }
    }, [session, loading, router]);

    if (!mounted || loading || !session) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000]">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:p-10 md:ml-[280px] relative z-10 animate-fade-in flex-1 min-h-screen flex flex-col items-center justify-center">
                <div className="w-full max-w-[800px] mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight">Deep Focus</h2>
                        <p className="text-[#888888] text-sm md:text-lg mt-2">Lock in and shut out the noise.</p>
                    </div>
                    
                    <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 md:p-12 shadow-2xl">
                        <SoloTimer />
                    </div>
                </div>
            </main>
        </div>
    );
}
