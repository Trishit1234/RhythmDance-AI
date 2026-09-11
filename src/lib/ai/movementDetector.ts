import {
  calculateElbowAngle,
  calculateShoulderElevation,
  calculateTorsoIncline,
} from "@/lib/ai/geometry";
import {
  Landmark3D,
  MovementDefinition,
  MovementStage,
} from "@/types/practice";

export interface MovementDetectionState {
  stage: MovementStage;
  currentArmAngle: number;
  expectedArmAngle: number;
  angleError: number;
  currentElbowAngle: number;
  expectedElbowAngle: number;
  torsoIncline: number;
  repsCompleted: number;
  confidence: number;
  feedbackText: string;
  lastTimestamp: number;
  stageStartedAt: number;
  movementStartedAt: number;
  completedAt: number;
}

const IDX = {
  NOSE: 0,

  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,

  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,

  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,

  LEFT_HIP: 23,
  RIGHT_HIP: 24,

  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number): number =>
  Math.round(value * 10) / 10;

export class MovementDetector {
  private definition: MovementDefinition;

  private state: MovementDetectionState = {
    stage: "not_started",
    currentArmAngle: 0,
    expectedArmAngle: 0,
    angleError: 0,
    currentElbowAngle: 0,
    expectedElbowAngle: 0,
    torsoIncline: 0,
    repsCompleted: 0,
    confidence: 0,
    feedbackText: "Position your body inside the camera frame.",
    lastTimestamp: 0,
    stageStartedAt: 0,
    movementStartedAt: 0,
    completedAt: 0,
  };

  private smoothedArmAngle = 0;
  private smoothedElbowAngle = 0;
  private smoothedTorsoIncline = 0;

  private angleHistory: number[] = [];
  private readonly historySize = 8;

  private extensionHoldStartedAt = 0;
  private completionCooldownUntil = 0;

  constructor(definition: MovementDefinition) {
    this.definition = definition;
    this.reset(definition);
  }

  public reset(definition?: MovementDefinition): void {
    if (definition) {
      this.definition = definition;
    }

    this.state = {
      stage: "not_started",
      currentArmAngle: 0,
      expectedArmAngle:
        this.definition.targetAngles.rightShoulderElevation.ideal,
      angleError: 0,
      currentElbowAngle: 0,
      expectedElbowAngle:
        this.definition.targetAngles.rightElbowFlexion.ideal,
      torsoIncline: 0,
      repsCompleted: 0,
      confidence: 0,
      feedbackText: "Position your body inside the camera frame.",
      lastTimestamp: 0,
      stageStartedAt: 0,
      movementStartedAt: 0,
      completedAt: 0,
    };

    this.smoothedArmAngle = 0;
    this.smoothedElbowAngle = 0;
    this.smoothedTorsoIncline = 0;

    this.angleHistory = [];
    this.extensionHoldStartedAt = 0;
    this.completionCooldownUntil = 0;
  }

  public getState(): MovementDetectionState {
    return {
      ...this.state,
    };
  }

