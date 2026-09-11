"""
Exports PyTorch DanceMovementClassifier model to ONNX format for WebAssembly / browser runtime.
"""

import os
import argparse
import torch
from ml.training.model import DanceMovementClassifier
from ml.preprocessing.dataset import MOVEMENT_CLASSES

def export_model_to_onnx(
    checkpoint_path: str,
    output_path: str,
    sequence_length: int = 64
):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    model = DanceMovementClassifier(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        num_classes=len(MOVEMENT_CLASSES)
    )

    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint not found: {checkpoint_path}. Train the model first; refusing to export an untrained model."
        )

    model.load_state_dict(torch.load(checkpoint_path, map_location="cpu"))
    print(f"Loaded weights from {checkpoint_path}")

    model.eval()

    # Dummy input: (batch_size=1, seq_len=64, features=99)
    dummy_input = torch.randn(1, sequence_length, 99, requires_grad=False)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["pose_sequence"],
        output_names=["movement_logits", "quality_score"],
        dynamic_axes={
            "pose_sequence": {0: "batch_size", 1: "sequence_length"},
            "movement_logits": {0: "batch_size"},
            "quality_score": {0: "batch_size"},
        },
    )

    print(f"Successfully exported ONNX model to: {output_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=str, default="ml/models/best_dance_model.pt")
    parser.add_argument("--output", type=str, default="ml/models/dance_movement_classifier.onnx")
    parser.add_argument("--seq_len", type=int, default=64)
    args = parser.parse_args()

    export_model_to_onnx(args.checkpoint, args.output, args.seq_len)

if __name__ == "__main__":
    main()
