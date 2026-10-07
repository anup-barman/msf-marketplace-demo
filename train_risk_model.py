"""Train the calibrated seller-risk model and score the store listing CSV.

The training CSV supplies labels. The store CSV is used only for inference; its
target column (if present) is ignored.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import sklearn
except ModuleNotFoundError:
    for candidate in [
        os.path.abspath(os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")),
        "/home/anup/ML/.venv/bin/python",
    ]:
        if os.path.exists(candidate) and sys.executable != candidate:
            os.execv(candidate, [candidate] + sys.argv)
    raise

import joblib
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from new_model.seller_risk_model import (
    FEATURES,
    GROUP,
    LOW_MAX,
    MEDIUM_MAX,
    MODEL_VERSION,
    RiskScorer,
    evaluate,
    train,
)


def main():
    parser = argparse.ArgumentParser(description="Train seller risk model and score store listings")
    parser.add_argument("--input", default="risk_training_100000.csv", help="Labelled training CSV")
    parser.add_argument("--store-input", default="data/store_listings_3000.csv", help="Store listing CSV to score")
    parser.add_argument("--model-out", default="data/risk_model.joblib", help="Joblib model output path")
    parser.add_argument("--model-json", default="data/risk-model.json", help="JSON model metadata output path")
    parser.add_argument("--scores-out", default="data/risk-scores.json", help="JSON risk scores output path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    print(f"Loading training data from {args.input}...")
    df_train = pd.read_csv(args.input)
    t0 = time.time()

    # 80/20 train/validation split by seller_id to prevent seller leakage
    tr, te = next(GroupShuffleSplit(1, test_size=0.2, random_state=args.seed).split(df_train, groups=df_train[GROUP]))
    val_df = df_train.iloc[te]
    print(f"Training calibrated HistGradientBoosting model on {len(tr)} rows (evaluating on {len(te)} holdout rows)...")
    val_model = train(df_train.iloc[tr], seed=args.seed)
    metrics = evaluate(val_model, val_df)
    print("Holdout evaluation metrics:")
    print(json.dumps(metrics, indent=2))

    print(f"Retraining final calibrated model on all {len(df_train)} rows...")
    final_model = train(df_train, seed=args.seed)
    metrics["train_rows"] = int(len(df_train))
    metrics["train_seconds"] = round(time.time() - t0, 1)

    bands = {
        "low": [0, LOW_MAX],
        "medium": [LOW_MAX + 1, MEDIUM_MAX],
        "high": [MEDIUM_MAX + 1, 100],
    }
    model_payload = {
        "model": final_model,
        "features": FEATURES,
        "version": MODEL_VERSION,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "metrics": metrics,
        "bands": bands,
    }

    # Save joblib model
    joblib.dump(model_payload, args.model_out, compress=3)
    print(f"Saved joblib model -> {args.model_out}")

    # Save model metadata JSON
    json_meta = {
        "type": "HistGradientBoostingClassifier",
        "version": MODEL_VERSION,
        "training_rows": int(len(df_train)),
        "metrics": metrics,
        "bands": bands,
        "features": FEATURES,
    }
    with open(args.model_json, "w", encoding="utf-8") as f:
        json.dump(json_meta, f, indent=2)
    print(f"Saved model metadata -> {args.model_json}")

    # Score store listings
    print(f"Scoring store listings from {args.store_input}...")
    store_df = pd.read_csv(args.store_input)
    scorer = RiskScorer(final_model, {k: v for k, v in model_payload.items() if k != "model"})
    scores_df = scorer.score_df(store_df)

    listings = {}
    for idx, row in store_df.iterrows():
        seller_id = int(str(row["seller_id"]).replace("S", ""))
        listing_id = f"item_{row['model_id']}_{seller_id}"
        score = int(scores_df.loc[idx, "risk_score"])
        prob = float(scores_df.loc[idx, "risk_probability"])
        band = str(scores_df.loc[idx, "risk_band"])
        level = band.capitalize()
        listings[listing_id] = {
            "score": score,
            "level": level,
            "risk_band": band,
            "suspicious_probability": prob,
        }

    scores_payload = {
        "model": json_meta,
        "listings": listings,
    }
    with open(args.scores_out, "w", encoding="utf-8") as f:
        json.dump(scores_payload, f, indent=2)
    print(f"Saved {len(listings)} scores -> {args.scores_out}")


if __name__ == "__main__":
    main()
