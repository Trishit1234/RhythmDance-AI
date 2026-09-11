import {
  Landmark3D,
  MovementDefinition,
  MovementStage,
  PracticeSessionResult,
} from "@/types/practice";

import type { MovementDetectionState } from "@/lib/ai/movementDetector";

export interface LiveEvaluationResult {
  poseSimilarityScore: number;
  timingScore: number;
  completionScore: number;
  overallScore: number;
}

type PosePoint = {
  x: number;
  y: number;
  z: number;
};

export class MovementComparator {
  private definition: MovementDefinition;

  private history: Array<{
    timestampMs: number;
    stage: MovementStage;
    poseScore: number;
    timingScore: number;
    completionScore: number;
    overallScore: number;
  }> = [];

  private startedAtMs = 0;
  private bestScore = 0;

  constructor(definition: MovementDefinition) {
    this.definition = definition;
  }

  public reset(newDefinition?: MovementDefinition): void {
    if (newDefinition) {
      this.definition = newDefinition;
    }

    this.history = [];
    this.startedAtMs = 0;
    this.bestScore = 0;
  }

  /**
   * Evaluate the current MediaPipe pose.
   *
   * The score uses:
   * 1. Joint-angle accuracy
   * 2. Reference keyframe similarity
   * 3. Body symmetry
   * 4. Torso alignment
   * 5. Movement timing/stage stability
   * 6. Real movement completion
   *
   * No random values are used.
   * No fake minimum score is used.
   * No training dataset is required for this comparison layer.
   */
  public evaluateLive(
    movementState: MovementDetectionState,
    landmarks: Landmark3D[]
  ): LiveEvaluationResult {
    const now = performance.now();

    if (this.startedAtMs === 0) {
      this.startedAtMs = now;
    }

    const angleScore = this.calculateAngleScore(movementState);

    const referenceScore = this.calculateReferencePoseScore(
      landmarks,
      movementState.stage
    );

    const symmetryScore = this.calculateSymmetryScore(landmarks);

    const torsoScore = this.calculateTorsoScore(
      movementState.torsoIncline
    );

    let poseScore =
      referenceScore * 0.45 +
      angleScore * 0.35 +
      symmetryScore * 0.10 +
      torsoScore * 0.10;

    /*
     * Several movement definitions currently have sparse or empty
     * reference landmarks. In that case, do not pretend that a
     * reference-pose comparison exists.
     *
     * Redistribute the weight to actual kinematic measurements.
     */
    if (!this.hasReferenceLandmarks()) {
      poseScore =
        angleScore * 0.65 +
        symmetryScore * 0.20 +
        torsoScore * 0.15;
    }

    const timingScore = this.calculateTimingScore(
      movementState.stage,
      now
    );

    const completionScore =
      this.calculateCompletionScore(
        movementState,
        now
      );

    const overallScore = this.round(
      this.clamp(
        poseScore * 0.60 +
          timingScore * 0.20 +
          completionScore * 0.20,
        0,
        100
      )
    );

    const result: LiveEvaluationResult = {
      poseSimilarityScore: this.round(
        this.clamp(poseScore, 0, 100)
      ),
      timingScore: this.round(
        this.clamp(timingScore, 0, 100)
      ),
      completionScore: this.round(
        this.clamp(completionScore, 0, 100)
      ),
      overallScore,
    };

    this.history.push({
      timestampMs: now,
      stage: movementState.stage,
      poseScore: result.poseSimilarityScore,
      timingScore: result.timingScore,
      completionScore: result.completionScore,
      overallScore: result.overallScore,
    });

    /*
     * Keep browser memory bounded during long practice sessions.
     */
    if (this.history.length > 900) {
      this.history.shift();
    }

    this.bestScore = Math.max(
      this.bestScore,
      overallScore
    );

    return result;
  }

  /**
   * Compare current arm and elbow angles with the
   * ideal values from the selected movement definition.
   */
  private calculateAngleScore(
    state: MovementDetectionState
  ): number {
    const armError = Math.abs(
      state.currentArmAngle -
        state.expectedArmAngle
    );

    const elbowError = Math.abs(
      state.currentElbowAngle -
        state.expectedElbowAngle
    );

    const armScore = this.errorToScore(
      armError,
      55
    );

    const elbowScore = this.errorToScore(
      elbowError,
      55
    );

    return (
      armScore * 0.55 +
      elbowScore * 0.45
    );
  }

