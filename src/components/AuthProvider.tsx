'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { useUser, useClerk } from '@clerk/nextjs';

interface AuthContextType {
    session: any | null; // Using any to represent the mock session
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [dbLoading, setDbLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        try {
            const res = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (res.data) {
                setProfile(res.data as Profile);
                // --- STREAK HEARTBEAT ---
                supabase.rpc('update_user_activity').then(({ error }: { error: any }) => {
                    if (error) console.error('Streak update error:', error);
                });
            } else {
                // If profile is strictly missing in keyless mode onboarding
                setProfile(null);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setDbLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (isSignedIn && user?.id) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        
        if (isSignedIn && user) {
            fetchProfile(user.id);
        } else {
            setProfile(null);
            setDbLoading(false);
        }
    }, [isLoaded, isSignedIn, user]);

    const signOut = async () => {
        await clerkSignOut();
        setProfile(null);
    };

    // Proxy the Clerk user object format to the Supabase session structure
    // so existing code (session.user.id) doesn't break
    const session = isSignedIn && user ? {
        user: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
        }
    } : null;

    const loading = !isLoaded || (isSignedIn && dbLoading);

    return (
        <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
