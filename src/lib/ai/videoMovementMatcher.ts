 import { ReferenceVideoSequence } from "./referenceVideoProcessor";

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface VideoMatchResult {
  score: number;
  progress: number;
  feedback: string;

  bodyPartScores: {
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    torso: number;
  };
}

interface FrameMatch {
  index: number;
  distance: number;
}

interface ScoreHistoryItem {
  score: number;
  timestamp: number;
}

interface FeedbackState {
  text: string;
  timestamp: number;
}

export class VideoMovementMatcher {
  private referenceSequence: ReferenceVideoSequence | null = null;

  /**
   * Current position inside the reference video.
   *
   * This is deliberately kept stable instead of allowing the matcher
   * to jump randomly backwards and forwards between reference frames.
   */
  private currentReferenceIndex = 0;

  /**
   * Recent raw scores used for temporal smoothing.
   */
  private scoreHistory: ScoreHistoryItem[] = [];

  /**
   * Recent body-part scores.
   */
  private bodyPartHistory: Array<{
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    torso: number;
    timestamp: number;
  }> = [];

  /**
   * Feedback history prevents the tutor from constantly changing
   * its message every single frame.
   */
  private feedbackState: FeedbackState = {
    text: "",
    timestamp: 0,
  };

  /**
   * Last matched frame.
   */
  private lastMatchedIndex = 0;

  /**
   * Number of consecutive frames where the current body-part
   * problem has remained visible.
   */
  private weakPartStreak = 0;

  private lastWeakPart = "";

  /**
   * Maximum amount of reference frames the matcher can inspect
   * around the current movement phase.
   */
  private readonly SEARCH_WINDOW = 15;

  /**
   * Additional forward-looking frames.
   *
   * This allows the matcher to recognize that the student is
   * slightly ahead of the reference without allowing huge jumps.
   */
  private readonly FORWARD_LOOKAHEAD = 8;

  /**
   * Maximum backward movement allowed between two matched frames.
   *
   * This prevents unstable frame jumping.
   */
  private readonly MAX_BACKWARD_STEP = 3;

  /**
   * Score smoothing window.
   */
  private readonly SCORE_HISTORY_SIZE = 8;

  /**
   * Body-part smoothing window.
   */
  private readonly BODY_HISTORY_SIZE = 6;

  /**
   * Feedback should not change too rapidly.
   */
  private readonly FEEDBACK_COOLDOWN_MS = 650;

  /**
   * Minimum score difference before we consider a new feedback
   * situation meaningful.
   */
  private readonly SIGNIFICANT_SCORE_CHANGE = 5;

  /**
   * Movement comparison weights.
   *
   * Arms are slightly more important because many Indian dance
   * movements contain strong hand/arm positioning.
   */
  private readonly PART_WEIGHTS = {
    leftArm: 0.22,
    rightArm: 0.22,
    leftLeg: 0.18,
    rightLeg: 0.18,
    torso: 0.20,
  };

  /**
   * Landmark groups.
   *
   * MediaPipe Pose landmark indexes:
   *
   * 11 left shoulder
   * 12 right shoulder
   * 13 left elbow
   * 14 right elbow
   * 15 left wrist
   * 16 right wrist
   * 23 left hip
   * 24 right hip
   * 25 left knee
   * 26 right knee
   * 27 left ankle
   * 28 right ankle
   */
  private readonly PARTS = {
    leftArm: [11, 13, 15],
    rightArm: [12, 14, 16],
    leftLeg: [23, 25, 27],
    rightLeg: [24, 26, 28],
    torso: [11, 12, 23, 24],
  };

  /**
   * Landmarks that are especially useful for determining
   * the movement phase.
   */
  private readonly SEARCH_LANDMARKS = [
    11,
    12,
    13,
    14,
    15,
    16,
    23,
    24,
    25,
    26,
    27,
    28,
  ];

  /**
   * Set a processed reference-video sequence.
   */
  public setReferenceSequence(sequence: ReferenceVideoSequence | null) {
    this.referenceSequence = sequence;
    this.resetPosition();
  }

  /**
   * Completely reset the matcher.
   */
  public reset() {
    this.referenceSequence = null;
    this.resetPosition();
  }

