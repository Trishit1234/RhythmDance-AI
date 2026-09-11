import { MovementDefinition } from "@/types/practice";

export const referenceMovements: MovementDefinition[] = [
  {
    id: "right-arm-raise",
    name: "Right Arm Raise (Hasta Uttana)",
    danceSlug: "odissi",
    lessonIndex: 0,
    category: "arm_elevation",
    description:
      "A fundamental classical Indian dance drill to build upper-body grace, arm alignment, and shoulder stability. Raise your right arm laterally until fully extended at shoulder/ear level.",
    instructions: [
      "Stand straight with shoulders relaxed and spine upright.",
      "Begin with hands near the center torso in samapada posture.",
      "Gradually elevate your right arm upward and outward to a 155° angle.",
      "Maintain a soft bend or straight line at the elbow (150°-170°).",
      "Hold at the peak elevation for 1 second, then smoothly return down.",
    ],
    targetAngles: {
      rightShoulderElevation: { min: 140, ideal: 155, max: 175 },
      rightElbowFlexion: { min: 145, ideal: 165, max: 180 },
      torsoIncline: { min: 0, ideal: 3, max: 12 },
    },
    weightings: {
      poseSimilarity: 0.5,
      timing: 0.3,
      completion: 0.2,
    },
    durationSeconds: 3.5,
    referenceFrames: [
      {
        timeOffsetNormalized: 0.0,
        stage: "not_started",
        targetAngles: { rightShoulderElevation: 25, rightElbowFlexion: 160 },
        keyLandmarks: {
          12: { x: 0.6, y: 0.35, z: 0.0 }, // right shoulder
          14: { x: 0.62, y: 0.55, z: 0.0 }, // right elbow
          16: { x: 0.63, y: 0.75, z: 0.0 }, // right wrist
        },
      },
      {
        timeOffsetNormalized: 0.25,
        stage: "raising",
        targetAngles: { rightShoulderElevation: 80, rightElbowFlexion: 155 },
        keyLandmarks: {
          12: { x: 0.6, y: 0.35, z: 0.0 },
          14: { x: 0.72, y: 0.42, z: 0.0 },
          16: { x: 0.82, y: 0.48, z: 0.0 },
        },
      },
      {
        timeOffsetNormalized: 0.5,
        stage: "extended",
        targetAngles: { rightShoulderElevation: 155, rightElbowFlexion: 165 },
        keyLandmarks: {
          12: { x: 0.6, y: 0.35, z: 0.0 },
          14: { x: 0.78, y: 0.22, z: 0.0 },
          16: { x: 0.88, y: 0.12, z: 0.0 },
        },
      },
      {
        timeOffsetNormalized: 0.75,
        stage: "returning",
        targetAngles: { rightShoulderElevation: 85, rightElbowFlexion: 155 },
        keyLandmarks: {
          12: { x: 0.6, y: 0.35, z: 0.0 },
          14: { x: 0.72, y: 0.42, z: 0.0 },
          16: { x: 0.82, y: 0.48, z: 0.0 },
        },
      },
      {
        timeOffsetNormalized: 1.0,
        stage: "completed",
        targetAngles: { rightShoulderElevation: 25, rightElbowFlexion: 160 },
        keyLandmarks: {
          12: { x: 0.6, y: 0.35, z: 0.0 },
          14: { x: 0.62, y: 0.55, z: 0.0 },
          16: { x: 0.63, y: 0.75, z: 0.0 },
        },
      },
    ],
  },
  {
    id: "odissi-chowka-stance",
    name: "Chowka & Namaskar Stance",
    danceSlug: "odissi",
    lessonIndex: 6, // Lesson 1: Namaskar & Chowka
    category: "stance",
    description:
      "Chowka is the foundational square stance representing Lord Jagannath. Knees bent outward forming a square, torso erect, and hands held at chest level.",
    instructions: [
      "Place feet wide apart with heels inward and toes pointing outward.",
      "Bend knees sideways to form a 120°-135° knee flexion angle.",
      "Hold hands in front of the chest in Katakamukha or Pataka mudra.",
      "Keep torso aligned vertically with shoulders level.",
    ],
    targetAngles: {
      rightShoulderElevation: { min: 80, ideal: 90, max: 105 },
      rightElbowFlexion: { min: 85, ideal: 100, max: 120 },
      torsoIncline: { min: 0, ideal: 2, max: 8 },
    },
    weightings: {
      poseSimilarity: 0.6,
      timing: 0.2,
      completion: 0.2,
    },
    durationSeconds: 4.0,
    referenceFrames: [
      {
        timeOffsetNormalized: 0.0,
        stage: "not_started",
        targetAngles: { rightShoulderElevation: 30, rightElbowFlexion: 150 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 0.5,
        stage: "extended",
        targetAngles: { rightShoulderElevation: 90, rightElbowFlexion: 100 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 1.0,
        stage: "completed",
        targetAngles: { rightShoulderElevation: 90, rightElbowFlexion: 100 },
        keyLandmarks: {},
      },
    ],
  },
  {
    id: "bharatanatyam-natyarambhe",
    name: "Natyarambhe & Aramandi Posture",
    danceSlug: "bharatanatyam",
    lessonIndex: 0,
    category: "stance",
    description:
      "Natyarambhe is the fundamental opening posture in Bharatanatyam with arms extended sideways at shoulder level and torso centered.",
    instructions: [
      "Spread both arms sideways at shoulder level (150°-165°).",
      "Keep elbows slightly rounded, palms facing forward/down.",
      "Bend knees outward into half-seated Aramandi stance.",
      "Keep the chest lifted and gaze focused straight ahead.",
    ],
    targetAngles: {
      rightShoulderElevation: { min: 140, ideal: 155, max: 170 },
      rightElbowFlexion: { min: 140, ideal: 160, max: 175 },
      torsoIncline: { min: 0, ideal: 2, max: 10 },
    },
    weightings: {
      poseSimilarity: 0.5,
      timing: 0.3,
      completion: 0.2,
    },
    durationSeconds: 3.5,
    referenceFrames: [
      {
        timeOffsetNormalized: 0.0,
        stage: "not_started",
        targetAngles: { rightShoulderElevation: 30, rightElbowFlexion: 160 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 0.5,
        stage: "extended",
        targetAngles: { rightShoulderElevation: 155, rightElbowFlexion: 160 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 1.0,
        stage: "completed",
        targetAngles: { rightShoulderElevation: 155, rightElbowFlexion: 160 },
        keyLandmarks: {},
      },
    ],
  },
  {
    id: "kathak-hastak-drill",
    name: "Hastak Arm Sweep & Tatkar",
    danceSlug: "kathak",
    lessonIndex: 0,
    category: "arm_elevation",
    description:
      "Basic Kathak hastak movement connecting torso posture, graceful wrist circles, and lateral arm elevation.",
    instructions: [
      "Stand in Samapada posture with hands at chest level.",
      "Sweep right arm outward and upward in an arching rhythm.",
      "Extend arm towards 155° elevation with wrist fluidly articulated.",
      "Return the hand gracefully back to chest center.",
    ],
    targetAngles: {
      rightShoulderElevation: { min: 135, ideal: 155, max: 175 },
      rightElbowFlexion: { min: 145, ideal: 165, max: 180 },
      torsoIncline: { min: 0, ideal: 3, max: 10 },
    },
    weightings: {
      poseSimilarity: 0.5,
      timing: 0.3,
      completion: 0.2,
    },
    durationSeconds: 3.5,
    referenceFrames: [
      {
        timeOffsetNormalized: 0.0,
        stage: "not_started",
        targetAngles: { rightShoulderElevation: 25, rightElbowFlexion: 160 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 0.5,
        stage: "extended",
        targetAngles: { rightShoulderElevation: 155, rightElbowFlexion: 165 },
        keyLandmarks: {},
      },
      {
        timeOffsetNormalized: 1.0,
        stage: "completed",
        targetAngles: { rightShoulderElevation: 25, rightElbowFlexion: 160 },
        keyLandmarks: {},
      },
    ],
  },
];

export function getMovementForLesson(
  danceSlug: string,
  lessonIndex: number
): MovementDefinition {
  const match = referenceMovements.find(
    (m) => m.danceSlug === danceSlug && m.lessonIndex === lessonIndex
  );
  if (match) return match;

  // Fallback to dance style's first movement or default right arm raise
  const danceFallback = referenceMovements.find((m) => m.danceSlug === danceSlug);
  if (danceFallback) return danceFallback;

  return referenceMovements[0];
}

export function getMovementById(id: string): MovementDefinition | undefined {
  return referenceMovements.find((m) => m.id === id);
}
