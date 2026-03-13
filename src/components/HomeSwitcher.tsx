'use client';

import { useAuth } from '@/components/AuthProvider';
import { DashboardClient } from './DashboardClient';
import { LandingPage } from './LandingPage';
import { useState, useEffect } from 'react';
import type { Room } from '@/types';

interface HomeSwitcherProps {
    initialRooms: Room[];
}

export function HomeSwitcher({ initialRooms }: HomeSwitcherProps) {
    const { session, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Always show loading state on first render (matches server output) 
    // and while auth is still loading
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20" />
            </div>
        );
    }

    // If no session, show the high-conversion landing page
    if (!session) {
        return <LandingPage />;
    }

    // If user is logged in, show the app dashboard
    return <DashboardClient initialRooms={initialRooms} />;
}

