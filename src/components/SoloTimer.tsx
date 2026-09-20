'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Play, Pause, Square, Flame, CheckCircle2, Clock, Target, AlertTriangle, ArrowRight, XCircle, History, Coffee, Volume2, VolumeX, RotateCcw, Loader2 as Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SoloSession } from '@/types';
import { useSoloTimer } from '@/lib/SoloTimerContext';
import { PiPTimer } from './PiPTimer';

const DURATIONS = [25, 45, 60];
const BREAK_DURATIONS = [5, 10, 15];
const DISTRACTION_REASONS = ['Social Media', 'Phone / Messages', 'Noise / Environment', 'Daydreaming', 'Other', 'Nothing! I was locked in 🔒'];

export function SoloTimer() {
    const { profile, session } = useAuth();
    const router = useRouter();
    const timer = useSoloTimer();

    // -- Global Timer State --
    const {
        timerState,
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
        setTotalRounds,
        totalRounds,
        soundEnabled,
        setSoundEnabled,
        timeLeft,
        countdown,
        isPaused,
        setIsPaused,
        handleStartSequence,
        handleQuitEarly,
        submitCompletion,
        resetAll,
        skipBreak
    } = useSoloTimer();

    // -- Local Component State (UI only) --
    const [showHistory, setShowHistory] = useState(false);
    const [sessionHistory, setSessionHistory] = useState<SoloSession[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // Setup View specific local state
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customDurationInput, setCustomDurationInput] = useState('');
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Completion View specific local state
    const [completedGoal, setCompletedGoal] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [distraction, setDistraction] = useState('');

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleCustomDurationSubmit = (e: React.KeyboardEvent<HTMLInputElement> | { key: string }) => {
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
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.02)] flex items-center justify-center">
                        <Flame className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">Solo Lock-In</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${soundEnabled ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-[#888888] hover:text-white hover:bg-white/5'}`}
                        title={soundEnabled ? 'Sound on' : 'Sound off'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${showHistory ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-[#888888] hover:text-white hover:bg-white/5'}`}
                        title="Session History"
                    >
                        <History className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showHistory ? renderHistory() : (
                <div className="space-y-8">
                    {/* Inputs */}
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-[#888888] text-[10px] font-bold uppercase tracking-widest block mb-2">Topic / Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Calculus, Web Dev"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 focus:border-white/30 focus:bg-[#0a0a0a] py-3.5 px-4 rounded-xl outline-none transition-all text-white placeholder-white/20 text-sm font-medium shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="text-[#888888] text-[10px] font-bold uppercase tracking-widest block mb-2">Session Goal</label>
                            <input
                                type="text"
                                placeholder="e.g. Finish Chapter 4"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 focus:border-white/30 focus:bg-[#0a0a0a] py-3.5 px-4 rounded-xl outline-none transition-all text-white placeholder-white/20 text-sm font-medium shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Durations */}
                    <div className="flex flex-col items-center md:items-start">
                        <label className="text-[#888888] text-[10px] font-bold uppercase tracking-widest block mb-3">Session Length</label>
                        <div className="flex items-center gap-1 bg-[#050505] p-1.5 rounded-2xl border border-white/10 w-fit">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => { setDuration(d); setIsCustomDuration(false); }}
                                    className={`px-5 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${duration === d && !isCustomDuration
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-[#888888] hover:text-white hover:bg-white/5'
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
                                    onBlur={() => handleCustomDurationSubmit({ key: 'Enter' })}
                                    className="w-20 px-2 py-2.5 rounded-xl bg-white/10 border border-white text-white text-center text-sm font-bold outline-none shadow-md"
                                />
                            ) : (
                                <button
                                    onClick={() => setIsCustomDuration(true)}
                                    className={`px-5 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${!DURATIONS.includes(duration)
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-[#888888] hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {!DURATIONS.includes(duration) ? `${duration}m` : 'Custom'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Pomodoro Mode Toggle */}
                    <div className="bg-[#050505] border border-white/10 p-5 rounded-2xl space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coffee className="w-5 h-5 text-white/50" />
                                <div>
                                    <span className="text-white font-bold text-sm">Pomodoro Mode</span>
                                    <p className="text-[#888888] text-xs mt-0.5">Work/break cycles for sustained focus</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPomodoroEnabled(!pomodoroEnabled)}
                                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${pomodoroEnabled ? 'bg-white' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${pomodoroEnabled ? 'bg-black left-6' : 'bg-[#888888] left-1'}`} />
                            </button>
                        </div>

                        {pomodoroEnabled && (
                            <div className="animate-fade-in grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <label className="text-[#888888] text-[10px] font-bold uppercase tracking-widest block mb-2">Break Length</label>
                                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl">
                                        {BREAK_DURATIONS.map(bd => (
                                            <button
                                                key={bd}
                                                onClick={() => setBreakDuration(bd)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${breakDuration === bd
                                                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                                                    : 'text-[#888888] hover:text-white hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                {bd}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[#888888] text-[10px] font-bold uppercase tracking-widest block mb-2">Rounds</label>
                                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl">
                                        {[2, 3, 4].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setTotalRounds(r)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${totalRounds === r
                                                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                                                    : 'text-[#888888] hover:text-white hover:bg-white/5 border border-transparent'
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
                    <div className="pt-2">
                        <button
                            onClick={() => {
                                if (!session) {
                                    router.push('/sign-in');
                                    return;
                                }
                                handleStartSequence();
                            }}
                            disabled={!label || !goal}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 ${
                                label && goal 
                                ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)]' 
                                : 'bg-white/5 text-[#888888] border border-white/10 cursor-not-allowed'
                            }`}
                        >
                            {pomodoroEnabled ? `START ${totalRounds}x POMODORO` : 'START LOCKED IN'}
                            <ArrowRight className={`w-5 h-5 transition-transform ${label && goal ? 'group-hover:translate-x-1' : ''}`} />
                        </button>
                        {(!label || !goal) && <p className="text-center text-[#888888] text-xs font-medium mt-4">Enter a topic and goal to start.</p>}
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
                            <span className="text-gray-600 text-xs font-medium shrink-0">{timeAgo(s.completed_at || new Date().toISOString())}</span>
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
            <p className="text-gray-400 mb-2">Round {pomodoroRound - 1} of {totalRounds} complete</p>
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
            <div className="animate-fade-in flex flex-col items-center justify-center w-full relative z-10 py-6">
                {/* Minimal Zen Info */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/80 font-bold text-[10px] tracking-[0.2em] uppercase border border-white/10 backdrop-blur-md flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Locked In
                        </span>
                        {pomodoroEnabled && (
                            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400/90 font-bold text-[10px] tracking-[0.2em] uppercase border border-amber-500/20 backdrop-blur-md">
                                Round {pomodoroRound}/{totalRounds}
                            </span>
                        )}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2">{label}</h2>
                    <div className="flex items-center justify-center gap-2 text-white/50 font-medium bg-white/5 px-4 py-1.5 rounded-full border border-white/5 w-max mx-auto">
                        <Target className="w-4 h-4 text-emerald-400/80" />
                        <span className="text-sm">Goal: {goal}</span>
                    </div>
                </div>

                {/* Giant Timer */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12 group">
                    {/* Inner atmospheric glow */}
                    <div className={`absolute inset-0 rounded-full blur-[50px] transition-all duration-1000 ${isPaused ? 'bg-amber-500/10' : 'bg-white/5 animate-pulse-glow'}`}></div>

                    <svg className="w-full h-full absolute -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background Track */}
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                        {/* Progress Track */}
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={isPaused ? "#fbbf24" : "#ffffff"}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="282.7"
                            strokeDashoffset={282.7 - (282.7 * progress) / 100}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="flex flex-col items-center justify-center font-mono z-10 w-full mt-2">
                        <span className={`text-7xl md:text-8xl font-light tracking-tighter tabular-nums transition-colors duration-500 ${isPaused ? 'text-amber-400 drop-shadow-md' : 'text-white drop-shadow-lg'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                {showQuitConfirm ? (
                    <div className="flex flex-col items-center gap-4 bg-red-500/10 p-6 rounded-3xl border border-red-500/30 backdrop-blur-xl shadow-2xl animate-fade-in-up w-full max-w-sm mx-auto">
                        <p className="text-white font-bold text-center">Are you sure? This logs as a failed session!</p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => { setShowQuitConfirm(false); handleQuitEarly(); }} className="flex-1 px-4 py-3.5 bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wider">
                                Yes, I'm a loser
                            </button>
                            <button onClick={() => setShowQuitConfirm(false)} className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 text-sm uppercase tracking-wider">
                                Nevermind
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md ${isPaused
                                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(251,191,36,0.4)] scale-110'
                                : 'bg-white hover:bg-gray-100 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105'
                                }`}
                        >
                            {isPaused ? <Play className="w-8 h-8 fill-current ml-1" /> : <Pause className="w-8 h-8 fill-current" />}
                        </button>

                        {/* Secondary Controls Group */}
                        <div className="flex items-center gap-2 bg-white/5 rounded-full p-2 border border-white/5 backdrop-blur-md">
                            <div className="px-2">
                                <PiPTimer />
                            </div>
                            
                            <div className="w-px h-6 bg-white/10"></div>
                            
                            <button
                                onClick={() => setShowQuitConfirm(true)}
                                className="flex items-center justify-center w-10 h-10 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
                                title="Quit Session Early"
                            >
                                <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
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
                    onClick={() => {
                        if (completedGoal && distraction) submitCompletion(completedGoal, distraction);
                    }}
                    disabled={!completedGoal || !distraction || isSaving}
                    className="w-full py-4 mt-4 bg-white text-brand-primary hover:bg-gray-100 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    {isSaving ? <Loader2Icon className="w-6 h-6 animate-spin" /> : 'SAVE REFLECTION'}
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
                    onClick={() => {
                        setCompletedGoal(null);
                        setDistraction('');
                        resetAll();
                    }}
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
