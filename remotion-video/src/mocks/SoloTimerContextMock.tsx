// Mock for @/lib/SoloTimerContext
// Provides a static "ACTIVE" state with 18:34 on the clock
// so SoloTimer renders the running countdown view directly.
import React, { createContext, useContext } from 'react';

const noop = () => {};
const asyncNoop = async () => {};

const mockTimerValue = {
  timerState: 'ACTIVE' as const,
  setTimerState: noop,
  isSaving: false,
  duration: 25,
  setDuration: noop,
  label: 'Data Structures',
  setLabel: noop,
  goal: 'Finish graph algorithms',
  setGoal: noop,
  pomodoroEnabled: false,
  setPomodoroEnabled: noop,
  breakDuration: 5,
  setBreakDuration: noop,
  pomodoroRound: 1,
  setPomodoroRound: noop,
  totalRounds: 4,
  setTotalRounds: noop,
  soundEnabled: false,
  setSoundEnabled: noop,
  timeLeft: 1114, // 18:34
  setTimeLeft: noop,
  countdown: 3,
  setCountdown: noop,
  isPaused: false,
  setIsPaused: noop,
  handleStartSequence: noop,
  handleQuitEarly: asyncNoop,
  submitCompletion: asyncNoop,
  resetAll: noop,
  skipBreak: noop,
  isTimerVisible: false,
};

const SoloTimerContext = createContext(mockTimerValue);

export function SoloTimerProvider({ children }: { children: React.ReactNode }) {
  return <SoloTimerContext.Provider value={mockTimerValue}>{children}</SoloTimerContext.Provider>;
}

export function useSoloTimer() {
  return useContext(SoloTimerContext);
}

export type TimerState = 'SETUP' | 'COUNTDOWN' | 'ACTIVE' | 'BREAK' | 'COMPLETION' | 'STATS';
