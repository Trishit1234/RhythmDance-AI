export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type LandmarkName =
  | "nose"
  | "left_eye_inner"
  | "left_eye"
  | "left_eye_outer"
  | "right_eye_inner"
  | "right_eye"
  | "right_eye_outer"
  | "left_ear"
  | "right_ear"
  | "mouth_left"
  | "mouth_right"
  | "left_shoulder"
  | "right_shoulder"
  | "left_elbow"
  | "right_elbow"
  | "left_wrist"
  | "right_wrist"
  | "left_pinky"
  | "right_pinky"
  | "left_index"
  | "right_index"
  | "left_thumb"
  | "right_thumb"
  | "left_hip"
  | "right_hip"
  | "left_knee"
  | "right_knee"
  | "left_ankle"
  | "right_ankle"
  | "left_heel"
  | "right_heel"
  | "left_foot_index"
  | "right_foot_index";

export type MovementStage =
  | "not_started"
  | "starting"
  | "raising"
  | "extended"
  | "returning"
  | "completed";

export interface ReferenceKeyframe {
  timeOffsetNormalized: number; // 0.0 to 1.0
  stage: MovementStage;
  targetAngles: {
    rightShoulderElevation?: number;
    rightElbowFlexion?: number;
    leftShoulderElevation?: number;
    leftElbowFlexion?: number;
    torsoIncline?: number;
    hipAlignment?: number;
    kneeBend?: number;
  };
  keyLandmarks: Partial<Record<number, { x: number; y: number; z: number }>>;
}

export interface MovementDefinition {
  id: string;
  name: string;
  danceSlug: string;
  lessonIndex: number;
  category: "arm_elevation" | "mudra" | "stance" | "footwork" | "repertoire";
  description: string;
  instructions: string[];
  targetAngles: {
    rightShoulderElevation: { min: number; ideal: number; max: number };
    rightElbowFlexion: { min: number; ideal: number; max: number };
    torsoIncline?: { min: number; ideal: number; max: number };
  };
  referenceFrames: ReferenceKeyframe[];
  weightings: {
    poseSimilarity: number; // e.g. 0.50
    timing: number;         // e.g. 0.30
    completion: number;     // e.g. 0.20
  };
  durationSeconds: number;
}

export interface TelemetryData {
  detectedMovement: string;
  stage: MovementStage;
  expectedArmAngle: number;
  currentArmAngle: number;
  angleError: number;
  currentElbowAngle: number;
  expectedElbowAngle: number;
  poseSimilarityScore: number;
  timingScore: number;
  completionScore: number;
  liveOverallScore: number;
  fps: number;
  bodyDetected: boolean;
  trackingConfidence: number;
  repsCompleted: number;
  feedbackText: string;
}

export interface PracticeSessionResult {
  id: string;
  userId: string;
  userName?: string;
  danceSlug: string;
  danceName: string;
  lessonIndex: number;
  lessonTitle: string;
  movementId: string;
  movementName: string;
  durationSeconds: number;
  accuracyScore: number;
  timingScore: number;
  completionScore: number;
  overallScore: number;
  feedbackSummary: string[];
  repsCompleted: number;
  createdAt: string;
}
