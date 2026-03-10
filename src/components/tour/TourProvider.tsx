'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface TourStep {
    id: string;
    route: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        route: '/',
        targetSelector: '[data-tour="welcome"]',
        title: 'Welcome to Your Dashboard! 🏠',
        description: 'This is your home base. You can see all active study & skill rooms here, and jump into any session.',
        position: 'bottom',
    },
    {
        id: 'solo-timer',
        route: '/',
        targetSelector: '[data-tour="solo-timer"]',
        title: 'Solo Lock-In Timer ⏱️',
        description: 'Don\'t need a room? Start a personal focus timer right here and track your solo study sessions.',
        position: 'bottom',
    },
    {
        id: 'room-tabs',
        route: '/',
        targetSelector: '[data-tour="room-tabs"]',
        title: 'Browse & Filter Rooms 📚',
        description: 'Filter between Study rooms, Skill sessions, your own rooms, and upcoming sessions. Search by title or course code.',
        position: 'bottom',
    },
    {
        id: 'join-room',
        route: '/',
        targetSelector: '[data-tour="join-room"]',
        title: 'Joining a Session 🎯',
        description: 'Click on any room card here to view its details. From there, just hit the Lock In button to join the session!',
        position: 'bottom',
    },
    {
        id: 'leaderboard',
        route: '/leaderboard',
        targetSelector: '[data-tour="leaderboard"]',
        title: 'Campus Leaderboard 🏆',
        description: 'Compete with other students and faculties! Earn points for every minute you study. Can you reach the top?',
        position: 'bottom',
    },
    {
        id: 'buddies',
        route: '/buddies',
        targetSelector: '[data-tour="buddies"]',
        title: 'Study Buddies 👥',
        description: 'Find and connect with study partners. See when your buddies are locked in and join their rooms.',
        position: 'bottom',
    },
    {
        id: 'resources',
        route: '/resources',
        targetSelector: '[data-tour="resources"]',
        title: 'Free Resources 📑',
        description: 'Access past questions, lecture slides, and study materials. Upload your own to help fellow students.',
        position: 'bottom',
    },
    {
        id: 'host-room',
        route: '/',
        targetSelector: '[data-tour="host-room"]',
        title: 'Ready to Lock In? 🔒',
        description: 'Create your own study or skill-sharing room and invite others to join. You\'re all set — let\'s go!',
        position: 'bottom',
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
        router.push(TOUR_STEPS[0].route);
    }, [router]);

    const nextStep = useCallback(() => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex >= TOUR_STEPS.length) {
            setIsTourActive(false);
            return;
        }
        setCurrentStepIndex(nextIndex);
        const nextStepData = TOUR_STEPS[nextIndex];
        if (nextStepData.route !== pathname) {
            router.push(nextStepData.route);
        }
    }, [currentStepIndex, pathname, router]);

    const prevStep = useCallback(() => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex < 0) return;
        setCurrentStepIndex(prevIndex);
        const prevStepData = TOUR_STEPS[prevIndex];
        if (prevStepData.route !== pathname) {
            router.push(prevStepData.route);
        }
    }, [currentStepIndex, pathname, router]);

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
