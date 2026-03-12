'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Locked In] Route error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: '#050505' }}>
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />

            <div className="relative z-10 text-center max-w-md w-full animate-fade-in">
                {/* Icon */}
                <div className="mx-auto mb-8 w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                    Something went wrong
                </h1>
                <p className="text-[rgba(255,255,255,0.5)] mb-2 text-sm leading-relaxed">
                    An unexpected error occurred while loading this page. This has been logged automatically.
                </p>
                {error?.digest && (
                    <p className="text-[rgba(255,255,255,0.25)] text-xs mb-8 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
                {!error?.digest && <div className="mb-8" />}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
                        style={{
                            background: 'white',
                            color: '#050505',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#cccccc';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Try again
                    </button>
                    <a
                        href="/"
                        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        Go home
                    </a>
                </div>
            </div>
        </div>
    );
}
