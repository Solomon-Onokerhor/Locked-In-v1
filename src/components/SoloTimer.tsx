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

    const formatTimeSplit = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return { mins, secs };
    };

    const { mins, secs } = formatTimeSplit(timeLeft);

    return (
        <div className="flex flex-col items-center justify-center w-full relative h-full min-h-[300px]">
            {isCompleted && (
                <div className="absolute top-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold animate-fade-in-up">
                    <CheckCircle2 className="w-4 h-4" />
                    Session Logged! Streak Saved.
                </div>
            )}
            <div className="flex items-center justify-center gap-2 sm:gap-4 py-8 w-full mt-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#111111] flex items-center justify-center border border-white/10">
                        <span className={`text-5xl sm:text-7xl font-black tabular-nums transition-colors ${isActive ? 'text-white' : 'text-[#555555]'}`}>{mins}</span>
                    </div>
                    <span className="text-[#888888] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Minutes</span>
                </div>
                <span className={`text-3xl sm:text-5xl font-black pb-6 transition-colors ${isActive ? 'text-white' : 'text-[#555555]'}`}>:</span>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#111111] flex items-center justify-center border border-white/10 relative overflow-hidden">
                        {isActive && (
                            <div className="absolute inset-0 bg-white/5 animate-pulse-glow" style={{ animationDuration: '1s' }} />
                        )}
                        <span className={`text-5xl sm:text-7xl font-black tabular-nums relative z-10 transition-colors ${isActive ? 'text-white' : 'text-[#555555]'}`}>{secs}</span>
                    </div>
                    <span className="text-[#888888] text-[10px] sm:text-xs font-bold uppercase tracking-widest">Seconds</span>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4 mt-2">
                <button
                    onClick={toggleTimer}
                    disabled={isCompleted || isSaving}
                    className="w-16 h-16 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin text-black" />
                    ) : isActive ? (
                        <Pause className="w-6 h-6 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 fill-current ml-1" />
                    )}
                </button>
                <button
                    onClick={resetTimer}
                    disabled={isSaving}
                    className="w-12 h-12 shrink-0 rounded-full bg-transparent border border-white/20 hover:bg-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Reset Timer"
                >
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>
        </div>
    );
}

// Simple fallback for missing lucide icon
function Loader2({ className }: { className?: string }) {
    return <Clock className={`${className} animate-pulse`} />;
}
