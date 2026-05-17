'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
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
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

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
        if (session?.user?.id) {
            await fetchProfile(session.user.id);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            
            if (currentSession?.user?.id) {
                await fetchProfile(currentSession.user.id);
            }
            setLoading(false);
        };

        initializeAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);
            if (newSession?.user?.id) {
                await fetchProfile(newSession.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
