"""Train a Gaussian naïve-Bayes seller-risk classifier and save it for the API."""
import argparse
import csv
import json
import math

NUMERIC = ["seller_txn_count", "txn_last_30d", "seller_account_age_months", "order_success_rate_pct", "refund_rate_pct", "late_delivery_rate_pct", "avg_response_time_hours", "complaint_report_count", "cod_order_share_pct", "seller_verified", "authorized_dealer", "warranty_months", "listing_age_days", "stock_quantity", "product_issue_rate_pct", "review_count_all_time", "review_count_last_30d", "product_rating_all_time", "product_rating_last_30d", "verified_purchase_review_pct", "early_review_burst_pct", "price_deviation_pct", "price_percentile_within_model"]
CATEGORICAL = ["product_condition", "recommend_to_others"]

def value(row, feature):
    raw = row.get(feature, "")
    if raw == "": return None
    number = float(raw)
    return math.log1p(number) if feature in {"seller_txn_count", "txn_last_30d", "complaint_report_count", "stock_quantity", "review_count_all_time", "review_count_last_30d"} else number

def train(path):
    counts = [0, 0]; sums = [{f: 0.0 for f in NUMERIC} for _ in range(2)]; squares = [{f: 0.0 for f in NUMERIC} for _ in range(2)]; observed = [{f: 0 for f in NUMERIC} for _ in range(2)]
    category_counts = [{f: {} for f in CATEGORICAL} for _ in range(2)]; category_values = {f: set() for f in CATEGORICAL}
    with open(path, newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            label = int(row["is_suspicious_listing"]); counts[label] += 1
            for feature in NUMERIC:
                number = value(row, feature)
                if number is not None: sums[label][feature] += number; squares[label][feature] += number * number; observed[label][feature] += 1
            for feature in CATEGORICAL:
                item = row.get(feature) or "missing"; category_values[feature].add(item); category_counts[label][feature][item] = category_counts[label][feature].get(item, 0) + 1
    numeric = {}
    for feature in NUMERIC:
        numeric[feature] = []
        for label in range(2):
            n = observed[label][feature]; mean = sums[label][feature] / n; variance = max((squares[label][feature] / n) - mean * mean, .0001)
            numeric[feature].append({"mean": mean, "variance": variance})
    return {"model_type": "gaussian_naive_bayes", "label": "is_suspicious_listing", "class_counts": counts, "numeric_features": numeric, "categorical_features": {feature: [category_counts[0][feature], category_counts[1][feature]] for feature in CATEGORICAL}, "categorical_values": {f: sorted(v) for f, v in category_values.items()}, "log_features": [f for f in NUMERIC if f in {"seller_txn_count", "txn_last_30d", "complaint_report_count", "stock_quantity", "review_count_all_time", "review_count_last_30d"}]}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--input", required=True); parser.add_argument("--out", default="server/risk-model.json"); args = parser.parse_args()
    model = train(args.input)
    with open(args.out, "w", encoding="utf-8") as file: json.dump(model, file, indent=2)
    print(f"Trained {model['model_type']} on {sum(model['class_counts'])} rows; suspicious class: {model['class_counts'][1]}")
