'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Locked In] Global error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{
                margin: 0,
                background: '#050505',
                color: '#F6FAFD',
                fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
                WebkitFontSmoothing: 'antialiased',
            }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Ambient glow */}
                    <div style={{
                        position: 'absolute',
                        top: '33%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        opacity: 0.07,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        textAlign: 'center',
                        maxWidth: '28rem',
                        width: '100%',
                    }}>
                        {/* Icon */}
                        <div style={{
                            margin: '0 auto 2rem',
                            width: '5rem',
                            height: '5rem',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>

                        <h1 style={{
                            fontSize: '1.875rem',
                            fontWeight: 700,
                            color: 'white',
                            marginBottom: '0.75rem',
                            letterSpacing: '-0.025em',
                        }}>
                            Critical Error
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            lineHeight: 1.7,
                        }}>
                            Something seriously broke. Don&apos;t worry — this has been logged and we&apos;re on it.
                        </p>
                        {error?.digest && (
                            <p style={{
                                color: 'rgba(255,255,255,0.25)',
                                fontSize: '0.75rem',
                                marginBottom: '2rem',
                                fontFamily: 'monospace',
                            }}>
                                Error ID: {error.digest}
                            </p>
                        )}
                        {!error?.digest && <div style={{ marginBottom: '2rem' }} />}

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            alignItems: 'center',
                        }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    background: 'white',
                                    color: '#050505',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                }}
                            >
                                Try again
                            </button>
                            <a
                                href="/"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    width: 'fit-content',
                                }}
                            >
                                Go home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
