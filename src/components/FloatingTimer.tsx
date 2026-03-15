'use client';

import { useState } from 'react';
import { useSoloTimer } from '@/lib/SoloTimerContext';
import { Play, Pause, Square, Flame, Target } from 'lucide-react';
import Link from 'next/navigation';
import { PiPTimer } from './PiPTimer';

export function FloatingTimer() {
    const {
        isTimerVisible,
        timeLeft,
        isPaused,
        setIsPaused,
        label,
        timerState,
        handleQuitEarly
    } = useSoloTimer();

    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    if (!isTimerVisible) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-[100] animate-fade-in-up">
            <div className="glass-panel !bg-black/80 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-72 flex flex-col gap-3 group">
                
                {/* Header = Link back to dashboard */}
                <a href="/" className="block hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 max-w-[70%]">
                            <Flame className={`w-4 h-4 ${isPaused ? 'text-amber-500' : 'text-brand-accent animate-pulse'}`} />
                            <span className="text-white font-bold text-sm truncate">{label || 'Locked In'}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent/70 bg-brand-accent/10 px-2 py-0.5 rounded">
                            {timerState === 'BREAK' ? 'BREAK' : 'FOCUS'}
                        </span>
                    </div>
                </a>

                {/* Big Timer */}
                <div className="flex items-center justify-between mt-1">
                    <div className={`text-4xl font-light tracking-tighter tabular-nums font-mono ${isPaused ? 'text-amber-400' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex gap-2 items-center">
                        <PiPTimer />
                        
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused
                                ? 'bg-amber-500 text-black hover:bg-amber-400 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                }`}
                        >
                            {isPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
                        </button>
                    </div>
                </div>

                {/* Quit intent inside group hover to keep it clean until hovered */}
                {showQuitConfirm ? (
                    <div className="mt-2 bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex flex-col gap-2 animate-fade-in-up">
                        <p className="text-white text-xs text-center font-bold">Quit early? This logs as a failure!</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowQuitConfirm(false); handleQuitEarly(); }}
                                className="flex-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 py-1.5 rounded-lg transition-colors shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            >
                                Yes, Quit
                            </button>
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className="flex-1 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 py-1.5 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-0 opacity-0 group-hover:h-8 group-hover:opacity-100 group-hover:mt-2 overflow-hidden transition-all duration-300">
                         <button
                            onClick={() => setShowQuitConfirm(true)}
                            className="w-full text-xs font-bold text-red-400/80 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg transition-colors border border-red-500/20"
                        >
                            Quit Session Early
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
