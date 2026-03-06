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
        <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">

                {/* Left: Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                        <Flame className={`w-5 h-5 ${isActive ? 'text-amber-500 animate-pulse' : 'text-gray-500'}`} />
                        <h3 className="text-xl font-bold text-white tracking-tight">Solo Lock-In</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        No groups available? Start a 25-minute Pomodoro timer to save your daily streak and boost your Faculty's total score.
                    </p>

                    {isCompleted && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold animate-fade-in-up">
                            <CheckCircle2 className="w-4 h-4" />
                            Session Logged! Streak Saved.
                        </div>
                    )}
                </div>

                {/* Right: Timer UI */}
                <div className="flex flex-col items-center">
                    {/* Circular Timer Display */}
                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                        {/* Static Background Ring */}
                        <svg className="w-full h-full absolute -rotate-90 transform" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            {/* Animated Progress Ring */}
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke={isActive ? "#3b82f6" : "#6b7280"}
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="283"
                                strokeDashoffset={283 - (283 * progress) / 100}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>

                        <div className="flex flex-col items-center justify-center font-mono">
                            <span className={`text-4xl font-light tracking-tighter ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>
                                {formatTime(timeLeft)}
                            </span>
                            {isSaving && <Loader2 className="w-4 h-4 text-brand-accent animate-spin mt-2" />}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTimer}
                            disabled={isCompleted}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-brand-accent hover:bg-brand-accent-hover text-white shadow-lg shadow-brand-accent/20 hover:scale-105'
                                } disabled:opacity-50 disabled:hover:scale-100`}
                        >
                            {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>

                        <button
                            onClick={resetTimer}
                            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
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
