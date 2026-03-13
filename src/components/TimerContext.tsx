'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import confetti from 'canvas-confetti';

// ---- Types ----
export type TimerState = 'SETUP' | 'COUNTDOWN' | 'ACTIVE' | 'BREAK' | 'COMPLETION' | 'STATS';

interface TimerContextValue {
    // Timer state
    timerState: TimerState;
    timeLeft: number;
    isPaused: boolean;
    countdown: number;
    showQuitConfirm: boolean;
    isSaving: boolean;

    // Setup data
    duration: number;
    label: string;
    goal: string;
    isCustomDuration: boolean;
    customDurationInput: string;

    // Pomodoro
    pomodoroEnabled: boolean;
    breakDuration: number;
    pomodoroRound: number;
    totalRounds: number;

    // Completion
    completedGoal: 'yes' | 'partial' | 'no' | null;
    distraction: string;

    // Audio
    soundEnabled: boolean;

    // History
    showHistory: boolean;

    // Setters
    setDuration: (d: number) => void;
    setLabel: (l: string) => void;
    setGoal: (g: string) => void;
    setIsCustomDuration: (v: boolean) => void;
    setCustomDurationInput: (v: string) => void;
    setPomodoroEnabled: (v: boolean) => void;
    setBreakDuration: (d: number) => void;
    setTotalRounds: (r: number) => void;
    setSoundEnabled: (v: boolean) => void;
    setIsPaused: (v: boolean) => void;
    setShowQuitConfirm: (v: boolean) => void;
    setCompletedGoal: (v: 'yes' | 'partial' | 'no' | null) => void;
    setDistraction: (v: string) => void;
    setShowHistory: (v: boolean) => void;

    // Actions
    startTimer: () => void;
    quitEarly: () => Promise<void>;
    submitCompletion: () => Promise<void>;
    skipBreak: () => void;
    resetAll: () => void;

    // Helpers
    formatTime: (seconds: number) => string;
    isTimerRunning: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
    return ctx;
}

// ---- localStorage keys ----
const LS_KEY = 'lockedin_timer_state';

interface PersistedTimerState {
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

function saveToStorage(state: PersistedTimerState) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch { /* quota or SSR */ }
}

function loadFromStorage(): PersistedTimerState | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearStorage() {
    try { localStorage.removeItem(LS_KEY); } catch { }
}

