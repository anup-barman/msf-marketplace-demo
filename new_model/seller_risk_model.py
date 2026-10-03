"""
Seller risk scoring: training, evaluation and inference in one module.

Model: histogram gradient boosting (handles NaN + categoricals natively), wrapped in
seller-grouped isotonic calibration so predicted probabilities are real probabilities.
Score = round(100 * P(suspicious)); bands: 0-34 low, 35-66 medium, 67-100 high.

CLI
    python seller_risk_model.py train --train train.csv --test test.csv --out risk_model.joblib
    python seller_risk_model.py score --model risk_model.joblib --input new.csv --out scored.csv [--by-seller max]

Backend
    from seller_risk_model import RiskScorer
    scorer = RiskScorer.load("risk_model.joblib")      # once, at startup
    scorer.score_records([{...listing fields...}])      # -> [{"risk_score": 12, "risk_band": "low", ...}]
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
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".venv", "bin", "python")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")),
        "/home/anup/ML/.venv/bin/python",
    ]:
        if os.path.exists(candidate) and sys.executable != candidate:
            os.execv(candidate, [candidate] + sys.argv)
    raise

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

MODEL_VERSION = "1.0"
TARGET = "is_suspicious_listing"
GROUP = "seller_id"

CATEGORICAL = ["seller_scale", "product_name", "product_condition"]
NUMERIC = [
    "seller_txn_count", "txn_last_30d", "seller_account_age_months",
    "order_success_rate_pct", "refund_rate_pct", "late_delivery_rate_pct",
    "avg_response_time_hours", "complaint_report_count", "cod_order_share_pct",
    "seller_verified", "authorized_dealer", "warranty_months", "listing_age_days",
    "stock_quantity", "product_issue_rate_pct", "review_count_all_time",
    "review_count_last_30d", "product_rating_all_time", "product_rating_last_30d",
    "recommend_to_others", "verified_purchase_review_pct", "early_review_burst_pct",
    "price_deviation_pct", "product_price_bdt",
]
# Brand-new sellers legitimately have no reviews, so these may be absent or NaN at inference.
OPTIONAL = {
    "review_count_all_time", "review_count_last_30d", "product_rating_all_time",
    "product_rating_last_30d", "recommend_to_others", "verified_purchase_review_pct",
    "early_review_burst_pct",
}
FEATURES = CATEGORICAL + NUMERIC
# NOT used on purpose: seller_id/model_id (identifiers), model_avg_price_bdt (redundant with
# product + model), price_percentile_within_model (needs the whole dataset, unavailable per request).

LOW_MAX, MEDIUM_MAX = 34, 66


def to_band(score):
    """Vectorised score (0-100) -> 'low' / 'medium' / 'high'."""
    return pd.cut(pd.Series(score), bins=[-1, LOW_MAX, MEDIUM_MAX, 100],
                  labels=["low", "medium", "high"]).astype(str).to_numpy()


# ----------------------------------------------------------------------------
# Features and model
# ----------------------------------------------------------------------------
def prepare(df: pd.DataFrame) -> pd.DataFrame:
    """Validate columns and return a clean feature frame in the exact training order."""
    missing = [c for c in FEATURES if c not in df.columns and c not in OPTIONAL]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    X = df.reindex(columns=FEATURES).copy()
    if "recommend_to_others" in X.columns:
        X["recommend_to_others"] = (
            X["recommend_to_others"]
            .map({"Yes": 1, "No": 0, "yes": 1, "no": 0, 1: 1, 0: 0, 1.0: 1, 0.0: 0})
            .fillna(pd.to_numeric(X["recommend_to_others"], errors="coerce"))
        )
    for c in NUMERIC:
        X[c] = pd.to_numeric(X[c], errors="coerce")
    for c in CATEGORICAL:
        X[c] = X[c].astype(object).where(X[c].notna(), np.nan)
    return X


def build_pipeline(seed: int = 42) -> Pipeline:
    pre = ColumnTransformer(
        [("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=np.nan),
          CATEGORICAL)],
        remainder="passthrough", verbose_feature_names_out=False,
    )
    gbm = HistGradientBoostingClassifier(
        learning_rate=0.06, max_iter=500, max_leaf_nodes=31, min_samples_leaf=40,
        l2_regularization=1.0, early_stopping=True, validation_fraction=0.1,
        n_iter_no_change=25, categorical_features=list(range(len(CATEGORICAL))),
        random_state=seed,
    )
    return Pipeline([("prep", pre), ("gbm", gbm)])


def train(df: pd.DataFrame, n_splits: int = 5, seed: int = 42):
    """Fit + calibrate. Calibration folds are split by seller, so no seller leaks across folds."""
    X, y = prepare(df), df[TARGET].astype(int).to_numpy()
    splits = list(GroupKFold(n_splits=n_splits).split(X, y, groups=df[GROUP]))
    model = CalibratedClassifierCV(build_pipeline(seed), method="isotonic", cv=splits)
    return model.fit(X, y)


# ----------------------------------------------------------------------------
# Evaluation
# ----------------------------------------------------------------------------
def evaluate(model, df: pd.DataFrame) -> dict:
    p = model.predict_proba(prepare(df))[:, 1]
    y = df[TARGET].astype(int).to_numpy()
    score = np.rint(p * 100).astype(int)
    band = to_band(score)
    out = {
        "rows": int(len(df)),
        "positive_rate": round(float(y.mean()), 4),
        "roc_auc": round(float(roc_auc_score(y, p)), 4),
        "pr_auc": round(float(average_precision_score(y, p)), 4),
        "brier": round(float(brier_score_loss(y, p)), 4),
        "bands": {},
    }
    for b in ["low", "medium", "high"]:
        m = band == b
        out["bands"][b] = {
            "rows": int(m.sum()),
            "share": round(float(m.mean()), 4),
            "actual_suspicious_rate": round(float(y[m].mean()), 4) if m.any() else None,
        }
    pos = y == 1
    out["recall_in_high"] = round(float((band[pos] == "high").mean()), 4)
    out["recall_in_medium_or_high"] = round(float((band[pos] != "low").mean()), 4)
    return out


# ----------------------------------------------------------------------------
# Inference (import this in the backend)
# ----------------------------------------------------------------------------
class RiskScorer:
    def __init__(self, model, meta: dict):
        self.model, self.meta = model, meta

    @classmethod
    def load(cls, path):
        art = joblib.load(path)
        return cls(art["model"], {k: v for k, v in art.items() if k != "model"})

    def score_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Per-listing scores; same index as the input."""
        p = self.model.predict_proba(prepare(df))[:, 1]
        score = np.rint(p * 100).astype(int)
        return pd.DataFrame({"risk_probability": p.round(4), "risk_score": score,
                             "risk_band": to_band(score)}, index=df.index)

    def score_records(self, records: list) -> list:
        """list[dict] in, list[dict] out - convenient for API handlers."""
        df = pd.DataFrame.from_records(records)
        res = self.score_df(df)
        return res.to_dict(orient="records")

    def score_sellers(self, df: pd.DataFrame, agg: str = "max") -> pd.DataFrame:
        """One score per seller. agg='max' flags a seller if any listing looks bad."""
        if agg not in ("max", "mean"):
            raise ValueError("agg must be 'max' or 'mean'")
        s = self.score_df(df).assign(**{GROUP: df[GROUP].to_numpy()})
        g = s.groupby(GROUP)["risk_probability"].agg(agg).rename("risk_probability").to_frame()
        g["n_listings"] = s.groupby(GROUP).size()
        g["risk_score"] = np.rint(g["risk_probability"] * 100).astype(int)
        g["risk_band"] = to_band(g["risk_score"])
        return g.reset_index()