  /**
   * Compare normalized user landmarks with the
   * reference keyframe belonging to the current stage.
   */
  private calculateReferencePoseScore(
    landmarks: Landmark3D[],
    stage: MovementStage
  ): number {
    const frame =
      this.findClosestReferenceFrame(stage);

    if (!frame || !frame.keyLandmarks) {
      return 50;
    }

    const normalized =
      this.normalizeLandmarks(landmarks);

    const errors: number[] = [];

    for (const [indexText, target] of Object.entries(
      frame.keyLandmarks
    )) {
      const index = Number(indexText);

      const actual = normalized[index];

      if (!actual || !target) {
        continue;
      }

      const distance = Math.sqrt(
        (actual.x - target.x) ** 2 +
          (actual.y - target.y) ** 2 +
          (actual.z - target.z) ** 2
      );

      errors.push(
        Math.min(distance / 0.75, 1)
      );
    }

    if (!errors.length) {
      return 50;
    }

    const meanError =
      errors.reduce(
        (sum, value) => sum + value,
        0
      ) / errors.length;

    return this.clamp(
      (1 - meanError) * 100,
      0,
      100
    );
  }

  /**
   * Check left/right body alignment.
   *
   * This is a supporting signal, not the main movement score.
   */
  private calculateSymmetryScore(
    landmarks: Landmark3D[]
  ): number {
    const pairs: Array<[number, number]> = [
      [11, 12],
      [13, 14],
      [15, 16],
      [23, 24],
      [25, 26],
      [27, 28],
    ];

    const errors: number[] = [];

    for (const [left, right] of pairs) {
      const leftPoint = landmarks[left];
      const rightPoint = landmarks[right];

      if (!leftPoint || !rightPoint) {
        continue;
      }

      if (
        !Number.isFinite(leftPoint.y) ||
        !Number.isFinite(rightPoint.y)
      ) {
        continue;
      }

      const verticalDifference = Math.abs(
        leftPoint.y - rightPoint.y
      );

      errors.push(
        Math.min(
          verticalDifference / 0.35,
          1
        )
      );
    }

    if (!errors.length) {
      return 70;
    }

    const meanError =
      errors.reduce(
        (sum, value) => sum + value,
        0
      ) / errors.length;

    return this.clamp(
      (1 - meanError) * 100,
      0,
      100
    );
  }

  /**
   * Score torso alignment against the movement definition.
   */
  private calculateTorsoScore(
    torsoIncline: number
  ): number {
    const target =
      this.definition.targetAngles
        .torsoIncline;

    if (!target) {
      return 85;
    }

    const error = Math.abs(
      torsoIncline - target.ideal
    );

    if (error <= 4) {
      return 100;
    }

    return this.errorToScore(
      error - 4,
      30
    );
  }

  /**
   * Timing score is based on stage stability and
   * total movement duration.
   */
  private calculateTimingScore(
    stage: MovementStage,
    now: number
  ): number {
    if (!this.history.length) {
      return 50;
    }

    const recent =
      this.history.slice(-20);

    const sameStageCount =
      recent.filter(
        (item) => item.stage === stage
      ).length;

    const sameStageRatio =
      sameStageCount / recent.length;

    /*
     * Stable stage transitions are rewarded.
     * Excessive bouncing usually means tracking
     * noise or uncontrolled movement.
     */
    const stabilityScore =
      sameStageRatio * 100;

    const expectedDuration =
      Math.max(
        this.definition.durationSeconds,
        1
      ) * 1000;

    const elapsed =
      now - this.startedAtMs;

    /*
     * Do not heavily punish the first moment of
     * practice while the dancer is getting ready.
     */
    if (elapsed < 1200) {
      return 75;
    }

    const durationRatio =
      elapsed / expectedDuration;

    let durationScore = 100;

    if (durationRatio < 0.35) {
      durationScore = 65;
    } else if (durationRatio > 2.5) {
      durationScore = 65;
    } else if (durationRatio > 1.8) {
      durationScore = 80;
    }

    return this.clamp(
      stabilityScore * 0.65 +
        durationScore * 0.35,
      0,
      100
    );
  }

