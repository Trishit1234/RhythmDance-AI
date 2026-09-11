"""
PyTorch Dataset class for loading and preprocessing dance landmark sequences.
Includes spatial normalization (centering on mid-hip) and fixed-length sequence padding/sampling.
"""

import os
import glob
import numpy as np
import torch
from torch.utils.data import Dataset

MOVEMENT_CLASSES = [
    "right_arm_raise",
    "left_arm_raise",
    "aramandi_stance",
    "chowka_stance",
    "namaskar_salutation",
]

LABEL_TO_INDEX = {name: idx for idx, name in enumerate(MOVEMENT_CLASSES)}

def normalize_landmarks_sequence(landmarks: np.ndarray) -> np.ndarray:
    """
    Normalizes landmarks (T, 33, C):
    1. Centers landmarks on the mid-hip point (average of landmark 23 and 24).
    2. Scales by torso length (distance between mid-hip and mid-shoulder) to make scale-invariant.
    """
    T, num_lm, C = landmarks.shape
    coords = landmarks[:, :, :3].copy() # Use X, Y, Z

    for t in range(T):
        left_hip = coords[t, 23]
        right_hip = coords[t, 24]
        mid_hip = (left_hip + right_hip) / 2.0

        left_shoulder = coords[t, 11]
        right_shoulder = coords[t, 12]
        mid_shoulder = (left_shoulder + right_shoulder) / 2.0

        torso_len = np.linalg.norm(mid_shoulder - mid_hip)
        if torso_len < 1e-4:
            torso_len = 1.0

        # Center and scale
        coords[t] = (coords[t] - mid_hip) / torso_len

    return coords.reshape(T, num_lm * 3)

def pad_or_truncate_sequence(seq: np.ndarray, target_length: int = 64) -> np.ndarray:
    """Adjusts sequence length via linear resampling or zero-padding."""
    T, feat_dim = seq.shape
    if T == target_length:
        return seq

    if T > target_length:
        indices = np.linspace(0, T - 1, target_length, dtype=int)
        return seq[indices]

    # If shorter, zero-pad
    padded = np.zeros((target_length, feat_dim), dtype=np.float32)
    padded[:T] = seq
    return padded

class DancePoseDataset(Dataset):
    def __init__(self, data_dir: str, sequence_length: int = 64):
        self.sequence_length = sequence_length
        self.samples = []
        self.labels = []
        self.scores = []

        files = glob.glob(os.path.join(data_dir, "*.npy"))
        for fpath in files:
            fname = os.path.basename(fpath).lower()
            label_idx = None
            for label_name, idx in LABEL_TO_INDEX.items():
                if label_name in fname:
                    label_idx = idx
                    break
            if label_idx is None:
                print(f"Skipping file with unknown movement label: {os.path.basename(fpath)}")
                continue

            raw_lm = np.load(fpath)
            if len(raw_lm) < 5:
                continue

            normalized = normalize_landmarks_sequence(raw_lm)
            fixed_seq = pad_or_truncate_sequence(normalized, target_length=sequence_length)

            # Browser-collected samples currently do not contain human quality labels.
            # Keep the existing live kinematic comparator as the quality-score source.
            score = 85.0

            self.samples.append(fixed_seq)
            self.labels.append(label_idx)
            self.scores.append(score)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x = torch.tensor(self.samples[idx], dtype=torch.float32) # (SeqLen, 99)
        y = torch.tensor(self.labels[idx], dtype=torch.long)
        score = torch.tensor(self.scores[idx], dtype=torch.float32)
        return x, y, score