# ----------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------
def _cmd_train(a):
    df = pd.read_csv(a.train)
    t0 = time.time()
    if a.test:
        test = pd.read_csv(a.test)
        model = train(df, seed=a.seed)
    else:   # no test file: hold out 20% of sellers, then refit on everything
        tr, te = next(GroupShuffleSplit(1, test_size=0.2, random_state=a.seed)
                      .split(df, groups=df[GROUP]))
        test = df.iloc[te]
        model = train(df.iloc[tr], seed=a.seed)
    metrics = evaluate(model, test)
    if not a.test:
        model = train(df, seed=a.seed)
    metrics["train_rows"] = int(len(df))
    metrics["train_seconds"] = round(time.time() - t0, 1)
    joblib.dump({"model": model, "features": FEATURES, "version": MODEL_VERSION,
                 "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "metrics": metrics,
                 "bands": {"low": [0, LOW_MAX], "medium": [LOW_MAX + 1, MEDIUM_MAX],
                           "high": [MEDIUM_MAX + 1, 100]}}, a.out, compress=3)
    Path(str(a.out) + ".metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))
    print(f"Saved model -> {a.out}")


def _cmd_score(a):
    scorer = RiskScorer.load(a.model)
    df = pd.read_csv(a.input)
    scored_df = scorer.score_df(df)
    out = scorer.score_sellers(df, a.by_seller) if a.by_seller else df.join(scored_df)
    out.to_csv(a.out, index=False)
    print(f"Scored {len(out)} rows -> {a.out}")
    if getattr(a, "json_out", None):
        listings = {}
        for idx, row in df.iterrows():
            seller_id = int(str(row["seller_id"]).replace("S", ""))
            listing_id = f"item_{row['model_id']}_{seller_id}"
            score = int(scored_df.loc[idx, "risk_score"])
            prob = float(scored_df.loc[idx, "risk_probability"])
            band = str(scored_df.loc[idx, "risk_band"])
            level = band.capitalize()
            listings[listing_id] = {
                "score": score,
                "level": level,
                "risk_band": band,
                "suspicious_probability": prob,
            }
        payload = {
            "model": {
                "type": "HistGradientBoostingClassifier",
                "version": scorer.meta.get("version", MODEL_VERSION),
                "training_rows": scorer.meta.get("metrics", {}).get("train_rows", 100000),
                "metrics": scorer.meta.get("metrics", {}),
                "bands": scorer.meta.get(
                    "bands",
                    {
                        "low": [0, LOW_MAX],
                        "medium": [LOW_MAX + 1, MEDIUM_MAX],
                        "high": [MEDIUM_MAX + 1, 100],
                    },
                ),
            },
            "listings": listings,
        }
        with open(a.json_out, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"Saved {len(listings)} scores to JSON -> {a.json_out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("train")
    t.add_argument("--train", required=True)
    t.add_argument("--test")
    t.add_argument("--out", default="risk_model.joblib")
    t.add_argument("--seed", type=int, default=42)
    t.set_defaults(fn=_cmd_train)
    s = sub.add_parser("score")
    s.add_argument("--model", required=True)
    s.add_argument("--input", required=True)
    s.add_argument("--out", default="scored.csv")
    s.add_argument("--json-out", help="Path to write JSON risk-scores for store backend")
    s.add_argument("--by-seller", choices=["max", "mean"])
    s.set_defaults(fn=_cmd_score)
    args = ap.parse_args()
    args.fn(args)
