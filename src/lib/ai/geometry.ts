import { Landmark3D } from "@/types/practice";

// MediaPipe 33 Landmark Indices:
// 11: left_shoulder, 12: right_shoulder
// 13: left_elbow,    14: right_elbow
// 15: left_wrist,    16: right_wrist
// 23: left_hip,      24: right_hip
// 25: left_knee,     26: right_knee
// 27: left_ankle,    28: right_ankle

/**
 * Calculates the angle (in degrees 0-180) at vertex point B formed by segments AB and BC.
 */
export function calculate3PointAngle(
  pointA: Landmark3D,
  pointB: Landmark3D,
  pointC: Landmark3D
): number {
  if (!pointA || !pointB || !pointC) return 0;

  const vectorBA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
    z: (pointA.z || 0) - (pointB.z || 0),
  };

  const vectorBC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
    z: (pointC.z || 0) - (pointB.z || 0),
  };

  const dotProduct =
    vectorBA.x * vectorBC.x +
    vectorBA.y * vectorBC.y +
    vectorBA.z * vectorBC.z;

  const magnitudeBA = Math.sqrt(
    vectorBA.x ** 2 + vectorBA.y ** 2 + vectorBA.z ** 2
  );
  const magnitudeBC = Math.sqrt(
    vectorBC.x ** 2 + vectorBC.y ** 2 + vectorBC.z ** 2
  );

  if (magnitudeBA === 0 || magnitudeBC === 0) return 0;

  const cosAngle = Math.max(
    -1,
    Math.min(1, dotProduct / (magnitudeBA * magnitudeBC))
  );
  const angleRad = Math.acos(cosAngle);
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Calculates shoulder elevation angle relative to the torso vertical line (hip -> shoulder -> elbow).
 */
export function calculateShoulderElevation(
  hip: Landmark3D,
  shoulder: Landmark3D,
  elbow: Landmark3D
): number {
  return calculate3PointAngle(hip, shoulder, elbow);
}

/**
 * Calculates elbow flexion/extension angle (shoulder -> elbow -> wrist).
 */
export function calculateElbowAngle(
  shoulder: Landmark3D,
  elbow: Landmark3D,
  wrist: Landmark3D
): number {
  return calculate3PointAngle(shoulder, elbow, wrist);
}

/**
 * Calculates knee flexion angle (hip -> knee -> ankle).
 */
export function calculateKneeAngle(
  hip: Landmark3D,
  knee: Landmark3D,
  ankle: Landmark3D
): number {
  return calculate3PointAngle(hip, knee, ankle);
}

/**
 * Calculates torso tilt relative to the true vertical axis in degrees (0 = upright).
 */
export function calculateTorsoIncline(
  leftShoulder: Landmark3D,
  rightShoulder: Landmark3D,
  leftHip: Landmark3D,
  rightHip: Landmark3D
): number {
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;

  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const dx = midShoulder.x - midHip.x;
  const dy = midShoulder.y - midHip.y;

  // In screen coords, y increases downwards, so a vertical torso has dx ~ 0
  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Calculates shoulder level tilt in degrees (0 = completely horizontal).
 */
export function calculateShoulderTilt(
  leftShoulder: Landmark3D,
  rightShoulder: Landmark3D
): number {
  if (!leftShoulder || !rightShoulder) return 0;
  const dy = rightShoulder.y - leftShoulder.y;
  const dx = rightShoulder.x - leftShoulder.x;
  const angleRad = Math.atan2(Math.abs(dy), Math.abs(dx));
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Calculates normalized Euclidean distance between two landmark sets.
 */
export function calculateLandmarkDistance(
  a: Landmark3D,
  b: Landmark3D
): number {
  if (!a || !b) return 1.0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

/**
 * Verifies if essential upper/full body landmarks are visible with sufficient confidence.
 */
export function checkBodyVisibility(
  landmarks: Landmark3D[] | null | undefined,
  minVisibility: number = 0.5
): {
  isVisible: boolean;
  confidence: number;
  missingLandmarks: string[];
} {
  if (!landmarks || landmarks.length < 33) {
    return { isVisible: false, confidence: 0, missingLandmarks: ["all"] };
  }

  const criticalIndices: [number, string][] = [
    [0, "nose"],
    [11, "left_shoulder"],
    [12, "right_shoulder"],
    [13, "left_elbow"],
    [14, "right_elbow"],
    [15, "left_wrist"],
    [16, "right_wrist"],
    [23, "left_hip"],
    [24, "right_hip"],
  ];

  let visibleCount = 0;
  const missing: string[] = [];

  for (const [idx, name] of criticalIndices) {
    const lm = landmarks[idx];
    const vis = lm && lm.visibility !== undefined ? lm.visibility : 1.0;
    if (lm && vis >= minVisibility) {
      visibleCount++;
    } else {
      missing.push(name);
    }
  }

  const confidence = Math.round((visibleCount / criticalIndices.length) * 100);
  return {
    isVisible: visibleCount >= criticalIndices.length - 2, // Allow max 2 slight occlusions
    confidence,
    missingLandmarks: missing,
  };
}
