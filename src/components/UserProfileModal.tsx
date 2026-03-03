'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, UserCheck, Flame, Users, Check, Clock } from 'lucide-react';
import type { Profile } from '@/types';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentUserProfile: Profile | null;
}

export function UserProfileModal({ isOpen, onClose, userId, currentUserProfile }: UserProfileModalProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
            if (currentUserProfile) {
                checkConnection();
            }
        }
    }, [isOpen, userId, currentUserProfile]);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setProfile(data as Profile);
        }
        setLoading(false);
    };

    const checkConnection = async () => {
        if (!currentUserProfile) return;
        const { data, error } = await supabase.rpc('check_buddy_connection', {
            p_user_id: currentUserProfile.id,
            p_buddy_id: userId
        });
        if (data) {
            setIsConnected(data);
        }
    };

    const handleConnect = async () => {
        if (!currentUserProfile || isConnecting || isConnected) return;
        setIsConnecting(true);
        try {
            const { error } = await supabase
                .from('buddy_connections')
                .insert([
                    { user_id: currentUserProfile.id, buddy_id: userId }
                ]);

            if (!error) {
                setIsConnected(true);
            }
        } catch (err) {
            console.error('Failed to connect:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!currentUserProfile || isConnecting || !isConnected) return;
        setIsConnecting(true);
        try {
            const { error } = await supabase
                .from('buddy_connections')
                .delete()
                .or(`and(user_id.eq.${currentUserProfile.id},buddy_id.eq.${userId}),and(user_id.eq.${userId},buddy_id.eq.${currentUserProfile.id})`);

            if (!error) {
                setIsConnected(false);
            }
        } catch (err) {
            console.error('Failed to disconnect:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-brand-primary border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative animate-scale-in">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-gray-400 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Background */}
                <div className="h-32 bg-gradient-to-br from-blue-600 to-brand-accent relative">
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Profile Content */}
                <div className="px-6 pb-6 pt-0 relative">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-brand-primary border-4 border-brand-primary flex items-center justify-center -mt-12 mb-4 mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10" />
                        <span className="text-4xl font-black text-blue-400">
                            {profile?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent"></div>
                        </div>
                    ) : profile ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                                {profile.name}
                                {profile.is_verified && (
                                    <div className="bg-blue-500 rounded-full p-0.5" title={profile.badge_label || 'Verified Scholar'}>
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={5} />
                                    </div>
                                )}
                            </h2>
                            {profile.badge_label && (
                                <p className="text-brand-accent text-sm font-bold uppercase tracking-widest mt-1">
                                    {profile.badge_label}
                                </p>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-6 mb-8">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Flame className="w-5 h-5 text-amber-500 mb-1" />
                                    <span className="text-white font-bold">{profile.current_streak}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Streak</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Clock className="w-5 h-5 text-emerald-400 mb-1" />
                                    <span className="text-white font-bold">{Math.round(profile.total_focus_time_minutes / 60)}h</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Focus</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Users className="w-5 h-5 text-indigo-400 mb-1" />
                                    <span className="text-white font-bold">{profile.study_buddies}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Buddies</span>
                                </div>
                            </div>

                            {/* Connect Button */}
                            {currentUserProfile?.id !== profile.id && (
                                <button
                                    onClick={isConnected ? handleDisconnect : handleConnect}
                                    disabled={isConnecting}
                                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${isConnected
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                                            : 'bg-brand-accent hover:bg-blue-600 text-white shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40'
                                        }`}
                                >
                                    {isConnecting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                    ) : isConnected ? (
                                        <>
                                            <UserCheck className="w-5 h-5" />
                                            Connected Buddy
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Connect
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center">Failed to load profile.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
