'use client';

import { useEffect, useRef, useState } from 'react';
import { useSoloTimer } from '@/lib/SoloTimerContext';
import { PictureInPicture2 } from 'lucide-react';

export function PiPTimer() {
    const { isTimerVisible, timeLeft, isPaused, label, timerState } = useSoloTimer();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPiPActive, setIsPiPActive] = useState(false);
    const [isSupported, setIsSupported] = useState(true); // Assume true until mount
    const timerRef = useRef<number>(0);

    // Check support on mount
    useEffect(() => {
        if (!document.pictureInPictureEnabled) {
            setIsSupported(false);
        }
    }, []);

    // Function to draw the timer onto the hidden canvas
    const drawTimerToCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a'; // Dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate time
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        const timeString = `${mins}:${secs}`;

        // Draw State text (FOCUS/BREAK)
        ctx.fillStyle = timerState === 'BREAK' ? '#60a5fa' : '#34d399'; // blue for break, green for focus
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timerState, canvas.width / 2, 60);

        // Draw Label text
        ctx.fillStyle = '#a3a3a3'; // gray
        ctx.font = '16px system-ui, sans-serif';
        ctx.fillText(label || 'Locked In', canvas.width / 2, 90);

        // Draw BIG Time text
        ctx.fillStyle = isPaused ? '#fbbf24' : '#ffffff'; // amber if paused
        ctx.font = 'bold 120px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeString, canvas.width / 2, 220);

        // If paused, draw a paused indicator
        if (isPaused) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'italic 20px system-ui';
            ctx.fillText('PAUSED', canvas.width / 2, 270);
        }

        // Loop the drawing if PiP is active so it stays updated
        if (isPiPActive) {
            timerRef.current = requestAnimationFrame(drawTimerToCanvas);
        }
    };

    // Update the canvas whenever dependencies change, but also loop it when PiP is active
    useEffect(() => {
        // Stop any existing loop
        if (timerRef.current) cancelAnimationFrame(timerRef.current);

        // Draw immediately
        drawTimerToCanvas();

    }, [timeLeft, isPaused, label, timerState, isPiPActive]);

    const togglePiP = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !isSupported) return;

        try {
            if (document.pictureInPictureElement) {
                // If already in PiP, exit
                await document.exitPictureInPicture();
                setIsPiPActive(false);
            } else {
                // To enter PiP, the video MUST be playing a stream.
                // Capture the canvas stream at 30fps
                // Typecast to any because some standard TS lib DOMs missing captureStream
                const stream = (canvas as any).captureStream(30);
                video.srcObject = stream;
                
                // Wait for video to be ready
                await video.play();
                
                // Enter PiP
                await video.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (error) {
            console.error("Failed to toggle PiP:", error);
            // Some browsers (like mobile Safari) aggressively block Canvas PiP.
            // We can gracefully ignore the failure or show a toast.
        }
    };

    // Clean up PiP active state if user closes the PiP window natively
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLeavePiP = () => setIsPiPActive(false);
        video.addEventListener('leavepictureinpicture', handleLeavePiP);
        
        return () => video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    }, []);


    // Only render the button if we are in a session and PiP is supported
    if (!isTimerVisible || !isSupported) return null;

    return (
        <div className="relative">
            {/* 1. Hidden Canvas we draw onto */}
            <canvas 
                ref={canvasRef} 
                width={400} 
                height={300} 
                className="hidden" 
            />
            
            {/* 2. Hidden Video element that streams the canvas */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="hidden" 
            />

            {/* 3. The Button to trigger it */}
            <button
                onClick={togglePiP}
                className={`p-2 rounded-lg transition-colors border group ${isPiPActive ? 'bg-brand-accent/20 border-brand-accent/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'}`}
                title="Pop-out Timer (Picture-in-Picture)"
            >
                <PictureInPicture2 className={`w-4 h-4 ${isPiPActive ? 'animate-pulse' : ''}`} />
            </button>
        </div>
    );
}
