"""
Training script for the Dance Pose Movement Classifier and Score Regressor.
"""

import os
import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from ml.preprocessing.dataset import DancePoseDataset, MOVEMENT_CLASSES
from ml.training.model import DanceMovementClassifier

def train_one_epoch(model, loader, optimizer, criterion_cls, criterion_reg, device):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for x, y, score in loader:
        x, y, score = x.to(device), y.to(device), score.to(device)

        optimizer.zero_grad()
        logits, pred_score = model(x)

        loss_cls = criterion_cls(logits, y)
        loss_reg = criterion_reg(pred_score, score) / 100.0
        loss = loss_cls + 0.3 * loss_reg

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * len(y)
        preds = torch.argmax(logits, dim=1)
        correct += (preds == y).sum().item()
        total += len(y)

    return total_loss / max(1, total), (correct / max(1, total)) * 100

def evaluate(model, loader, criterion_cls, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for x, y, score in loader:
            x, y, score = x.to(device), y.to(device), score.to(device)
            logits, _ = model(x)
            loss = criterion_cls(logits, y)

            total_loss += loss.item() * len(y)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == y).sum().item()
            total += len(y)

    return total_loss / max(1, total), (correct / max(1, total)) * 100

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="ml/data/processed_landmarks")
    parser.add_argument("--output_dir", type=str, default="ml/models")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    if not os.path.isdir(args.data_dir):
        raise FileNotFoundError(
            f"Training data directory does not exist: {args.data_dir}. "
            "Run `python -m ml.data.build_dataset` after collecting landmark samples."
        )

    data_files = [f for f in os.listdir(args.data_dir) if f.endswith(".npy")]
    if not data_files:
        raise RuntimeError(
            f"No training samples found in {args.data_dir}. Random/dummy data is disabled. "
            "Collect real pose samples first."
        )

    dataset = DancePoseDataset(data_dir=args.data_dir, sequence_length=64)
    if len(dataset) < len(MOVEMENT_CLASSES) * 2:
        raise RuntimeError(
            f"Only {len(dataset)} valid samples were found. Collect at least 2 samples per movement before training."
        )
    val_size = max(1, int(len(dataset) * 0.2))
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)

    model = DanceMovementClassifier(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        num_classes=len(MOVEMENT_CLASSES)
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion_cls = nn.CrossEntropyLoss()
    criterion_reg = nn.SmoothL1Loss()

    best_val_acc = 0.0

    print("Starting training...")
    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, optimizer, criterion_cls, criterion_reg, device
        )
        val_loss, val_acc = evaluate(model, val_loader, criterion_cls, device)
        scheduler.step()

        print(
            f"Epoch [{epoch:02d}/{args.epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.1f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.1f}%"
        )

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), os.path.join(args.output_dir, "best_dance_model.pt"))

    print(f"Training completed. Best Val Acc: {best_val_acc:.1f}%. Checkpoint saved.")

if __name__ == "__main__":
    main()
