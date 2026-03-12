'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface TourStep {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

// All steps now stay on the dashboard — no cross-page navigation
export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        targetSelector: '[data-tour="welcome"]',
        title: 'Welcome to Your Dashboard! 🏠',
        description: 'This is your home base. See all active study & skill rooms, and jump into any session.',
        position: 'bottom',
    },
    {
        id: 'solo-timer',
        targetSelector: '[data-tour="solo-timer"]',
        title: 'Solo Lock-In Timer ⏱️',
        description: 'Start a personal focus timer right here. Track your solo study sessions and build streaks.',
        position: 'bottom',
    },
    {
        id: 'room-tabs',
        targetSelector: '[data-tour="room-tabs"]',
        title: 'Browse & Filter Rooms 📚',
        description: 'Filter between Study rooms, Skill sessions, your rooms, and upcoming sessions.',
        position: 'top',
    },
    {
        id: 'host-room',
        targetSelector: '[data-tour="host-room"]',
        title: 'Create Your Own Room 🔒',
        description: 'Host a study or skill-sharing session and invite others to join. Tap the + button to get started!',
        position: 'top',
    },
    {
        id: 'nav-leaderboard',
        targetSelector: '[data-tour="nav-leaderboard"]',
        title: 'Campus Leaderboard 🏆',
        description: 'Compete with other students! Earn points for every minute you study. Can you reach the top?',
        position: 'top',
    },
    {
        id: 'nav-buddies',
        targetSelector: '[data-tour="nav-buddies"]',
        title: 'Study Buddies 👥',
        description: 'Find and connect with study partners. See when your buddies are locked in and join their rooms.',
        position: 'top',
    },
    {
        id: 'nav-resources',
        targetSelector: '[data-tour="nav-resources"]',
        title: 'Free Resources 📑',
        description: 'Access past questions, lecture slides, and study materials shared by the community.',
        position: 'top',
    },
];

interface TourContextType {
    isTourActive: boolean;
    currentStepIndex: number;
    currentStep: TourStep | null;
    totalSteps: number;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    endTour: () => void;
}

const TourContext = createContext<TourContextType>({
    isTourActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: TOUR_STEPS.length,
    startTour: () => { },
    nextStep: () => { },
    prevStep: () => { },
    endTour: () => { },
});

export const useTour = () => useContext(TourContext);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Activate tour when ?tour=1 is in the URL
    useEffect(() => {
        if (searchParams.get('tour') === '1' && !isTourActive) {
            setIsTourActive(true);
            setCurrentStepIndex(0);
            // Clean the URL
            window.history.replaceState({}, '', pathname);
        }
    }, [searchParams, pathname, isTourActive]);

    const currentStep = isTourActive ? TOUR_STEPS[currentStepIndex] : null;

    const startTour = useCallback(() => {
        setCurrentStepIndex(0);
        setIsTourActive(true);
        // Navigate to dashboard if not already there
        if (pathname !== '/') {
            router.push('/?tour=1');
        }
    }, [router, pathname]);

    const nextStep = useCallback(() => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex >= TOUR_STEPS.length) {
            setIsTourActive(false);
            return;
        }
        setCurrentStepIndex(nextIndex);
    }, [currentStepIndex]);

    const prevStep = useCallback(() => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex < 0) return;
        setCurrentStepIndex(prevIndex);
    }, [currentStepIndex]);

    const endTour = useCallback(() => {
        setIsTourActive(false);
        setCurrentStepIndex(0);
    }, []);

    return (
        <TourContext.Provider value={{
            isTourActive,
            currentStepIndex,
            currentStep,
            totalSteps: TOUR_STEPS.length,
            startTour,
            nextStep,
            prevStep,
            endTour,
        }}>
            {children}
        </TourContext.Provider>
    );
}
