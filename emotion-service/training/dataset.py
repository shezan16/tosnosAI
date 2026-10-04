import os
import json
import pandas as pd
import torch
from torch.utils.data import Dataset
from typing import List, Dict, Any, Union

class EmotionDataset(Dataset):
    """
    PyTorch Dataset supporting CSV, JSON, and JSONL formats for fine-tuning XLM-RoBERTa models.
    """
    def __init__(self, file_path: str, tokenizer=None, max_length: int = 128, label_map: Dict[str, int] = None):
        self.file_path = file_path
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = self._load_data(file_path)

        # Create label mapping
        if label_map is None:
            unique_emotions = sorted(list(set(item['emotion'] for item in self.data)))
            self.label_map = {emotion: idx for idx, emotion in enumerate(unique_emotions)}
        else:
            self.label_map = label_map

        self.inv_label_map = {v: k for k, v in self.label_map.items()}

    def _load_data(self, file_path: str) -> List[Dict[str, Any]]:
        ext = os.path.splitext(file_path)[1].lower()
        items = []

        if ext == ".csv":
            df = pd.read_csv(file_path)
            for _, row in df.iterrows():
                items.append({
                    "text": str(row["text"]),
                    "language": str(row.get("language", "auto")),
                    "emotion": str(row["emotion"]).lower().strip(),
                    "intensity": float(row.get("intensity", 0.5)),
                    "tone": str(row.get("tone", "natural"))
                })
        elif ext == ".json":
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for entry in data:
                    items.append({
                        "text": str(entry["text"]),
                        "language": str(entry.get("language", "auto")),
                        "emotion": str(entry["emotion"]).lower().strip(),
                        "intensity": float(entry.get("intensity", 0.5)),
                        "tone": str(entry.get("tone", "natural"))
                    })
        elif ext == ".jsonl":
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        items.append({
                            "text": str(entry["text"]),
                            "language": str(entry.get("language", "auto")),
                            "emotion": str(entry["emotion"]).lower().strip(),
                            "intensity": float(entry.get("intensity", 0.5)),
                            "tone": str(entry.get("tone", "natural"))
                        })
        else:
            raise ValueError(f"Unsupported file format: {ext}. Supported formats: .csv, .json, .jsonl")

        return items

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        text = item["text"]
        label = self.label_map.get(item["emotion"], 0)

        if self.tokenizer is not None:
            encoding = self.tokenizer(
                text,
                truncation=True,
                padding="max_length",
                max_length=self.max_length,
                return_tensors="pt"
            )
            return {
                "input_ids": encoding["input_ids"].squeeze(0),
                "attention_mask": encoding["attention_mask"].squeeze(0),
                "label": torch.tensor(label, dtype=torch.long),
                "intensity": torch.tensor(item["intensity"], dtype=torch.float)
            }

        return {
            "text": text,
            "label": label,
            "emotion": item["emotion"],
            "intensity": item["intensity"]
        }