  /**
   * Reset only movement position/state while keeping the
   * reference sequence.
   */
  public resetPosition() {
    this.currentReferenceIndex = 0;
    this.lastMatchedIndex = 0;

    this.scoreHistory = [];
    this.bodyPartHistory = [];

    this.feedbackState = {
      text: "",
      timestamp: 0,
    };

    this.weakPartStreak = 0;
    this.lastWeakPart = "";
  }

  /**
   * Returns the currently loaded reference sequence.
   */
  public getReferenceSequence(): ReferenceVideoSequence | null {
    return this.referenceSequence;
  }

  /**
   * Main evaluation method.
   *
   * This is intentionally kept compatible with the existing
   * Practice Mode API:
   *
   * videoMatcher.evaluate(liveLandmarks)
   */
  public evaluate(liveLandmarks: Landmark[]): VideoMatchResult | null {
    if (!this.referenceSequence) {
      return null;
    }

    if (!liveLandmarks || liveLandmarks.length < 33) {
      return {
        score: 0,
        progress: this.getProgress(),
        feedback: "Move fully into the camera view.",
        bodyPartScores: {
          leftArm: 0,
          rightArm: 0,
          leftLeg: 0,
          rightLeg: 0,
          torso: 0,
        },
      };
    }

    const normalizedLive = this.normalizeLandmarks(liveLandmarks);

    if (normalizedLive.length < 33) {
      return {
        score: 0,
        progress: this.getProgress(),
        feedback: "I can't clearly see your full body.",
        bodyPartScores: {
          leftArm: 0,
          rightArm: 0,
          leftLeg: 0,
          rightLeg: 0,
          torso: 0,
        },
      };
    }

    /**
     * Find the reference frame representing the closest movement
     * phase.
     */
    const match = this.findBestReferenceFrame(normalizedLive);

    if (!match) {
      return null;
    }

    this.currentReferenceIndex = match.index;
    this.lastMatchedIndex = match.index;

    const referenceFrame =
      this.referenceSequence.frames[match.index];

    if (!referenceFrame) {
      return null;
    }

    const result = this.compareAgainstReference(
      normalizedLive,
      referenceFrame.landmarks
    );

    return result;
  }

  /**
   * Find the best reference frame.
   *
   * Unlike the old implementation, this does not blindly compare
   * only currentIndex +/- 8.
   *
   * It uses:
   *
   * 1. A local window around the current phase.
   * 2. A small forward look-ahead.
   * 3. A penalty for jumping too far.
   * 4. A penalty for going backwards.
   *
   * This produces much smoother movement tracking.
   */
  private findBestReferenceFrame(
    liveLandmarks: Landmark[]
  ): FrameMatch | null {
    if (
      !this.referenceSequence ||
      this.referenceSequence.frames.length === 0
    ) {
      return null;
    }

    const frames = this.referenceSequence.frames;

    const startIndex = Math.max(
      0,
      this.currentReferenceIndex - this.SEARCH_WINDOW
    );

    const endIndex = Math.min(
      frames.length - 1,
      this.currentReferenceIndex +
        this.SEARCH_WINDOW +
        this.FORWARD_LOOKAHEAD
    );

    let bestMatch: FrameMatch | null = null;
    let bestCost = Number.POSITIVE_INFINITY;

    for (let index = startIndex; index <= endIndex; index++) {
      const frame = frames[index];

      if (!frame || frame.landmarks.length < 33) {
        continue;
      }

      const distance = this.calculatePoseDistance(
        liveLandmarks,
        frame.landmarks
      );

      const movementDelta = index - this.currentReferenceIndex;

      /**
       * Penalize very large movement jumps.
       */
      const jumpPenalty =
        Math.abs(movementDelta) * 0.012;

      /**
       * Going backwards is allowed, but more expensive.
       *
       * This prevents the reference animation from constantly
       * reversing when the student's pose fluctuates.
       */
      const backwardPenalty =
        movementDelta < 0
          ? Math.abs(movementDelta) * 0.035
          : 0;

      /**
       * Slightly prefer forward progression.
       *
       * This helps the system follow an actual dance sequence.
       */
      const forwardBonus =
        movementDelta > 0
          ? Math.min(movementDelta, 4) * 0.008
          : 0;

      const cost =
        distance +
        jumpPenalty +
        backwardPenalty -
        forwardBonus;

      if (cost < bestCost) {
        bestCost = cost;

        bestMatch = {
          index,
          distance,
        };
      }
    }

    /**
     * Fallback.
     */
    if (!bestMatch) {
      const fallbackFrame =
        frames[this.currentReferenceIndex];

      if (!fallbackFrame) {
        return null;
      }

      return {
        index: this.currentReferenceIndex,
        distance: this.calculatePoseDistance(
          liveLandmarks,
          fallbackFrame.landmarks
        ),
      };
    }

    /**
     * Do not allow a sudden massive backward jump.
     */
    if (
      bestMatch.index <
      this.currentReferenceIndex - this.MAX_BACKWARD_STEP
    ) {
      const limitedIndex = Math.max(
        0,
        this.currentReferenceIndex -
          this.MAX_BACKWARD_STEP
      );

      const limitedFrame = frames[limitedIndex];

      if (limitedFrame) {
        return {
          index: limitedIndex,
          distance: this.calculatePoseDistance(
            liveLandmarks,
            limitedFrame.landmarks
          ),
        };
      }
    }

    return bestMatch;
  }

