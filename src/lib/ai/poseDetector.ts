import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializing = false;
let initPromise: Promise<PoseLandmarker> | null = null;

const WASM_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerInstance = landmarker;
      return landmarker;
    } catch (gpuError) {
      console.warn(
        "GPU delegate initialization failed, falling back to CPU delegate:",
        gpuError
      );

      // CPU Fallback
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerInstance = landmarker;
      return landmarker;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

export function releasePoseLandmarker() {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
    } catch (e) {
      console.warn("Error closing pose landmarker:", e);
    }
    poseLandmarkerInstance = null;
  }
  initPromise = null;
  isInitializing = false;
}
