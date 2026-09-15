"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import Navbar from "@/components/Navbar";
import { danceStyles, type DanceStyle } from "@/data/danceData";

import {
  ArrowRight,
  Award,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  LogOut,
  Mail,
  Medal,
  Pencil,
  Play,
  Save,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first_lesson",
    title: "First Step",
    description: "Complete your first lesson",
    icon: "👣",
  },
  {
    id: "five_lessons",
    title: "Dedicated Learner",
    description: "Complete 5 lessons",
    icon: "📚",
  },
  {
    id: "ten_practices",
    title: "Practice Warrior",
    description: "Complete 10 AI practice sessions",
    icon: "⚔️",
  },
  {
    id: "seven_day_streak",
    title: "7 Day Rhythm",
    description: "Practice for 7 days",
    icon: "🔥",
  },
  {
    id: "precision_dancer",
    title: "Precision Dancer",
    description: "Achieve a 90% AI score",
    icon: "🎯",
  },
  {
    id: "course_champion",
    title: "Course Champion",
    description: "Complete a dance course",
    icon: "🏆",
  },
];

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const {
    completedLessons,
    getProgress,
    getPracticeStats,
    practiceSessions,
  } = useProgress();

  const router = useRouter();

  const [customName, setCustomName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("roi_user_profile");

      if (stored) {
        const data = JSON.parse(stored);

        if (data.name) {
          setCustomName(data.name);
        }

        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      }
    } catch {
      // Ignore malformed local profile data.
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F1E6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-full border-4 border-[#B42318] border-t-transparent animate-spin" />

          <p className="font-mono font-black text-xs tracking-[0.2em] text-[#777777] animate-pulse">
            LOADING PROFILE...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const practiceStats = getPracticeStats();

  const displayName =
    customName.trim() ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Rhythm Learner";

  const displayEmail = user.email || "Guest account";

  const profileImage = avatarUrl || user.photoURL || "";

  const initial =
    displayName.trim().charAt(0).toUpperCase() || "R";

  /* ============================================================
     OVERALL LESSON PROGRESS
  ============================================================ */

  const totalLessons = danceStyles.reduce(
    (total, dance) => total + dance.lessons.length,
    0
  );

  const totalCompletedLessons = Object.values(completedLessons).reduce(
    (total, lessons) => total + lessons.length,
    0
  );

  const overallProgress = Math.round(
    (totalCompletedLessons / Math.max(1, totalLessons)) * 100
  );

  /* ============================================================
     COURSE COMPLETION
  ============================================================ */

  const completedCourses = danceStyles.filter(
    (dance) =>
      (completedLessons[dance.slug]?.length || 0) >= dance.lessons.length
  ).length;

  /* ============================================================
     PRACTICE HOURS
  ============================================================ */

  const totalPracticeSeconds = practiceSessions.reduce(
    (total, session) =>
      total + (Number(session.durationSeconds) || 0),
    0
  );

  const practiceHours =
    Math.round((totalPracticeSeconds / 3600) * 10) / 10;

  /* ============================================================
     STREAK
  ============================================================ */

  const currentStreak = Number(practiceStats.currentStreak) || 0;
  const bestStreak = Number(practiceStats.bestStreak) || 0;

  /* ============================================================
     AI SCORES
  ============================================================ */

  const bestScore =
    practiceSessions.length > 0
      ? Math.max(
          ...practiceSessions.map(
            (session) => Number(session.overallScore) || 0
          )
        )
      : 0;

  const averageScore =
    practiceSessions.length > 0
      ? Math.round(
          practiceSessions.reduce(
            (total, session) =>
              total + (Number(session.overallScore) || 0),
            0
          ) / practiceSessions.length
        )
      : 0;

  /* ============================================================
     ACHIEVEMENTS
  ============================================================ */

  const achievementUnlocked = {
    first_lesson: totalCompletedLessons >= 1,

    five_lessons: totalCompletedLessons >= 5,

    ten_practices: practiceStats.totalSessions >= 10,

    seven_day_streak:
      currentStreak >= 7 || bestStreak >= 7,

    precision_dancer: bestScore >= 90,

    course_champion: completedCourses >= 1,
  };

  const unlockedAchievements = Object.values(
    achievementUnlocked
  ).filter(Boolean).length;

  /* ============================================================
     SAVE PROFILE
  ============================================================ */

  const openEditProfile = () => {
    setEditName(displayName);
    setEditAvatar(avatarUrl);
    setEditOpen(true);
  };

  const saveProfile = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) return;

    setSaving(true);

    try {
      const profileData = {
        name: trimmedName,
        avatarUrl: editAvatar.trim(),
      };

      localStorage.setItem(
        "roi_user_profile",
        JSON.stringify(profileData)
      );

      setCustomName(trimmedName);
      setAvatarUrl(editAvatar.trim());

      window.dispatchEvent(
        new Event("roi_profile_updated")
      );

      setEditOpen(false);
    } catch (error) {
      console.error("Unable to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  /* ============================================================
     DANCE COURSE DATA
  ============================================================ */

  const courseData = useMemo(() => {
    return danceStyles.map((dance) => {
      const completed =
        completedLessons[dance.slug]?.length || 0;

      const total = dance.lessons.length;

      const percentage = Math.round(
        (completed / Math.max(1, total)) * 100
      );

      return {
        dance,
        completed,
        total,
        percentage,
        isComplete: completed >= total,
      };
    });
  }, [completedLessons]);

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-7">

          {/* ========================================================
              PROFILE HERO
          ======================================================== */}

          <section className="relative overflow-hidden rounded-[32px] bg-[#111111] text-white shadow-2xl border border-[#292929]">
            {/* Decorative background */}
            <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full border border-[#B42318]/20" />
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border border-[#E3B23C]/10" />
            <div className="absolute -left-28 -bottom-32 w-80 h-80 rounded-full border border-white/5" />

            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B42318] via-[#E3B23C] to-[#B42318]" />

            <div className="relative z-10 p-6 sm:p-9 lg:p-11">

              {/* Top label */}
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-2">
                  <User size={13} className="text-[#E3B23C]" />

                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] font-mono text-gray-300">
                    YOUR PROFILE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={openEditProfile}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Pencil size={13} />
                  <span className="hidden sm:inline">
                    Edit Profile
                  </span>
                  <span className="sm:hidden">
                    Edit
                  </span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="absolute inset-[-6px] rounded-full bg-gradient-to-br from-[#B42318] via-[#E3B23C] to-transparent opacity-70 blur-sm" />

                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#F8F1E6] bg-[#242424] overflow-hidden flex items-center justify-center shadow-2xl">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt={`${displayName} profile`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <span className="text-5xl sm:text-6xl font-black font-mono text-white">
                        {initial}
                      </span>
                    )}
                  </div>

                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#B42318] border-4 border-[#111111] flex items-center justify-center">
                    <Check size={15} strokeWidth={3} />
                  </div>
                </div>

                {/* Identity */}
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E3B23C] font-mono">
                    RHYTHM OF INDIA ACADEMY
                  </p>

                  <h1 className="mt-2 text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight break-words">
                    {displayName}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B42318] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles size={11} />
                      Classical Scholar
                    </span>

                    {!user.isAnonymous && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-gray-300">
                        <CheckCircle2 size={11} className="text-green-400" />
                        Verified Account
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <Mail size={13} />
                    <span className="truncate max-w-[280px]">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile progress */}
              <div className="mt-9 pt-7 border-t border-white/10">
                <div className="flex items-end justify-between gap-4 mb-2.5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 font-mono">
                      DANCE JOURNEY
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-300">
                      {overallProgress === 0
                        ? "Your journey has just begun."
                        : overallProgress >= 100
                        ? "You've mastered the academy curriculum."
                        : "Keep moving forward toward mastery."}
                    </p>
                  </div>

                  <span className="text-2xl font-black font-mono text-[#E3B23C]">
                    {overallProgress}%
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#B42318] to-[#E3B23C] transition-all duration-700"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              STATS
          ======================================================== */}

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

            <ProfileStatCard
              icon={<GraduationCap size={19} />}
              label="COURSES COMPLETED"
              value={completedCourses.toString()}
              detail={`of ${danceStyles.length} courses`}
              accent="red"
            />

            <ProfileStatCard
              icon={<BookOpen size={19} />}
              label="LESSONS COMPLETED"
              value={totalCompletedLessons.toString()}
              detail={`of ${totalLessons} lessons`}
              accent="blue"
            />

            <ProfileStatCard
              icon={<Clock3 size={19} />}
              label="PRACTICE HOURS"
              value={practiceHours.toFixed(1)}
              detail={`${practiceStats.totalSessions} AI sessions`}
              accent="gold"
            />

            <ProfileStatCard
              icon={<Flame size={19} />}
              label="CURRENT STREAK"
              value={currentStreak.toString()}
              detail={`Best: ${bestStreak} days`}
              accent="orange"
            />

          </section>

          {/* ========================================================
              TWO COLUMN AREA
          ======================================================== */}

          <div className="grid lg:grid-cols-12 gap-6">

            {/* ======================================================
                MY COURSES
            ====================================================== */}

            <section className="lg:col-span-8 rounded-[30px] bg-white border border-[#E8DEC8] shadow-sm overflow-hidden">

              <div className="p-6 sm:p-8 border-b border-[#E8DEC8]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#B42318]">
                      <BookOpen size={15} />

                      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                        YOUR LEARNING
                      </span>
                    </div>

                    <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight">
                      My Courses
                    </h2>

                    <p className="mt-1 text-xs text-[#777777]">
                      Track your progress across every dance tradition.
                    </p>
                  </div>

                  <Link
                    href="/learning"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#111111] text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-[#B42318] transition-colors"
                  >
                    View Learning
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-3">
                {courseData.map(
                  ({
                    dance,
                    completed,
                    total,
                    percentage,
                    isComplete,
                  }) => (
                    <CourseProgressRow
                      key={dance.slug}
                      dance={dance}
                      completed={completed}
                      total={total}
                      percentage={percentage}
                      isComplete={isComplete}
                    />
                  )
                )}
              </div>

              <div className="px-6 pb-6 sm:hidden">
                <Link
                  href="/learning"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] text-white px-5 py-3 text-xs font-black uppercase tracking-wider"
                >
                  View All Courses
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>

            {/* ======================================================
                PROFILE SNAPSHOT
            ====================================================== */}

            <aside className="lg:col-span-4 space-y-4">

              {/* AI Performance */}
              <div className="rounded-[28px] bg-[#111111] text-white border border-[#292929] p-6 shadow-xl overflow-hidden relative">
                <div className="absolute -right-14 -top-14 w-36 h-36 rounded-full border border-[#B42318]/20" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#B42318]/15 border border-[#B42318]/25 flex items-center justify-center">
                      <Zap
                        size={17}
                        className="text-[#E3B23C]"
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#E3B23C] font-mono">
                        RHYTHM AI
                      </p>

                      <p className="text-xs font-bold">
                        Performance
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MiniMetric
                      label="BEST SCORE"
                      value={
                        practiceSessions.length > 0
                          ? `${bestScore}%`
                          : "—"
                      }
                    />

                    <MiniMetric
                      label="AVERAGE"
                      value={
                        practiceSessions.length > 0
                          ? `${averageScore}%`
                          : "—"
                      }
                    />
                  </div>

                  <Link
                    href="/practice/odissi?lesson=0"
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all hover:-translate-y-0.5"
                  >
                    <Camera size={13} />
                    Practice With AI
                  </Link>
                </div>
              </div>

              {/* Certificates */}
              <div className="rounded-[28px] bg-[#EFE7DA] border border-[#E8DEC8] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#E8DEC8] flex items-center justify-center">
                      <Award
                        size={19}
                        className="text-[#B42318]"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-black uppercase font-mono">
                      Certificates
                    </h3>

                    <p className="mt-1 text-xs text-[#777777] leading-relaxed">
                      Certificates unlock automatically when you complete
                      a full dance curriculum.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-white border border-[#E8DEC8] p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#777777] font-mono">
                      UNLOCKED
                    </p>

                    <p className="mt-1 text-2xl font-black font-mono">
                      {completedCourses}
                    </p>
                  </div>

                  <Link
                    href="/certificate"
                    className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center hover:bg-[#B42318] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>

            </aside>
          </div>

          {/* ========================================================
              ACHIEVEMENTS
          ======================================================== */}

          <section className="rounded-[30px] bg-white border border-[#E8DEC8] shadow-sm overflow-hidden">

            <div className="p-6 sm:p-8 border-b border-[#E8DEC8]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div>
                  <div className="flex items-center gap-2 text-[#B42318]">
                    <Trophy size={15} />

                    <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                      MILESTONES
                    </span>
                  </div>

                  <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight">
                    Achievements
                  </h2>

                  <p className="mt-1 text-xs text-[#777777]">
                    Every lesson, practice and streak moves you closer
                    to mastery.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F1E6] border border-[#E8DEC8] px-4 py-2">
                  <Medal
                    size={14}
                    className="text-[#B42318]"
                  />

                  <span className="text-xs font-black font-mono">
                    {unlockedAchievements}/6
                  </span>

                  <span className="text-[10px] text-[#777777] font-bold">
                    UNLOCKED
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:p-6">
              {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
                const unlocked =
                  achievementUnlocked[
                    achievement.id as keyof typeof achievementUnlocked
                  ];

                return (
                  <AchievementCard
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    icon={achievement.icon}
                    unlocked={unlocked}
                  />
                );
              })}
            </div>
          </section>

          {/* ========================================================
              STREAK / MOTIVATION
          ======================================================== */}

          <section className="relative overflow-hidden rounded-[30px] bg-[#111111] text-white border border-[#292929] p-6 sm:p-8">

            <div className="absolute right-[-80px] top-[-80px] w-56 h-56 rounded-full border border-[#B42318]/20" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#B42318]/15 border border-[#B42318]/30 flex items-center justify-center shrink-0">
                  <Flame
                    size={27}
                    className="text-[#E3B23C]"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E3B23C] font-mono">
                    KEEP THE RHYTHM ALIVE
                  </p>

                  <h3 className="mt-1 text-xl sm:text-2xl font-black uppercase font-mono">
                    {currentStreak > 0
                      ? `${currentStreak} day streak`
                      : "Start your streak"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {currentStreak > 0
                      ? "Come back tomorrow and keep it going."
                      : "One practice session is all it takes to begin."}
                  </p>
                </div>
              </div>

              <Link
                href="/practice/odissi?lesson=0"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B42318] hover:bg-[#D4492F] px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5"
              >
                <Play
                  size={14}
                  className="fill-white"
                />
                Practice Today
                <ArrowRight size={14} />
              </Link>

            </div>
          </section>

          {/* ========================================================
              ACCOUNT ACTIONS
          ======================================================== */}

          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[24px] border border-[#E8DEC8] bg-[#EFE7DA] p-5">

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E8DEC8] flex items-center justify-center">
                <User
                  size={16}
                  className="text-[#B42318]"
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase font-mono">
                  Account
                </p>

                <p className="text-[10px] text-[#777777]">
                  Manage your academy profile and preferences.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">

              <Link
                href="/settings"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E8DEC8] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider hover:border-[#B42318]/40 transition-colors"
              >
                Settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-[#B42318] text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                Logout
              </button>

            </div>
          </section>

        </div>
      </main>

      {/* ============================================================
          EDIT PROFILE MODAL
      ============================================================ */}

      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[30px] bg-white border border-[#E8DEC8] shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E8DEC8]">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8F1E6] flex items-center justify-center">
                  <Pencil
                    size={17}
                    className="text-[#B42318]"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B42318] font-mono">
                    PROFILE SETTINGS
                  </p>

                  <h2 className="text-lg font-black uppercase font-mono">
                    Edit Profile
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="w-9 h-9 rounded-full bg-[#EFE7DA] hover:bg-[#E8DEC8] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={17} />
              </button>

            </div>

            {/* Modal body */}
            <div className="p-5 sm:p-6 space-y-5">

              {/* Avatar preview */}
              <div className="flex items-center gap-4">

                <div className="w-20 h-20 rounded-full bg-[#111111] overflow-hidden flex items-center justify-center shrink-0">

                  {editAvatar.trim() ? (
                    <img
                      src={editAvatar.trim()}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-black text-white font-mono">
                      {editName.trim().charAt(0).toUpperCase() || initial}
                    </span>
                  )}

                </div>

                <div>
                  <p className="text-sm font-black">
                    Profile Photo
                  </p>

                  <p className="mt-1 text-[11px] text-[#777777] leading-relaxed">
                    Paste a public image URL below. Leave it empty to use
                    your Google profile photo.
                  </p>
                </div>

              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#777777] font-mono mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-[#E8DEC8] bg-[#F8F1E6] px-4 py-3.5 text-sm font-bold text-[#111111] outline-none focus:border-[#B42318] focus:bg-white transition-colors"
                />
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#777777] font-mono mb-2">
                  Avatar URL
                </label>

                <div className="relative">
                  <Camera
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]"
                  />

                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(event) =>
                      setEditAvatar(event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-[#E8DEC8] bg-[#F8F1E6] pl-11 pr-4 py-3.5 text-sm font-medium text-[#111111] outline-none focus:border-[#B42318] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full bg-[#EFE7DA] hover:bg-[#E8DEC8] px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || !editName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B42318] hover:bg-[#D4492F] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PROFILE STAT CARD
================================================================ */

function ProfileStatCard({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: "red" | "blue" | "gold" | "orange";
}) {
  const accentStyles = {
    red: {
      iconBg: "bg-[#B42318]/10",
      iconText: "text-[#B42318]",
      line: "from-[#B42318] to-[#D4492F]",
    },
    blue: {
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-600",
      line: "from-blue-500 to-cyan-400",
    },
    gold: {
      iconBg: "bg-[#E3B23C]/15",
      iconText: "text-[#B08416]",
      line: "from-[#E3B23C] to-[#D9A526]",
    },
    orange: {
      iconBg: "bg-orange-500/10",
      iconText: "text-orange-600",
      line: "from-orange-500 to-red-500",
    },
  };

  const style = accentStyles[accent];

  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white border border-[#E8DEC8] p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#B42318]/20">

      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">

        <div
          className={`w-10 h-10 rounded-2xl ${style.iconBg} ${style.iconText} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>

        <div className="text-right">
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-[#999999] font-mono">
            {label}
          </p>

          <p className="mt-1 text-2xl sm:text-3xl font-black font-mono tracking-tight">
            {value}
          </p>
        </div>

      </div>

      <p className="mt-4 text-[10px] sm:text-xs text-[#777777] font-medium">
        {detail}
      </p>

      <div className="mt-3 h-1 rounded-full bg-[#EFE7DA] overflow-hidden">
        <div
          className={`h-full w-1/2 rounded-full bg-gradient-to-r ${style.line} transition-all duration-500 group-hover:w-full`}
        />
      </div>

    </div>
  );
}

/* ================================================================
   COURSE PROGRESS ROW
================================================================ */

function CourseProgressRow({
  dance,
  completed,
  total,
  percentage,
  isComplete,
}: {
  dance: DanceStyle;
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}) {
  return (
    <Link
      href={`/dance/${dance.slug}`}
      className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-[#E8DEC8] bg-[#FDFBF7] p-3.5 sm:p-4 hover:bg-white hover:border-[#B42318]/25 hover:shadow-sm transition-all"
    >

      {/* Course image */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#EFE7DA]">

        {dance.image ? (
          <Image
            src={dance.image}
            alt={dance.name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={20} className="text-[#B42318]" />
          </div>
        )}

        {isComplete && (
          <div className="absolute inset-0 bg-[#111111]/50 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-[#22C55E] flex items-center justify-center">
              <Check size={15} strokeWidth={3} />
            </div>
          </div>
        )}

      </div>

      {/* Course information */}
      <div className="flex-1 min-w-0">

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black uppercase font-mono truncate">
              {dance.name}
            </h3>

            <p className="mt-0.5 text-[10px] sm:text-xs text-[#777777] truncate">
              {isComplete
                ? "Course completed"
                : `${completed}/${total} lessons completed`}
            </p>
          </div>

          <span
            className={`text-sm sm:text-base font-black font-mono shrink-0 ${
              isComplete
                ? "text-green-600"
                : percentage > 0
                ? "text-[#B42318]"
                : "text-[#999999]"
            }`}
          >
            {percentage}%
          </span>

        </div>

        <div className="mt-3 h-1.5 rounded-full bg-[#E8DEC8] overflow-hidden">

          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isComplete
                ? "bg-green-500"
                : "bg-gradient-to-r from-[#B42318] to-[#D4492F]"
            }`}
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

      </div>

      {/* Arrow */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isComplete
            ? "bg-green-50 text-green-600"
            : "bg-[#EFE7DA] text-[#777777] group-hover:bg-[#B42318] group-hover:text-white"
        }`}
      >
        {isComplete ? (
          <Check size={14} />
        ) : (
          <ChevronRight size={15} />
        )}
      </div>

    </Link>
  );
}

/* ================================================================
   ACHIEVEMENT CARD
================================================================ */

function AchievementCard({
  title,
  description,
  icon,
  unlocked,
}: {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-4 text-center transition-all duration-300 ${
        unlocked
          ? "border-[#E3B23C]/40 bg-[#FFF9E9] hover:-translate-y-1 hover:shadow-md"
          : "border-[#E8DEC8] bg-[#FDFBF7] opacity-65"
      }`}
    >

      {/* Badge */}
      <div
        className={`relative mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
          unlocked
            ? "bg-[#E3B23C]/15 border-[#E3B23C] shadow-md"
            : "bg-[#EFE7DA] border-[#E8DEC8] grayscale"
        }`}
      >
        {icon}

        {unlocked && (
          <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <Check size={10} color="white" strokeWidth={4} />
          </div>
        )}
      </div>

      <h3
        className={`mt-3 text-xs font-black uppercase font-mono ${
          unlocked ? "text-[#111111]" : "text-[#777777]"
        }`}
      >
        {title}
      </h3>

      <p className="mt-1.5 text-[9px] leading-4 text-[#999999]">
        {description}
      </p>

      <div className="mt-3">
        {unlocked ? (
          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-green-600">
            <CheckCircle2 size={10} />
            Unlocked
          </span>
        ) : (
          <span className="text-[8px] font-black uppercase tracking-wider text-[#AAAAAA]">
            Locked
          </span>
        )}
      </div>

    </div>
  );
}

/* ================================================================
   MINI AI METRIC
================================================================ */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 font-mono">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black font-mono text-[#E3B23C]">
        {value}
      </p>
    </div>
  );
}