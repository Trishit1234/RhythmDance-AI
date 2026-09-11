"""
Evaluation script to compute Confusion Matrix, Precision, Recall, and Accuracy.
"""

import os
import argparse
import torch
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
from ml.preprocessing.dataset import DancePoseDataset, MOVEMENT_CLASSES
from ml.training.model import DanceMovementClassifier

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="ml/data/processed_landmarks")
    parser.add_argument("--checkpoint", type=str, default="ml/models/best_dance_model.pt")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dataset = DancePoseDataset(data_dir=args.data_dir, sequence_length=64)
    loader = DataLoader(dataset, batch_size=16, shuffle=False)

    model = DanceMovementClassifier(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        num_classes=len(MOVEMENT_CLASSES)
    ).to(device)

    if os.path.exists(args.checkpoint):
        model.load_state_dict(torch.load(args.checkpoint, map_location=device))
        print(f"Loaded checkpoint from {args.checkpoint}")
    else:
        print(f"Checkpoint {args.checkpoint} not found, evaluating initialized model.")

    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for x, y, _ in loader:
            x = x.to(device)
            logits, _ = model(x)
            preds = torch.argmax(logits, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(y.numpy())

    print("\n--- CLASSIFICATION REPORT ---")
    print(classification_report(all_targets, all_preds, target_names=MOVEMENT_CLASSES[:len(set(all_targets))]))

    print("--- CONFUSION MATRIX ---")
    print(confusion_matrix(all_targets, all_preds))

if __name__ == "__main__":
    main()
