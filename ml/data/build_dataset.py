"""Convert browser-collected landmark JSON files into training-ready .npy sequences.

Run from the project root:
    python -m ml.data.build_dataset
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from ml.preprocessing.dataset import LABEL_TO_INDEX, normalize_landmarks_sequence, pad_or_truncate_sequence

ROOT = Path(__file__).resolve().parents[2]
COLLECTED_DIR = ROOT / "ml" / "data" / "collected"
OUTPUT_DIR = ROOT / "ml" / "data" / "processed_landmarks"


def iter_samples(payload):
    if isinstance(payload, dict) and isinstance(payload.get("landmarks"), list):
        yield payload
    elif isinstance(payload, dict) and isinstance(payload.get("samples"), list):
        for sample in payload["samples"]:
            if isinstance(sample, dict):
                yield sample
    elif isinstance(payload, list):
        for sample in payload:
            if isinstance(sample, dict):
                yield sample


def main():
    files = sorted(COLLECTED_DIR.glob("*.json"))
    if not files:
        raise SystemExit(f"No JSON samples found in {COLLECTED_DIR}. Record samples in the website first.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUTPUT_DIR.glob("*.npy"):
        old.unlink()

    written = {label: 0 for label in LABEL_TO_INDEX}
    skipped = 0

    for path in files:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"SKIP {path.name}: invalid JSON ({exc})")
            skipped += 1
            continue

        for i, sample in enumerate(iter_samples(payload)):
            label = sample.get("label")
            if label not in LABEL_TO_INDEX:
                print(f"SKIP {path.name}: unknown label {label!r}")
                skipped += 1
                continue

            arr = np.asarray(sample.get("landmarks"), dtype=np.float32)
            if arr.ndim != 3 or arr.shape[1:] != (33, 4) or arr.shape[0] < 5:
                print(f"SKIP {path.name}: expected [T,33,4], got {arr.shape}")
                skipped += 1
                continue

            normalized = normalize_landmarks_sequence(arr)
            sequence = pad_or_truncate_sequence(normalized, 64)
            stem = path.stem if i == 0 else f"{path.stem}_{i}"
            out = OUTPUT_DIR / f"{label}__{stem}.npy"
            np.save(out, sequence.astype(np.float32))
            written[label] += 1

    print("\nDataset build complete")
    print("----------------------")
    for label, count in written.items():
        print(f"{label:24s}: {count}")
    print(f"skipped: {skipped}")

    if min(written.values()) == 0:
        raise SystemExit("Every movement needs at least one valid sample. Record more data and run again.")


if __name__ == "__main__":
    main()
