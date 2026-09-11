"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PracticeSessionResult } from "@/types/practice";

interface PracticeStats {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  latestSession: PracticeSessionResult | null;
  totalDurationSeconds: number;
  totalReps: number;
}

interface ProgressContextType {
  completedLessons: Record<string, number[]>;
  toggleLesson: (slug: string, lessonIndex: number) => void;
  isCompleted: (slug: string, lessonIndex: number) => boolean;
  getProgress: (slug: string, totalLessons: number) => number;
  practiceSessions: PracticeSessionResult[];
  savePracticeSession: (session: PracticeSessionResult) => void;
  getPracticeStats: () => PracticeStats;
  getDancePracticeSessions: (slug: string) => PracticeSessionResult[];
}

const ProgressContext = createContext<ProgressContextType | null>(null);

const STORAGE_KEY = "rhythmofindia_progress";
const PRACTICE_STORAGE_KEY = "rhythmofindia_practice_sessions";

function loadProgress(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, number[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadPracticeSessions(): PracticeSessionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePracticeSessions(sessions: PracticeSessionResult[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(sessions));
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<
    Record<string, number[]>
  >({});
  const [practiceSessions, setPracticeSessions] = useState<
    PracticeSessionResult[]
  >([]);

  useEffect(() => {
    setCompletedLessons(loadProgress());
    setPracticeSessions(loadPracticeSessions());
  }, []);

  const toggleLesson = useCallback(
    (slug: string, lessonIndex: number) => {
      setCompletedLessons((prev) => {
        const current = prev[slug] || [];
        const updated = current.includes(lessonIndex)
          ? current.filter((i) => i !== lessonIndex)
          : [...current, lessonIndex];
        const next = { ...prev, [slug]: updated };
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const isCompleted = useCallback(
    (slug: string, lessonIndex: number) => {
      return (completedLessons[slug] || []).includes(lessonIndex);
    },
    [completedLessons]
  );

  const getProgress = useCallback(
    (slug: string, totalLessons: number) => {
      if (totalLessons === 0) return 0;
      const count = (completedLessons[slug] || []).length;
      return Math.round((count / totalLessons) * 100);
    },
    [completedLessons]
  );

  const savePracticeSession = useCallback((session: PracticeSessionResult) => {
    setPracticeSessions((prev) => {
      const updated = [session, ...prev];
      savePracticeSessions(updated);
      return updated;
    });

    // Also automatically mark lesson as completed if overallScore >= 70
    if (session.overallScore >= 70) {
      setCompletedLessons((prev) => {
        const current = prev[session.danceSlug] || [];
        if (!current.includes(session.lessonIndex)) {
          const next = {
            ...prev,
            [session.danceSlug]: [...current, session.lessonIndex],
          };
          saveProgress(next);
          return next;
        }
        return prev;
      });
    }
  }, []);

  const getPracticeStats = useCallback((): PracticeStats => {
    if (practiceSessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        latestSession: null,
        totalDurationSeconds: 0,
        totalReps: 0,
      };
    }

    const totalSessions = practiceSessions.length;
    const sumScore = practiceSessions.reduce(
      (acc, s) => acc + s.overallScore,
      0
    );
    const averageScore = Math.round(sumScore / totalSessions);
    const bestScore = Math.max(...practiceSessions.map((s) => s.overallScore));
    const totalDurationSeconds = practiceSessions.reduce(
      (acc, s) => acc + s.durationSeconds,
      0
    );
    const totalReps = practiceSessions.reduce(
      (acc, s) => acc + (s.repsCompleted || 0),
      0
    );

    return {
      totalSessions,
      averageScore,
      bestScore,
      latestSession: practiceSessions[0],
      totalDurationSeconds,
      totalReps,
    };
  }, [practiceSessions]);

  const getDancePracticeSessions = useCallback(
    (slug: string) => {
      return practiceSessions.filter((s) => s.danceSlug === slug);
    },
    [practiceSessions]
  );

  return (
    <ProgressContext.Provider
      value={{
        completedLessons,
        toggleLesson,
        isCompleted,
        getProgress,
        practiceSessions,
        savePracticeSession,
        getPracticeStats,
        getDancePracticeSessions,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}

