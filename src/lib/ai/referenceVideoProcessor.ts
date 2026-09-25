import { PoseLandmarker } from "@mediapipe/tasks-vision";

export interface ReferenceFrame {
  timestampMs: number;
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
  }>;
}

export interface ReferenceVideoSequence {
  videoUrl: string;
  durationMs: number;
  frames: ReferenceFrame[];
}

interface ProcessReferenceVideoOptions {
  videoUrl: string;
  poseLandmarker: PoseLandmarker;
  frameIntervalMs?: number;
  onProgress?: (progress: number) => void;
}

function normalizeLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>
): Array<{ x: number; y: number; z: number }> {
  if (!landmarks || landmarks.length < 33) {
    return [];
  }

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) {
    return landmarks.map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }));
  }

  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  const hipCenterZ = (leftHip.z + rightHip.z) / 2;

  const shoulderCenterX =
    (leftShoulder.x + rightShoulder.x) / 2;

  const shoulderCenterY =
    (leftShoulder.y + rightShoulder.y) / 2;

  const torsoHeight = Math.sqrt(
    Math.pow(shoulderCenterX - hipCenterX, 2) +
      Math.pow(shoulderCenterY - hipCenterY, 2)
  );

  const scale = Math.max(torsoHeight, 0.001);

  return landmarks.map((point) => ({
    x: (point.x - hipCenterX) / scale,
    y: (point.y - hipCenterY) / scale,
    z: (point.z - hipCenterZ) / scale,
  }));
}

export async function processReferenceVideo({
  videoUrl,
  poseLandmarker,
  frameIntervalMs = 100,
  onProgress,
}: ProcessReferenceVideoOptions): Promise<ReferenceVideoSequence> {
  if (!videoUrl) {
    throw new Error("Reference video URL is missing.");
  }

  if (!poseLandmarker) {
    throw new Error("Pose landmarker is not available.");
  }

  const video = document.createElement("video");

  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    const handleLoadedMetadata = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();

      reject(
        new Error(
          "The reference video could not be loaded. Check the Firebase Storage URL and CORS configuration."
        )
      );
    };

    const cleanup = () => {
      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      video.removeEventListener(
        "error",
        handleError
      );
    };

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    video.addEventListener(
      "error",
      handleError
    );
  });

  const durationSeconds = video.duration;

  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    video.removeAttribute("src");
    video.load();

    throw new Error(
      "Reference video duration could not be determined."
    );
  }

  const durationMs = durationSeconds * 1000;

  const frames: ReferenceFrame[] = [];

  const seekTo = (
    timeSeconds: number
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      let finished = false;

      const cleanup = () => {
        video.removeEventListener(
          "seeked",
          handleSeeked
        );

        video.removeEventListener(
          "error",
          handleError
        );
      };

      const handleSeeked = () => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        resolve();
      };

      const handleError = () => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();

        reject(
          new Error(
            "Failed while seeking reference video."
          )
        );
      };

      video.addEventListener(
        "seeked",
        handleSeeked
      );

      video.addEventListener(
        "error",
        handleError
      );

      video.currentTime = Math.min(
        Math.max(timeSeconds, 0),
        Math.max(durationSeconds - 0.001, 0)
      );
    });
  };

  try {
    const totalFrames = Math.max(
      1,
      Math.ceil(durationMs / frameIntervalMs)
    );

    for (
      let frameIndex = 0;
      frameIndex < totalFrames;
      frameIndex++
    ) {
      const timestampMs = Math.min(
        frameIndex * frameIntervalMs,
        Math.max(durationMs - 1, 0)
      );

      const timestampSeconds =
        timestampMs / 1000;

      await seekTo(timestampSeconds);

      const result =
        poseLandmarker.detectForVideo(
          video,
          timestampMs
        );

      const poseLandmarks =
        result.landmarks?.[0];

      if (
        poseLandmarks &&
        poseLandmarks.length >= 33
      ) {
        const normalized =
          normalizeLandmarks(
            poseLandmarks
          );

        if (normalized.length >= 33) {
          frames.push({
            timestampMs,
            landmarks: normalized,
          });
        }
      }

      const progress = Math.round(
        ((frameIndex + 1) / totalFrames) * 100
      );

      onProgress?.(progress);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  if (frames.length === 0) {
    throw new Error(
      "No human pose could be detected in the reference video."
    );
  }

  return {
    videoUrl,
    durationMs,
    frames,
  };
}