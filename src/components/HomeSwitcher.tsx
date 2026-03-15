'use client';

import { useAuth } from '@/components/AuthProvider';
import { DashboardClient } from './DashboardClient';
import { LandingPage } from './LandingPage';
import type { Room } from '@/types';

interface HomeSwitcherProps {
    initialRooms: Room[];
}

export function HomeSwitcher({ initialRooms }: HomeSwitcherProps) {
    const { session, loading } = useAuth();

    // To prevent hydration errors (where server renders Dashboard but client renders Loading),
    // we never render a loading spinner from here that replaces the whole layout tree.
    // Instead, we default to the LandingPage if we know we are unauthenticated,
    // otherwise we default to DashboardClient (which handles its own internal loading states)
    // if we haven't confirmed auth failure yet.
    // This ensures the DOM tree structure remains stable during the hydration pass.
    
    // Once loading finishes, if there's genuinely no session, show landing page.
    if (!loading && !session) {
        return <LandingPage />;
    }

    // Default to the dashboard view (which can render the sidebar skeletons)
    // during SSR, Hydration, and active auth sessions.
    return <DashboardClient initialRooms={initialRooms} />;
}
