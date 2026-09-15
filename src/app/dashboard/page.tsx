"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import Navbar from "@/components/Navbar";
import DanceCard from "@/components/DanceCard";
import MerchSection from "@/components/MerchSection";

import {
  Sparkles,
  ArrowRight,
  Play,
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Flame,
  Star,
  MessageSquare,
  Camera,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  Lock,
  Clock,
  Medal,
  Crown,
} from "lucide-react";

import {
  danceStyles,
  type DanceStyle,
} from "@/data/danceData";

/* ============================================================
   CONSTANTS
============================================================ */

const HERO_VIDEO =
  "https://www.youtube.com/embed/UBYqv21c0Yk?autoplay=1&mute=1&loop=1&playlist=UBYqv21c0Yk&controls=0&rel=0&modestbranding=1&playsinline=1";

const classicalSlugs = new Set<string>([
  "odissi",
  "bharatanatyam",
  "kathak",
  "kuchipudi",
  "kathakali",
  "manipuri",
  "mohiniyattam",
  "sattriya",
]);

/* ============================================================
   HELPERS
============================================================ */

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(max, Math.max(min, value));
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Improving";
  if (score > 0) return "Keep Practising";
  return "No score yet";
}

/* ============================================================
   DASHBOARD
============================================================ */

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const {
    completedLessons,
    getProgress,
    getPracticeStats,
    practiceSessions,
  } = useProgress();

  const router = useRouter();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedRegion, setSelectedRegion] =
    useState<string>("all");

  /* ============================================================
     AUTH
  ============================================================ */

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  /* ============================================================
     PRACTICE STATS
  ============================================================ */

  const practiceStats = getPracticeStats();

  /* ============================================================
     USER NAME
  ============================================================ */

  const displayName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0];
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "Dancer";
  }, [user]);

  /* ============================================================
     LESSON PROGRESS
  ============================================================ */

  const totalLessons = useMemo(() => {
    return danceStyles.reduce(
      (total, dance) =>
        total + (dance.lessons?.length || 0),
      0
    );
  }, []);

  const completedCount = useMemo(() => {
    return Object.values(completedLessons).reduce(
      (total, lessons) =>
        total + lessons.length,
      0
    );
  }, [completedLessons]);

  const overallProgress =
    totalLessons > 0
      ? Math.min(
          100,
          Math.round(
            (completedCount / totalLessons) * 100
          )
        )
      : 0;

  const remainingLessons = Math.max(
    totalLessons - completedCount,
    0
  );

  /* ============================================================
     COMPLETED COURSES
  ============================================================ */

  const completedCourses = useMemo(() => {
    return danceStyles.filter((dance) => {
      const completed =
        completedLessons[dance.slug]?.length || 0;

      return (
        dance.lessons.length > 0 &&
        completed >= dance.lessons.length
      );
    });
  }, [completedLessons]);

  /* ============================================================
     ACTIVE COURSE
  ============================================================ */

  const activeDance: DanceStyle = useMemo(() => {
    const unfinished = danceStyles.find(
      (dance) => {
        const completed =
          completedLessons[dance.slug]?.length || 0;

        return (
          completed <
          dance.lessons.length
        );
      }
    );

    return unfinished || danceStyles[0];
  }, [completedLessons]);

  const activeCompleted =
    completedLessons[activeDance.slug]?.length ||
    0;

  const activeTotal =
    activeDance.lessons.length;

  const activeProgress =
    activeTotal > 0
      ? Math.min(
          100,
          Math.round(
            (activeCompleted /
              activeTotal) *
              100
          )
        )
      : 0;

  const activeLessonIndex = clamp(
    activeCompleted,
    0,
    Math.max(activeTotal - 1, 0)
  );

  const activeLesson =
    activeDance.lessons[
      activeLessonIndex
    ];

  /* ============================================================
     SEARCH / FILTER
  ============================================================ */

  const filteredDanceStyles =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      return danceStyles.filter((dance) => {
        const searchableText =
          `${dance.name} ${dance.region} ${dance.tagline}`.toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        const region =
          dance.region.toLowerCase();

        let matchesRegion = true;

        if (
          selectedRegion === "east"
        ) {
          matchesRegion =
            region.includes("east") ||
            region.includes("odisha") ||
            region.includes("assam") ||
            region.includes("manipur");
        }

        if (
          selectedRegion === "south"
        ) {
          matchesRegion =
            region.includes("south") ||
            region.includes("tamil") ||
            region.includes("andhra") ||
            region.includes("kerala");
        }

        if (
          selectedRegion === "north"
        ) {
          matchesRegion =
            region.includes("north") &&
            !region.includes("northeast");
        }

        return (
          matchesSearch &&
          matchesRegion
        );
      });
    }, [
      searchQuery,
      selectedRegion,
    ]);

  const classicalDances =
    filteredDanceStyles.filter(
      (dance) =>
        dance.category ===
          "classical" ||
        classicalSlugs.has(
          dance.slug
        )
    );

  const folkDances =
    filteredDanceStyles.filter(
      (dance) =>
        dance.category === "folk"
    );

  /* ============================================================
     STREAK
  ============================================================ */

  const currentStreak = useMemo(() => {
    if (!practiceSessions?.length) {
      return 0;
    }

    const dates = new Set<string>();

    practiceSessions.forEach(
      (session: any) => {
        if (!session.createdAt) return;

        const date =
          new Date(
            session.createdAt
          )
            .toISOString()
            .split("T")[0];

        dates.add(date);
      }
    );

    if (dates.size === 0) {
      return 0;
    }

    const sortedDates =
      Array.from(dates)
        .map((date) =>
          new Date(date)
        )
        .sort(
          (a, b) =>
            b.getTime() -
            a.getTime()
        );

    let streak = 1;

    for (
      let i = 1;
      i < sortedDates.length;
      i++
    ) {
      const previous =
        sortedDates[i - 1];

      const current =
        sortedDates[i];

      const difference =
        Math.round(
          (previous.getTime() -
            current.getTime()) /
            (1000 * 60 * 60 * 24)
        );

      if (difference === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [practiceSessions]);

  /* ============================================================
     ACHIEVEMENTS
  ============================================================ */

  const achievements = useMemo(() => {
    const sessions =
      practiceStats?.totalSessions || 0;

    const score =
      practiceStats?.bestScore || 0;

    return [
      {
        title: "First Step",
        description:
          "Complete your first lesson",
        icon: BookOpen,
        unlocked:
          completedCount >= 1,
      },
      {
        title: "Practice Starter",
        description:
          "Complete your first AI session",
        icon: Camera,
        unlocked:
          sessions >= 1,
      },
      {
        title: "7 Day Rhythm",
        description:
          "Build a 7 day practice streak",
        icon: Flame,
        unlocked:
          currentStreak >= 7,
      },
      {
        title: "AI Performer",
        description:
          "Reach a 90% AI score",
        icon: Target,
        unlocked:
          score >= 90,
      },
      {
        title: "Course Champion",
        description:
          "Complete a full dance course",
        icon: Trophy,
        unlocked:
          completedCourses.length >= 1,
      },
      {
        title: "Classical Scholar",
        description:
          "Complete 3 dance courses",
        icon: Crown,
        unlocked:
          completedCourses.length >= 3,
      },
    ];
  }, [
    completedCount,
    completedCourses.length,
    currentStreak,
    practiceStats,
  ]);

  const unlockedAchievements =
    achievements.filter(
      (achievement) =>
        achievement.unlocked
    ).length;

  /* ============================================================
     CERTIFICATE STATUS
  ============================================================ */

  const certificateUnlocked =
    completedCourses.length > 0;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F1E6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />

          <p className="text-[#111111] font-bold font-mono text-sm tracking-wider animate-pulse">
            LOADING RHYTHM OF INDIA...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">

      <Navbar
        onSearch={setSearchQuery}
      />

      {/* ========================================================
          HERO
      ======================================================== */}

      <section className="relative w-full h-screen min-h-[680px] overflow-hidden bg-black">

        <div className="absolute inset-0 pointer-events-none overflow-hidden">

          <iframe
            src={HERO_VIDEO}
            title="Rhythm of India"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              width: "177.78vh",
              height: "56.25vw",
              minWidth: "100%",
              minHeight: "100%",
              transform:
                "translate(-50%, -50%)",
              border: "none",
              opacity: 0.72,
            }}
          />

        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90" />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

        <div className="relative z-20 flex h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 items-center">

          <div className="max-w-4xl pt-16">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-4 py-2 text-[10px] sm:text-xs font-bold tracking-widest text-white uppercase shadow-xl">

              <span className="w-2 h-2 rounded-full bg-[#E3B23C] animate-pulse" />

              Classical Indian Dance Academy

              <span className="text-white/30">
                •
              </span>

              <span className="text-[#E3B23C]">
                Est. 2026
              </span>

            </div>

            <p className="mt-7 text-white/50 text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">
              Welcome back, {displayName}
            </p>

            <h1 className="mt-3 text-5xl sm:text-7xl lg:text-8xl xl:text-[8.5rem] font-black uppercase font-mono tracking-[-0.055em] leading-[0.82] text-white drop-shadow-2xl">

              RHYTHM
              <br />

              <span className="text-[#D4492F]">
                OF INDIA
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-sm sm:text-lg lg:text-xl leading-relaxed text-white/80 font-medium">
              Learn India&apos;s classical dance traditions
              through movement, rhythm, expression and
              storytelling.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">

              <Link
                href="#continue-learning"
                className="group inline-flex items-center gap-3 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wide text-white shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                Continue Learning

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href={`/practice/${activeDance.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
              >
                <Camera
                  size={15}
                  className="text-[#E3B23C]"
                />

                AI Practice
              </Link>

            </div>

            <div className="mt-9 flex flex-wrap items-center gap-5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50">

              <div className="flex items-center gap-2">
                <BookOpen
                  size={14}
                  className="text-[#E3B23C]"
                />
                Structured Lessons
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/20" />

              <div className="flex items-center gap-2">
                <Camera
                  size={14}
                  className="text-[#E3B23C]"
                />
                AI Practice
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/20" />

              <div className="flex items-center gap-2">
                <Award
                  size={14}
                  className="text-[#E3B23C]"
                />
                Certificates
              </div>

            </div>

          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/45">

          <span className="text-[9px] font-bold uppercase tracking-[0.3em]">
            Scroll
          </span>

          <div className="h-9 w-px bg-gradient-to-b from-white/50 to-transparent animate-pulse" />

        </div>

      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-24 space-y-14">

        {/* ======================================================
            QUICK STATS
        ====================================================== */}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

          {/* Progress */}

          <div className="rounded-[24px] bg-[#111111] text-white p-5 sm:p-6 border border-[#292929] shadow-xl">

            <div className="flex items-center justify-between">

              <div className="w-10 h-10 rounded-xl bg-[#B42318] flex items-center justify-center">
                <TrendingUp size={19} />
              </div>

              <span className="text-[#E3B23C] text-xs font-black">
                {overallProgress}%
              </span>

            </div>

            <p className="mt-5 text-[9px] uppercase tracking-[0.18em] font-bold font-mono text-gray-500">
              Overall Progress
            </p>

            <p className="mt-1 text-3xl sm:text-4xl font-black font-mono">
              {overallProgress}%
            </p>

            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B42318] rounded-full transition-all duration-700"
                style={{
                  width: `${overallProgress}%`,
                }}
              />
            </div>

          </div>

          {/* Lessons */}

          <div className="rounded-[24px] bg-white border border-[#E8DEC8] p-5 sm:p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-10 h-10 rounded-xl bg-[#EFE5D3] flex items-center justify-center">
                <BookOpen
                  size={19}
                  className="text-[#B42318]"
                />
              </div>

              <CheckCircle2
                size={18}
                className="text-green-600"
              />

            </div>

            <p className="mt-5 text-[9px] uppercase tracking-[0.18em] font-bold font-mono text-[#888078]">
              Lessons
            </p>

            <p className="mt-1 text-3xl sm:text-4xl font-black font-mono">
              {completedCount}
              <span className="text-sm text-[#999] font-bold ml-1">
                / {totalLessons}
              </span>
            </p>

            <p className="mt-2 text-[10px] text-[#888078]">
              {remainingLessons} remaining
            </p>

          </div>

          {/* Streak */}

          <div className="rounded-[24px] bg-[#EFE7DA] border border-[#E8DEC8] p-5 sm:p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="w-10 h-10 rounded-xl bg-[#B42318] text-white flex items-center justify-center">
                <Flame size={19} />
              </div>

              <span className="text-xl">
                🔥
              </span>

            </div>

            <p className="mt-5 text-[9px] uppercase tracking-[0.18em] font-bold font-mono text-[#888078]">
              Current Streak
            </p>

            <p className="mt-1 text-3xl sm:text-4xl font-black font-mono">
              {currentStreak}
              <span className="text-sm ml-1 text-[#777]">
                days
              </span>
            </p>

            <p className="mt-2 text-[10px] text-[#888078]">
              Keep the rhythm alive
            </p>

          </div>

          {/* Achievements */}

          <div className="rounded-[24px] bg-[#B42318] text-white p-5 sm:p-6 shadow-xl shadow-[#B42318]/10">

            <div className="flex items-center justify-between">

              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Trophy size={19} />
              </div>

              <span className="text-[#E3B23C] text-xl">
                ✦
              </span>

            </div>

            <p className="mt-5 text-[9px] uppercase tracking-[0.18em] font-bold font-mono text-white/60">
              Achievements
            </p>

            <p className="mt-1 text-3xl sm:text-4xl font-black font-mono">
              {unlockedAchievements}
              <span className="text-sm text-white/60 ml-1">
                / {achievements.length}
              </span>
            </p>

            <p className="mt-2 text-[10px] text-white/60">
              Milestones unlocked
            </p>

          </div>

        </section>

        {/* ======================================================
            CONTINUE LEARNING
        ====================================================== */}

        <section
          id="continue-learning"
          className="group relative overflow-hidden rounded-[32px] bg-[#111111] text-[#F8F1E6] border border-[#292929] shadow-2xl scroll-mt-24"
        >

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

          <div className="grid lg:grid-cols-12 min-h-[410px]">

            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10">

              <div>

                <div className="inline-flex items-center gap-2 bg-[#242424] border border-white/10 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest">

                  <Flame
                    size={13}
                    className="text-[#E3B23C]"
                  />

                  Continue Learning

                  <span className="text-[#666]">
                    •
                  </span>

                  <span className="text-gray-400">
                    {activeProgress}% complete
                  </span>

                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black uppercase font-mono tracking-tight leading-[0.9]">
                  {activeDance.name}
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                  {activeLesson?.title ||
                    "Continue your classical dance journey."}
                  {" — "}
                  {activeDance.tagline}
                </p>

                {activeDance.guru && (
                  <p className="mt-3 text-xs text-gray-500 italic">
                    Taught in the tradition of{" "}
                    {activeDance.guru}
                  </p>
                )}

              </div>

              <div className="mt-8">

                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">
                  <span>
                    Course Progress
                  </span>

                  <span className="text-[#E3B23C]">
                    {activeCompleted} /{" "}
                    {activeTotal}
                  </span>
                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-[#B42318] rounded-full transition-all duration-700"
                    style={{
                      width: `${activeProgress}%`,
                    }}
                  />

                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">

                  <Link
                    href={`/dance/${activeDance.slug}`}
                    className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:-translate-y-0.5"
                  >

                    <Play
                      size={14}
                      className="fill-white"
                    />

                    Resume Lesson

                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />

                  </Link>

                  <Link
                    href={`/practice/${activeDance.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-xs font-bold uppercase tracking-wider"
                  >

                    <Camera size={14} />

                    AI Practice

                  </Link>

                </div>

              </div>

            </div>

            <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden">

              <Image
                src={activeDance.image}
                alt={activeDance.name}
                fill
                priority
                className="object-cover object-center brightness-90 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111111] via-transparent to-transparent" />

              <div className="absolute top-5 right-5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-widest">
                Your Path
              </div>

              <div className="absolute bottom-5 right-5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 px-4 py-3">

                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                  Next Lesson
                </p>

                <p className="mt-1 text-xs font-bold text-white max-w-[180px] truncate">
                  {activeLesson?.title ||
                    "Course Complete"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            MY COURSES
        ====================================================== */}

        <section className="space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">

            <div>

              <div className="text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                01 // YOUR JOURNEY
              </div>

              <h2 className="mt-1 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                My Courses
              </h2>

              <p className="mt-2 text-sm text-[#777]">
                Track your progress across every dance tradition.
              </p>

            </div>

            <Link
              href="#classical-forms"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#B42318] hover:text-[#D4492F]"
            >
              Explore all
              <ArrowRight size={14} />
            </Link>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {danceStyles
              .slice(0, 6)
              .map((dance) => {

                const completed =
                  completedLessons[
                    dance.slug
                  ]?.length || 0;

                const total =
                  dance.lessons.length;

                const percentage =
                  total > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (completed /
                            total) *
                            100
                        )
                      )
                    : 0;

                const isComplete =
                  percentage === 100;

                return (
                  <Link
                    key={dance.slug}
                    href={`/dance/${dance.slug}`}
                    className="group rounded-[24px] bg-white border border-[#E8DEC8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >

                    <div className="relative h-40 overflow-hidden">

                      <Image
                        src={dance.image}
                        alt={dance.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">

                        <div>

                          <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold">
                            {dance.region}
                          </p>

                          <h3 className="mt-1 text-xl font-black uppercase font-mono text-white">
                            {dance.name}
                          </h3>

                        </div>

                        {isComplete && (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2
                              size={16}
                              className="text-white"
                            />
                          </div>
                        )}

                      </div>

                    </div>

                    <div className="p-5">

                      <div className="flex items-center justify-between">

                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#777]">
                          Progress
                        </span>

                        <span className="text-xs font-black text-[#B42318]">
                          {percentage}%
                        </span>

                      </div>

                      <div className="mt-2 h-2 bg-[#EEE5D7] rounded-full overflow-hidden">

                        <div
                          className="h-full bg-[#B42318] rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <div className="mt-3 flex items-center justify-between">

                        <span className="text-[10px] text-[#888]">
                          {completed} / {total} lessons
                        </span>

                        <ChevronRight
                          size={15}
                          className="text-[#999] group-hover:text-[#B42318] group-hover:translate-x-1 transition-all"
                        />

                      </div>

                    </div>

                  </Link>
                );
              })}

          </div>

        </section>

        {/* ======================================================
            ACHIEVEMENTS
        ====================================================== */}

        <section className="rounded-[32px] bg-[#EFE7DA] border border-[#E8DEC8] p-6 sm:p-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">

            <div>

              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">

                <Trophy size={14} />

                02 // ACHIEVEMENTS

              </div>

              <h2 className="mt-2 text-3xl sm:text-4xl font-black uppercase font-mono">
                Your Milestones
              </h2>

              <p className="mt-2 text-sm text-[#777]">
                Keep learning, practising and collecting achievements.
              </p>

            </div>

            <div className="text-xs font-black font-mono text-[#B42318]">
              {unlockedAchievements} /{" "}
              {achievements.length} UNLOCKED
            </div>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

            {achievements.map(
              (achievement) => {

                const Icon =
                  achievement.icon;

                return (
                  <div
                    key={achievement.title}
                    className={`relative rounded-2xl p-4 border transition-all ${
                      achievement.unlocked
                        ? "bg-white border-[#DCCDB5] shadow-sm"
                        : "bg-[#E9DFD0] border-[#E1D5C2] opacity-60"
                    }`}
                  >

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        achievement.unlocked
                          ? "bg-[#B42318] text-white"
                          : "bg-[#D9CEBE] text-[#8E8479]"
                      }`}
                    >
                      {achievement.unlocked ? (
                        <Icon size={19} />
                      ) : (
                        <Lock size={17} />
                      )}
                    </div>

                    <p className="mt-4 text-xs font-black">
                      {achievement.title}
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-[#888078]">
                      {achievement.description}
                    </p>

                    {achievement.unlocked && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2
                          size={13}
                          className="text-green-600"
                        />
                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* ======================================================
            CERTIFICATE
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-[#111111] text-white border border-[#292929] shadow-2xl">

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border border-[#B42318]/10" />

          <div className="relative z-10 p-7 sm:p-10 lg:p-12">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">

              <div>

                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#E3B23C] uppercase tracking-[0.2em] font-mono">

                  <Award size={14} />

                  03 // CERTIFICATION

                </div>

                <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono">
                  Your Certificate
                </h2>

                <p className="mt-3 text-sm text-gray-400 max-w-xl leading-relaxed">

                  {certificateUnlocked
                    ? "Congratulations! You have completed a dance curriculum and unlocked your certificate."
                    : `Complete a full dance course to unlock your official Rhythm of India certificate.`}

                </p>

              </div>

              <div className="shrink-0">

                <Link
                  href="/certificate"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-7 py-4 text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-1"
                >

                  {certificateUnlocked ? (
                    <>
                      <Award size={15} />
                      View Certificate
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Certificate Preview
                    </>
                  )}

                  <ArrowRight size={14} />

                </Link>

              </div>

            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">

              <div className="rounded-2xl bg-[#191919] border border-white/5 p-5">

                <Award
                  size={20}
                  className="text-[#E3B23C]"
                />

                <p className="mt-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                  Courses Completed
                </p>

                <p className="mt-1 text-3xl font-black font-mono">
                  {completedCourses.length}
                </p>

              </div>

              <div className="rounded-2xl bg-[#191919] border border-white/5 p-5">

                <Medal
                  size={20}
                  className="text-[#E3B23C]"
                />

                <p className="mt-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                  Achievement Level
                </p>

                <p className="mt-1 text-xl font-black">
                  {unlockedAchievements >= 5
                    ? "Master"
                    : unlockedAchievements >= 3
                    ? "Advanced"
                    : unlockedAchievements >= 1
                    ? "Explorer"
                    : "Beginner"}
                </p>

              </div>

              <div className="rounded-2xl bg-[#191919] border border-white/5 p-5">

                <Target
                  size={20}
                  className="text-[#E3B23C]"
                />

                <p className="mt-4 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
                  Next Goal
                </p>

                <p className="mt-1 text-xl font-black">
                  {remainingLessons > 0
                    ? `${remainingLessons} Lessons`
                    : "Mastery Complete"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            AI PRACTICE
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[32px] bg-[#111111] border border-[#292929] text-white shadow-2xl">

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

          <div className="relative z-10 p-7 sm:p-10 lg:p-12">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-7">

              <div>

                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#E3B23C] uppercase tracking-[0.2em] font-mono">

                  <Sparkles size={14} />

                  04 // RHYTHM AI

                </div>

                <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">

                  Practice.
                  <span className="text-[#D4492F]">
                    {" "}
                    Improve.
                  </span>

                </h2>

                <p className="mt-3 text-sm text-gray-400 max-w-2xl leading-relaxed">
                  Use your camera to practice movement and receive feedback based on your performance.
                </p>

              </div>

              <Link
                href={`/practice/${activeDance.slug}`}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:-translate-y-1"
              >

                <Camera size={15} />

                Start AI Practice

                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />

              </Link>

            </div>

            {/* AI STATS */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-7">

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">

                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Average Score
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono">
                  {practiceStats.totalSessions > 0
                    ? `${practiceStats.averageScore}%`
                    : "—"}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  {getScoreLabel(
                    practiceStats.averageScore || 0
                  )}
                </p>

              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">

                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Personal Best
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono text-[#E3B23C]">
                  {practiceStats.totalSessions > 0
                    ? `${practiceStats.bestScore}%`
                    : "—"}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  Highest AI score
                </p>

              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">

                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Sessions
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono">
                  {practiceStats.totalSessions}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  Practice sessions
                </p>

              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">

                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Reps
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono">
                  {practiceStats.totalReps}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  Movement reps
                </p>

              </div>

            </div>

            {/* RECENT PRACTICE */}

            {practiceSessions.length > 0 ? (

              <div className="mt-7">

                <div className="flex items-center justify-between mb-3">

                  <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] font-mono text-gray-500">
                    Recent Practice
                  </h3>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E3B23C]">
                    Latest Sessions
                  </span>

                </div>

                <div className="space-y-2">

                  {practiceSessions
                    .slice(0, 3)
                    .map((session: any) => (

                      <Link
                        key={session.id}
                        href={`/practice/${session.danceSlug}?lesson=${session.lessonIndex}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#181818] border border-white/5 p-3.5 hover:bg-[#202020] transition-colors"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-11 h-11 rounded-xl bg-[#B42318] flex items-center justify-center font-black font-mono text-xs">
                            {session.overallScore}%
                          </div>

                          <div>

                            <p className="text-xs sm:text-sm font-bold">
                              {session.movementName}
                            </p>

                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {session.danceName}
                              {" · "}
                              {session.durationSeconds}s
                              {" · "}
                              {new Date(
                                session.createdAt
                              ).toLocaleDateString()}
                            </p>

                          </div>

                        </div>

                        <div className="self-end sm:self-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-white">
                          Practice Again
                          <ChevronRight size={13} />
                        </div>

                      </Link>

                    ))}

                </div>

              </div>

            ) : (

              <div className="mt-7 rounded-2xl bg-[#181818] border border-dashed border-white/10 p-6 text-center">

                <div className="w-11 h-11 mx-auto rounded-2xl bg-[#B42318]/15 border border-[#B42318]/20 flex items-center justify-center">

                  <Camera
                    size={20}
                    className="text-[#D4492F]"
                  />

                </div>

                <p className="mt-3 text-sm font-bold">
                  Your AI practice journey starts here.
                </p>

                <p className="mt-1 text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                  Step in front of your camera and perform your first movement. Your score will appear here after your first session.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* ======================================================
            CLASSICAL DANCES
        ====================================================== */}

        <section
          id="classical-forms"
          className="space-y-7 scroll-mt-24"
        >

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

            <div>

              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                <span>
                  05 // CURRICULUM
                </span>
              </div>

              <h2 className="mt-1 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                Classical Traditions
              </h2>

              <p className="mt-2 text-sm text-[#777] max-w-xl">
                Explore India&apos;s classical dance traditions through structured lessons and guided practice.
              </p>

            </div>

            <div className="flex items-center gap-1.5 bg-[#EFE7DA] border border-[#E8DEC8] p-1 rounded-full text-[10px] sm:text-xs font-bold overflow-x-auto max-w-full">

              {[
                {
                  id: "all",
                  label: "All Traditions",
                },
                {
                  id: "east",
                  label: "East & NE",
                },
                {
                  id: "south",
                  label: "South",
                },
                {
                  id: "north",
                  label: "North",
                },
              ].map((tab) => (

                <button
                  key={tab.id}
                  onClick={() =>
                    setSelectedRegion(
                      tab.id
                    )
                  }
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    selectedRegion ===
                    tab.id
                      ? "bg-[#111111] text-[#F8F1E6] shadow-sm"
                      : "text-[#777] hover:text-[#111]"
                  }`}
                >
                  {tab.label}
                </button>

              ))}

            </div>

          </div>

          {classicalDances.length > 0 ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {classicalDances.map(
                (dance, index) => (

                  <div
                    key={dance.slug}
                    className="group transition-transform duration-300 hover:-translate-y-1"
                  >

                    <DanceCard
                      dance={dance}
                      index={index}
                      featured={
                        index === 0
                      }
                    />

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="rounded-3xl border border-[#E8DEC8] bg-[#EFE7DA] p-10 text-center">

              <BookOpen
                size={32}
                className="mx-auto text-[#B42318] mb-3"
              />

              <p className="font-bold">
                No classical dance found.
              </p>

              <p className="mt-1 text-sm text-[#777]">
                Try another search or region.
              </p>

            </div>

          )}

        </section>

        {/* ======================================================
            MERCH
        ====================================================== */}

        <MerchSection />

        {/* ======================================================
            REVIEWS
        ====================================================== */}

        <section className="rounded-[32px] bg-[#EFE7DA] border border-[#E8DEC8] overflow-hidden">

          <div className="grid lg:grid-cols-12">

            <div className="lg:col-span-8 p-7 sm:p-10 lg:p-12">

              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">

                <MessageSquare size={14} />

                06 // COMMUNITY

              </div>

              <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight leading-[0.95]">

                What do you think
                <br />

                <span className="text-[#B42318]">
                  of Rhythm of India?
                </span>

              </h2>

              <p className="mt-5 text-sm sm:text-base text-[#666] max-w-2xl leading-relaxed">
                Your feedback helps us improve the academy, lessons and AI practice experience.
              </p>

              <div className="flex flex-wrap gap-3 mt-7">

                <Link
                  href="/reviews"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#B42318] hover:bg-[#D4492F] text-white px-6 py-3.5 text-xs font-black uppercase tracking-wide transition-all hover:-translate-y-1"
                >

                  <Star
                    size={15}
                    className="fill-[#E3B23C] text-[#E3B23C]"
                  />

                  Write a Review

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </Link>

                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E8DEC8] hover:border-[#B42318]/30 px-6 py-3.5 text-xs font-bold transition-all"
                >

                  <MessageSquare size={14} />

                  Read Reviews

                </Link>

              </div>

            </div>

            <div className="lg:col-span-4 bg-[#111111] text-white p-7 sm:p-10 flex flex-col justify-center">

              <div className="flex items-center gap-1">

                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      size={19}
                      className="fill-[#E3B23C] text-[#E3B23C]"
                    />
                  )
                )}

              </div>

              <p className="mt-5 text-xl sm:text-2xl font-black uppercase font-mono leading-tight">
                Every dancer has a{" "}
                <span className="text-[#D4492F]">
                  voice.
                </span>
              </p>

              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                Rate your coaching experience and the website separately through our review page.
              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            FOLK
        ====================================================== */}

        <section
          id="folk-forms"
          className="space-y-7 scroll-mt-24"
        >

          <div className="border-t border-[#E8DEC8] pt-12">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">

              <div>

                <div className="text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                  07 // EXPLORE
                </div>

                <h2 className="mt-1 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                  Folk & Traditional
                </h2>

                <p className="mt-2 text-sm text-[#777] max-w-xl">
                  Discover vibrant regional dance traditions from across India.
                </p>

              </div>

              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#777]">
                Across India
                <ArrowRight size={13} />
              </div>

            </div>

          </div>

          {folkDances.length > 0 ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {folkDances.map(
                (dance, index) => (

                  <div
                    key={dance.slug}
                    className="transition-transform duration-300 hover:-translate-y-1"
                  >

                    <DanceCard
                      dance={dance}
                      index={index}
                    />

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="rounded-3xl border border-[#E8DEC8] bg-[#EFE7DA] p-10 text-center">

              <p className="font-bold">
                Folk traditions are coming soon.
              </p>

              <p className="mt-1 text-sm text-[#777]">
                More regional dance forms will be added to the academy.
              </p>

            </div>

          )}

        </section>

        {/* ======================================================
            FINAL SNAPSHOT
        ====================================================== */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-3xl bg-[#111111] text-white p-6 border border-[#292929]">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-2xl bg-[#B42318] flex items-center justify-center">
                <BookOpen size={20} />
              </div>

              <Zap
                size={18}
                className="text-[#E3B23C]"
              />

            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-gray-500">
              Lessons Completed
            </p>

            <p className="mt-1 text-4xl font-black font-mono">
              {completedCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Across your learning journey
            </p>

          </div>

          <div className="rounded-3xl bg-[#EFE7DA] border border-[#E8DEC8] p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-2xl bg-[#B42318] text-white flex items-center justify-center">
                <Flame size={20} />
              </div>

              <span className="text-xl">
                🔥
              </span>

            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-[#777]">
              Practice Streak
            </p>

            <p className="mt-1 text-4xl font-black font-mono">
              {currentStreak}
              <span className="text-sm ml-1 text-[#777]">
                days
              </span>
            </p>

            <p className="mt-1 text-xs text-[#777]">
              Consistency builds mastery
            </p>

          </div>

          <div className="rounded-3xl bg-white border border-[#E8DEC8] p-6">

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
                <Crown size={20} />
              </div>

              <span className="text-[#E3B23C] text-xl">
                ✦
              </span>

            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-[#777]">
              Current Level
            </p>

            <p className="mt-1 text-2xl font-black uppercase font-mono">
              {unlockedAchievements >= 5
                ? "Master"
                : unlockedAchievements >= 3
                ? "Advanced"
                : unlockedAchievements >= 1
                ? "Explorer"
                : "Beginner"}
            </p>

            <p className="mt-1 text-xs text-[#777]">
              Keep building your practice
            </p>

          </div>

        </section>

      </main>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer className="bg-[#111111] text-[#F8F1E6] pt-20 sm:pt-28 relative overflow-hidden">

        <div className="px-8 sm:px-14 lg:px-24 pb-16">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

            <div className="lg:col-span-2">

              <div className="flex items-center gap-4 mb-6">

                <div className="w-14 h-14 rounded-2xl bg-[#B42318] flex items-center justify-center font-black text-white text-3xl">
                  ♫
                </div>

                <div>

                  <p className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tighter">
                    RHYTHM OF INDIA
                  </p>

                  <p className="text-xs text-[#777] uppercase tracking-widest font-bold">
                    Classical Dance Academy
                  </p>

                </div>

              </div>

              <p className="text-[#999] text-sm sm:text-base max-w-lg leading-relaxed">
                Preserving India&apos;s movement arts through a premium digital academy. Learn, practise and experience the traditions behind India&apos;s classical and folk dances.
              </p>

            </div>

            <div>

              <h5 className="text-xs font-bold text-[#777] uppercase tracking-[0.2em] font-mono mb-5">
                Academy
              </h5>

              <ul className="space-y-3 text-sm text-gray-300">

                <li>
                  <Link
                    href="/dashboard#classical-forms"
                    className="hover:text-white"
                  >
                    Classical Traditions
                  </Link>
                </li>

                <li>
                  <Link
                    href="/dashboard#folk-forms"
                    className="hover:text-white"
                  >
                    Folk Dances
                  </Link>
                </li>

                <li>
                  <Link
                    href="/learning"
                    className="hover:text-white"
                  >
                    My Learning
                  </Link>
                </li>

                <li>
                  <Link
                    href={`/practice/${activeDance.slug}`}
                    className="hover:text-white"
                  >
                    AI Practice
                  </Link>
                </li>

                <li>
                  <Link
                    href="/certificate"
                    className="hover:text-white"
                  >
                    Certificates
                  </Link>
                </li>

              </ul>

            </div>

            <div>

              <h5 className="text-xs font-bold text-[#777] uppercase tracking-[0.2em] font-mono mb-5">
                Connect
              </h5>

              <ul className="space-y-3 text-sm text-gray-300">

                <li>
                  <Link
                    href="/profile"
                    className="hover:text-white"
                  >
                    My Profile
                  </Link>
                </li>

                <li>
                  <Link
                    href="/settings"
                    className="hover:text-white"
                  >
                    Settings
                  </Link>
                </li>

                <li>
                  <Link
                    href="/reviews"
                    className="hover:text-white"
                  >
                    Reviews
                  </Link>
                </li>

                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white"
                  >
                    Pricing Plans
                  </Link>
                </li>

              </ul>

            </div>

          </div>

        </div>

        <div className="px-8 sm:px-14 lg:px-24 py-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">

          <p className="text-xs text-[#777] font-mono">
            © 2026 Rhythm of India. All rights reserved.
          </p>

          <p className="text-xs text-[#555] font-mono">
            Learn • Practice • Perform
          </p>

        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-[20vw] leading-none font-black font-sans text-white/[0.02] tracking-tighter pointer-events-none select-none whitespace-nowrap">
          rhythmofindia
        </div>

      </footer>

    </div>
  );
}

