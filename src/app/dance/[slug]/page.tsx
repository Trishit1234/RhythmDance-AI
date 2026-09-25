"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { getDanceBySlug } from "@/data/danceData";
import Navbar from "@/components/Navbar";
import Quiz from "@/components/Quiz";
import { useCart } from "@/context/CartContext";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Check,
  Circle,
  Play,
  Volume2,
  Maximize2,
  Sparkles,
  Award,
  BookOpen,
  FileText,
  MessageSquare,
  Download,
  Flame,
  HelpCircle,
  Clock,
  Layers,
  Sun,
  Moon,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import {
  getProduct,
  productSizes,
  type ProductSize,
} from "@/data/products";

const costumeProductMap: Record<string, string> = {
  bharatanatyam: "bharatanatyam-costume",
  kathak: "kathak-costume",
  odissi: "odissi-costume",
  kuchipudi: "kuchipudi-costume",
};

export default function DanceLessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const { user, loading } = useAuth();
  const { isCompleted, toggleLesson, getProgress } = useProgress();

  const { addToCart } = useCart();

  const [selectedLesson, setSelectedLesson] = useState(0);

  const [activeTab, setActiveTab] = useState<
    "transcript" | "overview" | "discussions" | "downloads"
  >("transcript");

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [justCompletedAnim, setJustCompletedAnim] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [selectedCostumeSize, setSelectedCostumeSize] =
    useState<ProductSize>("M");

  const dance = getDanceBySlug(slug);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F1E6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />

          <p className="text-[#111111] font-bold font-mono text-sm tracking-wider animate-pulse">
            LOADING LESSON...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!dance) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8F1E6] gap-4 p-6 text-center">
        <p className="text-2xl font-bold font-mono text-[#111111] uppercase">
          Dance form not found
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-[#B42318] text-white rounded-full font-bold text-sm hover:bg-[#C92A1E] transition-colors cursor-pointer shadow-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isQuizView = selectedLesson >= dance.lessons.length;

  const lesson = !isQuizView
    ? dance.lessons[selectedLesson]
    : null;

  const progress = getProgress(
    slug,
    dance.lessons.length
  );

  const isCurrentCompleted = isCompleted(
    slug,
    selectedLesson
  );

  /*
   * ============================================================
   * DANCE-SPECIFIC COSTUME
   * ============================================================
   *
   * The dance slug automatically decides which product appears.
   *
   * Bharatanatyam -> bharatanatyam-costume
   * Kathak        -> kathak-costume
   * Odissi        -> odissi-costume
   * Kuchipudi     -> kuchipudi-costume
   *
   * If a product does not exist, no costume section is shown.
   */

  const costumeProductId =
    costumeProductMap[slug.toLowerCase()];

  const costumeProduct = costumeProductId
    ? getProduct(costumeProductId)
    : undefined;

  const handleAddCostume = () => {
    if (!costumeProduct) return;

    addToCart(
      costumeProduct,
      selectedCostumeSize,
      1
    );
  };

  const handleToggleComplete = () => {
    toggleLesson(slug, selectedLesson);

    setJustCompletedAnim(true);

    setTimeout(() => {
      setJustCompletedAnim(false);
    }, 2000);
  };

  const handleNextLesson = () => {
    if (selectedLesson < dance.lessons.length - 1) {
      setSelectedLesson(selectedLesson + 1);
      setIsVideoPlaying(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else if (
      selectedLesson === dance.lessons.length - 1
    ) {
      setSelectedLesson(dance.lessons.length);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handlePrevLesson = () => {
    if (selectedLesson > 0) {
      setSelectedLesson(selectedLesson - 1);
      setIsVideoPlaying(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const nextLessonObj =
    selectedLesson < dance.lessons.length - 1
      ? dance.lessons[selectedLesson + 1]
      : null;

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-[#111111] text-[#F8F1E6]"
          : "bg-[#F8F1E6] text-[#111111]"
      } selection:bg-[#B42318] selection:text-white transition-colors duration-300`}
    >
      <Navbar />

      <main className="pt-20 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">

        {/* =====================================================
            1. TOP BREADCRUMB & LESSON NAVIGATION
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-[#E8DEC8] pb-4">

          <div className="flex items-center gap-2 text-xs font-bold text-[#777777]">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:text-[#B42318] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />

              <span>Your lessons</span>
            </button>

            <span>/</span>

            <span
              className={`${
                darkMode
                  ? "text-[#F8F1E6]"
                  : "text-[#111111]"
              } font-mono uppercase`}
            >
              {dance.name} ·{" "}
              {isQuizView
                ? "Knowledge Quiz"
                : `Lesson ${selectedLesson + 1}. ${lesson?.title}`}
            </span>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 bg-[#B42318] hover:bg-[#C92A1E] text-white px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            >
              <CreditCard size={12} />

              <span>Get Full Access</span>
            </Link>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                darkMode
                  ? "bg-[#252525] border-white/20 text-yellow-300 hover:bg-[#333333]"
                  : "bg-[#EFE7DA] border-[#E8DEC8] text-[#111111] hover:bg-[#E8DEC8]"
              }`}
              aria-label="Toggle dark mode"
              title={
                darkMode
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {darkMode ? (
                <Sun size={14} />
              ) : (
                <Moon size={14} />
              )}
            </button>
          </div>

          {!isQuizView && (
            <div className="flex items-center justify-between sm:justify-end gap-6 text-xs font-bold font-mono">

              <button
                onClick={handlePrevLesson}
                disabled={selectedLesson === 0}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedLesson === 0
                    ? "text-[#E8DEC8] cursor-not-allowed"
                    : "text-[#111111] hover:text-[#B42318]"
                }`}
              >
                <ChevronLeft
                  size={16}
                  className="text-[#B42318]"
                />

                <div className="text-left">
                  <span className="text-[10px] text-[#777777] block font-sans">
                    Lesson{" "}
                    {selectedLesson > 0
                      ? selectedLesson
                      : 1}
                  </span>

                  <span className="truncate max-w-[120px] block">
                    {selectedLesson > 0
                      ? dance.lessons[
                          selectedLesson - 1
                        ].title
                      : "Start"}
                  </span>
                </div>
              </button>

              <div className="h-6 w-px bg-[#E8DEC8]" />

              <button
                onClick={handleNextLesson}
                className="flex items-center gap-1.5 text-[#111111] hover:text-[#B42318] transition-colors cursor-pointer text-right"
              >
                <div className="text-right">
                  <span className="text-[10px] text-[#777777] block font-sans">
                    {nextLessonObj
                      ? "Next lesson"
                      : "Final Stage"}
                  </span>

                  <span className="truncate max-w-[120px] block">
                    {nextLessonObj
                      ? nextLessonObj.title
                      : "Take Quiz"}
                  </span>
                </div>

                <ChevronRight
                  size={16}
                  className="text-[#B42318]"
                />
              </button>

            </div>
          )}
        </div>

        {/* =====================================================
            2. TWO COLUMN MAIN LAYOUT
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* =================================================
              LEFT COLUMN
          ================================================== */}

          <div className="lg:col-span-8 space-y-6">

            {!isQuizView && lesson ? (
              <>

                {/* =================================================
                    VIDEO PLAYER
                ================================================== */}

                <div className="relative aspect-video w-full rounded-[28px] overflow-hidden bg-black border border-[#252525] shadow-xl group">

                  {lesson.video &&
                  !lesson.video.includes("XXXXXXX") ? (
                    <iframe
                      key={lesson.video}
                      src={`${lesson.video}?autoplay=${
                        isVideoPlaying ? 1 : 0
                      }&rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">

                      <Image
                        src={dance.image}
                        alt={dance.name}
                        fill
                        className="object-cover filter brightness-75"
                        priority
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />

                      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">

                        <div className="flex items-center justify-between">
                          <span className="bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase font-mono">
                            {dance.name} · Lesson{" "}
                            {(selectedLesson + 1)
                              .toString()
                              .padStart(2, "0")}
                          </span>

                          <span className="bg-[#B42318] text-white rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase font-mono">
                            HD MASTERCLASS
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center text-center">

                          <button
                            onClick={() =>
                              setIsVideoPlaying(true)
                            }
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#B42318] hover:bg-[#C92A1E] text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer mb-3"
                          >
                            <Play
                              size={28}
                              className="fill-white translate-x-0.5"
                            />
                          </button>

                          <p className="text-white font-mono font-bold text-sm tracking-wide drop-shadow-md">
                            {lesson.title}
                          </p>

                          <p className="text-gray-300 text-xs mt-0.5">
                            Traditional demonstration &
                            posture analysis
                          </p>
                        </div>

                        <div className="space-y-2">

                          <div className="flex items-center justify-between text-white text-xs font-mono font-bold">
                            <span>3:28 / 7:33</span>

                            <div className="flex items-center gap-3">
                              <Volume2 size={16} />
                              <Maximize2 size={16} />
                            </div>
                          </div>

                          <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-[#B42318] w-[45%]" />
                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* =================================================
                    TABS
                ================================================== */}

                <div className="flex items-center gap-6 sm:gap-8 border-b border-[#E8DEC8] pb-3 text-xs sm:text-sm font-bold">

                  <button
                    onClick={() =>
                      setActiveTab("overview")
                    }
                    className={`relative py-1 transition-colors cursor-pointer flex flex-col items-center ${
                      activeTab === "overview"
                        ? "text-[#111111]"
                        : "text-[#777777] hover:text-[#111111]"
                    }`}
                  >
                    <span>Overview</span>

                    {activeTab === "overview" && (
                      <span className="absolute -bottom-3.5 w-2 h-2 bg-[#B42318] rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab("transcript")
                    }
                    className={`relative py-1 transition-colors cursor-pointer flex flex-col items-center ${
                      activeTab === "transcript"
                        ? "text-[#111111]"
                        : "text-[#777777] hover:text-[#111111]"
                    }`}
                  >
                    <span>Text transcript</span>

                    {activeTab === "transcript" && (
                      <span className="absolute -bottom-3.5 w-2 h-2 bg-[#B42318] rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab("discussions")
                    }
                    className={`relative py-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "discussions"
                        ? "text-[#111111]"
                        : "text-[#777777] hover:text-[#111111]"
                    }`}
                  >
                    <span>Discussions</span>

                    <span className="bg-[#111111] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      15
                    </span>

                    {activeTab === "discussions" && (
                      <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#B42318] rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab("downloads")
                    }
                    className={`relative py-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "downloads"
                        ? "text-[#111111]"
                        : "text-[#777777] hover:text-[#111111]"
                    }`}
                  >
                    <span>Downloads</span>

                    <span className="bg-[#EFE7DA] text-[#777777] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      4
                    </span>
                  </button>

                </div>

                {/* =================================================
                    LESSON MAIN CONTENT
                ================================================== */}

                <div className="bg-white border border-[#E8DEC8] rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">

                  {/* TITLE & ACTIONS */}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#B42318] font-mono block mb-1">
                        {dance.name} · LESSON{" "}
                        {(selectedLesson + 1)
                          .toString()
                          .padStart(2, "0")}{" "}
                        OF{" "}
                        {dance.lessons.length
                          .toString()
                          .padStart(2, "0")}
                      </span>

                      <h2 className="text-2xl sm:text-4xl font-black uppercase text-[#111111] font-mono tracking-tight leading-tight">
                        {lesson.title}
                      </h2>
                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="flex flex-wrap items-center gap-2.5">

                      <Link
                        href={`/practice/${slug}?lesson=${selectedLesson}`}
                        id="btn-practice-ai"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#B42318] to-[#991B1B] hover:from-[#C92A1E] hover:to-[#B42318] text-white shadow-md shadow-[#B42318]/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Sparkles
                          size={15}
                          className="text-yellow-300 animate-pulse"
                        />

                        <span>
                          Practice with Rhythm AI
                        </span>
                      </Link>

                      <button
                        onClick={handleToggleComplete}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md ${
                          isCurrentCompleted
                            ? "bg-[#111111] text-[#F8F1E6] hover:bg-[#252525]"
                            : "bg-[#EFE7DA] text-[#111111] hover:bg-[#E8DEC8]"
                        }`}
                      >
                        <Check
                          size={16}
                          className={
                            isCurrentCompleted
                              ? "text-[#B42318]"
                              : "text-[#111111]"
                          }
                        />

                        <span>
                          {isCurrentCompleted
                            ? "COMPLETED ✓"
                            : "MARK COMPLETE ✓"}
                        </span>
                      </button>

                    </div>
                  </div>

                  {/* DESCRIPTION */}

                  <div className="space-y-4">

                    <p className="text-sm sm:text-base text-[#252525] font-medium leading-relaxed">
                      {lesson.description}
                    </p>

                    <p className="text-xs sm:text-sm text-[#777777] leading-relaxed italic bg-[#F8F1E6] p-4 rounded-2xl border border-[#E8DEC8]">
                      &ldquo;Every mudra is a syllable,
                      every footstep is a beat, and every
                      expression is a devotion to the eternal
                      rhythm.&rdquo;
                    </p>

                  </div>

                  {/* =================================================
                      KEY TAKEAWAYS
                  ================================================== */}

                  {lesson.points &&
                    lesson.points.length > 0 && (
                      <div className="pt-4 border-t border-[#E8DEC8] space-y-4">

                        <div className="flex items-center gap-2">
                          <span className="text-[#B42318] font-black text-sm">
                            ✦
                          </span>

                          <h4 className="text-xs font-black uppercase tracking-widest text-[#111111] font-mono">
                            KEY TAKEAWAYS
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          {lesson.points.map(
                            (pt, idx) => (
                              <div
                                key={idx}
                                className="bg-[#F8F1E6] border border-[#E8DEC8] rounded-2xl p-4 flex items-start gap-3 hover:border-[#B42318] transition-colors"
                              >
                                <span className="text-[#B42318] font-mono font-black text-base sm:text-lg leading-none">
                                  {(idx + 1)
                                    .toString()
                                    .padStart(
                                      2,
                                      "0"
                                    )}
                                </span>

                                <span className="text-xs sm:text-sm font-semibold text-[#252525] leading-snug">
                                  {pt}
                                </span>
                              </div>
                            )
                          )}

                        </div>
                      </div>
                    )}

                  {/* =================================================
                      DANCE-SPECIFIC COSTUME SECTION
                  ================================================== */}

                  {costumeProduct && (
                    <section className="pt-6 border-t border-[#E8DEC8]">

                      <div
                        className={`overflow-hidden rounded-[28px] border ${
                          darkMode
                            ? "border-white/10 bg-[#1A1A1A]"
                            : "border-[#E8DEC8] bg-[#FDFBF7]"
                        }`}
                      >

                        <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr]">

                          {/* COSTUME IMAGE */}

                          <div className="relative min-h-[320px] bg-[#EEE5D7]">

                            <Image
                              src={costumeProduct.image}
                              alt={costumeProduct.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              className="object-cover"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {costumeProduct.badge && (
                              <span
                                className="absolute left-5 top-5 rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-white"
                                style={{
                                  backgroundColor:
                                    costumeProduct.accent,
                                }}
                              >
                                {costumeProduct.badge}
                              </span>
                            )}

                            <div className="absolute bottom-5 left-5 right-5">

                              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                                {dance.name}
                              </p>

                              <p className="mt-1 text-white text-xl font-black uppercase">
                                Traditional Costume
                              </p>

                            </div>

                          </div>

                          {/* COSTUME DETAILS */}

                          <div className="p-6 sm:p-8 flex flex-col justify-center">

                            <div className="flex items-start justify-between gap-4">

                              <div>

                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#B42318]">
                                  Wear the tradition
                                </p>

                                <h3
                                  className={`mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight ${
                                    darkMode
                                      ? "text-[#F8F1E6]"
                                      : "text-[#111111]"
                                  }`}
                                >
                                  {dance.name}{" "}
                                  Costume
                                </h3>

                              </div>

                              <span className="shrink-0 text-xl font-black text-[#B42318]">
                                ₹
                                {costumeProduct.price.toLocaleString(
                                  "en-IN"
                                )}
                              </span>

                            </div>

                            <p
                              className={`mt-4 text-sm leading-6 ${
                                darkMode
                                  ? "text-white/55"
                                  : "text-black/55"
                              }`}
                            >
                              {costumeProduct.description}
                            </p>

                            {/* SIZE */}

                            <div className="mt-6">

                              <div className="flex items-center justify-between mb-2">

                                <p
                                  className={`text-[10px] font-black uppercase tracking-wider ${
                                    darkMode
                                      ? "text-white/50"
                                      : "text-[#777777]"
                                  }`}
                                >
                                  Select Size
                                </p>

                                <Link
                                  href="/products"
                                  className="text-[10px] font-bold text-[#B42318] hover:underline"
                                >
                                  Size guide
                                </Link>

                              </div>

                              <div className="flex flex-wrap gap-2">

                                {costumeProduct.sizes.map(
                                  (size) => (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() =>
                                        setSelectedCostumeSize(
                                          size
                                        )
                                      }
                                      className={`grid h-9 min-w-9 place-items-center rounded-full border px-2 text-[11px] font-black transition ${
                                        selectedCostumeSize ===
                                        size
                                          ? "border-[#B42318] bg-[#B42318] text-white"
                                          : darkMode
                                          ? "border-white/15 bg-white/5 text-white hover:border-[#B42318]"
                                          : "border-[#D8CBB7] bg-white hover:border-[#B42318]"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  )
                                )}

                              </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="mt-6 flex flex-col sm:flex-row gap-3">

                              <button
                                type="button"
                                onClick={handleAddCostume}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#B42318] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#921C14] hover:-translate-y-0.5"
                              >
                                <ShoppingBag
                                  size={15}
                                />

                                Add to Cart
                              </button>

                              <Link
                                href={`/products?product=${costumeProduct.id}`}
                                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3.5 text-xs font-black uppercase tracking-wider transition hover:-translate-y-0.5 ${
                                  darkMode
                                    ? "border-white/15 text-white hover:border-[#B42318]"
                                    : "border-[#D8CBB7] text-[#111111] hover:border-[#B42318]"
                                }`}
                              >
                                View in Shop

                                <ChevronRight
                                  size={15}
                                />
                              </Link>

                            </div>

                            {/* SMALL BENEFITS */}

                            <div
                              className={`mt-5 grid grid-cols-2 gap-2 text-[10px] font-bold ${
                                darkMode
                                  ? "text-white/45"
                                  : "text-[#777777]"
                              }`}
                            >

                              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                                ✓ Performance Ready
                              </div>

                              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                                ✓ Pan India Delivery
                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </section>
                  )}

                  {/* =================================================
                      BOTTOM NAVIGATION
                  ================================================== */}

                  <div className="pt-6 border-t border-[#E8DEC8] flex items-center justify-between gap-4">

                    <button
                      onClick={handlePrevLesson}
                      disabled={selectedLesson === 0}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold transition-all ${
                        selectedLesson === 0
                          ? "bg-[#EFE7DA] text-[#777777] cursor-not-allowed"
                          : "bg-[#EFE7DA] hover:bg-[#E8DEC8] text-[#111111] cursor-pointer hover:scale-105 active:scale-95"
                      }`}
                    >
                      <ChevronLeft size={16} />

                      <span>
                        ← Previous Lesson
                      </span>
                    </button>

                    <button
                      onClick={handleNextLesson}
                      className="inline-flex items-center gap-2 bg-[#B42318] hover:bg-[#C92A1E] text-white px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#B42318]/20 cursor-pointer"
                    >
                      <span>
                        {selectedLesson ===
                        dance.lessons.length - 1
                          ? "PROCEED TO QUIZ →"
                          : `NEXT: ${
                              nextLessonObj?.title.toUpperCase() ||
                              "NEXT"
                            } →`}
                      </span>

                      <ChevronRight size={16} />
                    </button>

                  </div>

                </div>

              </>
            ) : (

              /* =====================================================
                 QUIZ VIEW
              ====================================================== */

              <div className="space-y-6">

                <div className="bg-[#111111] text-white rounded-[28px] p-6 sm:p-8 flex items-center justify-between border border-[#252525]">

                  <div>

                    <span className="text-[10px] font-black uppercase font-mono tracking-widest text-[#B42318] block mb-1">
                      KNOWLEDGE ASSESSMENT
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight">
                      {dance.name} Module Quiz
                    </h2>

                    <p className="text-xs text-gray-300 mt-1">
                      Score at least 2/3 questions to
                      unlock your verified digital
                      certificate.
                    </p>

                  </div>

                  <HelpCircle
                    size={36}
                    className="text-[#B42318] hidden sm:block"
                  />

                </div>

                <Quiz
                  danceName={dance.name}
                  onComplete={() => {
                    router.push(
                      `/certificate?dance=${encodeURIComponent(
                        dance.name
                      )}`
                    );
                  }}
                />

              </div>
            )}

          </div>

          {/* =====================================================
              RIGHT COLUMN
          ====================================================== */}

          <div className="lg:col-span-4 space-y-6">

            {/* AUTHOR CARD */}

            <div className="bg-white border border-[#E8DEC8] rounded-[28px] p-6 shadow-sm">

              <div className="flex items-center justify-between mb-4">

                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] font-mono">
                  Author of the course
                </h4>

                <Link
                  href="/pricing"
                  className="bg-[#B42318] hover:bg-[#C92A1E] text-white rounded-full px-3 py-1 text-[11px] font-bold transition-colors shadow-sm"
                >
                  Author page
                </Link>

              </div>

              <div className="flex items-center gap-3 mb-3">

                <div className="w-11 h-11 rounded-full bg-[#111111] text-white flex items-center justify-center font-black text-sm uppercase">
                  {dance.name.charAt(0)}
                </div>

                <div>

                  <h5 className="text-xs font-black text-[#111111] font-mono">
                    {dance.guru ||
                      "Guru Kelucharan Tradition"}
                  </h5>

                  <p className="text-[11px] text-[#777777] font-semibold">
                    {dance.lessons.length} classes
                    available · Classical Master
                  </p>

                </div>

              </div>

              <p className="text-[11px] text-[#777777] leading-relaxed">
                Preserving ancient temple choreography
                and Vedic scriptures. In an accessible,
                modular format, explaining complex Mudras
                and Tala rhythm structures.
              </p>

            </div>

            {/* QUIZ CARD */}

            <div className="bg-white border border-[#E8DEC8] rounded-[28px] p-6 shadow-sm">

              <div className="flex items-center justify-between mb-2">

                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] font-mono">
                  Fill in the quiz (10 min)
                </h4>

                <span className="text-[10px] font-bold text-[#B42318] bg-[#B42318]/10 px-2 py-0.5 rounded-md">
                  Required
                </span>

              </div>

              <p className="text-[11px] text-[#777777] mb-4">
                Test your mastery of {dance.name} hand
                gestures, rhythms, and history.
              </p>

              <button
                onClick={() => {
                  setSelectedLesson(
                    dance.lessons.length
                  );

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                className="w-full py-3 bg-[#111111] hover:bg-[#252525] text-[#F8F1E6] font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                ANSWER QUESTIONS
              </button>

            </div>

            {/* =================================================
                COURSE CURRICULUM
            ================================================== */}

            <div className="bg-white border border-[#E8DEC8] rounded-[28px] p-6 shadow-sm space-y-4">

              <div>

                <div className="flex items-center justify-between mb-1">

                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] font-mono">
                    YOUR {dance.name.toUpperCase()}{" "}
                    JOURNEY
                  </h4>

                  <span className="text-xs font-black text-[#B42318] font-mono">
                    {progress}%
                  </span>

                </div>

                <p className="text-[11px] text-[#777777] mb-2 font-medium">
                  {selectedLesson <
                  dance.lessons.length
                    ? `Lesson ${selectedLesson + 1}`
                    : "Quiz"}{" "}
                  of {dance.lessons.length}
                </p>

                <div className="flex gap-1 w-full">

                  {Array.from({
                    length: dance.lessons.length,
                  }).map((_, idx) => {

                    const done = isCompleted(
                      slug,
                      idx
                    );

                    return (
                      <div
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          done
                            ? "bg-[#B42318]"
                            : idx === selectedLesson
                            ? "bg-[#111111]"
                            : "bg-[#EFE7DA]"
                        }`}
                      />
                    );
                  })}

                </div>

              </div>

              {/* LESSON LIST */}

              <div className="space-y-1 pt-2 max-h-[500px] overflow-y-auto pr-1">

                {dance.lessons.map((l, idx) => {

                  const completed =
                    isCompleted(slug, idx);

                  const isCurrent =
                    idx === selectedLesson &&
                    !isQuizView;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedLesson(idx);

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? "bg-[#111111] text-white shadow-md"
                          : completed
                          ? "bg-[#F8F1E6] text-[#111111] hover:bg-[#EFE7DA]"
                          : "text-[#777777] hover:bg-[#F8F1E6] hover:text-[#111111]"
                      }`}
                    >

                      <div className="flex items-center gap-2.5 truncate">

                        <span
                          className={`font-mono text-[11px] ${
                            isCurrent
                              ? "text-[#B42318]"
                              : "text-[#777777]"
                          }`}
                        >
                          {(idx + 1)
                            .toString()
                            .padStart(2, "0")}
                        </span>

                        <span className="truncate">
                          {l.title}
                        </span>

                      </div>

                      {completed ? (
                        <CheckCircle2
                          size={14}
                          className="text-[#B42318] flex-shrink-0"
                        />
                      ) : (
                        <Circle
                          size={12}
                          className="text-[#E8DEC8] flex-shrink-0"
                        />
                      )}

                    </button>
                  );
                })}

                {/* KNOWLEDGE QUIZ */}

                <button
                  onClick={() => {
                    setSelectedLesson(
                      dance.lessons.length
                    );

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase font-mono transition-all flex items-center justify-between cursor-pointer ${
                    isQuizView
                      ? "bg-[#B42318] text-white shadow-md"
                      : "text-[#B42318] bg-[#FDF2F2] hover:bg-[#FEE2E2]"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <HelpCircle size={14} />

                    <span>
                      04 // KNOWLEDGE QUIZ
                    </span>

                  </div>

                  <ChevronRight size={14} />

                </button>

              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}