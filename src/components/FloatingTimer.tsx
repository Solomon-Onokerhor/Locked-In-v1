'use client';

import { useTimer } from '@/components/TimerContext';
import { usePathname, useRouter } from 'next/navigation';
import { Play, Pause, ArrowLeft, Coffee } from 'lucide-react';

export function FloatingTimer() {
    const {
        timerState, timeLeft, isPaused, duration,
        label, pomodoroEnabled, pomodoroRound, totalRounds,
        setIsPaused, formatTime, isTimerRunning
    } = useTimer();
    const pathname = usePathname();
    const router = useRouter();

    // Only show when timer is running and NOT on the dashboard
    if (!isTimerRunning || pathname === '/') return null;

    const isBreak = timerState === 'BREAK';
    const totalSeconds = isBreak ? 5 * 60 : duration * 60; // approximate for progress
    const progress = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));
    const circumference = 2 * Math.PI * 20; // radius = 20 for mini circle
    const strokeDashoffset = circumference - (circumference * progress) / 100;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
                isBreak
                    ? 'bg-amber-950/80 border-amber-500/30 shadow-amber-500/20'
                    : 'bg-black/80 border-white/15 shadow-blue-500/10'
            }`}>
                {/* Mini circular progress */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="20" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                        <circle
                            cx="22" cy="22" r="20"
                            fill="none"
                            stroke={isBreak ? '#f59e0b' : '#3b82f6'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isBreak ? (
                            <Coffee className="w-4 h-4 text-amber-400" />
                        ) : (
                            <span className={`text-[10px] font-black tabular-nums ${isPaused ? 'text-amber-400' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-sm truncate max-w-[120px]">
                        {isBreak ? 'Break Time' : label || 'Solo Session'}
                    </span>
                    <span className={`text-xs font-medium ${isBreak ? 'text-amber-400' : 'text-gray-400'}`}>
                        {isBreak ? formatTime(timeLeft) : (
                            pomodoroEnabled
                                ? `Round ${pomodoroRound}/${totalRounds}`
                                : formatTime(timeLeft)
                        )}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 ml-1">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isPaused
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        {isPaused
                            ? <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            : <Pause className="w-3.5 h-3.5 fill-current" />
                        }
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all"
                        title="Back to Timer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
