#!/usr/bin/env python3
"""Score live seller-generator rows with the trained Upay risk model."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from new_model.seller_risk_model import RiskScorer


def main() -> None:
    model_path = sys.argv[1]
    records = json.load(sys.stdin)
    scorer = RiskScorer.load(model_path)
    predictions = scorer.score_records(records)
    json.dump(predictions, sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    main()
