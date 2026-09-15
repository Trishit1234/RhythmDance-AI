"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firestore";
import { danceStyles } from "@/data/danceData";

export interface CompletedLessons {
  [danceSlug: string]: number[];
}

export interface PracticeSession {
  id: string;
  userId: string;
  danceSlug: string;
  danceName: string;
  lessonIndex: number;
  lessonTitle: string;
  movementId?: string;
  movementName?: string;
  overallScore: number;
  accuracyScore?: number;
  timingScore?: number;
  completionScore?: number;
  repsCompleted: number;
  durationSeconds: number;
  feedbackSummary: string[];
  createdAt: string;
}

export interface PracticeStats {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  totalPracticeMinutes: number;
  totalReps: number;
  totalDurationSeconds: number;
  practiceDays: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticeDate: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

interface ProgressContextType {
  completedLessons: CompletedLessons;
  practiceSessions: PracticeSession[];

  getProgress: (
    danceSlug: string,
    totalLessons: number
  ) => number;

  isLessonCompleted: (
    danceSlug: string,
    lessonIndex: number
  ) => boolean;

  isCompleted: (
    danceSlug: string,
    lessonIndex: number
  ) => boolean;

  markLessonComplete: (
    danceSlug: string,
    lessonIndex: number
  ) => Promise<void>;

  completeLesson: (
    danceSlug: string,
    lessonIndex: number
  ) => Promise<void>;

  toggleLessonComplete: (
    danceSlug: string,
    lessonIndex: number
  ) => Promise<void>;

  toggleLesson: (
    danceSlug: string,
    lessonIndex: number
  ) => Promise<void>;

  resetDanceProgress: (
    danceSlug: string
  ) => Promise<void>;

  resetAllProgress: () => Promise<void>;

  savePracticeSession: (
    session: Omit<PracticeSession, "id" | "createdAt">
  ) => Promise<void>;

  getPracticeStats: () => PracticeStats;

  getPracticeDays: () => number;

  getPracticeStreak: () => number;

  getBestPracticeStreak: () => number;

  getLastPracticeDate: () => string | null;

  getAchievements: () => Achievement[];

  isCourseCompleted: (
    danceSlug: string,
    totalLessons: number
  ) => boolean;

  getCompletedLessonCount: (
    danceSlug: string
  ) => number;

  getTotalCompletedLessons: () => number;

  getOverallProgress: () => number;

  xp: number;

  loading: boolean;