  /**
   * Compare the user's pose against a reference frame.
   */
  private compareAgainstReference(
    liveLandmarks: Landmark[],
    referenceLandmarks: Landmark[]
  ): VideoMatchResult {
    const rawBodyPartScores = {
      leftArm: this.comparePart(
        liveLandmarks,
        referenceLandmarks,
        this.PARTS.leftArm
      ),

      rightArm: this.comparePart(
        liveLandmarks,
        referenceLandmarks,
        this.PARTS.rightArm
      ),

      leftLeg: this.comparePart(
        liveLandmarks,
        referenceLandmarks,
        this.PARTS.leftLeg
      ),

      rightLeg: this.comparePart(
        liveLandmarks,
        referenceLandmarks,
        this.PARTS.rightLeg
      ),

      torso: this.comparePart(
        liveLandmarks,
        referenceLandmarks,
        this.PARTS.torso
      ),
    };

    /**
     * Smooth individual body-part scores.
     */
    this.bodyPartHistory.push({
      ...rawBodyPartScores,
      timestamp: performance.now(),
    });

    if (
      this.bodyPartHistory.length >
      this.BODY_HISTORY_SIZE
    ) {
      this.bodyPartHistory.shift();
    }

    const bodyPartScores = {
      leftArm: this.getSmoothedBodyPartScore("leftArm"),
      rightArm: this.getSmoothedBodyPartScore("rightArm"),
      leftLeg: this.getSmoothedBodyPartScore("leftLeg"),
      rightLeg: this.getSmoothedBodyPartScore("rightLeg"),
      torso: this.getSmoothedBodyPartScore("torso"),
    };

    /**
     * Weighted overall score.
     */
    const rawOverallScore =
      bodyPartScores.leftArm *
        this.PART_WEIGHTS.leftArm +
      bodyPartScores.rightArm *
        this.PART_WEIGHTS.rightArm +
      bodyPartScores.leftLeg *
        this.PART_WEIGHTS.leftLeg +
      bodyPartScores.rightLeg *
        this.PART_WEIGHTS.rightLeg +
      bodyPartScores.torso *
        this.PART_WEIGHTS.torso;

    /**
     * Store score for temporal smoothing.
     */
    this.scoreHistory.push({
      score: rawOverallScore,
      timestamp: performance.now(),
    });

    if (
      this.scoreHistory.length >
      this.SCORE_HISTORY_SIZE
    ) {
      this.scoreHistory.shift();
    }

    const smoothedScore = this.getSmoothedScore();

    /**
     * Identify the weakest body part.
     */
    const weakestPart =
      this.getWeakestBodyPart(bodyPartScores);

    /**
     * Track whether the same body part has been weak
     * for several consecutive frames.
     */
    if (weakestPart === this.lastWeakPart) {
      this.weakPartStreak++;
    } else {
      this.lastWeakPart = weakestPart;
      this.weakPartStreak = 1;
    }

    const feedback = this.getFeedback(
      bodyPartScores,
      smoothedScore,
      weakestPart
    );

    return {
      score: Math.round(
        this.clamp(smoothedScore, 0, 100)
      ),

      progress: this.getProgress(),

      feedback,

      bodyPartScores: {
        leftArm: Math.round(bodyPartScores.leftArm),
        rightArm: Math.round(bodyPartScores.rightArm),
        leftLeg: Math.round(bodyPartScores.leftLeg),
        rightLeg: Math.round(bodyPartScores.rightLeg),
        torso: Math.round(bodyPartScores.torso),
      },
    };
  }

