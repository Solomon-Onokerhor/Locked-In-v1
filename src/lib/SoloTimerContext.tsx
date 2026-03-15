'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import confetti from 'canvas-confetti';
import { usePathname } from 'next/navigation';

export type TimerState = 'SETUP' | 'COUNTDOWN' | 'ACTIVE' | 'BREAK' | 'COMPLETION' | 'STATS';

interface SoloTimerContextType {
    // App State
    timerState: TimerState;
    setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
    isSaving: boolean;
    
    // Setup Data
    duration: number;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    label: string;
    setLabel: React.Dispatch<React.SetStateAction<string>>;
    goal: string;
    setGoal: React.Dispatch<React.SetStateAction<string>>;
    
    // Pomodoro Mode
    pomodoroEnabled: boolean;
    setPomodoroEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    breakDuration: number;
    setBreakDuration: React.Dispatch<React.SetStateAction<number>>;
    pomodoroRound: number;
    setPomodoroRound: React.Dispatch<React.SetStateAction<number>>;
    totalRounds: number;
    setTotalRounds: React.Dispatch<React.SetStateAction<number>>;
    
    // Audio
    soundEnabled: boolean;
    setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Timer State
    timeLeft: number;
    setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
    countdown: number;
    setCountdown: React.Dispatch<React.SetStateAction<number>>;
    isPaused: boolean;
    setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Actions
    handleStartSequence: () => void;
    handleQuitEarly: () => Promise<void>;
    submitCompletion: (completedGoal: string, distraction: string) => Promise<void>;
    resetAll: () => void;
    skipBreak: () => void;
    
    // View state tracking
    isTimerVisible: boolean; // Is the user on a page where the timer should float?
}

const SoloTimerContext = createContext<SoloTimerContextType | undefined>(undefined);