  refreshProgress: () => Promise<void>;
}

const ProgressContext =
  createContext<ProgressContextType | undefined>(undefined);

const LOCAL_PROGRESS_KEY = "roi_progress";
const LOCAL_PRACTICE_KEY = "roi_practice_sessions";

function getUserKey(userId: string) {
  return userId;
}

function getProgressStorageKey(userId: string) {
  return `${LOCAL_PROGRESS_KEY}_${getUserKey(userId)}`;
}

function getPracticeStorageKey(userId: string) {
  return `${LOCAL_PRACTICE_KEY}_${getUserKey(userId)}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateStreak(dates: string[]) {
  if (!dates.length) return 0;

  const uniqueDates = Array.from(new Set(dates)).sort().reverse();

  const today = new Date();
  const todayKey = dateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = dateKey(yesterday);

  if (
    uniqueDates[0] !== todayKey &&
    uniqueDates[0] !== yesterdayKey
  ) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(
    uniqueDates[0] === todayKey
      ? todayKey
      : yesterdayKey
  );

  for (const value of uniqueDates) {
    const expected = dateKey(cursor);

    if (value !== expected) break;

    streak++;

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateBestStreak(dates: string[]) {
  const uniqueDates = Array.from(new Set(dates)).sort();

  if (!uniqueDates.length) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const previous = new Date(uniqueDates[i - 1]);
    const currentDate = new Date(uniqueDates[i]);

    const diff =
      Math.round(
        (currentDate.getTime() -
          previous.getTime()) /
          86400000
      );

    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

export function ProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  const [completedLessons, setCompletedLessons] =
    useState<CompletedLessons>({});

  const [practiceSessions, setPracticeSessions] =
    useState<PracticeSession[]>([]);

  const [xp, setXp] = useState(0);

  const [loading, setLoading] = useState(true);

  /*
   * ------------------------------------------------------------
   * LOCAL CACHE
   * ------------------------------------------------------------
   */

  const loadLocalCache = (userId: string) => {
    if (typeof window === "undefined") return;

    const progress = safeParse<CompletedLessons>(
      localStorage.getItem(
        getProgressStorageKey(userId)
      ),
      {}
    );

    const practices = safeParse<PracticeSession[]>(
      localStorage.getItem(
        getPracticeStorageKey(userId)
      ),
      []
    );

    setCompletedLessons(progress);
    setPracticeSessions(practices);
  };

  /*
   * ------------------------------------------------------------
   * FIRESTORE LOAD
   * ------------------------------------------------------------
   */

  const refreshProgress = async () => {
    if (!user || user.isAnonymous) {
      setCompletedLessons({});
      setPracticeSessions([]);
      setXp(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      loadLocalCache(user.uid);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setXp(
          typeof data.xp === "number"
            ? data.xp
            : 0
        );
      }

      const progressRef = doc(
        db,
        "progress",
        user.uid
      );

      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data();

        const firestoreProgress =
          data.completedLessons || {};

        setCompletedLessons(
          firestoreProgress
        );

        localStorage.setItem(
          getProgressStorageKey(user.uid),
          JSON.stringify(firestoreProgress)
        );
      }

      const sessionsQuery = query(
        collection(db, "practiceSessions"),
        where("userId", "==", user.uid),
        limit(500)
      );

      const sessionsSnap =
        await getDocs(sessionsQuery);

      const sessions = sessionsSnap.docs
        .map((item) => {
          const data = item.data();

          return {
            id: item.id,
            userId: data.userId || user.uid,
            danceSlug: data.danceSlug || "",
            danceName: data.danceName || "",
            lessonIndex:
              data.lessonIndex ?? 0,
            lessonTitle:
              data.lessonTitle || "",
            movementId:
              data.movementId || "",
            movementName:
              data.movementName || "",
            overallScore:
              Number(data.overallScore || 0),
            accuracyScore:
              Number(data.accuracyScore || 0),
            timingScore:
              Number(data.timingScore || 0),
            completionScore:
              Number(data.completionScore || 0),
            repsCompleted:
              Number(data.repsCompleted || 0),
            durationSeconds:
              Number(data.durationSeconds || 0),
            feedbackSummary:
              Array.isArray(data.feedbackSummary)
                ? data.feedbackSummary
                : [],
            createdAt:
              typeof data.createdAt === "string"
                ? data.createdAt
                : new Date().toISOString(),
          } as PracticeSession;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

      setPracticeSessions(sessions);

      localStorage.setItem(
        getPracticeStorageKey(user.uid),
        JSON.stringify(sessions)
      );
    } catch (error) {
      console.error(
        "Failed to load Firestore progress:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProgress();
  }, [user?.uid]);

  /*
   * ------------------------------------------------------------
   * PROGRESS
   * ------------------------------------------------------------
   */

  const getProgress = (
    danceSlug: string,
    totalLessons: number
  ) => {
    if (!totalLessons) return 0;

    const completed =
      completedLessons[danceSlug]?.length || 0;

    return Math.round(
      Math.min(
        100,
        (completed / totalLessons) * 100
      )
    );
  };

  const isLessonCompleted = (
    danceSlug: string,
    lessonIndex: number
  ) => {
    return (
      completedLessons[danceSlug]?.includes(
        lessonIndex
      ) || false
    );
  };

  const isCompleted = isLessonCompleted;

  const saveProgress = async (
    updated: CompletedLessons
  ) => {
    setCompletedLessons(updated);

    if (!user || user.isAnonymous) return;

    localStorage.setItem(
      getProgressStorageKey(user.uid),
      JSON.stringify(updated)
    );

    try {
      await setDoc(
        doc(db, "progress", user.uid),
        {
          userId: user.uid,
          completedLessons: updated,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error(
        "Failed to save progress:",
        error
      );
    }
  };

  const updateXP = async (
    newCompleted: CompletedLessons
  ) => {
    if (!user || user.isAnonymous) return;

    const totalCompleted =
      Object.values(newCompleted).reduce(
        (sum, lessons) =>
          sum + lessons.length,
        0
      );

    const practiceXP =
      practiceSessions.reduce(
        (sum, session) =>
          sum +
          Math.max(
            0,
            Math.round(session.overallScore / 10)
          ),
        0
      );

    const newXP =
      totalCompleted * 50 + practiceXP;

    setXp(newXP);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          xp: newXP,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error(
        "Failed to update XP:",
        error
      );
    }
  };

  const markLessonComplete = async (
    danceSlug: string,
    lessonIndex: number
  ) => {
    const current =
      completedLessons[danceSlug] || [];

    if (current.includes(lessonIndex)) return;

    const updated: CompletedLessons = {
      ...completedLessons,
      [danceSlug]: [
        ...current,
        lessonIndex,
      ].sort((a, b) => a - b),
    };

    await saveProgress(updated);
    await updateXP(updated);
  };

  const completeLesson = markLessonComplete;

  const toggleLessonComplete = async (
    danceSlug: string,
    lessonIndex: number
  ) => {
    const current =
      completedLessons[danceSlug] || [];

    const exists =
      current.includes(lessonIndex);

    const updatedLessons = exists
      ? current.filter(
          (index) => index !== lessonIndex
        )
      : [...current, lessonIndex].sort(
          (a, b) => a - b
        );

    const updated: CompletedLessons = {
      ...completedLessons,
      [danceSlug]: updatedLessons,
    };

    await saveProgress(updated);
    await updateXP(updated);
  };

  const toggleLesson = toggleLessonComplete;

  const resetDanceProgress = async (
    danceSlug: string
  ) => {
    const updated = {
      ...completedLessons,
    };

    delete updated[danceSlug];

    await saveProgress(updated);
    await updateXP(updated);
  };

  const resetAllProgress = async () => {
    await saveProgress({});
    await updateXP({});
  };

  /*
   * ------------------------------------------------------------
   * PRACTICE
   * ------------------------------------------------------------
   */

  const savePracticeSession = async (
    session: Omit<
      PracticeSession,
      "id" | "createdAt"
    >
  ) => {
    const createdAt =
      new Date().toISOString();

    const id =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    const newSession: PracticeSession = {
      ...session,
      id,
      createdAt,
      feedbackSummary:
        session.feedbackSummary || [],
    };

    const updated = [
      newSession,
      ...practiceSessions,
    ];

    setPracticeSessions(updated);

    if (user) {
      localStorage.setItem(
        getPracticeStorageKey(user.uid),
        JSON.stringify(updated)
      );
    }

    if (!user || user.isAnonymous) return;

    try {
      await setDoc(
        doc(db, "practiceSessions", id),
        {
          ...newSession,
          createdAt,
          firestoreCreatedAt:
            serverTimestamp(),
        }
      );

      const totalCompleted =
        Object.values(
          completedLessons
        ).reduce(
          (sum, lessons) =>
            sum + lessons.length,
          0
        );

      const oldXP =
        practiceSessions.reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              Math.round(
                item.overallScore / 10
              )
            ),
          0
        );

      const newXP =
        totalCompleted * 50 +
        oldXP +
        Math.max(
          0,
          Math.round(
            newSession.overallScore / 10
          )
        );

      setXp(newXP);

      await setDoc(
        doc(db, "users", user.uid),
        {
          xp: newXP,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error(
        "Failed to save practice session:",
        error
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * STATS
   * ------------------------------------------------------------
   */

  const practiceDates =
    practiceSessions
      .map((session) => {
        const date = new Date(
          session.createdAt
        );

        return dateKey(date);
      })
      .sort();

  const practiceDays = Array.from(
    new Set(practiceDates)
  ).length;

  const currentStreak =
    calculateStreak(practiceDates);

  const bestStreak =
    calculateBestStreak(practiceDates);

  const lastPracticeDate =
    practiceSessions.length
      ? practiceSessions[0].createdAt
      : null;

  const getPracticeStats = (): PracticeStats => {
    const totalSessions =
      practiceSessions.length;

    const totalScore =
      practiceSessions.reduce(
        (sum, session) =>
          sum + session.overallScore,
        0
      );

    const totalReps =
      practiceSessions.reduce(
        (sum, session) =>
          sum + session.repsCompleted,
        0
      );

    const totalDurationSeconds =
      practiceSessions.reduce(
        (sum, session) =>
          sum + session.durationSeconds,
        0
      );

    const bestScore =
      totalSessions > 0
        ? Math.max(
            ...practiceSessions.map(
              (session) =>
                session.overallScore
            )
          )
        : 0;

    return {
      totalSessions,
      averageScore:
        totalSessions > 0
          ? Math.round(
              totalScore / totalSessions
            )
          : 0,
      bestScore,
      totalPracticeMinutes: Math.round(
        totalDurationSeconds / 60
      ),
      totalReps,
      totalDurationSeconds,
      practiceDays,
      currentStreak,
      bestStreak,
      lastPracticeDate,
    };
  };

  const getPracticeDays = () =>
    practiceDays;

  const getPracticeStreak = () =>
    currentStreak;

  const getBestPracticeStreak = () =>
    bestStreak;

  const getLastPracticeDate = () =>
    lastPracticeDate;

  /*
   * ------------------------------------------------------------
   * ACHIEVEMENTS
   * ------------------------------------------------------------
   */

  const getAchievements = (): Achievement[] => {
    const totalLessons =
      Object.values(
        completedLessons
      ).reduce(
        (sum, lessons) =>
          sum + lessons.length,
        0
      );

    const coursesCompleted =
      danceStyles.filter((dance) => {
        const completed =
          completedLessons[
            dance.slug
          ]?.length || 0;

        return (
          completed >=
          dance.lessons.length
        );
      }).length;

    const bestScore =
      getPracticeStats().bestScore;

    return [
      {
        id: "first-lesson",
        title: "First Step",
        description:
          "Complete your first lesson",
        icon: "👣",
        unlocked:
          totalLessons >= 1,
        progress: Math.min(
          totalLessons,
          1
        ),
        target: 1,
      },
      {
        id: "five-lessons",
        title: "Getting Started",
        description:
          "Complete 5 lessons",
        icon: "📚",
        unlocked:
          totalLessons >= 5,
        progress: Math.min(
          totalLessons,
          5
        ),
        target: 5,
      },
      {
        id: "ten-lessons",
        title: "Dedicated Student",
        description:
          "Complete 10 lessons",
        icon: "🔥",
        unlocked:
          totalLessons >= 10,
        progress: Math.min(
          totalLessons,
          10
        ),
        target: 10,
      },
      {
        id: "first-practice",
        title: "First Practice",
        description:
          "Complete your first AI practice",
        icon: "🤖",
        unlocked:
          practiceSessions.length >= 1,
        progress: Math.min(
          practiceSessions.length,
          1
        ),
        target: 1,
      },
      {
        id: "seven-day-streak",
        title: "7 Day Streak",
        description:
          "Practice for 7 consecutive days",
        icon: "🔥",
        unlocked:
          bestStreak >= 7,
        progress: Math.min(
          bestStreak,
          7
        ),
        target: 7,
      },
      {
        id: "ninety-score",
        title: "Precision",
        description:
          "Score 90% or higher in AI practice",
        icon: "🎯",
        unlocked:
          bestScore >= 90,
        progress: Math.min(
          bestScore,
          90
        ),
        target: 90,
      },
      {
        id: "perfect-score",
        title: "Perfect Performance",
        description:
          "Score 100% in AI practice",
        icon: "💯",
        unlocked:
          bestScore >= 100,
        progress: Math.min(
          bestScore,
          100
        ),
        target: 100,
      },
      {
        id: "course-champion",
        title: "Course Champion",
        description:
          "Complete one entire course",
        icon: "🏆",
        unlocked:
          coursesCompleted >= 1,
        progress: Math.min(
          coursesCompleted,
          1
        ),
        target: 1,
      },
      {
        id: "three-courses",
        title: "Classical Explorer",
        description:
          "Complete 3 courses",
        icon: "💃",
        unlocked:
          coursesCompleted >= 3,
        progress: Math.min(
          coursesCompleted,
          3
        ),
        target: 3,
      },
    ];
  };

  /*
   * ------------------------------------------------------------
   * COURSE HELPERS
   * ------------------------------------------------------------
   */

  const getCompletedLessonCount = (
    danceSlug: string
  ) => {
    return (
      completedLessons[danceSlug]
        ?.length || 0
    );
  };

  const getTotalCompletedLessons = () => {
    return Object.values(
      completedLessons
    ).reduce(
      (sum, lessons) =>
        sum + lessons.length,
      0
    );
  };

  const totalLessons = useMemo(() => {
    return danceStyles.reduce(
      (sum, dance) =>
        sum + dance.lessons.length,
      0
    );
  }, []);

  const getOverallProgress = () => {
    return Math.round(
      (getTotalCompletedLessons() /
        Math.max(1, totalLessons)) *
        100
    );
  };

  const isCourseCompleted = (
    danceSlug: string,
    courseTotalLessons: number
  ) => {
    return (
      getCompletedLessonCount(
        danceSlug
      ) >= courseTotalLessons
    );
  };

  const value: ProgressContextType = {
    completedLessons,
    practiceSessions,

    getProgress,
    isLessonCompleted,
    isCompleted,

    markLessonComplete,
    completeLesson,

    toggleLessonComplete,
    toggleLesson,

    resetDanceProgress,
    resetAllProgress,

    savePracticeSession,

    getPracticeStats,
    getPracticeDays,
    getPracticeStreak,
    getBestPracticeStreak,
    getLastPracticeDate,

    getAchievements,

    isCourseCompleted,
    getCompletedLessonCount,
    getTotalCompletedLessons,
    getOverallProgress,

    xp,
    loading,
    refreshProgress,
  };

  return (
    <ProgressContext.Provider
      value={value}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context =
    useContext(ProgressContext);

  if (!context) {
    throw new Error(
      "useProgress must be used inside a ProgressProvider"
    );
  }

  return context;
}