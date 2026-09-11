import { Landmark3D } from "@/types/practice";

// Standard MediaPipe Pose Landmark Connections
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],

  // Torso
  [11, 12], // shoulders
  [11, 23], // left shoulder to left hip
  [12, 24], // right shoulder to right hip
  [23, 24], // hips

  // Right Arm (Key for Right Arm Raise)
  [12, 14], // right shoulder to right elbow
  [14, 16], // right elbow to right wrist
  [16, 18], [16, 20], [16, 22], [18, 20], // right hand

  // Left Arm
  [11, 13], // left shoulder to left elbow
  [13, 15], // left elbow to left wrist
  [15, 17], [15, 19], [15, 21], [17, 19], // left hand

  // Legs
  [23, 25], // left hip to left knee
  [25, 27], // left knee to left ankle
  [27, 29], [27, 31], [29, 31], // left foot

  [24, 26], // right hip to right knee
  [26, 28], // right knee to right ankle
  [28, 30], [28, 32], [30, 32], // right foot
];

export interface SkeletonDrawOptions {
  currentArmAngle?: number;
  expectedArmAngle?: number;
  currentElbowAngle?: number;
  isCorrect?: boolean;
  mirrored?: boolean;
  showAngleLabels?: boolean;
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  width: number,
  height: number,
  options: SkeletonDrawOptions = {}
) {
  if (!landmarks || landmarks.length === 0) return;

  const {
    currentArmAngle = 0,
    expectedArmAngle = 155,
    currentElbowAngle = 0,
    showAngleLabels = true,
    mirrored = true,
  } = options;

  ctx.save();

  // Draw Connections
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (!start || !end) continue;
    const startVis = start.visibility !== undefined ? start.visibility : 1.0;
    const endVis = end.visibility !== undefined ? end.visibility : 1.0;
    if (startVis < 0.4 || endVis < 0.4) continue;

    const x1 = mirrored ? (1 - start.x) * width : start.x * width;
    const y1 = start.y * height;
    const x2 = mirrored ? (1 - end.x) * width : end.x * width;
    const y2 = end.y * height;

    // Highlight right arm segments in active color
    const isRightArm =
      (startIdx === 12 && endIdx === 14) || (startIdx === 14 && endIdx === 16);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    if (isRightArm) {
      const error = Math.abs(currentArmAngle - expectedArmAngle);
      if (error < 15 && currentArmAngle >= 135) {
        ctx.strokeStyle = "#22C55E"; // Vivid Green (Accurate)
        ctx.lineWidth = 6;
      } else if (currentArmAngle >= 80) {
        ctx.strokeStyle = "#F59E0B"; // Amber (In progress)
        ctx.lineWidth = 5;
      } else {
        ctx.strokeStyle = "#B42318"; // Crimson Theme Accent
        ctx.lineWidth = 4;
      }
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 3;
    }

    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw Keypoint Nodes
  landmarks.forEach((lm, idx) => {
    const vis = lm.visibility !== undefined ? lm.visibility : 1.0;
    if (vis < 0.4) return;

    const x = mirrored ? (1 - lm.x) * width : lm.x * width;
    const y = lm.y * height;

    const isRightArmJoint = idx === 12 || idx === 14 || idx === 16;
    const radius = isRightArmJoint ? 6 : 4;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = isRightArmJoint
      ? "rgba(180, 35, 24, 0.4)"
      : "rgba(255, 255, 255, 0.25)";
    ctx.fill();

    // Center Node
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isRightArmJoint ? "#B42318" : "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Draw Live Angle Text near Right Shoulder and Elbow
  if (showAngleLabels && currentArmAngle > 0) {
    const rShoulder = landmarks[12];
    const rElbow = landmarks[14];

    if (rShoulder && (rShoulder.visibility || 1) > 0.5) {
      const sx = mirrored ? (1 - rShoulder.x) * width : rShoulder.x * width;
      const sy = rShoulder.y * height;

      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(sx - 55, sy - 28, 110, 22);

      const isAligned = Math.abs(currentArmAngle - expectedArmAngle) <= 15;
      ctx.fillStyle = isAligned ? "#22C55E" : "#FBBF24";
      ctx.fillText(`Arm: ${currentArmAngle}°`, sx - 48, sy - 13);
    }

    if (rElbow && currentElbowAngle > 0 && (rElbow.visibility || 1) > 0.5) {
      const ex = mirrored ? (1 - rElbow.x) * width : rElbow.x * width;
      const ey = rElbow.y * height;

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(ex - 50, ey + 10, 100, 20);
      ctx.fillStyle = "#60A5FA";
      ctx.fillText(`Elbow: ${currentElbowAngle}°`, ex - 44, ey + 24);
    }
  }

  ctx.restore();
}