  /**
   * Completion score is calculated directly from
   * the real detector state.
   *
   * The current MovementDetector does not expose
   * holdDurationMs. Instead, the hold duration is
   * calculated from stageStartedAt while the user
   * is in the extended stage.
   */
  private calculateCompletionScore(
    state: MovementDetectionState,
    now: number
  ): number {
    let score = 15;

    switch (state.stage) {
      case "not_started":
        score = 0;
        break;

      case "starting":
        score = 30;
        break;

      case "raising":
        score = 50;
        break;

      case "extended":
        score = 72;
        break;

      case "returning":
        score = 82;
        break;

      case "completed":
        score = 100;
        break;

      default:
        score = 0;
        break;
    }

    /*
     * Calculate the real hold duration from the
     * detector's stage start timestamp.
     */
    const holdDurationMs =
      state.stage === "extended" &&
      state.stageStartedAt > 0
        ? Math.max(
            0,
            now - state.stageStartedAt
          )
        : 0;

    /*
     * A controlled extended hold is rewarded.
     */
    if (
      state.stage === "extended" &&
      holdDurationMs >= 500
    ) {
      score = 88;
    }

    /*
     * Completed repetitions contribute to the
     * completion score, but never push it above 100.
     */
    if (state.repsCompleted > 0) {
      score = Math.min(
        100,
        score +
          Math.min(
            state.repsCompleted * 3,
            12
          )
      );
    }

    return this.clamp(
      score,
      0,
      100
    );
  }

  /**
   * Find the reference frame that best represents
   * the current movement stage.
   */
  private findClosestReferenceFrame(
    stage: MovementStage
  ) {
    const frames =
      this.definition.referenceFrames ?? [];

    if (!frames.length) {
      return null;
    }

    const sameStage =
      frames.filter(
        (frame) =>
          frame.stage === stage
      );

    if (sameStage.length) {
      return sameStage[0];
    }

    /*
     * Semantic progress positions for stages that
     * do not have their own explicit keyframe.
     */
    const targetProgress: Record<
      MovementStage,
      number
    > = {
      not_started: 0,
      starting: 0.20,
      raising: 0.45,
      extended: 0.65,
      returning: 0.85,
      completed: 1,
    };

    const desired =
      targetProgress[stage];

    return frames.reduce(
      (closest, frame) => {
        const currentDistance =
          Math.abs(
            frame.timeOffsetNormalized -
              desired
          );

        const closestDistance =
          Math.abs(
            closest.timeOffsetNormalized -
              desired
          );

        return currentDistance <
          closestDistance
          ? frame
          : closest;
      },
      frames[0]
    );
  }

  /**
   * Determine whether at least one reference
   * movement frame contains useful landmark data.
   */
  private hasReferenceLandmarks(): boolean {
    return (
      this.definition.referenceFrames ?? []
    ).some(
      (frame) =>
        frame.keyLandmarks &&
        Object.keys(
          frame.keyLandmarks
        ).length >= 2
    );
  }

  /**
   * Normalize the skeleton around the hip midpoint
   * and scale it using body width.
   *
   * This makes comparison less dependent on:
   * - camera distance
   * - dancer position
   * - body size
   */
  private normalizeLandmarks(
    landmarks: Landmark3D[]
  ): Record<number, PosePoint> {
    if (landmarks.length < 33) {
      return {};
    }

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const leftShoulder =
      landmarks[11];

    const rightShoulder =
      landmarks[12];

    if (
      !leftHip ||
      !rightHip ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return {};
    }

    const center = {
      x:
        (leftHip.x +
          rightHip.x) /
        2,

      y:
        (leftHip.y +
          rightHip.y) /
        2,

      z:
        (leftHip.z +
          rightHip.z) /
        2,
    };

    const shoulderWidth =
      Math.sqrt(
        (leftShoulder.x -
          rightShoulder.x) **
          2 +
          (leftShoulder.y -
            rightShoulder.y) **
            2 +
          (leftShoulder.z -
            rightShoulder.z) **
            2
      );

    const hipWidth =
      Math.sqrt(
        (leftHip.x -
          rightHip.x) **
          2 +
          (leftHip.y -
            rightHip.y) **
            2 +
          (leftHip.z -
            rightHip.z) **
            2
      );

    const scale = Math.max(
      shoulderWidth,
      hipWidth,
      0.05
    );

    const output: Record<
      number,
      PosePoint
    > = {};

    landmarks.forEach(
      (point, index) => {
        output[index] = {
          x:
            (point.x -
              center.x) /
            scale,

          y:
            (point.y -
              center.y) /
            scale,

          z:
            (point.z -
              center.z) /
            scale,
        };
      }
    );

    return output;
  }

