"use client";

import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import Navbar from "@/components/Navbar";
import { danceStyles } from "@/data/danceData";
import Link from "next/link";
import Image from "next/image";
import { Play, BookOpen, Clock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MyLearningPage() {
  const { user } = useAuth();
  const { completedLessons, getProgress } = useProgress();

  // Find all courses the user has started (has at least 1 lesson completed, or just exists in state)
  // For demo purposes, if completedLessons is empty, we will still show a "Getting Started" state.
  const activeSlugs = Object.keys(completedLessons).filter(
    (slug) => completedLessons[slug] && completedLessons[slug].length > 0
  );

  const activeCourses = danceStyles.filter((style) =>
    activeSlugs.includes(style.slug)
  );

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-[#EFE7DA] border border-[#E8DEC8] rounded-full px-4 py-1.5 text-xs font-bold text-[#111111]">
            <BookOpen size={15} className="text-[#B42318]" />
            <span>YOUR DASHBOARD</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#111111] font-mono tracking-tight">
            My Learning
          </h1>
          <p className="text-sm text-[#777777]">
            Pick up right where you left off.
          </p>
        </motion.div>

        {activeCourses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest font-mono text-[#111111] flex items-center gap-2 mb-4">
              <Clock size={16} className="text-[#B42318]" /> In Progress
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {activeCourses.map((course, idx) => {
                const progress = getProgress(course.slug, course.lessons.length);
                const isComplete = progress === 100;
                
                return (
                  <motion.div
                    key={course.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[24px] border border-[#E8DEC8] p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex gap-5 mb-6">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#E8DEC8]">
                        <Image
                          src={course.image}
                          alt={course.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase font-mono tracking-widest text-[#B42318] mb-1 block">
                          {course.region}
                        </span>
                        <h3 className="text-xl font-black uppercase font-mono tracking-tight text-[#111111] mb-1">
                          {course.name}
                        </h3>
                        <p className="text-xs text-[#777777] font-medium">
                          {completedLessons[course.slug]?.length || 0} / {course.lessons.length} Lessons Completed
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-black font-mono mb-1.5">
                          <span className="text-[#777777] uppercase tracking-wider">Progress</span>
                          <span className={isComplete ? "text-green-600" : "text-[#B42318]"}>{progress}%</span>
                        </div>
                        <div className="w-full bg-[#EFE7DA] h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isComplete ? "bg-green-600" : "bg-[#B42318]"}`}
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={isComplete ? `/certificate?dance=${course.name}` : `/dance/${course.slug}`}
                          className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                            isComplete 
                              ? "bg-[#111111] text-white hover:bg-[#252525]"
                              : "bg-[#B42318] text-white hover:bg-[#C92A1E]"
                          }`}
                        >
                          {isComplete ? (
                            <>
                              <CheckCircle2 size={16} /> Get Certificate
                            </>
                          ) : (
                            <>
                              <Play size={14} fill="currentColor" /> Resume
                            </>
                          )}
                        </Link>

                        <Link
                          href={`/practice/${course.slug}`}
                          className="px-3.5 py-3.5 bg-[#EFE7DA] hover:bg-[#E8DEC8] text-[#111111] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          title="Practice with Rhythm AI"
                        >
                          <Sparkles size={14} className="text-[#B42318]" />
                          <span className="hidden sm:inline">Rhythm AI</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-10 sm:p-16 border border-[#E8DEC8] shadow-sm text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-[#FDF2F2] rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-[#B42318]" />
            </div>
            <h2 className="text-2xl font-black uppercase font-mono tracking-tight text-[#111111] mb-2">
              No active courses yet
            </h2>
            <p className="text-sm text-[#777777] mb-8 max-w-sm mx-auto">
              Your learning journey awaits. Start exploring the rich traditions of Indian classical dance.
            </p>
            <Link
              href="/dashboard#classical-forms"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#B42318] text-white hover:bg-[#C92A1E] font-black uppercase tracking-wider text-xs rounded-full transition-all active:scale-95 shadow-xl shadow-[#B42318]/30 cursor-pointer"
            >
              Explore Classical Dances <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
