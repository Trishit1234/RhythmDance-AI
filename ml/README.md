# Indian Classical Dance Movement Recognition ML Pipeline

This directory contains the standalone PyTorch training, evaluation, and ONNX export pipeline for classifying Indian classical dance movements and evaluating student execution form.

---

## Pipeline Architecture

```text
Dance Video Input (.mp4 / .mov)
         ↓
Pose Extraction (MediaPipe Pose 33 3D Landmarks)
         ↓
Landmark Normalization (Torso Center Centered, Scale Invariant)
         ↓
Sliding Window Sequence Dataset (PyTorch Dataset)
         ↓
Bi-directional LSTM / GRU + Temporal Self-Attention
         ↓
Dual Heads:
  1. Movement Classification (CrossEntropy: right_arm_raise, left_arm_raise, aramandi_stance, chowka_stance)
  2. Form Quality Score Regression (SmoothL1 / MSE: 0 - 100%)
         ↓
Evaluation & ONNX Export for Browser WebAssembly Inference
```

---

## Directory Structure

```text
ml/
├── README.md                  # Documentation and architecture guide
├── requirements.txt           # Python library dependencies
├── data/
│   └── extract_landmarks.py   # Extracts 33 3D landmarks from raw dance video footage
├── preprocessing/
│   └── dataset.py             # PyTorch Dataset, sequence padding, and spatial normalization
├── training/
│   ├── model.py               # BiLSTM + Attention deep neural network architecture
│   └── train.py               # Full training loop with validation, learning rate scheduling & checkpointing
├── evaluation/
│   └── evaluate.py            # Confusion matrix, classification report, and test accuracy metrics
├── inference/
│   ├── export_onnx.py         # Exports PyTorch weights (.pt) to optimized ONNX format
│   └── predict.py             # Runs standalone inference on video or landmark files
└── models/                    # Saved model checkpoints and ONNX binaries
```

---

## Supported Movement Classes

1. `right_arm_raise` (Hasta Uttana)
2. `left_arm_raise`
3. `aramandi_stance` (Bharatanatyam Half-seated Stance)
4. `chowka_stance` (Odissi Square Stance)
5. `namaskar_salutation`

---

## How to Run

### 1. Install Dependencies
```bash
pip install -r ml/requirements.txt
```

### 2. Extract Landmarks from Videos
```bash
python ml/data/extract_landmarks.py --input_dir /path/to/videos --output_dir ml/data/processed
```

### 3. Train Model
```bash
python ml/training/train.py --epochs 40 --batch_size 32 --lr 0.001
```

### 4. Evaluate Checkpoint
```bash
python ml/evaluation/evaluate.py --checkpoint ml/models/best_dance_model.pt
```

### 5. Export to ONNX
```bash
python ml/inference/export_onnx.py --checkpoint ml/models/best_dance_model.pt --output ml/models/dance_pose_classifier.onnx
```