  /**
   * Convert an angle error into a 0-100 score.
   */
  private errorToScore(
    error: number,
    tolerance: number
  ): number {
    return this.clamp(
      100 *
        (1 -
          error /
            Math.max(
              tolerance,
              1
            )),
      0,
      100
    );
  }

  private clamp(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }

  private round(
    value: number
  ): number {
    return Math.round(value);
  }

  /**
   * Finalize the complete practice session.
   */
  public finalizeSession(
    userId: string,
    danceSlug: string,
    danceName: string,
    lessonIndex: number,
    lessonTitle: string,
    repsCompleted: number
  ): PracticeSessionResult {
    const recent =
      this.history.slice(-120);

    /*
     * If no frames were evaluated, return a real
     * zero score instead of inventing a score.
     */
    const poseScore =
      recent.length > 0
        ? recent.reduce(
            (sum, item) =>
              sum + item.poseScore,
            0
          ) / recent.length
        : 0;

    const timingScore =
      recent.length > 0
        ? recent.reduce(
            (sum, item) =>
              sum + item.timingScore,
            0
          ) / recent.length
        : 0;

    const completionScore =
      recent.length > 0
        ? recent.reduce(
            (sum, item) =>
              sum +
              item.completionScore,
            0
          ) / recent.length
        : 0;

    const weightedOverall =
      recent.length > 0
        ? poseScore * 0.60 +
          timingScore * 0.20 +
          completionScore * 0.20
        : 0;

    const durationMs =
      this.startedAtMs > 0 &&
      recent.length > 0
        ? Math.max(
            recent[
              recent.length - 1
            ].timestampMs -
              this.startedAtMs,
            0
          )
        : 0;

    const feedbackSummary =
      this.buildFeedback(
        poseScore,
        timingScore,
        completionScore,
        repsCompleted
      );

    return {
      id: `practice-${Date.now()}`,

      userId,

      danceSlug,

      danceName,

      lessonIndex,

      lessonTitle,

      movementId:
        this.definition.id,

      movementName:
        this.definition.name,

      durationSeconds:
        Math.round(
          durationMs / 1000
        ),

      accuracyScore:
        Math.round(
          this.clamp(
            poseScore,
            0,
            100
          )
        ),

      timingScore:
        Math.round(
          this.clamp(
            timingScore,
            0,
            100
          )
        ),

      completionScore:
        Math.round(
          this.clamp(
            completionScore,
            0,
            100
          )
        ),

      overallScore:
        Math.round(
          this.clamp(
            weightedOverall,
            0,
            100
          )
        ),

      feedbackSummary,

      repsCompleted,

      createdAt:
        new Date().toISOString(),
    };
  }

  /**
   * Generate final human-readable feedback.
   */
  private buildFeedback(
    poseScore: number,
    timingScore: number,
    completionScore: number,
    repsCompleted: number
  ): string[] {
    const feedback: string[] = [];

    if (poseScore >= 85) {
      feedback.push(
        "Excellent pose alignment and joint positioning."
      );
    } else if (poseScore >= 70) {
      feedback.push(
        "Good pose overall. Refine the joint angles for better accuracy."
      );
    } else if (poseScore >= 50) {
      feedback.push(
        "Your movement is developing. Focus on matching the target angles more closely."
      );
    } else {
      feedback.push(
        "Focus on matching the target pose and keeping your body aligned."
      );
    }

    if (timingScore >= 85) {
      feedback.push(
        "Your movement timing was controlled and consistent."
      );
    } else if (timingScore >= 65) {
      feedback.push(
        "Your timing is reasonable. Try to make the transitions smoother."
      );
    } else {
      feedback.push(
        "Slow down slightly and make each transition more controlled."
      );
    }

    if (
      completionScore >= 85 &&
      repsCompleted > 0
    ) {
      feedback.push(
        `You completed ${repsCompleted} repetition${
          repsCompleted === 1
            ? ""
            : "s"
        } with good movement control.`
      );
    } else if (repsCompleted > 0) {
      feedback.push(
        `You completed ${repsCompleted} repetition${
          repsCompleted === 1
            ? ""
            : "s"
        }. Keep working on completing the full movement cycle cleanly.`
      );
    } else {
      feedback.push(
        "Complete the full movement cycle from start through return to register a repetition."
      );
    }

    return feedback;
  }
}