'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

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
                // Trigger activity update silently in the background
                supabase.rpc('update_user_activity').then(({ error }: { error: any }) => {
                    if (error) console.error('Streak update error:', error);
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (session?.user.id) {
            await fetchProfile(session.user.id);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            if (event === 'PASSWORD_RECOVERY') {
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/update-password';
                }
            }

            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
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
