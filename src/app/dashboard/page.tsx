"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import Navbar from "@/components/Navbar";
import DanceCard from "@/components/DanceCard";
import MerchSection from "@/components/MerchSection";
import { danceStyles, DanceStyle } from "@/data/danceData";
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
} from "lucide-react";

const HERO_VIDEO =
  "https://www.youtube.com/embed/UBYqv21c0Yk?autoplay=1&mute=1&loop=1&playlist=UBYqv21c0Yk&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const {
    completedLessons,
    getProgress,
    getPracticeStats,
    practiceSessions,
  } = useProgress();

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const practiceStats = getPracticeStats();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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

  if (!user) return null;

  /* ============================================================
     PROGRESS
  ============================================================ */

  const totalLessonsCount = danceStyles.reduce(
    (total, dance) => total + dance.lessons.length,
    0
  );

  const totalCompletedCount = Object.values(completedLessons).reduce(
    (total, lessons) => total + lessons.length,
    0
  );

  const overallPercentage = Math.round(
    (totalCompletedCount / Math.max(1, totalLessonsCount)) * 100
  );

  /* ============================================================
     ACTIVE DANCE
  ============================================================ */

  const activeDance: DanceStyle =
    danceStyles.find(
      (dance) =>
        (completedLessons[dance.slug]?.length || 0) <
        dance.lessons.length
    ) || danceStyles[0];

  const activeCompleted =
    completedLessons[activeDance.slug]?.length || 0;

  const activeCurrentLessonIndex = Math.min(
    activeCompleted,
    Math.max(0, activeDance.lessons.length - 1)
  );

  const activeCurrentLesson =
    activeDance.lessons[activeCurrentLessonIndex];

  /* ============================================================
     SEARCH + REGION FILTER
  ============================================================ */

  const filteredDanceStyles = danceStyles.filter((dance) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      dance.name.toLowerCase().includes(query) ||
      dance.region.toLowerCase().includes(query) ||
      dance.tagline.toLowerCase().includes(query);

    const region = dance.region.toLowerCase();

    const matchesRegion =
      selectedRegion === "all" ||
      (selectedRegion === "east" &&
        (region.includes("east") ||
          region.includes("odisha") ||
          region.includes("manipur") ||
          region.includes("assam"))) ||
      (selectedRegion === "south" &&
        (region.includes("south") ||
          region.includes("tamil nadu") ||
          region.includes("andhra pradesh") ||
          region.includes("kerala"))) ||
      (selectedRegion === "north" &&
        region.includes("north") &&
        !region.includes("northeast"));

    return matchesSearch && matchesRegion;
  });

  const classicalDances = filteredDanceStyles.filter(
    (dance) => dance.category === "classical"
  );

  const folkDances = filteredDanceStyles.filter(
    (dance) => dance.category === "folk"
  );

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar onSearch={setSearchQuery} />

      {/* ============================================================
          HERO
      ============================================================ */}

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
              transform: "translate(-50%, -50%)",
              border: "none",
              opacity: 0.72,
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

        <div className="absolute left-0 right-0 bottom-0 h-32 bg-gradient-to-t from-[#F8F1E6] to-transparent opacity-20" />

        <div className="relative z-20 flex h-full max-w-7xl mx-auto px-7 sm:px-12 lg:px-20 items-center">
          <div className="max-w-4xl pt-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-4 py-2 text-[10px] sm:text-xs font-bold tracking-widest text-white uppercase shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#E3B23C] animate-pulse" />

              <span>Classical Indian Dance Academy</span>

              <span className="text-white/40">•</span>

              <span className="text-[#E3B23C]">Est. 2026</span>
            </div>

            <h1 className="mt-7 text-5xl sm:text-7xl lg:text-8xl xl:text-[8.5rem] font-black uppercase font-mono tracking-[-0.055em] leading-[0.82] text-white drop-shadow-2xl">
              RHYTHM
              <br />
              <span className="text-[#D4492F]">OF INDIA</span>
            </h1>

            <div className="mt-7 max-w-xl">
              <p className="text-sm sm:text-lg lg:text-xl leading-relaxed text-white/80 font-medium">
                Learn India&apos;s classical dance traditions through
                movement, rhythm, expression and storytelling.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="#classical-forms"
                className="group inline-flex items-center gap-3 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wide text-white shadow-2xl shadow-black/30 transition-all duration-300 hover:-translate-y-1"
              >
                <span>Explore Dance Forms</span>

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
              >
                <Sparkles size={15} className="text-[#E3B23C]" />

                <span>Get Lifetime Pass</span>
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#E3B23C]" />
                Structured Lessons
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/20" />

              <div className="flex items-center gap-2">
                <Camera size={14} className="text-[#E3B23C]" />
                AI Practice
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/20" />

              <div className="flex items-center gap-2">
                <Award size={14} className="text-[#E3B23C]" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-24 space-y-16">
        {/* ============================================================
            CONTINUE LEARNING
        ============================================================ */}

        <section className="group relative overflow-hidden rounded-[32px] bg-[#111111] text-[#F8F1E6] border border-[#292929] shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

          <div className="grid lg:grid-cols-12 min-h-[390px]">
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#242424] border border-white/10 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                  <Flame
                    size={13}
                    className="text-[#E3B23C]"
                  />

                  <span>Continue Learning</span>

                  <span className="text-[#666666]">•</span>

                  <span className="text-gray-400">
                    {activeDance.editorialTag}
                  </span>
                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black uppercase font-mono tracking-tight leading-[0.9]">
                  {activeDance.name}
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                  {activeCurrentLesson?.title} —{" "}
                  {activeDance.tagline}
                </p>

                {activeDance.guru && (
                  <p className="mt-3 text-xs text-gray-500 italic">
                    Taught in the tradition of{" "}
                    {activeDance.guru}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-500 font-mono">
                    Current Progress
                  </p>

                  <p className="mt-1 text-base sm:text-lg font-black font-mono">
                    Lesson {activeCurrentLessonIndex + 1} of{" "}
                    {activeDance.lessons.length}

                    <span className="ml-2 text-[#E3B23C]">
                      (
                      {getProgress(
                        activeDance.slug,
                        activeDance.lessons.length
                      )}
                      %)
                    </span>
                  </p>
                </div>

                <Link
                  href={`/dance/${activeDance.slug}`}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Play
                    size={14}
                    className="fill-white"
                  />

                  <span>Resume Lesson</span>

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
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
            </div>
          </div>
        </section>

        {/* ============================================================
            YOUR LESSONS
        ============================================================ */}

        <section className="rounded-[28px] bg-[#EFE7DA] border border-[#E8DEC8] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#B42318] font-black text-lg">
                  ✦
                </span>

                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-mono">
                  Your Learning Journey
                </h2>
              </div>

              <p className="mt-1 text-xs sm:text-sm text-[#777777] font-semibold">
                <span className="text-[#B42318] font-black">
                  {totalCompletedCount}
                </span>{" "}
                of {totalLessonsCount} lessons completed{" "}
                <span className="text-[#111111]">
                  ({overallPercentage}%)
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/certificate"
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E8DEC8] px-4 py-2 text-xs font-bold hover:bg-[#F8F1E6] transition-colors"
              >
                <Award
                  size={14}
                  className="text-[#B42318]"
                />

                Certificates
              </Link>

              <Link
                href="#classical-forms"
                className="rounded-full bg-[#111111] hover:bg-[#222222] text-white px-4 py-2 text-xs font-bold transition-colors"
              >
                Explore
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 sm:gap-2">
            {Array.from({ length: 16 }).map((_, index) => {
              const segmentPercent =
                (index + 1) * (100 / 16);

              const filled =
                overallPercentage >= segmentPercent;

              return (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    filled
                      ? "bg-[#B42318]"
                      : "bg-[#E8DEC8]"
                  }`}
                />
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold font-mono text-[#777777]">
            <span>Beginning</span>

            <span className="hidden sm:block">
              Keep moving forward
            </span>

            <span>Mastery</span>
          </div>
        </section>

        {/* ============================================================
            CLASSICAL TRADITIONS
        ============================================================ */}

        <section
          id="classical-forms"
          className="space-y-7 scroll-mt-24"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                <span>01 // CURRICULUM</span>
              </div>

              <h2 className="mt-1 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                Classical Traditions
              </h2>

              <p className="mt-2 text-sm text-[#777777] max-w-xl">
                Explore India&apos;s classical dance traditions
                through structured lessons and guided practice.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#EFE7DA] border border-[#E8DEC8] p-1 rounded-full text-[10px] sm:text-xs font-bold overflow-x-auto max-w-full">
              {[
                { id: "all", label: "All Traditions" },
                { id: "east", label: "East & NE" },
                { id: "south", label: "South" },
                { id: "north", label: "North" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    selectedRegion === tab.id
                      ? "bg-[#111111] text-[#F8F1E6] shadow-sm"
                      : "text-[#777777] hover:text-[#111111]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {classicalDances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {classicalDances.map((dance, index) => (
                <div
                  key={dance.slug}
                  className="group transition-transform duration-300 hover:-translate-y-1"
                >
                  <DanceCard
                    dance={dance}
                    index={index}
                    featured={index === 0}
                  />
                </div>
              ))}
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

              <p className="mt-1 text-sm text-[#777777]">
                Try another search or region.
              </p>
            </div>
          )}
        </section>

        {/* ============================================================
            RHYTHM MERCH
        ============================================================ */}

        <MerchSection />

        {/* ============================================================
            AI PRACTICE
        ============================================================ */}

        <section className="relative overflow-hidden rounded-[32px] bg-[#111111] border border-[#292929] text-white shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

          <div className="absolute -right-32 -top-32 w-80 h-80 rounded-full border border-[#B42318]/10" />

          <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full border border-[#E3B23C]/10" />

          <div className="relative z-10 p-7 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-7">
              <div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#E3B23C] uppercase tracking-[0.2em] font-mono">
                  <Sparkles size={14} />
                  <span>02 // RHYTHM AI</span>
                </div>

                <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                  Practice.
                  <span className="text-[#D4492F]">
                    {" "}
                    Improve.
                  </span>
                </h2>

                <p className="mt-3 text-sm text-gray-400 max-w-2xl leading-relaxed">
                  Use your camera to practice movement and receive
                  real-time feedback based on pose geometry,
                  movement timing and reference positions.
                </p>
              </div>

              <Link
                href={`/practice/${activeDance.slug}`}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:-translate-y-1"
              >
                <Camera size={15} />

                <span>Start AI Practice</span>

                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

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

                {practiceStats.totalSessions > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-green-500">
                    <CheckCircle2 size={12} />
                    Verified Session
                  </div>
                )}
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
                  Your highest Rhythm AI score
                </p>
              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Practice Sessions
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono">
                  {practiceStats.totalSessions}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  Sessions recorded
                </p>
              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 sm:p-5">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono font-bold text-gray-500">
                  Reps Perfected
                </p>

                <p className="mt-2 text-3xl sm:text-4xl font-black font-mono">
                  {practiceStats.totalReps}
                </p>

                <p className="mt-2 text-[10px] text-gray-500">
                  Completed movement reps
                </p>
              </div>
            </div>

            {practiceSessions.length > 0 ? (
              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] font-mono text-gray-500">
                    Recent Practice
                  </h3>

                  <Link
                    href={`/practice/${activeDance.slug}`}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#E3B23C] hover:text-white transition-colors"
                  >
                    Practice Again
                  </Link>
                </div>

                <div className="space-y-2">
                  {practiceSessions
                    .slice(0, 3)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#181818] border border-white/5 p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#B42318] flex items-center justify-center font-black font-mono text-xs">
                            {session.overallScore}%
                          </div>

                          <div>
                            <p className="text-xs sm:text-sm font-bold">
                              {session.movementName}
                            </p>

                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {session.danceName} ·{" "}
                              {session.durationSeconds}s ·{" "}
                              {new Date(
                                session.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/practice/${session.danceSlug}?lesson=${session.lessonIndex}`}
                          className="self-end sm:self-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                        >
                          Practice Again
                          <ChevronRight size={13} />
                        </Link>
                      </div>
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
                  Step in front of your camera and perform your
                  first movement. Your practice score will appear
                  here after the session.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            REVIEWS
        ============================================================ */}

        <section className="rounded-[32px] bg-[#EFE7DA] border border-[#E8DEC8] overflow-hidden">
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-8 p-7 sm:p-10 lg:p-12">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                <MessageSquare size={14} />

                <span>03 // COMMUNITY</span>
              </div>

              <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight leading-[0.95]">
                What do you think
                <br />
                <span className="text-[#B42318]">
                  of Rhythm of India?
                </span>
              </h2>

              <p className="mt-5 text-sm sm:text-base text-[#666666] max-w-2xl leading-relaxed">
                Your feedback helps us improve the academy,
                lessons and AI practice experience. Share your
                thoughts after trying the platform.
              </p>

              <div className="flex flex-wrap gap-3 mt-7">
                <Link
                  href="/reviews"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#B42318] hover:bg-[#D4492F] text-white px-6 py-3.5 text-xs font-black uppercase tracking-wide transition-all duration-300 hover:-translate-y-1"
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
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E8DEC8] hover:border-[#B42318]/30 px-6 py-3.5 text-xs font-bold transition-all duration-300"
                >
                  <MessageSquare size={14} />

                  Read Reviews
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#111111] text-white p-7 sm:p-10 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full border border-[#B42318]/20" />

              <div className="relative z-10">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={19}
                      className="fill-[#E3B23C] text-[#E3B23C]"
                    />
                  ))}
                </div>

                <p className="mt-5 text-xl sm:text-2xl font-black uppercase font-mono leading-tight">
                  Every dancer has a
                  <span className="text-[#D4492F]">
                    {" "}
                    voice.
                  </span>
                </p>

                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Rate your coaching experience and the website
                  separately through our review page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FOLK & TRADITIONAL
        ============================================================ */}

        <section
          id="folk-forms"
          className="space-y-7 scroll-mt-24"
        >
          <div className="border-t border-[#E8DEC8] pt-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-[#B42318] uppercase tracking-[0.2em] font-mono">
                  04 // EXPLORE
                </div>

                <h2 className="mt-1 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
                  Folk & Traditional
                </h2>

                <p className="mt-2 text-sm text-[#777777] max-w-xl">
                  Discover vibrant regional dance traditions from
                  across India.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#777777]">
                <span>Across India</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          {folkDances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {folkDances.map((dance, index) => (
                <div
                  key={dance.slug}
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <DanceCard
                    dance={dance}
                    index={index}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E8DEC8] bg-[#EFE7DA] p-10 text-center">
              <p className="font-bold text-[#111111]">
                Folk traditions are coming soon.
              </p>

              <p className="mt-1 text-sm text-[#777777]">
                More regional dance forms will be added to the
                academy.
              </p>
            </div>
          )}
        </section>

        {/* ============================================================
            FINAL SNAPSHOT
        ============================================================ */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group rounded-3xl bg-[#111111] text-white p-6 border border-[#292929] transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#B42318] flex items-center justify-center">
                <BookOpen size={20} />
              </div>

              <TrendingUp
                size={18}
                className="text-[#E3B23C]"
              />
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-gray-500">
              Lessons Completed
            </p>

            <p className="mt-1 text-4xl font-black font-mono">
              {totalCompletedCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Across your learning journey
            </p>
          </div>

          <div className="group rounded-3xl bg-[#EFE7DA] border border-[#E8DEC8] p-6 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#B42318] text-white flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>

              <span className="text-xs font-black font-mono text-[#B42318]">
                {overallPercentage}%
              </span>
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-[#777777]">
              Overall Progress
            </p>

            <p className="mt-1 text-4xl font-black font-mono">
              {overallPercentage}%
            </p>

            <div className="mt-3 h-2 bg-[#E8DEC8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B42318] rounded-full transition-all duration-700"
                style={{
                  width: `${overallPercentage}%`,
                }}
              />
            </div>
          </div>

          <div className="group rounded-3xl bg-white border border-[#E8DEC8] p-6 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
                <Award size={20} />
              </div>

              <span className="text-[#E3B23C] text-xl">
                ✦
              </span>
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.18em] font-bold font-mono text-[#777777]">
              Current Path
            </p>

            <p className="mt-1 text-2xl font-black uppercase font-mono">
              {activeDance.name}
            </p>

            <p className="mt-1 text-xs text-[#777777]">
              Keep building your practice
            </p>
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer
        className="mt-12 bg-[#111111] text-[#F8F1E6] overflow-hidden relative shadow-2xl pt-24 sm:pt-32 flex flex-col justify-between"
        style={{ minHeight: "76vh" }}
      >
        <div className="px-8 sm:px-14 lg:px-24 flex-grow relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-7">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#B42318] flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-[#B42318]/20">
                  ♫
                </div>

                <div>
                  <p className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tighter">
                    RHYTHM OF INDIA
                  </p>

                  <p className="text-xs sm:text-sm text-[#777777] uppercase tracking-widest font-bold">
                    Classical Dance Academy
                  </p>
                </div>
              </div>

              <p className="text-[#999999] text-base sm:text-lg max-w-lg leading-relaxed mb-9">
                Preserving India&apos;s movement arts through a
                premium digital academy. Learn, practice and
                experience the traditions behind India&apos;s
                classical and folk dances.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#"
                  aria-label="X"
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#B42318] hover:border-[#B42318] transition-all duration-300 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#B42318] hover:border-[#B42318] transition-all duration-300 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#B42318] hover:border-[#B42318] transition-all duration-300 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#B42318] hover:border-[#B42318] transition-all duration-300 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#777777] uppercase tracking-[0.2em] font-mono mb-6">
                Academy
              </h5>

              <ul className="space-y-4 text-sm text-gray-300 font-medium">
                <li>
                  <Link
                    href="/dashboard#classical-forms"
                    className="hover:text-white transition-colors"
                  >
                    Classical Traditions
                  </Link>
                </li>

                <li>
                  <Link
                    href="/dashboard#folk-forms"
                    className="hover:text-white transition-colors"
                  >
                    Folk Dances
                  </Link>
                </li>

                <li>
                  <Link
                    href="/learning"
                    className="hover:text-white transition-colors"
                  >
                    My Learning
                  </Link>
                </li>

                <li>
                  <Link
                    href={`/practice/${activeDance.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    AI Practice
                  </Link>
                </li>

                <li>
                  <Link
                    href="/reviews"
                    className="hover:text-white transition-colors"
                  >
                    Reviews
                  </Link>
                </li>

                <li>
                  <Link
                    href="/certificate"
                    className="hover:text-white transition-colors"
                  >
                    Certificates
                  </Link>
                </li>

                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing Plans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#777777] uppercase tracking-[0.2em] font-mono mb-6">
                Connect
              </h5>

              <ul className="space-y-4 text-sm text-gray-300 font-medium">
                <li>
                  <a
                    href="https://github.com/heyaurav01/Rhythmdance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub Repository
                  </a>
                </li>

                <li>
                  <a
                    href="mailto:megouravpaul2003@gmail.com"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>

                <li>
                  <Link
                    href="/settings"
                    className="hover:text-white transition-colors"
                  >
                    Settings
                  </Link>
                </li>

                <li>
                  <Link
                    href="/profile"
                    className="hover:text-white transition-colors"
                  >
                    My Profile
                  </Link>
                </li>
              </ul>

              <div className="mt-8 inline-flex items-center gap-2 bg-[#B42318]/15 border border-[#B42318]/30 text-[#E3B23C] px-4 py-2 rounded-xl text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-[#B42318] animate-pulse" />
                RHYTHM OF INDIA
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 text-[24vw] leading-none font-black font-sans text-white/[0.025] tracking-tighter pointer-events-none select-none z-0 whitespace-nowrap">
          rhythmofindia
        </div>

        <div className="mt-16 px-8 sm:px-14 lg:px-24 py-7 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 bg-black/30 backdrop-blur-md">
          <p className="text-xs text-[#777777] font-mono font-medium">
            © 2026 Rhythm of India. All rights reserved.
          </p>

          <a
            href="https://github.com/heyaurav01/Rhythmdance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#777777] hover:text-[#E3B23C] font-mono transition-colors flex items-center gap-2 font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483.013-1.703-2.782.605-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>

            heyaurav01/Rhythmdance
          </a>
        </div>
      </footer>
    </div>
  );
}