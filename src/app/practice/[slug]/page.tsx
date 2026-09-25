"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  use,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";

import { getDanceBySlug } from "@/data/danceData";
import {
  getMovementForLesson,
  referenceMovements,
} from "@/data/referenceMovements";

import {
  getPoseLandmarker,
  releasePoseLandmarker,
} from "@/lib/ai/poseDetector";

import { MovementDetector } from "@/lib/ai/movementDetector";
import { MovementComparator } from "@/lib/ai/comparator";

import {
  processReferenceVideo,
  ReferenceVideoSequence,
} from "@/lib/ai/referenceVideoProcessor";

import { VideoMovementMatcher } from "@/lib/ai/videoMovementMatcher";

import { drawSkeleton } from "@/lib/ai/skeletonDrawer";
import { checkBodyVisibility } from "@/lib/ai/geometry";

import {
  Landmark3D,
  MovementDefinition,
  PracticeSessionResult,
  TelemetryData,
} from "@/types/practice";

import Navbar from "@/components/Navbar";

import {
  Camera,
  CameraOff,
  Sparkles,
  ArrowLeft,
  Award,
  AlertCircle,
  Activity,
  Code,
  RotateCcw,
  Play,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Target,
  MessageCircle,
  TrendingUp,
  Video,
  Loader2,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

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
  const lessonIndex =
    lessonParam !== null ? parseInt(lessonParam, 10) : 0;

  const dance = getDanceBySlug(slug);
  const lesson =
    dance?.lessons[lessonIndex] || dance?.lessons[0];

  // ---------------------------------------------------------------------------
  // SELECTED MOVEMENT
  // ---------------------------------------------------------------------------

  const [selectedMovement, setSelectedMovement] =
    useState<MovementDefinition>(() =>
      getMovementForLesson(slug, lessonIndex)
    );

  // ---------------------------------------------------------------------------
  // PRACTICE STATE
  // ---------------------------------------------------------------------------

  const [isPracticing, setIsPracticing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const isPracticingRef = useRef(false);

  const [cameraError, setCameraError] =
    useState<string | null>(null);

  const [showDiagnostics, setShowDiagnostics] =
    useState(true);

  const [sessionResult, setSessionResult] =
    useState<PracticeSessionResult | null>(null);

  const [completedModalOpen, setCompletedModalOpen] =
    useState(false);

  const [voiceTutorEnabled, setVoiceTutorEnabled] =
    useState(true);

  const lastSpokenFeedbackRef = useRef("");
  const lastSpokenAtRef = useRef(0);

  // ---------------------------------------------------------------------------
  // REFERENCE VIDEO STATE
  // ---------------------------------------------------------------------------

  const [referenceVideoUrl, setReferenceVideoUrl] =
    useState<string | null>(null);

  const [referenceVideoFileName, setReferenceVideoFileName] =
    useState<string | null>(null);

  const [referenceLoading, setReferenceLoading] =
    useState(false);

  const [referenceProgress, setReferenceProgress] =
    useState(0);

  const [referenceReady, setReferenceReady] =
    useState(false);

  const [referenceError, setReferenceError] =
    useState<string | null>(null);

  const referenceSequenceRef =
    useRef<ReferenceVideoSequence | null>(null);

  const videoMatcherRef =
    useRef<VideoMovementMatcher>(
      new VideoMovementMatcher()
    );

  const [videoMatch, setVideoMatch] = useState({
    score: 0,
    progress: 0,
    feedback: "Reference video not loaded.",
    leftArm: 0,
    rightArm: 0,
    leftLeg: 0,
    rightLeg: 0,
    torso: 0,
  });

  // ---------------------------------------------------------------------------
  // LIVE TELEMETRY
  // ---------------------------------------------------------------------------

  const [telemetry, setTelemetry] =
    useState<TelemetryData>({
      detectedMovement: selectedMovement.name,
      stage: "not_started",
      expectedArmAngle:
        selectedMovement.targetAngles.rightShoulderElevation.ideal,
      currentArmAngle: 0,
      angleError: 0,
      currentElbowAngle: 0,
      expectedElbowAngle:
        selectedMovement.targetAngles.rightElbowFlexion.ideal,
      poseSimilarityScore: 0,
      timingScore: 0,
      completionScore: 0,
      liveOverallScore: 0,
      fps: 0,
      bodyDetected: false,
      trackingConfidence: 0,
      repsCompleted: 0,
      feedbackText:
        "Click 'Start Practice' to begin real-time pose tracking.",
    });

  // ---------------------------------------------------------------------------
  // DOM REFS
  // ---------------------------------------------------------------------------

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const animationFrameIdRef =
    useRef<number | null>(null);

  const lastFrameTimeRef =
    useRef<number>(0);

  const frameCountRef =
    useRef<number>(0);

  const fpsRef =
    useRef<number>(0);

  // ---------------------------------------------------------------------------
  // AI ENGINES
  // ---------------------------------------------------------------------------

  const movementDetectorRef =
    useRef<MovementDetector>(
      new MovementDetector(selectedMovement)
    );

  const comparatorRef =
    useRef<MovementComparator>(
      new MovementComparator(selectedMovement)
    );

  // ---------------------------------------------------------------------------
  // LOAD REFERENCE VIDEO
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadReferenceVideo = async () => {
      if (!selectedMovement?.id) return;

      setReferenceLoading(true);
      setReferenceReady(false);
      setReferenceProgress(0);
      setReferenceError(null);
      setReferenceVideoUrl(null);
      setReferenceVideoFileName(null);

      referenceSequenceRef.current = null;
      videoMatcherRef.current.reset();

      try {
        const referenceVideosRef =
          collection(db, "referenceVideos");

        const q = query(
          referenceVideosRef,
          where("danceSlug", "==", slug),
          where("movementId", "==", selectedMovement.id),
          where("status", "==", "uploaded")
        );

        const snapshot = await getDocs(q);

        if (cancelled) return;

        if (snapshot.empty) {
          setReferenceError(
            "No reference video has been uploaded for this movement yet."
          );
          setReferenceLoading(false);
          return;
        }

        // Sort client-side so we don't require a Firestore composite index.
        const documents = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a: any, b: any) => {
            const aTime =
              a.createdAt?.seconds ??
              a.createdAt?.toMillis?.() ??
              0;

            const bTime =
              b.createdAt?.seconds ??
              b.createdAt?.toMillis?.() ??
              0;

            return bTime - aTime;
          });

        const latestVideo: any = documents[0];

        if (!latestVideo?.videoUrl) {
          setReferenceError(
            "The reference video record exists, but no video URL was found."
          );
          setReferenceLoading(false);
          return;
        }

        setReferenceVideoUrl(latestVideo.videoUrl);
        setReferenceVideoFileName(
          latestVideo.fileName || "Reference dance video"
        );

        const landmarker = await getPoseLandmarker();

        if (cancelled) return;

        const sequence = await processReferenceVideo({
          videoUrl: latestVideo.videoUrl,
          poseLandmarker: landmarker,
          frameIntervalMs: 100,
          onProgress: (progress) => {
            if (!cancelled) {
              setReferenceProgress(progress);
            }
          },
        });

        if (cancelled) return;

        referenceSequenceRef.current = sequence;

        videoMatcherRef.current.setReferenceSequence(
          sequence
        );

        setReferenceProgress(100);
        setReferenceReady(true);

        setVideoMatch({
          score: 0,
          progress: 0,
          feedback:
            "Reference loaded. Start Practice to begin matching.",
          leftArm: 0,
          rightArm: 0,
          leftLeg: 0,
          rightLeg: 0,
          torso: 0,
        });
      } catch (error: any) {
        console.error(
          "Failed to load reference video:",
          error
        );

        if (!cancelled) {
          setReferenceError(
            error?.message ||
              "Failed to process the reference dance video."
          );
        }
      } finally {
        if (!cancelled) {
          setReferenceLoading(false);
        }
      }
    };

    loadReferenceVideo();

    return () => {
      cancelled = true;
    };
  }, [slug, selectedMovement.id]);

  // ---------------------------------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // ---------------------------------------------------------------------------
  // LIVE COACHING SCORES
  // ---------------------------------------------------------------------------

  const coachingScores = useMemo(() => {
    const arm = Math.max(
      0,
      Math.min(
        100,
        Math.round(100 - telemetry.angleError * 1.8)
      )
    );

    const elbowError = Math.abs(
      telemetry.currentElbowAngle -
        telemetry.expectedElbowAngle
    );

    const elbow = Math.max(
      0,
      Math.min(
        100,
        Math.round(100 - elbowError * 1.6)
      )
    );

    const pose = Math.round(
      telemetry.poseSimilarityScore
    );

    const timing = Math.round(
      telemetry.timingScore
    );

    const traditionalOverall = Math.round(
      telemetry.liveOverallScore
    );

    const overall = referenceReady
      ? Math.round(
          videoMatch.score * 0.7 +
            traditionalOverall * 0.3
        )
      : traditionalOverall;

    return {
      arm,
      elbow,
      pose,
      timing,
      overall,
    };
  }, [
    telemetry,
    referenceReady,
    videoMatch.score,
  ]);

  // ---------------------------------------------------------------------------
  // AI TUTOR MESSAGE
  // ---------------------------------------------------------------------------

  const tutorMessage = useMemo(() => {
    if (!isPracticing) {
      return "Start practice when you are ready. I will guide you step by step.";
    }

    if (!telemetry.bodyDetected) {
      return "I cannot see your full body. Step back and keep your whole body inside the frame.";
    }

    // When reference video matching is active, prioritize
    // reference-video corrections.
    if (
      referenceReady &&
      videoMatch.score > 0
    ) {
      if (videoMatch.rightArm < 55) {
        return "Focus on your right arm. Match the reference video's arm position more closely.";
      }

      if (videoMatch.leftArm < 55) {
        return "Focus on your left arm. Bring it closer to the reference movement.";
      }

      if (videoMatch.rightLeg < 55) {
        return "Your right leg is different from the reference. Adjust the leg position.";
      }

      if (videoMatch.leftLeg < 55) {
        return "Your left leg is different from the reference. Adjust the leg position.";
      }

      if (videoMatch.torso < 55) {
        return "Keep your torso closer to the reference dancer's posture.";
      }

      if (videoMatch.score >= 90) {
        return "Excellent! Your movement is closely matching the reference video.";
      }

      if (videoMatch.score >= 78) {
        return "Very good. Your movement is close to the reference. Keep the timing smooth.";
      }

      if (videoMatch.score >= 65) {
        return "Good start. Watch the reference carefully and make your movement more precise.";
      }
    }

    const armError = Math.abs(
      telemetry.expectedArmAngle -
        telemetry.currentArmAngle
    );

    const elbowError = Math.abs(
      telemetry.expectedElbowAngle -
        telemetry.currentElbowAngle
    );

    if (elbowError >= 18) {
      return telemetry.currentElbowAngle <
        telemetry.expectedElbowAngle
        ? "Your elbow is too low. Lift it gradually and keep your shoulder relaxed."
        : "Your elbow is too high. Lower it slightly and keep the arm controlled.";
    }

    if (elbowError >= 10) {
      return telemetry.currentElbowAngle <
        telemetry.expectedElbowAngle
        ? "Bring your elbow a little higher. Nice and controlled."
        : "Bring your elbow down a little. Stay relaxed through the shoulder.";
    }

    if (armError >= 18) {
      return telemetry.currentArmAngle <
        telemetry.expectedArmAngle
        ? "Your right arm needs to come higher. Lift from the shoulder and hold the line."
        : "Your right arm is too high. Lower it slowly to match the target position.";
    }

    if (armError >= 10) {
      return telemetry.currentArmAngle <
        telemetry.expectedArmAngle
        ? "Raise your right arm just a little. You are almost there."
        : "Lower your right arm slightly. Match the target position.";
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

    return (
      telemetry.feedbackText ||
      "Stay centered, follow the target, and move with control."
    );
  }, [
    isPracticing,
    telemetry,
    referenceReady,
    videoMatch,
  ]);

  // ---------------------------------------------------------------------------
  // VOICE TUTOR
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (
      !voiceTutorEnabled ||
      !isPracticing ||
      typeof window === "undefined"
    ) {
      return;
    }

    if (!window.speechSynthesis) return;

    const message = tutorMessage.trim();

    if (!message) return;

    const now = Date.now();

    const sameMessage =
      message === lastSpokenFeedbackRef.current;

    const minimumGap = sameMessage ? 7000 : 3000;

    if (
      now - lastSpokenAtRef.current <
      minimumGap
    ) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      return;
    }

    lastSpokenFeedbackRef.current = message;
    lastSpokenAtRef.current = now;

    const utterance =
      new SpeechSynthesisUtterance(message);

    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices =
      window.speechSynthesis.getVoices();

    const preferredVoice = voices.find((voice) =>
      /en-IN|en-GB|en-US/i.test(voice.lang)
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [
    tutorMessage,
    voiceTutorEnabled,
    isPracticing,
  ]);

  // ---------------------------------------------------------------------------
  // HANDLE MOVEMENT CHANGE
  // ---------------------------------------------------------------------------

  const handleSelectMovement = (
    movement: MovementDefinition
  ) => {
    if (isPracticingRef.current) {
      return;
    }

    setSelectedMovement(movement);

    movementDetectorRef.current.reset(movement);
    comparatorRef.current.reset(movement);

    videoMatcherRef.current.reset();

    setReferenceReady(false);
    setReferenceProgress(0);
    setReferenceError(null);
    setReferenceVideoUrl(null);
    setReferenceVideoFileName(null);

    setVideoMatch({
      score: 0,
      progress: 0,
      feedback:
        "Loading reference video...",
      leftArm: 0,
      rightArm: 0,
      leftLeg: 0,
      rightLeg: 0,
      torso: 0,
    });

    setTelemetry((prev) => ({
      ...prev,
      detectedMovement: movement.name,
      expectedArmAngle:
        movement.targetAngles.rightShoulderElevation.ideal,
      expectedElbowAngle:
        movement.targetAngles.rightElbowFlexion.ideal,
      currentArmAngle: 0,
      currentElbowAngle: 0,
      angleError: 0,
      poseSimilarityScore: 0,
      timingScore: 0,
      completionScore: 0,
      liveOverallScore: 0,
      repsCompleted: 0,
      stage: "not_started",
      bodyDetected: false,
      trackingConfidence: 0,
      feedbackText:
        "Reference video is loading...",
    }));
  };

  // ---------------------------------------------------------------------------
  // STOP PRACTICE
  // ---------------------------------------------------------------------------

  const stopPractice = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    const wasPracticing =
      isPracticingRef.current;

    if (
      animationFrameIdRef.current !== null
    ) {
      cancelAnimationFrame(
        animationFrameIdRef.current
      );

      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx =
        canvasRef.current.getContext("2d");

      if (ctx) {
        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }

    isPracticingRef.current = false;

    setIsPracticing(false);
    setIsModelLoading(false);

    if (
      wasPracticing &&
      dance &&
      lesson
    ) {
      const result =
        comparatorRef.current.finalizeSession(
          user?.uid || "guest",
          dance.slug,
          dance.name,
          lessonIndex,
          lesson.title,
          movementDetectorRef.current.getState()
            .repsCompleted
        );

      setSessionResult(result);

      savePracticeSession(result);

      setCompletedModalOpen(true);
    }
  }, [
    dance,
    lesson,
    lessonIndex,
    user,
    savePracticeSession,
  ]);

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (
        animationFrameIdRef.current
      ) {
        cancelAnimationFrame(
          animationFrameIdRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      releasePoseLandmarker();

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // LIVE AI PROCESSING STATE
  // ---------------------------------------------------------------------------

  const processingBusyRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastTelemetryUpdateRef = useRef(0);
  const lastVideoMatchUpdateRef = useRef(0);

  const TARGET_PROCESS_INTERVAL_MS = 33;

  // ---------------------------------------------------------------------------
  // PROCESS LIVE VIDEO FRAME
  // ---------------------------------------------------------------------------

  const processVideoFrame = useCallback(
    async (landmarker: any) => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !isPracticingRef.current
      ) {
        return;
      }

      /*
       * requestAnimationFrame can run faster than MediaPipe can process.
       * Without this guard, multiple detectForVideo calls can overlap and
       * create unstable timestamps / CPU spikes.
       */
      if (processingBusyRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(() =>
          processVideoFrame(landmarker)
        );
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState < 2) {
        animationFrameIdRef.current = requestAnimationFrame(() =>
          processVideoFrame(landmarker)
        );
        return;
      }

      const now = performance.now();

      /*
       * Keep processing close to 30 FPS even when the browser is rendering
       * at 60/120/144 Hz.
       */
      if (
        lastDetectionTimeRef.current > 0 &&
        now - lastDetectionTimeRef.current <
          TARGET_PROCESS_INTERVAL_MS
      ) {
        animationFrameIdRef.current = requestAnimationFrame(() =>
          processVideoFrame(landmarker)
        );
        return;
      }

      processingBusyRef.current = true;
      lastDetectionTimeRef.current = now;

      try {
        // ---------------------------------------------------------------------
        // FPS
        // ---------------------------------------------------------------------

        frameCountRef.current += 1;

        if (
          now - lastFrameTimeRef.current >= 1000
        ) {
          fpsRef.current = frameCountRef.current;
          frameCountRef.current = 0;
          lastFrameTimeRef.current = now;
        }

        // ---------------------------------------------------------------------
        // CANVAS
        // ---------------------------------------------------------------------

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (
          canvas.width !== width ||
          canvas.height !== height
        ) {
          canvas.width = width;
          canvas.height = height;
        }

        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // ---------------------------------------------------------------------
        // MEDIAPIPE POSE DETECTION
        // ---------------------------------------------------------------------

        const results =
          landmarker.detectForVideo(
            video,
            now
          );

        if (
          !results ||
          !results.landmarks ||
          results.landmarks.length === 0
        ) {
          if (
            now - lastTelemetryUpdateRef.current >= 150
          ) {
            lastTelemetryUpdateRef.current = now;

            setTelemetry((prev) => ({
              ...prev,
              bodyDetected: false,
              trackingConfidence: 0,
              feedbackText:
                "Body not detected. Move into the camera frame.",
              fps: fpsRef.current || prev.fps || 30,
            }));
          }

          return;
        }

        const rawLandmarks: Landmark3D[] =
          results.landmarks[0];

        // ---------------------------------------------------------------------
        // BODY VISIBILITY
        // ---------------------------------------------------------------------

        const visibilityCheck =
          checkBodyVisibility(rawLandmarks);

        if (!visibilityCheck.isVisible) {
          if (
            now - lastTelemetryUpdateRef.current >= 150
          ) {
            lastTelemetryUpdateRef.current = now;

            setTelemetry((prev) => ({
              ...prev,
              bodyDetected: false,
              trackingConfidence:
                visibilityCheck.confidence,
              feedbackText:
                "Body not fully detected. Step back and keep your whole body inside the frame.",
              fps: fpsRef.current || prev.fps || 30,
            }));
          }

          return;
        }

        // ---------------------------------------------------------------------
        // EXISTING MOVEMENT ENGINE
        // ---------------------------------------------------------------------

        const movementState =
          movementDetectorRef.current.update(
            rawLandmarks,
            now
          );

        const evalResult =
          comparatorRef.current.evaluateLive(
            movementState,
            rawLandmarks
          );

        // ---------------------------------------------------------------------
        // REFERENCE VIDEO MATCHING
        // ---------------------------------------------------------------------

        let currentMatchResult:
          | ReturnType<
              VideoMovementMatcher["evaluate"]
            >
          | null = null;

        if (
          referenceReady &&
          referenceSequenceRef.current
        ) {
          try {
            currentMatchResult =
              videoMatcherRef.current.evaluate(
                rawLandmarks
              );

            /*
             * React state updates do not need to happen at camera frequency.
             * The matcher itself still evaluates every processed frame.
             */
            if (
              currentMatchResult &&
              now -
                lastVideoMatchUpdateRef.current >=
                100
            ) {
              lastVideoMatchUpdateRef.current = now;

              setVideoMatch({
                score:
                  currentMatchResult.score,
                progress:
                  currentMatchResult.progress,
                feedback:
                  currentMatchResult.feedback,
                leftArm:
                  currentMatchResult.bodyPartScores
                    .leftArm,
                rightArm:
                  currentMatchResult.bodyPartScores
                    .rightArm,
                leftLeg:
                  currentMatchResult.bodyPartScores
                    .leftLeg,
                rightLeg:
                  currentMatchResult.bodyPartScores
                    .rightLeg,
                torso:
                  currentMatchResult.bodyPartScores
                    .torso,
              });
            }
          } catch (matchError) {
            console.warn(
              "Reference video matching error:",
              matchError
            );
          }
        }

        // ---------------------------------------------------------------------
        // DRAW SKELETON
        // ---------------------------------------------------------------------

        drawSkeleton(
          ctx,
          rawLandmarks,
          canvas.width,
          canvas.height,
          {
            currentArmAngle:
              movementState.currentArmAngle,

            expectedArmAngle:
              movementState.expectedArmAngle,

            currentElbowAngle:
              movementState.currentElbowAngle,

            mirrored: true,

            showAngleLabels: true,
          }
        );

        // ---------------------------------------------------------------------
        // TELEMETRY
        // ---------------------------------------------------------------------

        /*
         * Update React telemetry at a controlled frequency.
         * The AI engines still run every processed camera frame.
         */
        if (
          now -
            lastTelemetryUpdateRef.current >=
          100
        ) {
          lastTelemetryUpdateRef.current = now;

          setTelemetry({
            detectedMovement:
              selectedMovement.name,

            stage:
              movementState.stage,

            expectedArmAngle:
              movementState.expectedArmAngle,

            currentArmAngle:
              movementState.currentArmAngle,

            angleError:
              movementState.angleError,

            currentElbowAngle:
              movementState.currentElbowAngle,

            expectedElbowAngle:
              movementState.expectedElbowAngle,

            poseSimilarityScore:
              evalResult.poseSimilarityScore,

            timingScore:
              evalResult.timingScore,

            completionScore:
              evalResult.completionScore,

            liveOverallScore:
              evalResult.overallScore,

            fps:
              fpsRef.current || 30,

            bodyDetected: true,

            trackingConfidence:
              visibilityCheck.confidence,

            repsCompleted:
              movementState.repsCompleted,

            feedbackText:
              movementState.feedbackText,
          });
        }
      } catch (detectionErr) {
        console.warn(
          "Pose detection error:",
          detectionErr
        );
      } finally {
        processingBusyRef.current = false;

        if (
          isPracticingRef.current
        ) {
          animationFrameIdRef.current =
            requestAnimationFrame(() =>
              processVideoFrame(
                landmarker
              )
            );
        }
      }
    },
    [
      selectedMovement,
      referenceReady,
    ]
  );

  // ---------------------------------------------------------------------------
  // START PRACTICE
  // ---------------------------------------------------------------------------

  const startPractice = async () => {
    setCameraError(null);
    setIsModelLoading(true);

    try {
      if (
        !referenceReady &&
        referenceLoading
      ) {
        setCameraError(
          "The reference dance video is still loading. Please wait a moment and try again."
        );

        setIsModelLoading(false);

        return;
      }

      // Camera
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              width: {
                ideal: 640,
              },

              height: {
                ideal: 480,
              },

              frameRate: {
                ideal: 30,
                max: 30,
              },
            },

            audio: false,
          }
        );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      // MediaPipe
      const landmarker =
        await getPoseLandmarker();

      setIsModelLoading(false);

      // Reset live processing state
      processingBusyRef.current = false;
      lastDetectionTimeRef.current = 0;
      lastTelemetryUpdateRef.current = 0;
      lastVideoMatchUpdateRef.current = 0;
      frameCountRef.current = 0;
      fpsRef.current = 0;
      lastFrameTimeRef.current = performance.now();

      // Reset existing AI
      movementDetectorRef.current.reset(
        selectedMovement
      );

      comparatorRef.current.reset(
        selectedMovement
      );

      videoMatcherRef.current.resetPosition();

      setVideoMatch((prev) => ({
        ...prev,

        progress: 0,

        feedback: referenceReady
          ? "Reference matching started."
          : "Practicing without a reference video.",
      }));

      isPracticingRef.current =
        true;

      setIsPracticing(true);

      // Start processing
      animationFrameIdRef.current =
        requestAnimationFrame(() =>
          processVideoFrame(
            landmarker
          )
        );
    } catch (err: any) {
      console.error(
        "Failed to start AI practice:",
        err
      );

      setIsModelLoading(false);

      isPracticingRef.current =
        false;

      setIsPracticing(false);

      if (
        err.name ===
          "NotAllowedError" ||
        err.name ===
          "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (
        err.name ===
          "NotFoundError" ||
        err.name ===
          "DevicesNotFoundError"
      ) {
        setCameraError(
          "No compatible webcam was found on your device."
        );
      } else {
        setCameraError(
          err.message ||
            "Failed to initialize camera or AI model. Please try again."
        );
      }
    }
  };

  // ---------------------------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // DANCE NOT FOUND
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#111111] text-[#F8F1E6] selection:bg-[#B42318] selection:text-white pb-20">
      <Navbar />

      <main className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Link
              href={`/dance/${slug}`}
              className="hover:text-[#B42318] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />

              <span>
                Back to {dance.name} Lesson
              </span>
            </Link>

            <span>/</span>

            <span className="text-white font-mono uppercase">
              RHYTHM AI — VIDEO MATCH COACH ·{" "}
              {selectedMovement.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 bg-[#252525] border border-white/10 rounded-full px-3 py-1 text-[11px] font-semibold text-gray-300">
              <ShieldCheck
                size={13}
                className="text-green-400"
              />

              <span>
                Camera Local Only
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-[#B42318]/20 border border-[#B42318]/40 rounded-full px-3 py-1 text-[11px] font-mono font-bold text-[#FF8577]">
              <Sparkles size={12} />

              <span>
                Rhythm AI Engine
              </span>
            </div>
          </div>
        </div>

        {/* CAMERA ERROR */}
        {cameraError && (
          <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3 text-red-200">
            <AlertCircle
              size={20}
              className="text-red-400 flex-shrink-0 mt-0.5"
            />

            <div className="text-xs sm:text-sm">
              <p className="font-bold text-red-300 mb-1">
                Practice Error
              </p>

              <p>{cameraError}</p>
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT */}
          <div className="lg:col-span-8 space-y-4">
            {/* CAMERA */}
            <div className="relative aspect-video w-full rounded-[28px] overflow-hidden bg-black border border-white/15 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isPracticing
                    ? "opacity-100"
                    : "opacity-0 hidden"
                }`}
              />

              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                  isPracticing
                    ? "block"
                    : "hidden"
                }`}
              />

              {!isPracticing &&
                !isModelLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#1E1E1E] to-[#111111] z-20">
                    <div className="w-20 h-20 rounded-full bg-[#B42318]/20 border border-[#B42318]/40 flex items-center justify-center mb-4 text-[#B42318]">
                      <Camera size={36} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#FF8577] mb-2">
                      <Sparkles size={12} />

                      <span>
                        RHYTHM AI COACH
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-3xl font-black uppercase font-mono tracking-tight text-white mb-2">
                      Practice with Rhythm AI
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-5 leading-relaxed">
                      Dance in front of your camera while
                      Rhythm AI compares your body movement
                      with the uploaded reference dance video.
                    </p>

                    {/* Reference status */}
                    <div className="mb-5 w-full max-w-md">
                      {referenceLoading && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Loader2
                              size={14}
                              className="animate-spin text-[#FF8577]"
                            />

                            <span className="text-xs font-bold text-white">
                              PROCESSING REFERENCE VIDEO
                            </span>

                            <span className="ml-auto text-xs font-mono text-[#FF8577]">
                              {referenceProgress}%
                            </span>
                          </div>

                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#B42318] transition-all duration-300"
                              style={{
                                width: `${referenceProgress}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {!referenceLoading &&
                        referenceReady && (
                          <div className="rounded-2xl bg-green-950/30 border border-green-500/30 p-3 text-left">
                            <div className="flex items-center gap-2">
                              <Video
                                size={14}
                                className="text-green-400"
                              />

                              <span className="text-xs font-bold text-green-300">
                                REFERENCE VIDEO READY
                              </span>
                            </div>

                            <p className="text-[10px] text-gray-400 mt-1 truncate">
                              {referenceVideoFileName}
                            </p>
                          </div>
                        )}

                      {!referenceLoading &&
                        referenceError && (
                          <div className="rounded-2xl bg-yellow-950/30 border border-yellow-500/30 p-3 text-left">
                            <div className="flex items-center gap-2">
                              <AlertCircle
                                size={14}
                                className="text-yellow-400"
                              />

                              <span className="text-xs font-bold text-yellow-300">
                                NO REFERENCE VIDEO
                              </span>
                            </div>

                            <p className="text-[10px] text-gray-400 mt-1">
                              {referenceError}
                            </p>
                          </div>
                        )}
                    </div>

                    <button
                      onClick={startPractice}
                      id="btn-start-practice"
                      disabled={
                        referenceLoading
                      }
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#B42318] hover:bg-[#C92A1E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-[#B42318]/40"
                    >
                      <Play
                        size={16}
                        className="fill-white"
                      />

                      <span>
                        {referenceLoading
                          ? "Loading Reference..."
                          : "Practice with Rhythm AI"}
                      </span>
                    </button>
                  </div>
                )}

              {/* MODEL LOADING */}
              {isModelLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />

                  <p className="text-sm font-bold font-mono tracking-wider text-white">
                    LOADING MEDIAPIPE POSE ENGINE...
                  </p>

                  <p className="text-xs text-gray-400">
                    Initializing local WebAssembly &
                    GPU delegate
                  </p>
                </div>
              )}

              {/* LIVE HUD */}
              {isPracticing && (
                <>
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          telemetry.bodyDetected
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }`}
                      />

                      <span>
                        {telemetry.bodyDetected
                          ? `TRACKING: ${telemetry.trackingConfidence}%`
                          : "BODY LOST"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {referenceReady && (
                        <div className="bg-black/80 backdrop-blur-md border border-[#B42318]/50 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold">
                          <span className="text-[#FF8577]">
                            VIDEO:
                          </span>{" "}
                          {videoMatch.score}%
                        </div>
                      )}

                      <div className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-mono font-bold">
                        <span className="text-[#FF8577]">
                          REPS:
                        </span>{" "}
                        <span className="text-white text-sm">
                          {telemetry.repsCompleted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM FEEDBACK */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2 pointer-events-none">
                    <div className="bg-black/85 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl">
                      <div className="w-8 h-8 rounded-full bg-[#B42318] flex items-center justify-center flex-shrink-0 text-white font-bold">
                        ✦
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] uppercase font-mono font-bold text-gray-400">
                            AI TUTOR ·{" "}
                            {telemetry.stage
                              .replaceAll(
                                "_",
                                " "
                              )
                              .toUpperCase()}
                          </span>

                          <span className="text-[10px] font-mono font-black text-yellow-400">
                            {coachingScores.overall}%
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

            {/* CONTROLS */}
            <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {isPracticing ? (
                  <button
                    onClick={stopPractice}
                    id="btn-stop-practice"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase text-xs rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#B42318]/30"
                  >
                    <CameraOff size={15} />

                    <span>
                      Stop Practice
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={startPractice}
                    disabled={
                      referenceLoading
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase text-xs rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-green-500/20"
                  >
                    <Play
                      size={15}
                      className="fill-white"
                    />

                    <span>
                      Start Practice
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    movementDetectorRef.current.reset(
                      selectedMovement
                    );

                    comparatorRef.current.reset(
                      selectedMovement
                    );

                    videoMatcherRef.current.resetPosition();

                    setVideoMatch((prev) => ({
                      ...prev,
                      score: 0,
                      progress: 0,
                      feedback:
                        referenceReady
                          ? "Reference matching reset."
                          : "Reference video not loaded.",
                    }));

                    setTelemetry((prev) => ({
                      ...prev,
                      repsCompleted: 0,
                      liveOverallScore: 0,
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-gray-300 hover:text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />

                  <span>
                    Reset Reps
                  </span>
                </button>
              </div>

              <button
                onClick={() =>
                  setShowDiagnostics(
                    !showDiagnostics
                  )
                }
                id="btn-toggle-diagnostics"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 px-3 py-2 rounded-xl"
              >
                <Code
                  size={14}
                  className="text-[#FF8577]"
                />

                <span>
                  Judge & Dev Telemetry
                </span>

                {showDiagnostics ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            </div>

            {/* DIAGNOSTICS */}
            <AnimatePresence>
              {showDiagnostics && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="bg-[#181818] border border-white/15 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity
                        size={16}
                        className="text-[#B42318]"
                      />

                      <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                        Real-Time Mathematical Telemetry
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
                        Target Arm
                      </span>

                      <span className="text-yellow-400 font-bold block">
                        {telemetry.expectedArmAngle}°
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Current Arm
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
                        Pose Similarity
                      </span>

                      <span className="text-white font-bold block">
                        {telemetry.poseSimilarityScore}%
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Timing Score
                      </span>

                      <span className="text-white font-bold block">
                        {telemetry.timingScore}%
                      </span>
                    </div>

                    <div className="bg-[#222222] p-3 rounded-xl border border-[#B42318]/30 space-y-1">
                      <span className="text-gray-400 text-[10px] block uppercase">
                        Video Match
                      </span>

                      <span className="text-[#FF8577] font-bold block text-sm">
                        {videoMatch.score}%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#222222] border border-white/5 p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-gray-400 font-mono uppercase">
                        Reference Video Progress
                      </span>

                      <span className="text-[10px] text-[#FF8577] font-mono font-bold">
                        {videoMatch.progress}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#B42318] transition-all duration-200"
                        style={{
                          width: `${videoMatch.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 italic">
                    Joint positions are extracted from
                    MediaPipe Pose Landmarker and compared
                    against normalized landmark frames from
                    the uploaded reference dance video.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI TUTOR */}
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

                      <p className="text-xs font-bold text-white">
                        Reference video coaching
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setVoiceTutorEnabled(
                        (v) => !v
                      )
                    }
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title={
                      voiceTutorEnabled
                        ? "Mute AI tutor"
                        : "Enable AI tutor voice"
                    }
                  >
                    {voiceTutorEnabled ? (
                      <Volume2 size={16} />
                    ) : (
                      <VolumeX size={16} />
                    )}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#222222] border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPracticing
                          ? "bg-green-400 animate-pulse"
                          : "bg-gray-500"
                      }`}
                    />

                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-gray-400">
                      {isPracticing
                        ? "ANALYSING YOUR DANCE"
                        : "READY TO COACH"}
                    </span>
                  </div>

                  <p className="text-sm font-bold leading-6 text-white">
                    {tutorMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* REFERENCE VIDEO CARD */}
            <div className="bg-[#181818] border border-[#B42318]/30 rounded-[28px] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    REFERENCE VIDEO
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded dance used for AI matching
                  </p>
                </div>

                <Video
                  size={18}
                  className="text-[#FF8577]"
                />
              </div>

              {referenceVideoUrl ? (
                <div className="space-y-3">
                  <video
                    src={referenceVideoUrl}
                    controls
                    muted
                    playsInline
                    className="w-full rounded-2xl bg-black border border-white/10 aspect-video object-contain"
                  />

                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        referenceReady
                          ? "bg-green-400"
                          : "bg-yellow-400"
                      }`}
                    />

                    <span className="text-[10px] font-mono font-bold text-gray-300 truncate">
                      {referenceReady
                        ? "READY FOR LIVE MATCHING"
                        : `PROCESSING ${referenceProgress}%`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-[#222222] border border-white/5 flex flex-col items-center justify-center text-center p-5">
                  {referenceLoading ? (
                    <>
                      <Loader2
                        size={24}
                        className="text-[#FF8577] animate-spin mb-2"
                      />

                      <p className="text-xs font-bold text-white">
                        Processing reference video...
                      </p>

                      <p className="text-[10px] text-gray-500 mt-1">
                        {referenceProgress}%
                      </p>
                    </>
                  ) : (
                    <>
                      <Video
                        size={24}
                        className="text-gray-600 mb-2"
                      />

                      <p className="text-xs font-bold text-gray-400">
                        No reference video loaded
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* VIDEO MATCH SCORE */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    VIDEO MATCH
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Your live pose vs reference dance
                  </p>
                </div>

                <div className="w-16 h-16 rounded-full border-4 border-[#B42318]/30 flex items-center justify-center bg-[#B42318]/10">
                  <span className="text-xl font-black font-mono text-[#FF8577]">
                    {videoMatch.score}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  [
                    "LEFT ARM",
                    videoMatch.leftArm,
                  ],
                  [
                    "RIGHT ARM",
                    videoMatch.rightArm,
                  ],
                  [
                    "LEFT LEG",
                    videoMatch.leftLeg,
                  ],
                  [
                    "RIGHT LEG",
                    videoMatch.rightLeg,
                  ],
                  [
                    "TORSO",
                    videoMatch.torso,
                  ],
                ].map(([label, score]) => (
                  <div
                    key={label as string}
                  >
                    <div className="flex justify-between mb-1.5 text-[10px] font-mono font-bold">
                      <span className="text-gray-400">
                        {label}
                      </span>

                      <span className="text-white">
                        {score}%
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#B42318] transition-all duration-300"
                        style={{
                          width: `${score}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-[#222222] border border-white/5 p-3">
                <p className="text-[11px] text-gray-300 leading-5">
                  {videoMatch.feedback}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">
                    Reference Progress
                  </span>

                  <span className="text-[9px] font-mono font-bold text-[#FF8577]">
                    {videoMatch.progress}%
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#B42318] transition-all duration-300"
                    style={{
                      width: `${videoMatch.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* OVERALL SCORE */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    LIVE PERFORMANCE
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Video matching + pose analysis
                  </p>
                </div>

                <div className="w-16 h-16 rounded-full border-4 border-[#B42318]/30 flex items-center justify-center bg-[#B42318]/10">
                  <span className="text-xl font-black font-mono text-[#FF8577]">
                    {coachingScores.overall}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  [
                    "VIDEO MATCH",
                    videoMatch.score,
                  ],
                  [
                    "ARM POSITION",
                    coachingScores.arm,
                  ],
                  [
                    "ELBOW ANGLE",
                    coachingScores.elbow,
                  ],
                  [
                    "POSE MATCH",
                    coachingScores.pose,
                  ],
                  [
                    "TIMING",
                    coachingScores.timing,
                  ],
                ].map(([label, score]) => (
                  <div
                    key={label as string}
                  >
                    <div className="flex justify-between mb-1.5 text-[10px] font-mono font-bold">
                      <span className="text-gray-400">
                        {label}
                      </span>

                      <span className="text-white">
                        {score}%
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#B42318] transition-all duration-300"
                        style={{
                          width: `${score}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TARGET VS ACTUAL */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Target
                  size={16}
                  className="text-[#FF8577]"
                />

                <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                  TARGET VS YOUR POSE
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">
                    Target Arm
                  </span>

                  <span className="text-2xl font-black font-mono text-green-400">
                    {telemetry.expectedArmAngle}°
                  </span>
                </div>

                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">
                    Your Arm
                  </span>

                  <span
                    className={`text-2xl font-black font-mono ${
                      coachingScores.arm >= 80
                        ? "text-green-400"
                        : "text-[#FF8577]"
                    }`}
                  >
                    {telemetry.currentArmAngle}°
                  </span>
                </div>

                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">
                    Target Elbow
                  </span>

                  <span className="text-2xl font-black font-mono text-green-400">
                    {telemetry.expectedElbowAngle}°
                  </span>
                </div>

                <div className="rounded-2xl bg-[#222222] border border-white/5 p-4 text-center">
                  <span className="block text-[9px] font-mono font-bold text-gray-500 uppercase mb-2">
                    Your Elbow
                  </span>

                  <span
                    className={`text-2xl font-black font-mono ${
                      coachingScores.elbow >= 80
                        ? "text-green-400"
                        : "text-[#FF8577]"
                    }`}
                  >
                    {telemetry.currentElbowAngle}°
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#B42318]/20 bg-[#B42318]/5 p-3 flex items-start gap-3">
                <TrendingUp
                  size={15}
                  className="text-[#FF8577] mt-0.5 shrink-0"
                />

                <p className="text-[11px] leading-5 text-gray-300">
                  {telemetry.bodyDetected
                    ? `Current arm error: ${Math.round(
                        telemetry.angleError
                      )}°. Video match: ${
                        videoMatch.score
                      }%.`
                    : "Start practice to compare your live movement with the reference dance."}
                </p>
              </div>
            </div>

            {/* MOVEMENT SELECTOR */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase font-mono tracking-widest text-[#FF8577]">
                  DANCE MOVEMENT
                </span>

                <span className="text-xs font-bold text-gray-400">
                  {dance.name}
                </span>
              </div>

              <h3 className="text-xl font-black uppercase font-mono tracking-tight text-white">
                {selectedMovement.name}
              </h3>

              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedMovement.description}
              </p>

              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase">
                  Studio drills
                </span>

                <div className="space-y-1.5">
                  {referenceMovements.map(
                    (movement) => (
                      <button
                        key={movement.id}
                        onClick={() =>
                          handleSelectMovement(
                            movement
                          )
                        }
                        disabled={
                          isPracticing
                        }
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedMovement.id ===
                          movement.id
                            ? "bg-[#B42318] text-white shadow-md"
                            : "bg-[#222222] text-gray-300 hover:bg-[#2A2A2A]"
                        }`}
                      >
                        <span className="truncate">
                          {movement.name}
                        </span>

                        <ChevronRight
                          size={14}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* INSTRUCTIONS */}
            <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[#FF8577] font-black">
                  ✦
                </span>

                <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
                  EXECUTION GUIDELINES
                </h4>
              </div>

              <div className="space-y-2.5">
                {selectedMovement.instructions.map(
                  (instruction, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 bg-[#222222] p-3 rounded-xl border border-white/5 text-xs text-gray-300"
                    >
                      <span className="text-[#FF8577] font-mono font-black text-sm leading-none">
                        {(index + 1)
                          .toString()
                          .padStart(2, "0")}
                      </span>

                      <span className="leading-snug">
                        {instruction}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SESSION RESULTS */}
      <AnimatePresence>
        {completedModalOpen &&
          sessionResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0,
                }}
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
                    {dance.name} · Lesson{" "}
                    {(lessonIndex + 1)
                      .toString()
                      .padStart(2, "0")}
                  </p>
                </div>

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

                <div className="text-left space-y-2 bg-[#252525] p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                    Rhythm AI Feedback & Takeaways:
                  </span>

                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                    {sessionResult.feedbackSummary.map(
                      (feedback, index) => (
                        <li key={index}>
                          {feedback}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCompletedModalOpen(
                        false
                      );

                      startPractice();
                    }}
                    className="flex-1 py-3.5 bg-[#252525] hover:bg-[#333333] rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-white/10"
                  >
                    Practice Again
                  </button>

                  <button
                    onClick={() =>
                      router.push(
                        "/dashboard"
                      )
                    }
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