  public update(
    landmarks: Landmark3D[],
    timestamp: number
  ): MovementDetectionState {
    if (!landmarks || landmarks.length < 33) {
      return this.handleTrackingLost(timestamp);
    }

    const requiredLandmarks = [
      IDX.RIGHT_SHOULDER,
      IDX.RIGHT_ELBOW,
      IDX.RIGHT_WRIST,
      IDX.LEFT_SHOULDER,
      IDX.LEFT_HIP,
      IDX.RIGHT_HIP,
    ];

    const validCount = requiredLandmarks.filter((index) => {
      const point = landmarks[index];

      return (
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        Number.isFinite(point.z ?? 0) &&
        (point.visibility === undefined || point.visibility >= 0.35)
      );
    }).length;

    const confidence = clamp(
      validCount / requiredLandmarks.length,
      0,
      1
    );

    if (confidence < 0.65) {
      return this.handleTrackingLost(timestamp, confidence);
    }

    const rightShoulder = landmarks[IDX.RIGHT_SHOULDER];
    const rightElbow = landmarks[IDX.RIGHT_ELBOW];
    const rightWrist = landmarks[IDX.RIGHT_WRIST];
    const leftShoulder = landmarks[IDX.LEFT_SHOULDER];
    const leftHip = landmarks[IDX.LEFT_HIP];
    const rightHip = landmarks[IDX.RIGHT_HIP];

    const rawArmAngle = calculateShoulderElevation(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    const rawElbowAngle = calculateElbowAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    const rawTorsoIncline = calculateTorsoIncline(
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip
    );

    if (!Number.isFinite(rawArmAngle) || !Number.isFinite(rawElbowAngle)) {
      return this.handleTrackingLost(timestamp, confidence);
    }

    if (this.state.lastTimestamp === 0) {
      this.smoothedArmAngle = rawArmAngle;
      this.smoothedElbowAngle = rawElbowAngle;
      this.smoothedTorsoIncline = rawTorsoIncline;
    } else {
      const smoothing = 0.28;

      this.smoothedArmAngle =
        this.smoothedArmAngle * (1 - smoothing) +
        rawArmAngle * smoothing;

      this.smoothedElbowAngle =
        this.smoothedElbowAngle * (1 - smoothing) +
        rawElbowAngle * smoothing;

      this.smoothedTorsoIncline =
        this.smoothedTorsoIncline * (1 - smoothing) +
        rawTorsoIncline * smoothing;
    }

    const armAngle = clamp(this.smoothedArmAngle, 0, 180);
    const elbowAngle = clamp(this.smoothedElbowAngle, 0, 180);
    const torsoIncline = clamp(
      Math.abs(this.smoothedTorsoIncline),
      0,
      90
    );

    this.angleHistory.push(armAngle);

    if (this.angleHistory.length > this.historySize) {
      this.angleHistory.shift();
    }

    const target =
      this.definition.targetAngles.rightShoulderElevation;

    const elbowTarget =
      this.definition.targetAngles.rightElbowFlexion;

    const angleError = Math.abs(armAngle - target.ideal);

    this.state.currentArmAngle = round(armAngle);
    this.state.expectedArmAngle = round(target.ideal);
    this.state.angleError = round(angleError);

    this.state.currentElbowAngle = round(elbowAngle);
    this.state.expectedElbowAngle = round(elbowTarget.ideal);

    this.state.torsoIncline = round(torsoIncline);
    this.state.confidence = Math.round(confidence * 100);

    const previousTimestamp = this.state.lastTimestamp;

    this.state.lastTimestamp = timestamp;

    if (previousTimestamp === 0) {
      this.state.stageStartedAt = timestamp;
    }

    this.updateStage(
      armAngle,
      elbowAngle,
      torsoIncline,
      timestamp
    );

    this.state.feedbackText = this.getFeedback(
      armAngle,
      elbowAngle,
      torsoIncline
    );

    return {
      ...this.state,
    };
  }

  private updateStage(
    armAngle: number,
    elbowAngle: number,
    torsoIncline: number,
    timestamp: number
  ): void {
    const target =
      this.definition.targetAngles.rightShoulderElevation;

    const elbowTarget =
      this.definition.targetAngles.rightElbowFlexion;

    const lowThreshold = Math.max(
      target.min,
      target.ideal * 0.42
    );

    const raisingThreshold = Math.max(
      target.min,
      target.ideal * 0.62
    );

    const extensionThreshold = Math.min(
      target.max,
      target.ideal
    );

    const isNearExtension =
      armAngle >= extensionThreshold &&
      elbowAngle >= elbowTarget.min &&
      torsoIncline <=
        (this.definition.targetAngles.torsoIncline?.max ?? 15);

    const isReturning =
      armAngle < target.ideal - 18;

    const isLow =
      armAngle <= lowThreshold;

    const isRaising =
      armAngle >= raisingThreshold &&
      armAngle < extensionThreshold;

    switch (this.state.stage) {
      case "not_started": {
        if (!isLow) {
          this.beginStage("starting", timestamp);
        }

        break;
      }

      case "starting": {
        if (isRaising) {
          this.beginStage("raising", timestamp);

          if (this.state.movementStartedAt === 0) {
            this.state.movementStartedAt = timestamp;
          }
        } else if (isLow) {
          this.state.feedbackText =
            "Good start. Raise the right arm smoothly.";
        }

        break;
      }

      case "raising": {
        if (isNearExtension) {
          this.beginStage("extended", timestamp);
          this.extensionHoldStartedAt = timestamp;
        } else if (isLow) {
          this.beginStage("starting", timestamp);
        }

        break;
      }

      case "extended": {
        if (!isNearExtension) {
          this.beginStage("returning", timestamp);
          break;
        }

        if (this.extensionHoldStartedAt === 0) {
          this.extensionHoldStartedAt = timestamp;
        }

        const heldFor =
          timestamp - this.extensionHoldStartedAt;

        if (heldFor >= 450) {
          this.beginStage("returning", timestamp);
        }

        break;
      }

      case "returning": {
        if (isLow) {
          if (timestamp >= this.completionCooldownUntil) {
            this.completeRep(timestamp);
          }
        } else if (isNearExtension) {
          this.beginStage("extended", timestamp);
        }

        break;
      }

      case "completed": {
        if (isLow) {
          this.beginStage("starting", timestamp);
        } else if (isRaising) {
          this.beginStage("raising", timestamp);
        }

        break;
      }

      default: {
        this.beginStage("not_started", timestamp);
      }
    }
  }

  private completeRep(timestamp: number): void {
    this.state.repsCompleted += 1;
    this.state.completedAt = timestamp;

    this.completionCooldownUntil = timestamp + 350;
    this.extensionHoldStartedAt = 0;

    this.beginStage("completed", timestamp);

    this.state.feedbackText =
      `Rep ${this.state.repsCompleted} completed. Nice control — repeat the movement.`;
  }

  private beginStage(
    stage: MovementStage,
    timestamp: number
  ): void {
    if (this.state.stage !== stage) {
      this.state.stage = stage;
      this.state.stageStartedAt = timestamp;
    }
  }

  private handleTrackingLost(
    timestamp: number,
    confidence = 0
  ): MovementDetectionState {
    this.state.confidence = Math.round(
      clamp(confidence, 0, 1) * 100
    );

    this.state.lastTimestamp = timestamp;

    this.state.feedbackText =
      "Body tracking is unstable. Step back and keep your full upper body visible.";

    return {
      ...this.state,
    };
  }

  private getFeedback(
    armAngle: number,
    elbowAngle: number,
    torsoIncline: number
  ): string {
    const target =
      this.definition.targetAngles.rightShoulderElevation;

    const elbowTarget =
      this.definition.targetAngles.rightElbowFlexion;

    const torsoTarget =
      this.definition.targetAngles.torsoIncline;

    if (this.state.stage === "not_started") {
      return "Ready. Start the movement when you are positioned correctly.";
    }

    if (this.state.stage === "starting") {
      if (armAngle < target.min) {
        return `Begin raising your right arm toward ${target.ideal}°.`;
      }

      return "Good start. Keep raising smoothly.";
    }

    if (this.state.stage === "raising") {
      if (armAngle < target.ideal - 15) {
        return "Raise the right arm a little higher.";
      }

      if (elbowAngle < elbowTarget.min) {
        return "Extend the right elbow more while raising.";
      }

      return "Good trajectory. Keep the movement controlled.";
    }

    if (this.state.stage === "extended") {
      if (armAngle < target.min) {
        return "Lift the arm higher.";
      }

      if (armAngle > target.max) {
        return "Arm is too high. Lower it slightly.";
      }

      if (elbowAngle < elbowTarget.min) {
        return "Straighten the elbow slightly.";
      }

      if (elbowAngle > elbowTarget.max) {
        return "Relax the elbow slightly.";
      }

      if (
        torsoTarget &&
        torsoIncline > torsoTarget.max
      ) {
        return "Keep your torso more upright.";
      }

      return "Excellent position. Hold briefly, then return smoothly.";
    }

    if (this.state.stage === "returning") {
      if (armAngle > target.ideal - 18) {
        return "Good. Return the arm smoothly to the starting position.";
      }

      return "Almost there. Complete the return to finish the rep.";
    }

    if (this.state.stage === "completed") {
      return "Rep detected. Prepare for the next repetition.";
    }

    return "Keep your movement controlled and centered.";
  }
}