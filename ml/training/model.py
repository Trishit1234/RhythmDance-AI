"""
Neural Network Architecture for Dance Pose Sequence Classification and Scoring.
Combines BiLSTM with Multi-Head Attention and Dual Output Heads.
"""

import torch
import torch.nn as nn
import math

class TemporalSelfAttention(nn.Module):
    def __init__(self, hidden_dim: int, num_heads: int = 4):
        super().__init__()
        self.mha = nn.MultiheadAttention(embed_dim=hidden_dim, num_heads=num_heads, batch_first=True)
        self.norm = nn.LayerNorm(hidden_dim)

    def forward(self, x):
        attn_out, _ = self.mha(x, x, x)
        return self.norm(x + attn_out)

class DanceMovementClassifier(nn.Module):
    def __init__(
        self,
        input_dim: int = 99,       # 33 landmarks * 3 (X, Y, Z)
        hidden_dim: int = 128,
        num_layers: int = 2,
        num_classes: int = 5,
        dropout: float = 0.3
    ):
        super().__init__()

        # Linear projection
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout)
        )

        # Bi-directional LSTM
        self.lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim // 2,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0
        )

        # Attention layer
        self.attention = TemporalSelfAttention(hidden_dim=hidden_dim, num_heads=4)

        # Pooling & Classification Head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_classes)
        )

        # Score Regression Head (0 - 100)
        self.regressor = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.GELU(),
            nn.Linear(32, 1),
            nn.Sigmoid() # Scale to [0, 100]
        )

    def forward(self, x):
        # x: (Batch, SeqLen, 99)
        proj = self.input_proj(x)
        lstm_out, _ = self.lstm(proj)
        attn_out = self.attention(lstm_out)

        # Global average pooling over time
        pooled = torch.mean(attn_out, dim=1)

        # Class logits and quality score
        logits = self.classifier(pooled)
        score = self.regressor(pooled) * 100.0

        return logits, score.squeeze(-1)
