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

const LS_KEY = 'lockedin_solotimer_state';

interface PersistedSoloTimerState {
    timerState: TimerState;
    expectedEndTime: number | null;
    duration: number;
    label: string;
    goal: string;
    isPaused: boolean;
    pausedTimeLeft: number;
    pomodoroEnabled: boolean;
    breakDuration: number;
    pomodoroRound: number;
    totalRounds: number;
    soundEnabled: boolean;
}

function saveToStorage(state: PersistedSoloTimerState) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
}

function loadFromStorage(): PersistedSoloTimerState | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(LS_KEY);
    } catch { /* ignore */ }
}


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
    const expectedEndTimeRef = useRef<number | null>(null);
    const hasRestoredRef = useRef(false);

    // Determine if floating timer should show (if active/break/completion/stats AND not on dashboard or auth pages)
    const AUTH_PATHS = ['/', '/onboarding', '/sign-in', '/sign-up'];
    const isAuthPage = AUTH_PATHS.some(p => pathname === p) || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
    const isTimerVisible = (timerState === 'ACTIVE' || timerState === 'BREAK' || timerState === 'COUNTDOWN' || timerState === 'COMPLETION' || timerState === 'STATS') && !isAuthPage;

    // ---- Restore from localStorage on mount ----
    useEffect(() => {
        if (hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        const saved = loadFromStorage();
        if (!saved) return;

        // Restore setup/pomodoro data
        setDuration(saved.duration);
        setLabel(saved.label);
        setGoal(saved.goal);
        setPomodoroEnabled(saved.pomodoroEnabled);
        setBreakDuration(saved.breakDuration);
        setPomodoroRound(saved.pomodoroRound);
        setTotalRounds(saved.totalRounds);
        setSoundEnabled(saved.soundEnabled);

        const activeStates: TimerState[] = ['ACTIVE', 'BREAK', 'COUNTDOWN'];

        if (activeStates.includes(saved.timerState)) {
            if (saved.isPaused) {
                setTimeLeft(saved.pausedTimeLeft);
                setIsPaused(true);
                setTimerState(saved.timerState);
            } else if (saved.expectedEndTime) {
                const remaining = Math.round((saved.expectedEndTime - Date.now()) / 1000);
                if (remaining > 0) {
                    setTimeLeft(remaining);
                    expectedEndTimeRef.current = saved.expectedEndTime;
                    setTimerState(saved.timerState);
                } else {
                    setTimeLeft(0);
                    if (saved.timerState === 'ACTIVE') {
                        setTimerState('COMPLETION');
                    } else if (saved.timerState === 'BREAK') {
                        setPomodoroRound(r => r + 1);
                        setTimeLeft(saved.duration * 60);
                        setCountdown(3);
                        setTimerState('COUNTDOWN');
                    }
                    clearStorage();
                }
            }
        } else if (saved.timerState === 'COMPLETION') {
            setTimerState('COMPLETION');
        } else if (saved.timerState === 'STATS') {
            setTimerState('STATS');
        }
    }, []);

    // ---- Persist state to localStorage whenever it changes ----
    useEffect(() => {
        if (!hasRestoredRef.current) return;
        if (timerState === 'SETUP') {
            clearStorage();
            return;
        }

        const persisted: PersistedSoloTimerState = {
            timerState,
            expectedEndTime: expectedEndTimeRef.current,
            duration,
            label,
            goal,
            isPaused,
            pausedTimeLeft: timeLeft,
            pomodoroEnabled,
            breakDuration,
            pomodoroRound,
            totalRounds,
            soundEnabled,
        };
        saveToStorage(persisted);
    }, [timerState, timeLeft, isPaused, duration, label, goal, pomodoroEnabled, breakDuration, pomodoroRound, totalRounds, soundEnabled]);

    // Sync timeLeft when duration changes in SETUP
    useEffect(() => {
        if (timerState === 'SETUP') {
            setTimeLeft(duration * 60);
            expectedEndTimeRef.current = null;
        }
    }, [duration, timerState]);

    // ---- Sync is_locked_in state to Supabase ----
    useEffect(() => {
        if (!session?.user?.id) return;
        
        const isLockedIn = ['COUNTDOWN', 'ACTIVE', 'BREAK'].includes(timerState);
        const topic = isLockedIn ? label : null;

        supabase.from('profiles').update({
            is_locked_in: isLockedIn,
            current_topic: topic
        }).eq('id', session.user.id).then(({ error }) => {
            if (error) console.error('Failed to update lock-in status:', error);
        });
    }, [timerState, session?.user?.id, label]);

    // Main Timer Loop using system-time sync
    useEffect(() => {
        if (timerState === 'COUNTDOWN') {
            if (countdown > 0) {
                const id = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(id);
            } else {
                setTimerState('ACTIVE');
                expectedEndTimeRef.current = Date.now() + (duration * 60 * 1000);
            }
        }

        const isActive = (timerState === 'ACTIVE' || timerState === 'BREAK');

        if (isActive && !isPaused) {
            if (!expectedEndTimeRef.current) {
                expectedEndTimeRef.current = Date.now() + (timeLeft * 1000);
            }

            timerRef.current = setInterval(() => {
                if (!expectedEndTimeRef.current) return;

                const remaining = Math.round((expectedEndTimeRef.current - Date.now()) / 1000);

                if (remaining > 0) {
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(0);
                    expectedEndTimeRef.current = null;
                    if (timerRef.current) clearInterval(timerRef.current);

                    if (timerState === 'ACTIVE') {
                        handleTimerFinished();
                    } else if (timerState === 'BREAK') {
                        handleBreakFinished();
                    }
                }
            }, 1000);
        } else if (isPaused) {
            expectedEndTimeRef.current = null;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerState, countdown, isPaused]);

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
        setTimeLeft(duration * 60);
        expectedEndTimeRef.current = null;
        setTimerState('COUNTDOWN');
    };

    const handleTimerFinished = () => {
        playCompletionSound();
        expectedEndTimeRef.current = null;
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
            clearStorage();
        }
    };

    const handleBreakFinished = () => {
        playBreakSound();
        if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
            new Notification('Break Over!', { body: `Time for Pomodoro round ${pomodoroRound + 1}` });
        }
        setPomodoroRound(r => r + 1);
        setTimeLeft(duration * 60);
        expectedEndTimeRef.current = null;
        setCountdown(3);
        setTimerState('COUNTDOWN');
    };

    const skipBreak = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        expectedEndTimeRef.current = null;
        handleBreakFinished();
    };

    const handleQuitEarly = async () => {
        setIsSaving(true);
        if (timerRef.current) clearInterval(timerRef.current);
        expectedEndTimeRef.current = null;
        clearStorage();

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

            const { data, error } = await supabase.rpc('submit_solo_session', {
                p_label: label,
                p_goal: goal,
                p_duration: actualDuration,
                p_completed_goal: completedGoal,
                p_distraction: distraction,
                p_is_pomodoro: pomodoroEnabled
            });

            if (error) throw error;
            
            // Handle custom error response from RPC
            if (data && data.success === false) {
                throw new Error(data.error || 'Unknown error saving session');
            }

            clearStorage();
            await refreshProfile();
            setTimerState('STATS');

            // Auto-reset after a short window so the timer doesn't linger on other pages
            setTimeout(() => resetAll(), 8000);

            // Trigger WhatsApp notification asynchronously
            fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: 'SOLO_SESSION_COMPLETE',
                    payload: { 
                        duration: actualDuration, 
                        goal: completedGoal || goal || label || 'Study session'
                    }
                })
            }).catch(console.error);

        } catch (error) {
            console.error('Error saving completion:', error);
            alert('Failed to save session. Ensure database functions are updated.');
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
        expectedEndTimeRef.current = null;
        clearStorage();
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
