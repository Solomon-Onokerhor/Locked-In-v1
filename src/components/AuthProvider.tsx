'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, setSupabaseToken } from '@/lib/supabase';
import type { Profile } from '@/types';
import { useAuth as useClerkAuth, useUser, useClerk, useSession } from '@clerk/nextjs';

// We mock a Session type that matches the subset used by the app
interface MockSession {
    user: {
        id: string;
        email?: string;
    };
}

interface AuthContextType {
    session: MockSession | null;
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
    const { userId, isLoaded: clerkLoaded } = useClerkAuth();
    const { user: clerkUser } = useUser();
    const { signOut: clerkSignOut } = useClerk();
    const { session: clerkSession } = useSession();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync Clerk session token with Supabase client
    useEffect(() => {
        const syncToken = async () => {
            if (clerkSession) {
                try {
                    const token = await clerkSession.getToken({ template: 'supabase' });
                    setSupabaseToken(token);
                } catch (err) {
                    console.error('Error getting Supabase token from Clerk:', err);
                }
            } else {
                setSupabaseToken(null);
            }
        };

        syncToken();

        // Refresh token every 55 seconds to prevent expiration
        const interval = setInterval(syncToken, 55 * 1000);
        return () => clearInterval(interval);
    }, [clerkSession]);

    const session: MockSession | null = userId ? {
        user: {
            id: userId,
            email: clerkUser?.primaryEmailAddress?.emailAddress
        }
    } : null;


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
                setProfile(null);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const refreshProfile = async () => {
        if (userId) {
            await fetchProfile(userId);
        }
    };

    useEffect(() => {
        if (clerkLoaded) {
            if (userId) {
                fetchProfile(userId).finally(() => setLoading(false));
            } else {
                setProfile(null);
                setLoading(false);
            }
        }
    }, [clerkLoaded, userId]);

    const signOut = async () => {
        setProfile(null);
        await clerkSignOut();
    };

    return (
        <AuthContext.Provider value={{ session, profile, loading: !clerkLoaded || loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
