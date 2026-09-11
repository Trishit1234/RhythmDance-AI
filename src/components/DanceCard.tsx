"use client";

import Image from "next/image";
import Link from "next/link";
import { useProgress } from "@/context/ProgressContext";
import type { DanceStyle } from "@/data/danceData";
import { ArrowUpRight, BookOpen, Users, Sparkles, CheckCircle2 } from "lucide-react";

interface DanceCardProps {
  dance: DanceStyle;
  index: number;
  featured?: boolean;
}

export default function DanceCard({
  dance,
  index,
  featured = false,
}: DanceCardProps) {
  const { getProgress, completedLessons } = useProgress();
  const progress = getProgress(dance.slug, dance.lessons.length);
  const completedCount = completedLessons[dance.slug]?.length || 0;
  const isAllCompleted = completedCount === dance.lessons.length && dance.lessons.length > 0;

  // Fake avatar initials for learner social proof matching reference
  const avatarColors = ["#B42318", "#252525", "#7F1D1D"];
  const avatarInitials = ["AK", "SM", "RD"];

  return (
    <Link
      href={dance.comingSoon ? "#" : `/dance/${dance.slug}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[#E8DEC8] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-[#B42318]/50 ${
        featured ? "h-[460px] sm:h-[500px]" : "h-[430px] sm:h-[470px]"
      } ${dance.comingSoon ? "cursor-default hover:-translate-y-0 hover:shadow-none hover:border-[#E8DEC8]" : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
      onClick={(e) => {
        if (dance.comingSoon) e.preventDefault();
      }}
    >
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={dance.image}
          alt={dance.name}
          fill
          priority={index < 2}
          className={`object-cover object-top filter transition-all duration-700 ease-out ${
            dance.comingSoon ? "grayscale opacity-60" : "brightness-90 group-hover:scale-108 group-hover:brightness-100"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {/* Subtle Dark Editorial Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black to-black/20 ${
          dance.comingSoon ? "via-black/70" : "via-black/40 group-hover:via-black/30"
        } transition-all duration-500`} />
      </div>

      {/* Card Header: Region & Lessons Badge */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-[#F8F1E6]">
          <span className={`w-1.5 h-1.5 rounded-full ${dance.comingSoon ? "bg-gray-400" : "bg-[#C92A1E]"}`} />
          {dance.editorialTag || dance.region}
        </span>

        {dance.comingSoon ? (
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
            Coming Soon
          </span>
        ) : isAllCompleted ? (
          <span className="inline-flex items-center gap-1 bg-[#B42318] text-white rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-md">
            <CheckCircle2 size={11} />
            Mastered
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-2.5 py-1 text-[10px] font-bold">
            <BookOpen size={11} />
            {dance.lessons.length} Lessons
          </span>
        )}
      </div>

      {/* Card Body & Footer: Title, Meta, Avatars, Progress */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end">
        {/* Editorial Title */}
        <h3 className={`text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-mono leading-none mb-1.5 ${
          !dance.comingSoon ? "group-hover:text-[#F8F1E6] transition-colors" : ""
        }`}>
          {dance.name}
        </h3>

        {/* Subtitle / Tagline */}
        <p className="text-xs sm:text-sm text-gray-200/90 font-medium line-clamp-2 mb-2">
          {dance.tagline}
        </p>

        {/* Guru Lineage Attribution */}
        {!dance.comingSoon && dance.guru && (
          <p className="text-[11px] text-gray-300 italic mb-4">
            by {dance.guru}
          </p>
        )}

        {!dance.comingSoon && (
          <>
            {/* Learner Avatars & Count matching Reference Image */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {avatarInitials.map((init, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-black/50 text-[9px] font-black text-white shadow-sm"
                      style={{ backgroundColor: avatarColors[i % avatarColors.length] }}
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <span className="ml-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-gray-200">
                  {dance.learnersCount || "12K learners"}
                </span>
              </div>

              <span className="text-[11px] font-bold text-gray-300 font-mono">
                {completedCount > 0
                  ? `Lesson ${completedCount}/${dance.lessons.length}`
                  : `0/${dance.lessons.length}`}
                {" · "}
                {dance.duration || "24 min"}
              </span>
            </div>

            {/* Segmented Progress Bar (11 dashes matching reference) */}
            <div className="flex gap-1 w-full mb-3">
              {Array.from({ length: Math.min(dance.lessons.length, 11) }).map((_, idx) => {
                const isDone = idx < completedCount;
                return (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      isDone ? "bg-[#C92A1E]" : "bg-white/30"
                    }`}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Action Button Strip */}
        <div className={`pt-1 flex items-center justify-between border-t border-white/15 text-white ${dance.comingSoon ? "opacity-50 mt-4" : ""}`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase text-gray-200 transition-colors ${
            !dance.comingSoon ? "group-hover:text-white" : ""
          }`}>
            {dance.comingSoon ? "In Production" : completedCount > 0 ? "Continue Watching" : "Start Learning"}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            dance.comingSoon ? "bg-white/10" : "bg-white/20 group-hover:bg-[#B42318] group-hover:translate-x-1"
          }`}>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