// ---- Provider ----
export function TimerProvider({ children }: { children: ReactNode }) {
    const { profile, session, refreshProfile } = useAuth();

    // -- Timer core state --
    const [timerState, setTimerState] = useState<TimerState>('SETUP');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [countdown, setCountdown] = useState(3);
    const [isPaused, setIsPaused] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // -- Setup --
    const [duration, setDuration] = useState(25);
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customDurationInput, setCustomDurationInput] = useState('');
    const [label, setLabel] = useState('');
    const [goal, setGoal] = useState('');

    // -- Pomodoro --
    const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
    const [breakDuration, setBreakDuration] = useState(5);
    const [pomodoroRound, setPomodoroRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(4);

    // -- Completion --
    const [completedGoal, setCompletedGoal] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [distraction, setDistraction] = useState('');

    // -- Audio --
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // -- History --
    const [showHistory, setShowHistory] = useState(false);

    // -- Refs --
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const expectedEndTimeRef = useRef<number | null>(null);
    const hasRestoredRef = useRef(false);

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
                // Was paused — restore paused time
                setTimeLeft(saved.pausedTimeLeft);
                setIsPaused(true);
                setTimerState(saved.timerState);
            } else if (saved.expectedEndTime) {
                // Was running — calculate remaining time
                const remaining = Math.round((saved.expectedEndTime - Date.now()) / 1000);
                if (remaining > 0) {
                    setTimeLeft(remaining);
                    expectedEndTimeRef.current = saved.expectedEndTime;
                    setTimerState(saved.timerState);
                } else {
                    // Timer expired while away — auto-complete
                    setTimeLeft(0);
                    if (saved.timerState === 'ACTIVE') {
                        setTimerState('COMPLETION');
                    } else if (saved.timerState === 'BREAK') {
                        // Break finished — start next round
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

        const persisted: PersistedTimerState = {
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

    // ---- Sync timeLeft when duration changes in SETUP ----
    useEffect(() => {
        if (timerState === 'SETUP') {
            setTimeLeft(duration * 60);
            expectedEndTimeRef.current = null;
        }
    }, [duration, timerState]);

    // ---- Handle Countdown ----
    useEffect(() => {
        if (timerState === 'COUNTDOWN') {
            if (countdown > 0) {
                const id = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(id);
            } else {
                setTimerState('ACTIVE');
            }
        }
    }, [timerState, countdown]);

    // ---- Handle Active & Break with Date.now() ----
    useEffect(() => {
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
                    } else {
                        handleBreakFinished();
                    }
                }
            }, 1000);
        } else {
            expectedEndTimeRef.current = null;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timerState, isPaused]);

    // ---- Audio ----
    const playCompletionSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const notes = [523.25, 659.25, 783.99, 1046.50];
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
        } catch { }
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
        } catch { }
    }, [soundEnabled]);

    // ---- Timer Actions ----
    const handleTimerFinished = useCallback(() => {
        playCompletionSound();
        if (pomodoroEnabled && pomodoroRound < totalRounds) {
            setTimeLeft(breakDuration * 60);
            setTimerState('BREAK');
        } else {
            setTimerState('COMPLETION');
            triggerConfetti();
        }
    }, [playCompletionSound, pomodoroEnabled, pomodoroRound, totalRounds, breakDuration]);

    const handleBreakFinished = useCallback(() => {
        playBreakSound();
        setPomodoroRound(r => r + 1);
        setTimeLeft(duration * 60);
        expectedEndTimeRef.current = null;
        setCountdown(3);
        setTimerState('COUNTDOWN');
    }, [playBreakSound, duration]);

    const startTimer = useCallback(() => {
        if (!session) return;
        setPomodoroRound(1);
        setCountdown(3);
        expectedEndTimeRef.current = null;
        setTimeLeft(duration * 60);
        setTimerState('COUNTDOWN');
    }, [session, duration]);

    const quitEarly = useCallback(async () => {
        setIsSaving(true);
        if (timerRef.current) clearInterval(timerRef.current);
        expectedEndTimeRef.current = null;

        try {
            await supabase.from('solo_sessions').insert({
                user_id: session!.user.id,
                label: label || 'Solo Session',
                goal,
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
    }, [session, label, goal, duration, refreshProfile]);

    const submitCompletion = useCallback(async () => {
        if (!completedGoal || !distraction) return;
        setIsSaving(true);
        try {
            const actualDuration = pomodoroEnabled ? duration * pomodoroRound : duration;

            await supabase.from('solo_sessions').insert({
                user_id: session!.user.id,
                label: label || 'Solo Session',
                goal,
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
    }, [completedGoal, distraction, pomodoroEnabled, duration, pomodoroRound, session, label, goal, profile, refreshProfile]);

    const skipBreak = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        handleBreakFinished();
    }, [handleBreakFinished]);

    const resetAll = useCallback(() => {
        setTimerState('SETUP');
        setDuration(25);
        setIsCustomDuration(false);
        setCustomDurationInput('');
        setLabel('');
        setGoal('');
        setCompletedGoal(null);
        setDistraction('');
        setIsPaused(false);
        setShowQuitConfirm(false);
        setPomodoroRound(1);
        expectedEndTimeRef.current = null;
        clearStorage();
    }, []);

    const triggerConfetti = () => {
        const dur = 3 * 1000;
        const animationEnd = Date.now() + dur;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const tl = animationEnd - Date.now();
            if (tl <= 0) return clearInterval(interval);
            const particleCount = 50 * (tl / dur);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const isTimerRunning = timerState === 'ACTIVE' || timerState === 'BREAK' || timerState === 'COUNTDOWN';

    return (
        <TimerContext.Provider value={{
            timerState, timeLeft, isPaused, countdown, showQuitConfirm, isSaving,
            duration, label, goal, isCustomDuration, customDurationInput,
            pomodoroEnabled, breakDuration, pomodoroRound, totalRounds,
            completedGoal, distraction, soundEnabled, showHistory,
            setDuration, setLabel, setGoal, setIsCustomDuration, setCustomDurationInput,
            setPomodoroEnabled, setBreakDuration, setTotalRounds, setSoundEnabled,
            setIsPaused, setShowQuitConfirm, setCompletedGoal, setDistraction, setShowHistory,
            startTimer, quitEarly, submitCompletion, skipBreak, resetAll,
            formatTime, isTimerRunning,
        }}>
            {children}
        </TimerContext.Provider>
    );
}
