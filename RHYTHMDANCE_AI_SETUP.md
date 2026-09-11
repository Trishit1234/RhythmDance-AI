# RhythmDance AI pipeline

## What is now included

- `/dataset-recorder`: browser-based pose-landmark collector using the existing MediaPipe Pose pipeline.
- The recorder saves **landmarks only**, not webcam video.
- Five movement labels match the existing ML classes:
  - right_arm_raise
  - left_arm_raise
  - aramandi_stance
  - chowka_stance
  - namaskar_salutation
- Browser samples are exported as JSON and converted to 64-frame, 99-feature `.npy` sequences by `ml/data/build_dataset.py`.
- Training no longer fabricates random data when the dataset is missing.
- Unknown dataset filenames are no longer silently treated as class 0.
- ONNX Runtime Web is declared as a frontend dependency for the later browser inference stage.
- The known camera/tracking stale-state fix is preserved in the practice page.

## Collect data

1. Start the website.
2. Open `http://localhost:3000/dataset-recorder`.
3. Select a movement and press **Start Camera**.
4. Press **Record Sample** and perform one clean example.
5. Download the JSON sample.
6. Repeat **8–10 samples per movement**.
7. Put all downloaded JSON files into `ml/data/collected/`.

## Build the training dataset

From the project root:

```bash
python -m ml.data.build_dataset
```

This creates normalized 64-frame sequences in `ml/data/processed_landmarks/`.

## Train

Install the Python requirements from `ml/requirements.txt`, then:

```bash
python -m ml.training.train --epochs 30 --batch_size 16
```

The trained checkpoint is written to `ml/models/best_dance_model.pt`.

## Export ONNX

After a real checkpoint exists:

```bash
python -m ml.inference.export_onnx --checkpoint ml/models/best_dance_model.pt --output public/models/dance_movement_classifier.onnx
```

The export script intentionally refuses to export an untrained model.

## Important

The existing live quality score is still calculated by the project's kinematic comparator. The neural model is being used for movement classification; a trustworthy learned quality score requires quality-labelled examples and is not fabricated here.
