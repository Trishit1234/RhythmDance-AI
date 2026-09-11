"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPoseLandmarker } from "@/lib/ai/poseDetector";

type MovementLabel =
  | "right_arm_raise"
  | "left_arm_raise"
  | "aramandi_stance"
  | "chowka_stance"
  | "namaskar_salutation";

type Landmark = { x: number; y: number; z: number; visibility?: number };

type DatasetSample = {
  version: 1;
  id: string;
  label: MovementLabel;
  capturedAt: string;
  frameCount: number;
  landmarks: number[][][];
};

const MOVEMENTS: { value: MovementLabel; name: string; hint: string }[] = [
  { value: "right_arm_raise", name: "Right Arm Raise", hint: "Raise the right arm through the full movement." },
  { value: "left_arm_raise", name: "Left Arm Raise", hint: "Raise the left arm through the full movement." },
  { value: "aramandi_stance", name: "Aramandi / Ardhamandalam", hint: "Hold a clear aramandi / half-sitting stance." },
  { value: "chowka_stance", name: "Chowka Stance", hint: "Hold a clear chowka stance." },
  { value: "namaskar_salutation", name: "Namaskar Salutation", hint: "Perform a complete namaskar salutation." },
];

const CAPTURE_FRAMES = 80;
const CAPTURE_INTERVAL_MS = 50;
const STORAGE_KEY = "rhythm-dance-recorder-counts-v1";

function makeId() {
  return `sample_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function downloadJson(sample: DatasetSample) {
  const blob = new Blob([JSON.stringify(sample)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sample.label}_${sample.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function landmarkToArray(lm: Landmark) {
  return [lm.x, lm.y, lm.z, lm.visibility ?? 0];
}

export default function DatasetRecorderPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastCaptureRef = useRef(0);
  const framesRef = useRef<number[][][]>([]);
  const recordingRef = useRef(false);

  const [movement, setMovement] = useState<MovementLabel>("right_arm_raise");
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [lastSample, setLastSample] = useState<DatasetSample | null>(null);
  const [counts, setCounts] = useState<Record<MovementLabel, number>>(() => {
    const empty = Object.fromEntries(MOVEMENTS.map((m) => [m.value, 0])) as Record<MovementLabel, number>;
    if (typeof window === "undefined") return empty;
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return empty;
    }
  });
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    recordingRef.current = false;
    setRecording(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const processFrame = useCallback((now: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker) return;

    if (video.readyState >= 2) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      try {
        const result = landmarker.detectForVideo(video, now);
        const pose = result?.landmarks?.[0] as Landmark[] | undefined;
        if (pose?.length === 33 && recordingRef.current && now - lastCaptureRef.current >= CAPTURE_INTERVAL_MS) {
          lastCaptureRef.current = now;
          framesRef.current.push(pose.map(landmarkToArray));
          setFrameCount(framesRef.current.length);

          if (framesRef.current.length >= CAPTURE_FRAMES) {
            const sample: DatasetSample = {
              version: 1,
              id: makeId(),
              label: movement,
              capturedAt: new Date().toISOString(),
              frameCount: framesRef.current.length,
              landmarks: framesRef.current,
            };
            recordingRef.current = false;
            setRecording(false);
            setLastSample(sample);
            setCounts((prev) => {
              const next = { ...prev, [movement]: prev[movement] + 1 };
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
              return next;
            });
          }
        }
      } catch (e) {
        console.error("Pose recording error", e);
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [movement]);

  const startCamera = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Video element is unavailable.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      landmarkerRef.current = await getPoseLandmarker();
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (e: any) {
      setError(e?.message || "Could not start the camera. Check browser camera permission.");
      stopCamera();
    } finally {
      setLoading(false);
    }
  }, [processFrame, stopCamera]);

  const startRecording = useCallback(() => {
    if (!cameraOn || recordingRef.current) return;
    setError("");
    setLastSample(null);
    framesRef.current = [];
    setFrameCount(0);
    setCountdown(3);
    let n = 3;
    const timer = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(timer);
        setCountdown(null);
        recordingRef.current = true;
        setRecording(true);
        lastCaptureRef.current = performance.now();
      } else {
        setCountdown(n);
      }
    }, 1000);
  }, [cameraOn]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const selected = MOVEMENTS.find((m) => m.value === movement)!;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">RhythmDance AI</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Dataset Recorder</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Record pose landmarks only. No video is saved. Each sample contains 80 frames × 33 body landmarks and can be downloaded as JSON for ML training.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
            <div className="relative overflow-hidden rounded-xl bg-black aspect-video">
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              {!cameraOn && (
                <div className="absolute inset-0 grid place-items-center text-center text-slate-400">Camera preview</div>
              )}
              {countdown !== null && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <div className="text-7xl font-black">{countdown}</div>
                </div>
              )}
              {recording && (
                <div className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-sm font-bold">
                  ● RECORDING {frameCount}/{CAPTURE_FRAMES}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {!cameraOn ? (
                <button onClick={startCamera} disabled={loading} className="rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50">
                  {loading ? "Starting AI camera…" : "Start Camera"}
                </button>
              ) : (
                <button onClick={stopCamera} className="rounded-lg bg-slate-700 px-5 py-3 font-bold">Stop Camera</button>
              )}
              <button onClick={startRecording} disabled={!cameraOn || recording || countdown !== null} className="rounded-lg bg-white px-5 py-3 font-bold text-slate-950 disabled:opacity-40">
                Record Sample
              </button>
              {lastSample && (
                <button onClick={() => downloadJson(lastSample)} className="rounded-lg border border-cyan-400 px-5 py-3 font-bold text-cyan-300">
                  Download Sample JSON
                </button>
              )}
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{error}</p>}
          </section>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <label className="text-sm font-semibold text-slate-300">Movement to record</label>
            <select value={movement} onChange={(e) => setMovement(e.target.value as MovementLabel)} disabled={recording} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-3">
              {MOVEMENTS.map((m) => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
            <p className="mt-4 text-sm text-slate-400">{selected.hint}</p>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between"><span className="text-slate-400">Total samples</span><strong className="text-2xl">{total}</strong></div>
              <div className="mt-4 space-y-3">
                {MOVEMENTS.map((m) => (
                  <div key={m.value} className="flex justify-between text-sm"><span>{m.name}</span><span className="font-bold text-cyan-300">{counts[m.value]}</span></div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-cyan-950/30 p-4 text-sm text-cyan-100">
              <strong>How to collect:</strong>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Stand far enough back that your full body is visible.</li>
                <li>Choose one movement.</li>
                <li>Press Record and perform one clean example.</li>
                <li>Download the JSON after each sample.</li>
                <li>Repeat 8–10 times per movement.</li>
              </ol>
            </div>
          </aside>
        </div>

        {lastSample && (
          <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/30 p-5">
            <h2 className="font-bold text-emerald-300">Sample captured successfully ✅</h2>
            <p className="mt-1 text-sm text-slate-300">{lastSample.label} · {lastSample.frameCount} frames · 33 landmarks/frame</p>
            <p className="mt-2 text-xs text-slate-400">Save all downloaded JSON files into <code>ml/data/collected/</code> before running the dataset builder.</p>
          </div>
        )}
      </div>
    </main>
  );
}
