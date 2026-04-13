'use client';

import { useEffect } from 'react';

export default function Maintenance() {
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                    Site under maintenance
                </h1>
                <p className="text-[rgba(255,255,255,0.5)] mb-8 text-sm leading-relaxed">
                    We are currently doing some upgrades to make your experience better. Hold on tight, we will be back shortly!
                </p>
            </div>
        </div>
    );
}
