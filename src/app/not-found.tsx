import Link from 'next/link';

export const metadata = {
    title: '404 — Page Not Found | Locked In',
    description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />

            <div className="relative z-10 text-center max-w-md w-full animate-fade-in">
                {/* 404 Text */}
                <div className="mb-6">
                    <span className="text-8xl font-bold tracking-tighter"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                        404
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    Page not found
                </h1>
                <p className="text-[rgba(255,255,255,0.5)] mb-10 text-sm leading-relaxed max-w-xs mx-auto">
                    This page doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                            background: 'white',
                            color: '#050505',
                        }}
                    >
                        Back to home
                    </Link>
                    <Link
                        href="/resources"
                        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        Browse resources
                    </Link>
                </div>
            </div>
        </div>
    );
}