  /**
   * Compare selected landmarks of one body part.
   */
  private comparePart(
    live: Landmark[],
    reference: Landmark[],
    indices: number[]
  ): number {
    if (!indices.length) {
      return 0;
    }

    let totalDistance = 0;
    let validPoints = 0;

    for (const index of indices) {
      const livePoint = live[index];
      const referencePoint = reference[index];

      if (!livePoint || !referencePoint) {
        continue;
      }

      totalDistance += this.distance(
        livePoint,
        referencePoint
      );

      validPoints++;
    }

    if (validPoints === 0) {
      return 0;
    }

    const averageDistance =
      totalDistance / validPoints;

    /**
     * Convert normalized landmark distance into a score.
     *
     * Smaller distance = higher score.
     *
     * The exponential curve gives:
     * - very close poses → high score
     * - moderate differences → medium score
     * - very different poses → low score
     */
    const score =
      Math.exp(-averageDistance * 2.8) * 100;

    return this.clamp(score, 0, 100);
  }

  /**
   * Calculate whole-pose distance.
   *
   * Only important movement landmarks are used.
   */
  private calculatePoseDistance(
    live: Landmark[],
    reference: Landmark[]
  ): number {
    let total = 0;
    let count = 0;

    for (const index of this.SEARCH_LANDMARKS) {
      const livePoint = live[index];
      const referencePoint = reference[index];

      if (!livePoint || !referencePoint) {
        continue;
      }

      total += this.distance(
        livePoint,
        referencePoint
      );

      count++;
    }

    if (count === 0) {
      return Number.POSITIVE_INFINITY;
    }

    return total / count;
  }

