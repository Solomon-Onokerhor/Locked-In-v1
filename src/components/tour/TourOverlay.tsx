'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTour } from './TourProvider';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function TourOverlay() {
    const { isTourActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, endTour } = useTour();
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const retryRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const updateRect = useCallback(() => {
        if (!currentStep) return;
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        }
    }, [currentStep]);

    useEffect(() => {
        if (!isTourActive || !currentStep) {
            setIsVisible(false);
            setTargetRect(null);
            return;
        }

        const findTarget = (attempts = 0) => {
            const el = document.querySelector(currentStep.targetSelector);
            if (el) {
                // Scroll element into view
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Wait for scroll to settle, then measure
                setTimeout(() => {
                    const rect = el.getBoundingClientRect();
                    setTargetRect({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });
                    setIsVisible(true);
                }, 400);
            } else if (attempts < 10) {
                retryRef.current = setTimeout(() => findTarget(attempts + 1), 150);
            } else {
                // Fallback: no target found, show centered tooltip
                setTargetRect(null);
                setIsVisible(true);
            }
        };

        setIsVisible(false);
        setTargetRect(null);
        findTarget();

        return () => {
            if (retryRef.current) clearTimeout(retryRef.current);
        };
    }, [isTourActive, currentStep, currentStepIndex]);

    // Recalculate on scroll/resize
    useEffect(() => {
        if (!isTourActive || !currentStep) return;

        const handler = () => updateRect();
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [isTourActive, currentStep, updateRect]);

    if (!isTourActive || !currentStep || !isVisible) return null;

    const isLastStep = currentStepIndex === totalSteps - 1;
    const isFirstStep = currentStepIndex === 0;
    const padding = 10;

    // Calculate tooltip position — prefer below, flip to above if not enough space
    const tooltipWidth = 340;
    const tooltipHeight = 280; // approximate
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 500;

    let tooltipTop = 0;
    let tooltipLeft = 0;
    let showBelow = true;

    if (targetRect) {
        const spaceBelow = viewportH - (targetRect.top + targetRect.height + padding);
        const spaceAbove = targetRect.top - padding;

        if (spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove) {
            tooltipTop = targetRect.top + targetRect.height + padding + 8;
            showBelow = true;
        } else {
            tooltipTop = targetRect.top - padding - tooltipHeight;
            showBelow = false;
        }

        // Horizontal center on target, clamped to viewport
        tooltipLeft = Math.max(12, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            viewportW - tooltipWidth - 12
        ));
    }

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Dark overlay with spotlight cutout — using viewport coordinates */}
            <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - padding}
                                y={targetRect.top - padding}
                                width={targetRect.width + padding * 2}
                                height={targetRect.height + padding * 2}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0" y="0" width="100%" height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#tour-spotlight-mask)"
                    onClick={(e) => { e.stopPropagation(); }}
                />
            </svg>

            {/* Spotlight ring glow */}
            {targetRect && (
                <div
                    className="fixed border-2 border-white/20 rounded-xl pointer-events-none"
                    style={{
                        top: targetRect.top - padding,
                        left: targetRect.left - padding,
                        width: targetRect.width + padding * 2,
                        height: targetRect.height + padding * 2,
                        boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1), 0 0 25px rgba(255, 255, 255, 0.1)',
                        animation: 'pulse 2s infinite',
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                ref={tooltipRef}
                className="fixed z-[10000]"
                style={{
                    pointerEvents: 'auto',
                    ...(targetRect
                        ? {
                            top: tooltipTop,
                            left: tooltipLeft,
                            width: tooltipWidth,
                        }
                        : {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: tooltipWidth,
                        }),
                }}
            >
                <div
                    className="border border-white/10 rounded-2xl p-5 shadow-[0_15px_50px_rgba(0,0,0,0.6)]"
                    style={{ background: 'linear-gradient(135deg, #13142a 0%, #0d0e1a 100%)' }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-gray-300" />
                            <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">
                                Step {currentStepIndex + 1} of {totalSteps}
                            </span>
                        </div>
                        <button
                            onClick={endTour}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <h3 className="text-base font-bold text-white mb-1.5">{currentStep.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{currentStep.description}</p>

                    {/* Progress dots */}
                    <div className="flex gap-1 mb-4">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i <= currentStepIndex
                                    ? 'bg-white/10 w-5'
                                    : 'bg-white/10 w-2.5'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                        {!isFirstStep && (
                            <button
                                onClick={prevStep}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                        )}
                        {isFirstStep && (
                            <button
                                onClick={endTour}
                                className="px-3 py-2 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                            >
                                Skip
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className={`flex-1 py-2.5 px-4 font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${isLastStep
                                ? 'bg-white hover:bg-gray-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                : 'bg-white/10 hover:bg-white/10 text-white shadow-[0_0_12px_rgba(255, 255, 255, 0.1)]'
                                }`}
                        >
                            {isLastStep ? "Let's Go! 🔥" : 'Next'}
                            {!isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
