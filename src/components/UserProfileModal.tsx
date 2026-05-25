'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, UserCheck, UserMinus, Flame, Users, Check, Clock, BellRing } from 'lucide-react';
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
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isNudging, setIsNudging] = useState(false);
    const [nudgeSent, setNudgeSent] = useState(false);

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
        const { data, error } = await supabase.rpc('check_buddy_connection_status', {
            p_user_id: currentUserProfile.id,
            p_buddy_id: userId
        });
        if (data) {
            setConnectionStatus(data as any);
        }
    };

    const handleConnect = async () => {
        if (!currentUserProfile || isConnecting || connectionStatus !== 'none') return;
        setIsConnecting(true);
        try {
            const res = await fetch('/api/buddies/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver_id: userId })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to send request');
                return;
            }
            setConnectionStatus('pending_sent');
        } catch (err) {
            console.error('Failed to connect:', err);
        } finally {
            setIsConnecting(false);
        }
    };
    
    const handleAccept = async () => {
        if (!currentUserProfile || isConnecting || connectionStatus !== 'pending_received') return;
        setIsConnecting(true);
        try {
            const res = await fetch('/api/buddies/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_id: userId })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to accept request');
                return;
            }
            setConnectionStatus('accepted');
        } catch (err) {
            console.error('Failed to accept:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!currentUserProfile || isConnecting || connectionStatus === 'none') return;
        setIsConnecting(true);
        try {
            const { error } = await supabase
                .from('buddy_connections')
                .delete()
                .or(`and(user_id.eq.${currentUserProfile.id},buddy_id.eq.${userId}),and(user_id.eq.${userId},buddy_id.eq.${currentUserProfile.id})`);

            if (!error) {
                setConnectionStatus('none');
            }
        } catch (err) {
            console.error('Failed to disconnect/cancel:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleNudge = async () => {
        if (!currentUserProfile || isNudging || nudgeSent || !profile) return;
        setIsNudging(true);
        try {
            const res = await fetch('/api/buddies/nudge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver_id: profile.id })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    alert(data.error || 'You cannot poke this buddy again so soon.');
                } else {
                    throw new Error(data.error || 'Failed to send nudge');
                }
                setIsNudging(false);
                return;
            }

            setNudgeSent(true);
            setTimeout(() => setNudgeSent(false), 3000);
        } catch (err) {
            console.error('Failed to nudge:', err);
            alert('Failed to send nudge. Please try again later.');
        } finally {
            setIsNudging(false);
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
                <div className="h-32 bg-gradient-to-br from-white/10 to-transparent relative">
                    {profile?.is_locked_in && (
                        <div className="absolute inset-0 bg-brand-accent/20 animate-pulse" />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Profile Content */}
                <div className="px-6 pb-6 pt-0 relative">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-brand-primary border-4 border-brand-primary flex items-center justify-center -mt-12 mb-4 mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10" />
                        <span className="text-4xl font-black text-gray-300">
                            {profile?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                        {profile?.is_locked_in && (
                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-brand-primary animate-pulse-glow" title="Locked In" />
                        )}
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
                                    <div className="bg-white/10 rounded-full p-0.5" title={profile.badge_label || 'Verified Scholar'}>
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={5} />
                                    </div>
                                )}
                            </h2>
                            {profile.badge_label && (
                                <p className="text-brand-accent text-sm font-bold uppercase tracking-widest mt-1">
                                    {profile.badge_label}
                                </p>
                            )}

                            {/* Status Indicator */}
                            {profile.is_locked_in ? (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                        Locked In: {profile.current_topic || 'Focusing'}
                                    </span>
                                </div>
                            ) : (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                                        Offline
                                    </span>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-6 mb-8">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Flame className="w-5 h-5 text-gray-300 mb-1" />
                                    <span className="text-white font-bold">{profile.current_streak}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Streak</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Clock className="w-5 h-5 text-gray-300 mb-1" />
                                    <span className="text-white font-bold">{Math.round(profile.total_focus_time_minutes / 60)}h</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Focus</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                    <Users className="w-5 h-5 text-gray-300 mb-1" />
                                    <span className="text-white font-bold">{profile.study_buddies}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-black">Buddies</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {currentUserProfile?.id !== profile.id && (
                                <div className="flex flex-col gap-2 relative">
                                    {connectionStatus === 'accepted' ? (
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={isConnecting}
                                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/10 text-gray-300 border border-white/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                                        >
                                            {isConnecting ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                            ) : (
                                                <>
                                                    <UserCheck className="w-5 h-5" />
                                                    Connected Buddy
                                                </>
                                            )}
                                        </button>
                                    ) : connectionStatus === 'pending_sent' ? (
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={isConnecting}
                                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-red-500/10 hover:text-red-400"
                                        >
                                            {isConnecting ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                            ) : (
                                                <>
                                                    <UserMinus className="w-5 h-5" />
                                                    Cancel Request
                                                </>
                                            )}
                                        </button>
                                    ) : connectionStatus === 'pending_received' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAccept}
                                                disabled={isConnecting}
                                                className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                                            >
                                                {isConnecting ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                                ) : (
                                                    <>
                                                        <Check className="w-5 h-5" />
                                                        Accept
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleDisconnect}
                                                disabled={isConnecting}
                                                className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleConnect}
                                            disabled={isConnecting}
                                            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-white hover:bg-gray-200 text-black shadow-lg shadow-white/10 hover:shadow-white/10"
                                        >
                                            {isConnecting ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-5 h-5" />
                                                    Connect
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {connectionStatus === 'accepted' && (
                                        <button
                                            onClick={handleNudge}
                                            disabled={isNudging || nudgeSent}
                                            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${nudgeSent
                                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                                }`}
                                        >
                                            {isNudging ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
                                            ) : nudgeSent ? (
                                                <>
                                                    <Flame className="w-5 h-5 animate-pulse" />
                                                    Nudge Sent!
                                                </>
                                            ) : (
                                                <>
                                                    <BellRing className="w-5 h-5 text-orange-400" />
                                                    Send Nudge 🔥
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
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
