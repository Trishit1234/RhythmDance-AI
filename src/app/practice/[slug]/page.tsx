"use client";

import { useEffect, useRef, useState, useCallback, useMemo, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { getDanceBySlug } from "@/data/danceData";
import { getMovementForLesson, referenceMovements } from "@/data/referenceMovements";
import { getPoseLandmarker, releasePoseLandmarker } from "@/lib/ai/poseDetector";
import { MovementDetector } from "@/lib/ai/movementDetector";
import { MovementComparator } from "@/lib/ai/comparator";
import { drawSkeleton } from "@/lib/ai/skeletonDrawer";
import { checkBodyVisibility } from "@/lib/ai/geometry";
import { Landmark3D, MovementDefinition, PracticeSessionResult, TelemetryData } from "@/types/practice";
import Navbar from "@/components/Navbar";
import {
  Camera,
  CameraOff,
  Sparkles,
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertCircle,
  Activity,
  Code,
  RotateCcw,
  Play,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Target,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PracticeModePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { savePracticeSession } = useProgress();

  const lessonParam = searchParams.get("lesson");
  const lessonIndex = lessonParam !== null ? parseInt(lessonParam, 10) : 0;

  const dance = getDanceBySlug(slug);
  const lesson = dance?.lessons[lessonIndex] || dance?.lessons[0];

  // Selected movement definition
  const [selectedMovement, setSelectedMovement] = useState<MovementDefinition>(() =>
    getMovementForLesson(slug, lessonIndex)
  );

  // Practice State
  const [isPracticing, setIsPracticing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const isPracticingRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [sessionResult, setSessionResult] = useState<PracticeSessionResult | null>(null);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [voiceTutorEnabled, setVoiceTutorEnabled] = useState(true);
  const lastSpokenFeedbackRef = useRef("");
  const lastSpokenAtRef = useRef(0);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    detectedMovement: selectedMovement.name,
    stage: "not_started",
    expectedArmAngle: selectedMovement.targetAngles.rightShoulderElevation.ideal,
    currentArmAngle: 0,
    angleError: 0,
    currentElbowAngle: 0,
    expectedElbowAngle: selectedMovement.targetAngles.rightElbowFlexion.ideal,
    poseSimilarityScore: 0,
    timingScore: 0,
    completionScore: 0,
    liveOverallScore: 0,
    fps: 0,
    bodyDetected: false,
    trackingConfidence: 0,
    repsCompleted: 0,
    feedbackText: "Click 'Start Practice' to begin real-time pose tracking.",
  });


  // Derived live coaching scores. These are based only on values produced by
  // the existing MediaPipe + movement-comparator pipeline; no fake metrics.
  const coachingScores = useMemo(() => {
    const arm = Math.max(0, Math.min(100, Math.round(100 - telemetry.angleError * 1.8)));
    const elbowError = Math.abs(telemetry.currentElbowAngle - telemetry.expectedElbowAngle);
    const elbow = Math.max(0, Math.min(100, Math.round(100 - elbowError * 1.6)));
    const pose = Math.round(telemetry.poseSimilarityScore);
    const timing = Math.round(telemetry.timingScore);
    const overall = Math.round(telemetry.liveOverallScore);
    return { arm, elbow, pose, timing, overall };
  }, [telemetry]);

  // ---------------------------------------------------------------------------
  // REAL-TIME AI TUTOR
  // The tutor speaks in short coaching cues instead of repeating one generic
  // sentence. Feedback is derived from the live pose angles/scores we already
  // receive from MediaPipe + the movement comparator.
  // ---------------------------------------------------------------------------
  const tutorMessage = useMemo(() => {
    if (!isPracticing) {
      return "Start practice when you are ready. I will guide you step by step.";
    }

    if (!telemetry.bodyDetected) {
      return "I cannot see your full body. Step back and keep your whole body inside the frame.";
    }

    const armError = Math.abs(
      telemetry.expectedArmAngle - telemetry.currentArmAngle
    );
    const elbowError = Math.abs(
      telemetry.expectedElbowAngle - telemetry.currentElbowAngle
    );

    // Give the biggest correction first. This makes the tutor behave like a
    // real coach: one clear action at a time instead of five instructions.
    if (elbowError >= 18) {
      return telemetry.currentElbowAngle < telemetry.expectedElbowAngle
        ? "Your elbow is too low. Lift it gradually and keep your shoulder relaxed."
        : "Your elbow is too high. Lower it slightly and keep the arm controlled.";
    }

    if (elbowError >= 10) {
      return telemetry.currentElbowAngle < telemetry.expectedElbowAngle
        ? "Bring your elbow a little higher. Nice and controlled."
        : "Bring your elbow down a little. Stay relaxed through the shoulder.";
    }

    if (armError >= 18) {
      return telemetry.currentArmAngle < telemetry.expectedArmAngle
        ? "Your right arm needs to come higher. Lift from the shoulder and hold the line."
        : "Your right arm is too high. Lower it slowly to match the target."
    }

    if (armError >= 10) {
      return telemetry.currentArmAngle < telemetry.expectedArmAngle
        ? "Raise your right arm just a little. You are almost there."
        : "Lower your right arm slightly. Match the target position."
    }

    if (telemetry.timingScore < 55) {
      return "Focus on the rhythm. Slow the movement down and finish the position cleanly.";
    }

    if (telemetry.timingScore < 72) {
      return "Good shape. Now work on your timing and make the movement smoother.";
    }

    if (telemetry.liveOverallScore >= 93) {
      return "Excellent control. Keep the position steady and stay with the rhythm.";
    }

    if (telemetry.liveOverallScore >= 85) {
      return "Very good. Your position is close. Hold it and keep the movement smooth.";
    }

    if (telemetry.liveOverallScore >= 72) {
      return "Good start. Make one small correction and keep going.";
    }

    return telemetry.feedbackText || "Stay centered, follow the target, and move with control.";
  }, [isPracticing, telemetry]);

  // Voice coach: speak useful coaching moments, not every camera frame.
  // The message is intentionally stable inside an error band, so tiny angle
  // fluctuations do not cause a new spoken sentence every second.
  useEffect(() => {
    if (!voiceTutorEnabled || !isPracticing || typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

    const message = tutorMessage.trim();
    if (!message) return;

    const now = Date.now();
    const sameMessage = message === lastSpokenFeedbackRef.current;
    const minimumGap = sameMessage ? 7000 : 3000;

    if (now - lastSpokenAtRef.current < minimumGap) return;

    // Do not interrupt a sentence that is already being spoken just because
    // another camera frame arrived.
    if (window.speechSynthesis.speaking) return;

    lastSpokenFeedbackRef.current = message;
    lastSpokenAtRef.current = now;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Prefer a natural English voice when the browser exposes one.
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) =>
      /en-IN|en-GB|en-US/i.test(voice.lang)
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }, [tutorMessage, voiceTutorEnabled, isPracticing]);


  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);

  // AI Engines
  const movementDetectorRef = useRef<MovementDetector>(
    new MovementDetector(selectedMovement)
  );
  const comparatorRef = useRef<MovementComparator>(
    new MovementComparator(selectedMovement)
  );

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Handle movement change
  const handleSelectMovement = (m: MovementDefinition) => {
    setSelectedMovement(m);
    movementDetectorRef.current.reset(m);
    comparatorRef.current.reset(m);
    setTelemetry((prev) => ({
      ...prev,
      detectedMovement: m.name,
      expectedArmAngle: m.targetAngles.rightShoulderElevation.ideal,
      expectedElbowAngle: m.targetAngles.rightElbowFlexion.ideal,
    }));
  };

  // Stop Camera & AI Tracking Cleanup
  const stopPractice = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const wasPracticing = isPracticingRef.current;

    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    isPracticingRef.current = false;
    setIsPracticing(false);
    setIsModelLoading(false);

    if (wasPracticing && dance && lesson) {
      const result = comparatorRef.current.finalizeSession(
        user?.uid || "guest",
        dance.slug,
        dance.name,
        lessonIndex,
        lesson.title,
        movementDetectorRef.current.getState().repsCompleted
      );

      setSessionResult(result);
      savePracticeSession(result);
      setCompletedModalOpen(true);
    }
  }, [dance, lesson, lessonIndex, user, savePracticeSession]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      releasePoseLandmarker();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Frame Processing Loop
  const processVideoFrame = useCallback(
    async (landmarker: any) => {
      if (!videoRef.current || !canvasRef.current || !isPracticingRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.readyState >= 2 && ctx) {
        const now = performance.now();

        // Calculate FPS
        frameCountRef.current += 1;
        if (now - lastFrameTimeRef.current >= 1000) {
          fpsRef.current = frameCountRef.current;
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        // Set canvas dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Run MediaPipe Pose Detection
        try {
          const results = landmarker.detectForVideo(video, now);

          if (results && results.landmarks && results.landmarks.length > 0) {
            const rawLandmarks: Landmark3D[] = results.landmarks[0];
            const visibilityCheck = checkBodyVisibility(rawLandmarks);

            if (visibilityCheck.isVisible) {
              // Update Movement State Machine
              const movementState = movementDetectorRef.current.update(
                rawLandmarks,
                now
              );

              // Evaluate against Reference Movement & Kinematics
              const evalResult = comparatorRef.current.evaluateLive(
                movementState,
                rawLandmarks
              );

              // Draw Real-time Skeleton Overlay
              drawSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, {
                currentArmAngle: movementState.currentArmAngle,
                expectedArmAngle: movementState.expectedArmAngle,
                currentElbowAngle: movementState.currentElbowAngle,
                mirrored: true,
                showAngleLabels: true,
              });

              // Update Live Telemetry
              setTelemetry({
                detectedMovement: selectedMovement.name,
                stage: movementState.stage,
                expectedArmAngle: movementState.expectedArmAngle,
                currentArmAngle: movementState.currentArmAngle,
                angleError: movementState.angleError,
                currentElbowAngle: movementState.currentElbowAngle,
                expectedElbowAngle: movementState.expectedElbowAngle,
                poseSimilarityScore: evalResult.poseSimilarityScore,
                timingScore: evalResult.timingScore,
                completionScore: evalResult.completionScore,
                liveOverallScore: evalResult.overallScore,
                fps: fpsRef.current || 30,
                bodyDetected: true,
                trackingConfidence: visibilityCheck.confidence,
                repsCompleted: movementState.repsCompleted,
                feedbackText: movementState.feedbackText,
              });
            } else {
              setTelemetry((prev) => ({
                ...prev,
                bodyDetected: false,
                trackingConfidence: visibilityCheck.confidence,
                feedbackText: "Body not fully detected. Step back into camera frame.",
              }));
            }
          } else {
            setTelemetry((prev) => ({
              ...prev,
              bodyDetected: false,
              trackingConfidence: 0,
              feedbackText: "Body not detected. Move into the camera frame.",
            }));
          }
        } catch (detectionErr) {
          console.warn("Pose detection error:", detectionErr);
        }
      }

      if (isPracticingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(() =>
          processVideoFrame(landmarker)
        );
      }
    },
    [isPracticing, selectedMovement]
  );

  // Start Camera & AI Model
  const startPractice = async () => {
    setCameraError(null);
    setIsModelLoading(true);

    try {
      // 1. Request Webcam Permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Initialize MediaPipe PoseLandmarker
      const landmarker = await getPoseLandmarker();

      setIsModelLoading(false);

      // Reset state machines
      movementDetectorRef.current.reset(selectedMovement);
      comparatorRef.current.reset(selectedMovement);

      // Set the ref immediately so the animation loop does not
      // depend on React state update timing.
      isPracticingRef.current = true;
      setIsPracticing(true);

      // 3. Start Processing Loop
      animationFrameIdRef.current = requestAnimationFrame(() =>
        processVideoFrame(landmarker)
      );
    } catch (err: any) {
      console.error("Failed to start AI practice:", err);
      setIsModelLoading(false);
      isPracticingRef.current = false;
      setIsPracticing(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No compatible webcam was found on your device.");
      } else {
        setCameraError(
          err.message || "Failed to initialize camera or AI model. Please try again."
        );
      }
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F1E6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#111111] font-bold font-mono text-sm tracking-wider animate-pulse">
            INITIALIZING AI PRACTICE STUDIO...
          </p>
        </div>
      </div>
    );
  }

  if (!dance) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8F1E6] gap-4 p-6 text-center">
        <p className="text-2xl font-bold font-mono text-[#111111] uppercase">
          Dance style not found
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-[#B42318] text-white rounded-full font-bold text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F8F1E6] selection:bg-[#B42318] selection:text-white pb-20">
      <Navbar />

      <main className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Link
              href={`/dance/${slug}`}
              className="hover:text-[#B42318] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Back to {dance.name} Lesson</span>
            </Link>
            <span>/</span>
            <span className="text-white font-mono uppercase">
              RHYTHM AI — REAL-TIME DANCE COACH · {selectedMovement.name}
            </span>
          </div>

          {/* Privacy & Engine Badges */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 bg-[#252525] border border-white/10 rounded-full px-3 py-1 text-[11px] font-semibold text-gray-300">
              <ShieldCheck size={13} className="text-green-400" />
              <span>Camera Local Only</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-[#B42318]/20 border border-[#B42318]/40 rounded-full px-3 py-1 text-[11px] font-mono font-bold text-[#FF8577]">
              <Sparkles size={12} />
              <span>Rhythm AI Engine</span>
            </div>
          </div>
        </div>

        {/* Camera Permission / Error Banner */}
        {cameraError && (
          <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-red-300 mb-1">Camera Access Required</p>
              <p>{cameraError}</p>
            </div>
          </div>
        )}

        {/* Main 2-Column AI Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ═════════ LEFT: Webcam Feed & Real-Time Pose HUD (8 Cols) ═════════ */}
          <div className="lg:col-span-8 space-y-4">
            {/* Viewport Container */}
            <div className="relative aspect-video w-full rounded-[28px] overflow-hidden bg-black border border-white/15 shadow-2xl flex items-center justify-center">
              {/* Actual Video Tag (mirrored) */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isPracticing ? "opacity-100" : "opacity-0 hidden"
                }`}
              />

              {/* Skeleton Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                  isPracticing ? "block" : "hidden"
                }`}
              />

              {/* Inactive Camera State / Start Practice Splash */}
              {!isPracticing && !isModelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#1E1E1E] to-[#111111] z-20">
                  <div className="w-20 h-20 rounded-full bg-[#B42318]/20 border border-[#B42318]/40 flex items-center justify-center mb-4 text-[#B42318]">
                    <Camera size={36} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#FF8577] mb-2">
                    <Sparkles size={12} />
                    <span>RHYTHM AI COACH</span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black uppercase font-mono tracking-tight text-white mb-2">
                    Practice with Rhythm AI
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
                    Your real-time dance practice coach. Stand ~1.5–2 meters back so your upper body is in frame. Pose estimation runs 100% locally in your browser.
                  </p>

                  <button
                    onClick={startPractice}
                    id="btn-start-practice"
                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-[#B42318]/40 cursor-pointer"
                  >
                    <Play size={16} className="fill-white" />
                    <span>Practice with Rhythm AI</span>
                  </button>
                </div>
              )}

              {/* Model Loading State */}
              {isModelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold font-mono tracking-wider text-white">
                    LOADING MEDIAPIPE POSE ENGINE...
                  </p>
                  <p className="text-xs text-gray-400">
                    Initializing local WebAssembly & GPU delegate
                  </p>
                </div>
              )}

              {/* Live HUD Overlays when Practicing */}
              {isPracticing && (
                <>
                  {/* Top Bar HUD: Tracking Status & Reps */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          telemetry.bodyDetected ? "bg-green-500 animate-pulse" : "bg-red-500"
                        }`}
                      />
                      <span>
                        {telemetry.bodyDetected
                          ? `TRACKING: ${telemetry.trackingConfidence}%`
                          : "BODY LOST"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-mono font-bold">
                      <span className="text-[#FF8577]">REPS:</span>
                      <span className="text-white text-sm">{telemetry.repsCompleted}</span>
                    </div>
                  </div>

                  {/* Bottom Bar HUD: Stage Indicator & Live Feedback Banner */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2 pointer-events-none">
                    {/* Live Corrective Feedback Box */}
                    <div className="bg-black/85 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl">
                      <div className="w-8 h-8 rounded-full bg-[#B42318] flex items-center justify-center flex-shrink-0 text-white font-bold">
                        ✦
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] uppercase font-mono font-bold text-gray-400">
                            AI TUTOR · {telemetry.stage.replaceAll("_", " ").toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono font-black text-yellow-400">
                            {telemetry.liveOverallScore}%
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          {tutorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {isPracticing ? (
                  <button
                    onClick={stopPractice}
                    id="btn-stop-practice"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase text-xs rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#B42318]/30"
                  >
                    <CameraOff size={15} />
                    <span>Stop Practice</span>
                  </button>
                ) : (
                  <button
                    onClick={startPractice}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black uppercase text-xs rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-green-500/20"
                  >
                    <Play size={15} className="fill-white" />
                    <span>Start Practice</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    movementDetectorRef.current.reset(selectedMovement);
                    comparatorRef.current.reset(selectedMovement);
                    setTelemetry((prev) => ({ ...prev, repsCompleted: 0, liveOverallScore: 0 }));
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-gray-300 hover:text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Reps</span>
                </button>
              </div>

              {/* Diagnostics Toggle */}
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                id="btn-toggle-diagnostics"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 px-3 py-2 rounded-xl"
              >
                <Code size={14} className="text-[#FF8577]" />
                <span>Judge & Dev Telemetry</span>
                {showDiagnostics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* ═════════ DEVELOPER & JUDGE DIAGNOSTICS PANEL (PROOF OF REAL CALCULATIONS) ═════════ */}
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#181818] border border-white/15 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-[#B42318]" />
                      <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                        Real-Time Mathematical Telemetry (Live Model Proof)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-green-400 bg-green-950/60 border border-green-500/30 px-2 py-0.5 rounded">
                      {telemetry.fps} FPS · ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Detected Movement
                      </span>
                      <span className="text-white font-bold truncate block">
                        {telemetry.detectedMovement}
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Movement Stage
                      </span>
                      <span className="text-[#FF8577] font-bold block uppercase">
                        {telemetry.stage}
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Target Arm Angle
                      </span>
                      <span className="text-yellow-400 font-bold block">
                        {telemetry.expectedArmAngle}°
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Current Arm Angle
                      </span>
                      <span className="text-green-400 font-bold block">
                        {telemetry.currentArmAngle}°
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Angle Error
                      </span>
                      <span className="text-red-400 font-bold block">
                        {telemetry.angleError}°
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Pose Similarity (50%)
                      </span>
                      <span className="text-white font-bold block">
                        {telemetry.poseSimilarityScore}%
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Timing Score (30%)
                      </span>
                      <span className="text-white font-bold block">
                        {telemetry.timingScore}%
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Final Live Score
                      </span>
                      <span className="text-[#FF8577] font-bold block text-sm">
                        {telemetry.liveOverallScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 italic">
                    Note for judges: Joint angles are computed vectorially using arccos( (u · v) / (|u| * |v|) ) across shoulder, elbow, and wrist landmark keypoints. Real body motion directly updates every value above in real time.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═════════ RIGHT: LIVE AI TUTOR WORKSPACE ═════════ */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI Tutor */}
            <div className="relative overflow-hidden bg-[#181818] border border-[#B42318]/40 rounded-[28px] p-6 shadow-xl">
              <div className="pointer-events-none absolute -right-16 -top-16 w-40 h-40 rounded-full bg-[#B42318]/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#B42318] flex items-center justify-center">
                      <MessageCircle size={17} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8577]">
                        AI TUTOR
                      </p>
                      <p className="text-xs font-bold text-white">Live movement coaching</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceTutorEnabled((v) => !v)}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title={voiceTutorEnabled ? "Mute AI tutor" : "Enable AI tutor voice"}
                  >
                    {voiceTutorEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#222222] border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${isPracticing ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-gray-400">
                      {isPracticing ? "ANALYSING YOUR POSE" : "READY TO COACH"}
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-6 text-white">{tutorMessage}</p>
                </div>
              </div>
            </div>

            {/* Overall score */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    LIVE PERFORMANCE
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Calculated from your detected pose</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#B42318]/30 flex items-center justify-center bg-[#B42318]/10">
                  <span className="text-xl font-black font-mono text-[#FF8577]">{coachingScores.overall}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["ARM POSITION", coachingScores.arm],
                  ["ELBOW ANGLE", coachingScores.elbow],
                  ["POSE MATCH", coachingScores.pose],
                  ["TIMING", coachingScores.timing],
                ].map(([label, score]) => (
                  <div key={label as string}>
                    <div className="flex justify-between mb-1.5 text-[10px] font-mono font-bold">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white">{score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#B42318] transition-all duration-300"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target vs actual */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-[#FF8577]" />
                <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                  TARGET VS YOUR POSE
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">Target Arm</span>
                  <span className="text-2xl font-black font-mono text-green-400">{telemetry.expectedArmAngle}°</span>
                </div>
                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">Your Arm</span>
                  <span className={`text-2xl font-black font-mono ${coachingScores.arm >= 80 ? "text-green-400" : "text-[#FF8577]"}`}>
                    {telemetry.currentArmAngle}°
                  </span>
                </div>
                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">Target Elbow</span>
                  <span className="text-2xl font-black font-mono text-green-400">{telemetry.expectedElbowAngle}°</span>
                </div>
                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">Your Elbow</span>
                  <span className={`text-2xl font-black font-mono ${coachingScores.elbow >= 80 ? "text-green-400" : "text-[#FF8577]"}`}>
                    {telemetry.currentElbowAngle}°
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#B42318]/20 bg-[#B42318]/5 p-3 flex items-start gap-3">
                <TrendingUp size={15} className="text-[#FF8577] mt-0.5 shrink-0" />
                <p className="text-[11px] leading-5 text-gray-300">
                  {telemetry.bodyDetected
                    ? `Current arm error: ${Math.round(telemetry.angleError)}°. Keep adjusting until the target range is reached.`
                    : "Start practice to compare your live joint angles with the target movement."}
                </p>
              </div>
            </div>

            {/* Movement selector */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase font-mono tracking-widest text-[#FF8577]">
                  DANCE MOVEMENT
                </span>
                <span className="text-xs font-bold text-gray-400">{dance.name}</span>
              </div>
              <h3 className="text-xl font-black uppercase font-mono tracking-tight text-white">
                {selectedMovement.name}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">{selectedMovement.description}</p>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase">Studio drills</span>
                <div className="space-y-1.5">
                  {referenceMovements.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMovement(m)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedMovement.id === m.id
                          ? "bg-[#B42318] text-white shadow-md"
                          : "bg-[#222222] text-gray-300 hover:bg-[#2A2A2A]"
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[#FF8577] font-black">✦</span>
                <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">EXECUTION GUIDELINES</h4>
              </div>
              <div className="space-y-2.5">
                {selectedMovement.instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-[#222222] p-3 rounded-xl border border-white/5 text-xs text-gray-300">
                    <span className="text-[#FF8577] font-mono font-black text-sm leading-none">{(idx + 1).toString().padStart(2, "0")}</span>
                    <span className="leading-snug">{inst}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═════════ SESSION RESULTS MODAL ═════════ */}
      <AnimatePresence>
        {completedModalOpen && sessionResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1E1E1E] border border-white/20 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#B42318]/20 border border-[#B42318] flex items-center justify-center mx-auto text-[#FF8577]">
                <Award size={32} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest font-mono text-[#FF8577]">
                  RHYTHM AI PRACTICE RESULTS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-tight">
                  {sessionResult.movementName}
                </h3>
                <p className="text-xs text-gray-400">
                  {dance.name} · Lesson {(lessonIndex + 1).toString().padStart(2, "0")}
                </p>
              </div>

              {/* Overall Score Circle */}
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex items-center justify-around">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">
                    Rhythm AI Score
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-green-400">
                    {sessionResult.overallScore}%
                  </span>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">
                    Reps Done
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                    {sessionResult.repsCompleted}
                  </span>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">
                    Duration
                  </span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-yellow-400">
                    {sessionResult.durationSeconds}s
                  </span>
                </div>
              </div>

              {/* Feedback Summary */}
              <div className="text-left space-y-2 bg-[#252525] p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                  Rhythm AI Feedback & Takeaways:
                </span>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  {sessionResult.feedbackSummary.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    setCompletedModalOpen(false);
                    startPractice();
                  }}
                  className="flex-1 py-3.5 bg-[#252525] hover:bg-[#333333] rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-white/10"
                >
                  Practice Again
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 py-3.5 bg-[#B42318] hover:bg-[#C92A1E] text-white rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-[#B42318]/30 cursor-pointer"
                >
                  View on Dashboard →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
