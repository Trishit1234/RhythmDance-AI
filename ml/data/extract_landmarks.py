"""
Extracts 33 3D body pose landmarks from raw dance video files using MediaPipe Pose.
Outputs JSON and NumPy (.npy) landmark sequences.
"""

import os
import argparse
import json
import cv2
import numpy as np
import mediapipe as mp
from tqdm import tqdm

def extract_landmarks_from_video(video_path: str) -> np.ndarray:
    """Processes a video and extracts a sequence of (T, 33, 3) normalized landmarks."""
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=2,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(video_path)
    frames_landmarks = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

        if results.pose_landmarks:
            frame_lm = []
            for lm in results.pose_landmarks.landmark:
                frame_lm.append([lm.x, lm.y, lm.z, lm.visibility])
            frames_landmarks.append(frame_lm)
        else:
            # Fallback zero array if body lost in frame
            frames_landmarks.append([[0.0, 0.0, 0.0, 0.0] for _ in range(33)])

    cap.release()
    pose.close()

    return np.array(frames_landmarks, dtype=np.float32)

def main():
    parser = argparse.ArgumentParser(description="Extract pose landmarks from video dataset.")
    parser.add_argument("--input_dir", type=str, default="data/raw_videos", help="Directory of video files")
    parser.add_argument("--output_dir", type=str, default="data/processed_landmarks", help="Output directory for landmarks")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    video_files = [f for f in os.listdir(args.input_dir) if f.endswith((".mp4", ".mov", ".avi"))]

    print(f"Found {len(video_files)} videos in {args.input_dir}")

    for vfile in tqdm(video_files, desc="Extracting landmarks"):
        vpath = os.path.join(args.input_dir, vfile)
        landmarks = extract_landmarks_from_video(vpath)

        out_name = os.path.splitext(vfile)[0]
        np.save(os.path.join(args.output_dir, f"{out_name}.npy"), landmarks)

    print("Landmark extraction complete.")

if __name__ == "__main__":
    main()