  /**
   * Normalize landmarks so body size and camera distance have
   * less influence on the score.
   *
   * Hip center becomes the origin.
   * Torso height becomes the scale.
   */
  private normalizeLandmarks(
    landmarks: Landmark[]
  ): Landmark[] {
    if (!landmarks || landmarks.length < 33) {
      return [];
    }

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    if (
      !leftHip ||
      !rightHip ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return landmarks.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z,
      }));
    }

    const hipCenterX =
      (leftHip.x + rightHip.x) / 2;

    const hipCenterY =
      (leftHip.y + rightHip.y) / 2;

    const hipCenterZ =
      (leftHip.z + rightHip.z) / 2;

    const shoulderCenterX =
      (leftShoulder.x + rightShoulder.x) / 2;

    const shoulderCenterY =
      (leftShoulder.y + rightShoulder.y) / 2;

    const shoulderCenterZ =
      (leftShoulder.z + rightShoulder.z) / 2;

    const torsoHeight = Math.sqrt(
      Math.pow(
        shoulderCenterX - hipCenterX,
        2
      ) +
        Math.pow(
          shoulderCenterY - hipCenterY,
          2
        ) +
        Math.pow(
          shoulderCenterZ - hipCenterZ,
          2
        )
    );

    const scale = Math.max(
      torsoHeight,
      0.001
    );

    return landmarks.map((point) => ({
      x: (point.x - hipCenterX) / scale,
      y: (point.y - hipCenterY) / scale,
      z: (point.z - hipCenterZ) / scale,
    }));
  }

  /**
   * Smooth overall score.
   *
   * Recent frames have slightly more influence than older frames.
   */
  private getSmoothedScore(): number {
    if (this.scoreHistory.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (
      let i = 0;
      i < this.scoreHistory.length;
      i++
    ) {
      const item = this.scoreHistory[i];

      /**
       * Newer samples get higher weight.
       */
      const weight = i + 1;

      weightedSum += item.score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return this.scoreHistory[
        this.scoreHistory.length - 1
      ].score;
    }

    return weightedSum / totalWeight;
  }

  /**
   * Smooth one body-part score.
   */
  private getSmoothedBodyPartScore(
    part:
      | "leftArm"
      | "rightArm"
      | "leftLeg"
      | "rightLeg"
      | "torso"
  ): number {
    if (this.bodyPartHistory.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (
      let i = 0;
      i < this.bodyPartHistory.length;
      i++
    ) {
      const item = this.bodyPartHistory[i];

      const weight = i + 1;

      weightedSum += item[part] * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return 0;
    }

    return weightedSum / totalWeight;
  }

  /**
   * Find the body part currently causing the biggest problem.
   */
  private getWeakestBodyPart(scores: {
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
    torso: number;
  }): string {
    const entries = Object.entries(scores);

    entries.sort((a, b) => a[1] - b[1]);

    return entries[0]?.[0] ?? "torso";
  }

  /**
   * Generate useful real-time feedback.
   *
   * Feedback is deliberately stable instead of changing every
   * camera frame.
   */
  private getFeedback(
    scores: {
      leftArm: number;
      rightArm: number;
      leftLeg: number;
      rightLeg: number;
      torso: number;
    },
    overallScore: number,
    weakestPart: string
  ): string {
    const now = performance.now();

    /**
     * Very good overall performance.
     */
    if (overallScore >= 90) {
      return "Excellent! Your movement is matching the reference very well.";
    }

    /**
     * Good enough that we should not constantly interrupt
     * the student with corrections.
     */
    if (
      overallScore >= 80 &&
      this.weakPartStreak < 4
    ) {
      return "Good! Keep the same movement and timing.";
    }

    /**
     * Do not change feedback too frequently.
     */
    if (
      now - this.feedbackState.timestamp <
      this.FEEDBACK_COOLDOWN_MS
    ) {
      return (
        this.feedbackState.text ||
        "Keep following the reference movement."
      );
    }

    let message = "";

    switch (weakestPart) {
      case "leftArm":
        if (scores.leftArm < 45) {
          message =
            "Adjust your left arm position to match the reference.";
        } else if (scores.leftArm < 65) {
          message =
            "Bring your left arm a little closer to the reference.";
        } else {
          message =
            "Fine-tune your left arm position.";
        }
        break;

      case "rightArm":
        if (scores.rightArm < 45) {
          message =
            "Adjust your right arm position to match the reference.";
        } else if (scores.rightArm < 65) {
          message =
            "Bring your right arm a little closer to the reference.";
        } else {
          message =
            "Fine-tune your right arm position.";
        }
        break;

      case "leftLeg":
        if (scores.leftLeg < 45) {
          message =
            "Adjust your left leg position and stance.";
        } else if (scores.leftLeg < 65) {
          message =
            "Move your left leg slightly closer to the reference.";
        } else {
          message =
            "Fine-tune your left leg position.";
        }
        break;

      case "rightLeg":
        if (scores.rightLeg < 45) {
          message =
            "Adjust your right leg position and stance.";
        } else if (scores.rightLeg < 65) {
          message =
            "Move your right leg slightly closer to the reference.";
        } else {
          message =
            "Fine-tune your right leg position.";
        }
        break;

      case "torso":
        if (scores.torso < 45) {
          message =
            "Adjust your torso and overall body posture.";
        } else if (scores.torso < 65) {
          message =
            "Keep your torso alignment closer to the reference.";
        } else {
          message =
            "Fine-tune your torso position.";
        }
        break;

      default:
        message =
          "Follow the reference movement more closely.";
    }

    /**
     * If the student is very far from the reference,
     * give a general recovery instruction rather than
     * a tiny correction.
     */
    if (
      overallScore < 35 &&
      this.weakPartStreak >= 3
    ) {
      message =
        "Your pose is quite different. Slow down and match the reference position first.";
    }

    this.feedbackState = {
      text: message,
      timestamp: now,
    };

    return message;
  }

  /**
   * Current reference-video progress.
   *
   * 0 → beginning
   * 100 → end
   */
  private getProgress(): number {
    if (
      !this.referenceSequence ||
      this.referenceSequence.frames.length <= 1
    ) {
      return 0;
    }

    const progress =
      (this.currentReferenceIndex /
        (this.referenceSequence.frames.length - 1)) *
      100;

    return this.clamp(progress, 0, 100);
  }

  /**
   * Euclidean distance between two landmarks.
   */
  private distance(
    a: Landmark,
    b: Landmark
  ): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return Math.sqrt(
      dx * dx +
        dy * dy +
        dz * dz
    );
  }

  /**
   * Average numbers.
   */
  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    return (
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length
    );
  }

  /**
   * Clamp a number between min and max.
   */
  private clamp(
    value: number,
    min: number,
    max: number
  ): number {
    return Math.min(
      Math.max(value, min),
      max
    );
  }
}