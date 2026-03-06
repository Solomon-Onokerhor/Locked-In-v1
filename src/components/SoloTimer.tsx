'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Play, Pause, Square, Flame, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SoloTimer() {
    const { profile, session, refreshProfile } = useAuth();
    const router = useRouter();

    // 25 minutes in seconds
    const FOCUS_DURATION = 25 * 60;

    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            handleSessionComplete();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSessionComplete = async () => {
        setIsCompleted(true);
        if (!session?.user?.id || !profile) return;

        setIsSaving(true);
        try {
            // 1. Update total focus time in profile
            await supabase.from('profiles')
                .update({
                    total_focus_time_minutes: (profile.total_focus_time_minutes || 0) + 25
                })
                .eq('id', session.user.id);

            // 2. Trigger the streak update RPC to ensure their daily streak is saved
            await supabase.rpc('update_user_activity');

            await refreshProfile();
        } catch (error) {
            console.error('Error saving solo session:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTimer = () => {
        if (!session) {
            router.push('/auth');
            return;
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(FOCUS_DURATION);
        setIsCompleted(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for the circular ring
    const progress = ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100;

    return (
        <div className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden group border border-white/5">
            {/* Premium Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            {isActive && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-10 -mt-10 animate-pulse-glow"></div>}

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">

                {/* Left: Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-white/5'}`}>
                            <Flame className={`w-6 h-6 ${isActive ? 'text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-gray-400'}`} />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Solo Lock-In</h3>
                    </div>
                    <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 max-w-md mx-auto md:mx-0 font-medium">
                        No groups available? Start a focused 25-minute session to save your daily streak and boost your Faculty's total score.
                    </p>

                    {isCompleted && (
                        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold animate-fade-in-up shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                            <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]" />
                            Session Logged! Streak Saved.
                        </div>
                    )}
                </div>

                {/* Right: Timer UI */}
                <div className="flex flex-col items-center">
                    {/* Glowing Circular Timer Display */}
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8 shrink-0">
                        {/* Static Background Ring */}
                        <svg className="w-full h-full absolute -rotate-90 transform drop-shadow-2xl" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                            {/* Animated Progress Ring */}
                            <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke={isActive ? "#3b82f6" : "rgba(255,255,255,0.1)"}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="289"
                                strokeDashoffset={289 - (289 * progress) / 100}
                                className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                            />
                        </svg>

                        <div className="flex flex-col items-center justify-center font-mono z-10">
                            <span className={`text-5xl font-light tracking-tighter tabular-nums ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                {formatTime(timeLeft)}
                            </span>
                            {isSaving && <Loader2 className="w-5 h-5 text-brand-accent animate-spin mt-3 opacity-80" />}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTimer}
                            disabled={isCompleted || isSaving}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                : 'bg-brand-accent hover:bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] hover:scale-105 border border-blue-500/50'
                                } disabled:opacity-50 disabled:hover:scale-100`}
                        >
                            {isActive ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                        </button>

                        <button
                            onClick={resetTimer}
                            disabled={isSaving}
                            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50"
                            title="Reset Timer"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Simple fallback for missing lucide icon
function Loader2({ className }: { className?: string }) {
    return <Clock className={`${className} animate-pulse`} />;
}
