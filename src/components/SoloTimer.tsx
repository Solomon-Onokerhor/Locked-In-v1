'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Play, Pause, Square, Flame, CheckCircle2, Clock, Target, AlertTriangle, ArrowRight, XCircle, History, Coffee, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import type { SoloSession } from '@/types';

type TimerState = 'SETUP' | 'COUNTDOWN' | 'ACTIVE' | 'BREAK' | 'COMPLETION' | 'STATS';

const DURATIONS = [25, 45, 60];
const BREAK_DURATIONS = [5, 10, 15];
const DISTRACTION_REASONS = ['Social Media', 'Phone / Messages', 'Noise / Environment', 'Daydreaming', 'Other', 'Nothing! I was locked in 🔒'];

export function SoloTimer() {
    const { profile, session, refreshProfile } = useAuth();
    const router = useRouter();

    // -- App State --
    const [timerState, setTimerState] = useState<TimerState>('SETUP');
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sessionHistory, setSessionHistory] = useState<SoloSession[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // -- Setup Data --
    const [duration, setDuration] = useState(25); // minutes
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customDurationInput, setCustomDurationInput] = useState('');
    const [label, setLabel] = useState('');
    const [goal, setGoal] = useState('');

    // -- Pomodoro Mode --
    const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
    const [breakDuration, setBreakDuration] = useState(5); // minutes
    const [pomodoroRound, setPomodoroRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(4);

    // -- Audio --
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);

    // -- Timer State --
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [countdown, setCountdown] = useState(3);
    const [isPaused, setIsPaused] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    
    // -- Completion Data --
    const [completedGoal, setCompletedGoal] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [distraction, setDistraction] = useState('');

    // Timer Refs for precise background tracking
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const expectedEndTimeRef = useRef<number | null>(null);

    // Sync timeLeft when duration changes in SETUP
    useEffect(() => {
        if (timerState === 'SETUP') {
            setTimeLeft(duration * 60);
            expectedEndTimeRef.current = null;
        }
    }, [duration, timerState]);

    // Handle Countdown
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

    // Handle Active & Break Timers with Absolute Timestamp
    useEffect(() => {
        const isTimerActive = (timerState === 'ACTIVE' || timerState === 'BREAK');
        
        if (isTimerActive && !isPaused) {
            // Set expected end time if not set (e.g. just started or just unpaused)
            if (!expectedEndTimeRef.current) {
                expectedEndTimeRef.current = Date.now() + (timeLeft * 1000);
            }

            timerRef.current = setInterval(() => {
                if (!expectedEndTimeRef.current) return;
                
                const now = Date.now();
                const remaining = Math.round((expectedEndTimeRef.current - now) / 1000);

                if (remaining > 0) {
                    setTimeLeft(remaining);
                } else {
                    // Timer finished exactly
                    setTimeLeft(0);
                    expectedEndTimeRef.current = null;
                    if (timerRef.current) clearInterval(timerRef.current);
                    
                    if (timerState === 'ACTIVE') {
                        handleTimerFinished();
                    } else {
                        handleBreakFinished();
                    }
                }
            }, 1000); // Check every second
        } else {
            // User paused, clear the expected end time so it recalculates on resume
            expectedEndTimeRef.current = null;
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerState, isPaused]); // Removed timeLeft dependency to prevent re-renders restarting interval

    // -- Audio Functions --
    const playCompletionSound = useCallback(() => {
        if (!soundEnabled) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;

            // Play a pleasant "ding-ding-ding" chime
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
        } catch {
            // Audio not available, fail silently
        }
    }, [soundEnabled]);

    const playBreakSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            // Two gentle tones for break
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
        } catch {
            // Fail silently
        }
    }, [soundEnabled]);

    // -- Fetch Session History --
    const fetchHistory = useCallback(async () => {
        if (!session) return;
        setHistoryLoading(true);
        try {
            const { data } = await supabase
                .from('solo_sessions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('completed_at', { ascending: false })
                .limit(10);
            setSessionHistory((data as SoloSession[]) || []);
        } catch {
            // Fail quietly
        } finally {
            setHistoryLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (showHistory && session) {
            fetchHistory();
        }
    }, [showHistory, session, fetchHistory]);

    const handleStartSequence = () => {
        if (!session) {
            router.push('/auth');
            return;
        }
        setPomodoroRound(1);
        setCountdown(3);
        expectedEndTimeRef.current = null;
        setTimeLeft(duration * 60);
        setTimerState('COUNTDOWN');
    };

    const handleTimerFinished = () => {
        playCompletionSound();
        if (pomodoroEnabled && pomodoroRound < totalRounds) {
            // Transition to break
            setTimeLeft(breakDuration * 60);
            setTimerState('BREAK');
        } else {
            // Final completion
            setTimerState('COMPLETION');
            triggerConfetti();
        }
    };

    const handleBreakFinished = () => {
        playBreakSound();
        setPomodoroRound(r => r + 1);
        setTimeLeft(duration * 60);
        expectedEndTimeRef.current = null;
        setCountdown(3);
        setTimerState('COUNTDOWN');
    };

    const skipBreak = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        handleBreakFinished();
    };

    const handleQuitEarly = async () => {
        setIsSaving(true);
        if (timerRef.current) clearInterval(timerRef.current);
        expectedEndTimeRef.current = null;

        try {
            // Log failed session
            await supabase.from('solo_sessions').insert({
                user_id: session!.user.id,
                label: label || 'Solo Session',
                goal: goal,
                duration_minutes: duration,
                completed_at: new Date().toISOString(),
                quit_early: true
            });

            // Update focus score negatively
            await supabase.rpc('update_focus_score', { score_delta: -5, user_uuid: session!.user.id });

            await refreshProfile();
        } catch (error) {
            console.error('Error quitting early:', error);
        } finally {
            setIsSaving(false);
            resetAll();
        }
    };

    const submitCompletion = async () => {
        if (!completedGoal || !distraction) return;
        setIsSaving(true);
        try {
            const actualDuration = pomodoroEnabled ? duration * pomodoroRound : duration;

            // 1. Log Session
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

            // 2. Calculate Base Metrics
            let scoreUpdate = 10; // Base score for completion
            if (completedGoal === 'yes') scoreUpdate += 5;
            if (distraction === 'Nothing! I was locked in 🔒') scoreUpdate += 5;
            if (actualDuration >= 60) scoreUpdate += 10; // Bonus for long sessions
            if (pomodoroEnabled) scoreUpdate += 5; // Pomodoro bonus

            // Update profile
            await supabase.from('profiles')
                .update({
                    total_focus_time_minutes: (profile?.total_focus_time_minutes || 0) + actualDuration,
                    sessions_completed: (profile?.sessions_completed || 0) + 1,
                    focus_score: (profile?.focus_score || 0) + scoreUpdate
                })
                .eq('id', session!.user.id);

            // 3. Trigger streak
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
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleCustomDurationSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = parseInt(customDurationInput);
            if (!isNaN(val) && val > 0 && val <= 180) {
                setDuration(val);
                setIsCustomDuration(false);
            }
        }
    };

    const getGoalStatusIcon = (status: string | null | undefined) => {
        if (status === 'yes') return '✅';
        if (status === 'partial') return '⚠️';
        if (status === 'no') return '❌';
        return '—';
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    // --- Sub-Renders ---

    const renderSetup = () => (
        <div className="animate-fade-in w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-accent/20 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        <Flame className="w-8 h-8 text-brand-accent" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">Solo Lock-In</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-2.5 rounded-xl border transition-all ${soundEnabled ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                        title={soundEnabled ? 'Sound on' : 'Sound off'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2.5 rounded-xl border transition-all ${showHistory ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                        title="Session History"
                    >
                        <History className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showHistory ? renderHistory() : (
                <div className="space-y-6">
                    {/* Inputs */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-gray-400 text-sm font-bold ml-1 uppercase tracking-wider">Topic / Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Calculus, Web Dev"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="w-full glass-panel !border-white/10 !bg-black/30 focus:!bg-black/50 py-3.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-white placeholder:text-gray-600 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-gray-400 text-sm font-bold ml-1 uppercase tracking-wider">Session Goal</label>
                            <input
                                type="text"
                                placeholder="e.g. Finish Chapter 4"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full glass-panel !border-white/10 !bg-black/30 focus:!bg-black/50 py-3.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all text-white placeholder:text-gray-600 font-medium"
                            />
                        </div>
                    </div>

                    {/* Durations */}
                    <div className="space-y-3 pt-2">
                        <label className="text-gray-400 text-sm font-bold ml-1 uppercase tracking-wider text-center block md:text-left">Session Length</label>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => { setDuration(d); setIsCustomDuration(false); }}
                                    className={`px-6 py-3 rounded-xl text-base font-bold transition-all ${duration === d && !isCustomDuration
                                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 border-transparent'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {d}m
                                </button>
                            ))}
                            {isCustomDuration ? (
                                <input
                                    autoFocus
                                    type="number"
                                    min="1" max="180"
                                    placeholder="Mins"
                                    value={customDurationInput}
                                    onChange={(e) => setCustomDurationInput(e.target.value)}
                                    onKeyDown={handleCustomDurationSubmit}
                                    onBlur={() => handleCustomDurationSubmit({ key: 'Enter' } as any)}
                                    className="w-24 px-4 py-3 rounded-xl bg-black/40 border border-brand-accent text-white text-center font-bold outline-none focus:ring-2 focus:ring-brand-accent"
                                />
                            ) : (
                                <button
                                    onClick={() => setIsCustomDuration(true)}
                                    className={`px-6 py-3 rounded-xl text-base font-bold transition-all ${!DURATIONS.includes(duration)
                                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 border-transparent'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {!DURATIONS.includes(duration) ? `${duration}m` : 'Custom'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Pomodoro Mode Toggle */}
                    <div className="glass-panel !bg-black/20 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coffee className="w-5 h-5 text-amber-400" />
                                <div>
                                    <span className="text-white font-bold text-sm">Pomodoro Mode</span>
                                    <p className="text-gray-500 text-xs mt-0.5">Work/break cycles for sustained focus</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPomodoroEnabled(!pomodoroEnabled)}
                                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${pomodoroEnabled ? 'bg-amber-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${pomodoroEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        {pomodoroEnabled && (
                            <div className="animate-fade-in grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div className="space-y-2">
                                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Break Length</label>
                                    <div className="flex gap-2">
                                        {BREAK_DURATIONS.map(bd => (
                                            <button
                                                key={bd}
                                                onClick={() => setBreakDuration(bd)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${breakDuration === bd
                                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                                    : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                {bd}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rounds</label>
                                    <div className="flex gap-2">
                                        {[2, 3, 4].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setTotalRounds(r)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${totalRounds === r
                                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                                    : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                {r}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Start Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleStartSequence}
                            disabled={!label || !goal}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                        >
                            {pomodoroEnabled ? `START ${totalRounds}x POMODORO` : 'START LOCKED IN'}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                        {(!label || !goal) && <p className="text-center text-amber-500/80 text-sm mt-3 font-medium">Please enter a topic and goal to start.</p>}
                    </div>
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="animate-fade-in space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-white text-lg font-bold">Recent Sessions</h4>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white text-sm font-medium transition-colors">
                    ← Back
                </button>
            </div>

            {historyLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent" />
                </div>
            ) : sessionHistory.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-white/10 bg-white/5">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No sessions yet</p>
                    <p className="text-gray-600 text-sm mt-1">Start your first lock-in session!</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {sessionHistory.map((s) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${s.quit_early ? 'bg-red-500/15 border border-red-500/20' : 'bg-emerald-500/15 border border-emerald-500/20'}`}>
                                {s.quit_early ? '💀' : getGoalStatusIcon(s.completed_goal)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-sm truncate">{s.label || 'Solo Session'}</span>
                                    {s.quit_early && <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Quit</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-gray-500 text-xs font-medium">{s.duration_minutes}m</span>
                                    {s.goal && <span className="text-gray-600 text-xs truncate">• {s.goal}</span>}
                                </div>
                            </div>
                            <span className="text-gray-600 text-xs font-medium shrink-0">{timeAgo(s.completed_at)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCountdown = () => (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-primary/95 backdrop-blur-xl animate-fade-in rounded-3xl">
            <div className="text-center">
                <div className="text-9xl font-black text-white animate-pulse-glow drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
                    {countdown}
                </div>
                <p className="text-2xl font-bold text-brand-accent mt-4 tracking-widest uppercase">
                    {pomodoroEnabled && pomodoroRound > 1 ? `Round ${pomodoroRound} — Get Ready` : 'Get Ready'}
                </p>
            </div>
        </div>
    );

    const renderBreak = () => (
        <div className="animate-fade-in flex flex-col items-center justify-center w-full relative z-10 py-8">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Break Time ☕</h2>
            <p className="text-gray-400 mb-2">Round {pomodoroRound} of {totalRounds} complete</p>
            <p className="text-amber-400 font-bold mb-8 text-sm">Relax, stretch, hydrate — you've earned it</p>

            <div className="text-6xl md:text-7xl font-light tracking-tighter tabular-nums text-amber-400 font-mono mb-8">
                {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPaused
                        ? 'bg-amber-500 text-brand-primary shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                        : 'bg-white/10 text-white border border-white/20'}`}
                >
                    {isPaused ? <Play className="w-6 h-6 fill-current ml-0.5" /> : <Pause className="w-6 h-6 fill-current" />}
                </button>
                <button
                    onClick={skipBreak}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold transition-all"
                >
                    <ArrowRight className="w-5 h-5" />
                    Skip Break
                </button>
            </div>
        </div>
    );

    const renderActive = () => {
        const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
        return (
            <div className="animate-fade-in flex flex-col items-center justify-center w-full relative z-10 py-4">
                {/* Minimal Zen Info */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="px-4 py-1.5 rounded-full bg-brand-accent/20 text-brand-accent font-bold text-sm tracking-widest uppercase border border-brand-accent/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                            Locked In
                        </span>
                        {pomodoroEnabled && (
                            <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs tracking-wider uppercase border border-amber-500/30">
                                Round {pomodoroRound}/{totalRounds}
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-white mt-4 mb-1">{label}</h2>
                    <div className="flex items-center justify-center gap-2 text-gray-400 font-medium">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span>Goal: {goal}</span>
                    </div>
                </div>

                {/* Giant Timer */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-10 group">
                    <div className={`absolute inset-0 bg-brand-accent/10 rounded-full blur-3xl transition-opacity duration-1000 ${isPaused ? 'opacity-30' : 'opacity-80 animate-pulse-glow'}`}></div>

                    <svg className="w-full h-full absolute -rotate-90 transform drop-shadow-2xl" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
                        <circle
                            cx="50" cy="50" r="46"
                            fill="none"
                            stroke={isPaused ? "#f59e0b" : "#3b82f6"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="289"
                            strokeDashoffset={289 - (289 * progress) / 100}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="flex flex-col items-center justify-center font-mono z-10 w-full">
                        <span className={`text-6xl md:text-7xl font-light tracking-tighter tabular-nums transition-colors ${isPaused ? 'text-amber-400' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                {showQuitConfirm ? (
                    <div className="flex flex-col items-center gap-4 bg-red-500/10 p-5 rounded-3xl border border-red-500/30 animate-fade-in-up md:w-auto w-[90%]">
                        <p className="text-white font-bold text-center">Are you sure? This logs as a failed session!</p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={handleQuitEarly} className="px-6 py-3 bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white font-bold rounded-xl transition-all w-full sm:w-auto">
                                Yes, I&apos;m a loser
                            </button>
                            <button onClick={() => setShowQuitConfirm(false)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20 w-full sm:w-auto">
                                Nevermind, stay locked in
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isPaused
                                ? 'bg-amber-500 hover:bg-amber-400 text-brand-primary shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-110'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:scale-105'
                                }`}
                        >
                            {isPaused ? <Play className="w-7 h-7 fill-current ml-1" /> : <Pause className="w-7 h-7 fill-current" />}
                        </button>

                        <button
                            onClick={() => setShowQuitConfirm(true)}
                            className="flex items-center gap-2 px-6 py-4 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            <XCircle className="w-5 h-5" />
                            Are you a loser? Quit early
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const renderCompletion = () => (
        <div className="animate-fade-in-up w-full max-w-xl mx-auto text-center py-6 relative z-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>

            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                {pomodoroEnabled ? `${totalRounds} Rounds Complete! 🎉` : 'Session Complete! 🎉'}
            </h2>
            <p className="text-gray-400 text-lg mb-10">Amazing work. Let&apos;s reflect on how it went.</p>

            <div className="space-y-8 text-left glass-panel p-6 md:p-8 !bg-black/20">
                {/* Goal Check */}
                <div className="space-y-4">
                    <label className="text-white font-bold text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-brand-accent" />
                        Did you complete your goal: &quot;{goal}&quot;?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[{ v: 'yes', l: 'Yes ✅', c: 'hover:bg-emerald-500/20 hover:border-emerald-500/50', a: 'bg-emerald-500/30 border-emerald-500/80 text-emerald-300' },
                        { v: 'partial', l: 'Partially ⚠️', c: 'hover:bg-amber-500/20 hover:border-amber-500/50', a: 'bg-amber-500/30 border-amber-500/80 text-amber-300' },
                        { v: 'no', l: 'No ❌', c: 'hover:bg-red-500/20 hover:border-red-500/50', a: 'bg-red-500/30 border-red-500/80 text-red-300' }
                        ].map(opt => (
                            <button
                                key={opt.v}
                                onClick={() => setCompletedGoal(opt.v as any)}
                                className={`py-3 px-2 rounded-xl border border-white/10 text-sm font-bold transition-all text-center ${completedGoal === opt.v ? opt.a : `text-gray-400 bg-white/5 ${opt.c}`}`}
                            >
                                {opt.l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Distraction Check */}
                <div className="space-y-4">
                    <label className="text-white font-bold text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        What distracted you the most?
                    </label>
                    <select
                        value={distraction}
                        onChange={(e) => setDistraction(e.target.value)}
                        className="w-full glass-panel !border-white/10 !bg-black/40 focus:!bg-black/60 py-4 px-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-white font-medium cursor-pointer appearance-none"
                    >
                        <option value="" disabled className="text-gray-500">Select an option...</option>
                        {DISTRACTION_REASONS.map(r => (
                            <option key={r} value={r} className="bg-brand-primary text-white">{r}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={submitCompletion}
                    disabled={!completedGoal || !distraction || isSaving}
                    className="w-full py-4 mt-4 bg-white text-brand-primary hover:bg-gray-100 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SAVE REFLECTION'}
                </button>
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="animate-fade-in-up w-full max-w-xl mx-auto text-center py-6 relative z-10">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Focus Score Updated</h2>
            <p className="text-emerald-400 font-bold mb-10 flex items-center justify-center gap-2">
                <Flame className="w-5 h-5" /> Streak Secured
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Focus Score</div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{profile?.focus_score || 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Total Mins</div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{profile?.total_focus_time_minutes || 0}</div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={resetAll}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all active:scale-95"
                >
                    START ANOTHER SESSION
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all active:scale-95"
                >
                    RETURN TO DASHBOARD
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative overflow-hidden min-h-[400px] flex items-center justify-center">
            {/* Dynamic Backgrounds based on state */}
            {timerState === 'ACTIVE' && (
                <div className={`absolute inset-0 bg-gradient-to-b from-brand-accent/5 to-transparent transition-opacity duration-1000 ${isPaused ? 'opacity-20' : 'opacity-100'}`} />
            )}
            {timerState === 'BREAK' && (
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
            )}

            {timerState === 'SETUP' && renderSetup()}
            {timerState === 'COUNTDOWN' && renderCountdown()}
            {timerState === 'ACTIVE' && renderActive()}
            {timerState === 'BREAK' && renderBreak()}
            {timerState === 'COMPLETION' && renderCompletion()}
            {timerState === 'STATS' && renderStats()}

        </div>
    );
}

// Fallback loader
function Loader2({ className }: { className?: string }) {
    return <Clock className={`${className} animate-spin`} />;
}
