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

<<<<<<< HEAD
    // To prevent hydration errors (where server renders Dashboard but client renders Loading),
    // we never render a loading spinner from here that replaces the whole layout tree.
    // Instead, we default to the LandingPage if we know we are unauthenticated,
    // otherwise we default to DashboardClient (which handles its own internal loading states)
    // if we haven't confirmed auth failure yet.
    // This ensures the DOM tree structure remains stable during the hydration pass.
    
    // Once loading finishes, if there's genuinely no session, show landing page.
    if (!loading && !session) {
=======
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
>>>>>>> 966a14f1aa2b909d904bc25e306e777a2768f8c7
        return <LandingPage />;
    }

    // Default to the dashboard view (which can render the sidebar skeletons)
    // during SSR, Hydration, and active auth sessions.
    return <DashboardClient initialRooms={initialRooms} />;
}

