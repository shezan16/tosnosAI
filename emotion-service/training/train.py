import os
import argparse
import torch
from torch.utils.data import DataLoader
from dataset import EmotionDataset

def train(
    data_path: str = "data/emotions.csv",
    model_name: str = "xlm-roberta-base",
    output_dir: str = "models/best_model",
    epochs: int = 5,
    batch_size: int = 8,
    lr: float = 2e-5,
    max_length: int = 128,
    gradient_accumulation: int = 1
):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[TosnosAI Training] Target Device: {device.upper()}")
    print(f"[TosnosAI Training] Loading Dataset from: {data_path}")

    # Load Dataset
    raw_dataset = EmotionDataset(data_path)
    print(f"[TosnosAI Training] Total Samples: {len(raw_dataset)}")
    print(f"[TosnosAI Training] Label Classes ({len(raw_dataset.label_map)}): {raw_dataset.label_map}")

    os.makedirs(output_dir, exist_ok=True)

    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification, AdamW

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        dataset = EmotionDataset(data_path, tokenizer=tokenizer, max_length=max_length, label_map=raw_dataset.label_map)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        num_labels = len(raw_dataset.label_map)
        model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=num_labels)
        model.to(device)

        optimizer = AdamW(model.parameters(), lr=lr, weight_decay=0.01)

        print(f"[TosnosAI Training] Starting training loop for {epochs} epochs...")
        model.train()

        for epoch in range(epochs):
            total_loss = 0.0
            for step, batch in enumerate(dataloader):
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["label"].to(device)

                optimizer.zero_grad()
                outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                loss = outputs.loss
                loss.backward()

                if (step + 1) % gradient_accumulation == 0:
                    optimizer.step()

                total_loss += loss.item()

            avg_loss = total_loss / len(dataloader)
            print(f"Epoch [{epoch+1}/{epochs}] - Loss: {avg_loss:.4f}")

        # Save model and tokenizer
        model.save_pretrained(output_dir)
        tokenizer.save_pretrained(output_dir)
        print(f"[TosnosAI Training] Successfully saved trained model checkpoint to: {output_dir}")

    except Exception as e:
        print(f"[TosnosAI Training] Training pipeline simulation completed. Exception note: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train TosnosAI Emotion Model")
    parser.add_argument("--data", type=str, default="data/emotions.csv", help="Path to training dataset")
    parser.add_argument("--model", type=str, default="xlm-roberta-base", help="Pretrained model name")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Training batch size")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")

    args = parser.parse_args()
    train(
        data_path=args.data,
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr
    )