export function SoloTimerProvider({ children }: { children: React.ReactNode }) {
    const { session, profile, refreshProfile } = useAuth();
    const pathname = usePathname();

    // -- App State --
    const [timerState, setTimerState] = useState<TimerState>('SETUP');
    const [isSaving, setIsSaving] = useState(false);

    // -- Setup Data --
    const [duration, setDuration] = useState(25);
    const [label, setLabel] = useState('');
    const [goal, setGoal] = useState('');

    // -- Pomodoro Mode --
    const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
    const [breakDuration, setBreakDuration] = useState(5);
    const [pomodoroRound, setPomodoroRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(4);

    // -- Audio --
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // -- Timer State --
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [countdown, setCountdown] = useState(3);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now()); // For background sync

    // Determine if floating timer should show (if active AND not on dashboard)
    const isTimerVisible = (timerState === 'ACTIVE' || timerState === 'BREAK' || timerState === 'COUNTDOWN') && pathname !== '/';

    // Sync timeLeft when duration changes in SETUP
    useEffect(() => {
        if (timerState === 'SETUP') {
            setTimeLeft(duration * 60);
        }
    }, [duration, timerState]);

    // Background Tab Sync Logic
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isPaused && (timerState === 'ACTIVE' || timerState === 'BREAK')) {
                // We came back! Calculate how much time passed
                const now = Date.now();
                const diffSeconds = Math.floor((now - lastTickRef.current) / 1000);
                
                if (diffSeconds > 0) {
                    setTimeLeft(prev => {
                        const newTime = Math.max(0, prev - diffSeconds);
                        // If it crossed 0 while we were gone, we need to handle completion manually
                        if (newTime === 0 && prev > 0) {
                            // Note: this will be picked up by the regular interval loop safely
                        }
                        return newTime;
                    });
                }
            }
            lastTickRef.current = Date.now();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPaused, timerState]);

    // Main Timer Loop
    useEffect(() => {
        if (timerState === 'COUNTDOWN') {
            if (countdown > 0) {
                const id = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(id);
            } else {
                setTimerState('ACTIVE');
                lastTickRef.current = Date.now();
            }
        }

        if ((timerState === 'ACTIVE' || timerState === 'BREAK') && !isPaused) {
            if (timeLeft > 0) {
                timerRef.current = setTimeout(() => {
                    setTimeLeft(t => t - 1);
                    lastTickRef.current = Date.now();
                }, 1000);
            } else if (timeLeft === 0) {
                if (timerState === 'ACTIVE') {
                    handleTimerFinished();
                } else if (timerState === 'BREAK') {
                    handleBreakFinished();
                }
            }
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timerState, countdown, isPaused, timeLeft]);

    // -- Audio Functions --
    const playCompletionSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.5);
                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + i * 0.2 + 0.5);
            });
        } catch { /* ignore */ }
    }, [soundEnabled]);

    const playBreakSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            [440, 523.25].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.3 + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.3 + 0.4);
                osc.start(ctx.currentTime + i * 0.3);
                osc.stop(ctx.currentTime + i * 0.3 + 0.4);
            });
        } catch { /* ignore */ }
    }, [soundEnabled]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    // -- Actions --
    const handleStartSequence = () => {
        setPomodoroRound(1);
        setCountdown(3);
        setTimerState('COUNTDOWN');
    };

    const handleTimerFinished = () => {
        playCompletionSound();
        if (pomodoroEnabled && pomodoroRound < totalRounds) {
            setTimeLeft(breakDuration * 60);
            setTimerState('BREAK');
        } else {
            setTimerState('COMPLETION');
            // Check if we are not on dashboard, trigger local browser notification
            if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
                new Notification('Locked In Complete! 🎉', { body: `You finished: ${label}` });
            }
            triggerConfetti();
        }
    };

    const handleBreakFinished = () => {
        playBreakSound();
        if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
            new Notification('Break Over!', { body: `Time for Pomodoro round ${pomodoroRound + 1}` });
        }
        setPomodoroRound(r => r + 1);
        setTimeLeft(duration * 60);
        setCountdown(3);
        setTimerState('COUNTDOWN');
    };

    const skipBreak = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        handleBreakFinished();
    };

    const handleQuitEarly = async () => {
        setIsSaving(true);
        if (timerRef.current) clearTimeout(timerRef.current);

        try {
            await supabase.from('solo_sessions').insert({
                user_id: session!.user.id,
                label: label || 'Solo Session',
                goal: goal,
                duration_minutes: duration,
                completed_at: new Date().toISOString(),
                quit_early: true
            });
            await supabase.rpc('update_focus_score', { score_delta: -5, user_uuid: session!.user.id });
            await refreshProfile();
        } catch (error) {
            console.error('Error quitting early:', error);
        } finally {
            setIsSaving(false);
            resetAll();
        }
    };

    const submitCompletion = async (completedGoal: string, distraction: string) => {
        setIsSaving(true);
        try {
            const actualDuration = pomodoroEnabled ? duration * pomodoroRound : duration;

            await supabase.from('solo_sessions').insert({
                user_id: session!.user.id,
                label: label || 'Solo Session',
                goal: goal,
                duration_minutes: actualDuration,
                completed_goal: completedGoal,
                distraction_reason: distraction,
                completed_at: new Date().toISOString(),
                quit_early: false
            });

            let scoreUpdate = 10;
            if (completedGoal === 'yes') scoreUpdate += 5;
            if (distraction === 'Nothing! I was locked in 🔒') scoreUpdate += 5;
            if (actualDuration >= 60) scoreUpdate += 10;
            if (pomodoroEnabled) scoreUpdate += 5;

            await supabase.from('profiles')
                .update({
                    total_focus_time_minutes: (profile?.total_focus_time_minutes || 0) + actualDuration,
                    sessions_completed: (profile?.sessions_completed || 0) + 1,
                    focus_score: (profile?.focus_score || 0) + scoreUpdate
                })
                .eq('id', session!.user.id);

            await supabase.rpc('update_user_activity');
            await refreshProfile();

            setTimerState('STATS');
        } catch (error) {
            console.error('Error saving completion:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const resetAll = () => {
        setTimerState('SETUP');
        setDuration(25);
        setLabel('');
        setGoal('');
        setIsPaused(false);
        setPomodoroRound(1);
    };

    // Ask for notification permission when they start typing a goal
    useEffect(() => {
        if (goal.length > 0 && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [goal]);

    const value = {
        timerState,
        setTimerState,
        isSaving,
        duration,
        setDuration,
        label,
        setLabel,
        goal,
        setGoal,
        pomodoroEnabled,
        setPomodoroEnabled,
        breakDuration,
        setBreakDuration,
        pomodoroRound,
        setPomodoroRound,
        totalRounds,
        setTotalRounds,
        soundEnabled,
        setSoundEnabled,
        timeLeft,
        setTimeLeft,
        countdown,
        setCountdown,
        isPaused,
        setIsPaused,
        handleStartSequence,
        handleQuitEarly,
        submitCompletion,
        resetAll,
        skipBreak,
        isTimerVisible,
    };

    return (
        <SoloTimerContext.Provider value={value}>
            {children}
        </SoloTimerContext.Provider>
    );
}

export function useSoloTimer() {
    const context = useContext(SoloTimerContext);
    if (context === undefined) {
        throw new Error('useSoloTimer must be used within a SoloTimerProvider');
    }
    return context;
}
