import { usePathname } from 'next/navigation';
import { useSoloTimer } from '@/lib/SoloTimerContext';
import { PiPTimer } from './PiPTimer';

export function FloatingTimer() {
    const pathname = usePathname();
    const {
        isTimerVisible,
        timeLeft,
        isPaused,
        timerState
    } = useSoloTimer();

    // Hide if not active or if we're on the main solo timer page
    if (!isTimerVisible || pathname === '/solo') return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="fixed top-20 right-4 md:top-10 md:right-10 z-[100] animate-fade-in-down group flex items-center justify-center gap-3">
            
            {/* PiP Button - Only visible on hover, placed on the left so it doesn't go off-screen */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:-mr-1">
                <PiPTimer />
            </div>

            {/* The Tiny Timer - Just Text */}
            <a href="/solo" className="flex flex-col items-center cursor-pointer">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${isPaused ? 'text-amber-500/70' : 'text-white/30 group-hover:text-white/50 transition-colors'}`}>
                    {timerState === 'BREAK' ? 'BREAK' : 'FOCUS'}
                </span>
                <div className={`text-2xl md:text-3xl font-black font-mono tracking-tight leading-none drop-shadow-xl transition-all duration-300 ${isPaused ? 'text-amber-400 opacity-80 hover:opacity-100' : 'text-white/70 hover:text-white hover:scale-105'}`}>
                    {timerState === 'COMPLETION' || timerState === 'STATS' ? 'DONE' : formatTime(timeLeft)}
                </div>
            </a>
            
        </div>
    );
}
