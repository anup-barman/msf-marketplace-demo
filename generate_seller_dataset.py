"""Generate labelled synthetic marketplace listings without third-party packages.

Uses a continuous latent seller risk score r in [0, 1] instead of a binary shady/not-shady
flag, so review rates, price deviations, and all signals overlap realistically between classes.
The is_suspicious_listing label is drawn probabilistically from a logistic function of
listing-level risk — producing a broad 0-100 model score distribution after training.

Examples:
  python3 generate_seller_dataset.py --rows 100000 --seed 42 --out risk_training_100000.csv
  python3 generate_seller_dataset.py --rows 3000  --seed 1337 --out store_listings_3000.csv --drop-target
"""
import argparse
import csv
import math
import random

PRODUCTS = {
    "Mobile Phone":     ("MOB", 3.5, [12000, 22000, 38000, 65000, 140000]),
    "Laptop":           ("LAP", 4.0, [38000, 55000, 80000, 120000, 190000]),
    "Smart TV":         ("TV",  3.0, [22000, 35000, 55000, 90000, 180000]),
    "Desktop Computer": ("PC",  3.0, [30000, 45000, 65000, 95000, 160000]),
    "Digital Camera":   ("CAM", 2.5, [35000, 55000, 80000, 100000, 180000]),
    "Gaming Console":   ("CON", 2.5, [38000, 52000, 62000, 78000, 95000]),
    "Wireless Earbuds": ("EAR", 5.0, [1200, 2500, 5500, 12000, 28000]),
    "Bluetooth Speaker":("SPK", 4.0, [1500, 3500, 7000, 14000, 30000]),
    "Power Bank":       ("PWR", 4.5, [1100, 1800, 3000, 4800, 8500]),
    "Smartwatch":       ("WCH", 4.5, [2000, 4500, 9000, 22000, 45000]),
    "Wi-Fi Router":     ("RTR", 3.0, [1800, 3200, 5500, 9500, 16000]),
}
FIELDS = [
    "seller_id", "seller_scale", "product_name", "model_id",
    "seller_txn_count", "txn_last_30d", "seller_account_age_months",
    "order_success_rate_pct", "refund_rate_pct", "late_delivery_rate_pct",
    "avg_response_time_hours", "complaint_report_count", "cod_order_share_pct",
    "seller_verified", "authorized_dealer", "product_condition",
    "warranty_months", "listing_age_days", "stock_quantity",
    "product_issue_rate_pct", "review_count_all_time", "review_count_last_30d",
    "product_rating_all_time", "product_rating_last_30d", "recommend_to_others",
    "verified_purchase_review_pct", "early_review_burst_pct",
    "model_avg_price_bdt", "price_deviation_pct", "product_price_bdt",
    "price_percentile_within_model", "is_suspicious_listing",
]


def clip(value, low, high):
    return max(low, min(value, high))


def pick(rng, values, weights=None):
    return rng.choices(values, weights=weights, k=1)[0] if weights else rng.choice(values)


def poisson(rng, mean):
    if mean <= 0:
        return 0
    if mean > 30:
        return max(0, round(rng.gauss(mean, math.sqrt(mean))))
    product, limit, count = 1.0, math.exp(-mean), 0
    while product > limit:
        count, product = count + 1, product * rng.random()
    return count - 1


def seller(rng, number):
    """
    Draw a seller with a continuous latent risk score r in [0, 1].

    r ~ 0.05-0.20  → trusted / established seller
    r ~ 0.25-0.50  → borderline / careless seller
    r ~ 0.55-0.95  → fraudulent / bad-faith seller

    All observable features (age, tx, review metrics, price) depend smoothly
    on r so that class distributions overlap and the model learns a gradient.
    """
    scale = pick(rng, ["small", "medium", "big"], [0.78, 0.17, 0.05])

    # Continuous latent risk — most sellers cluster low, a tail goes high
    if scale == "small":
        r = rng.betavariate(1.5, 4.0)          # mean ≈ 0.27, wide spread
        if rng.random() < 0.08:                 # ~8 % outright bad actors
            r = clip(rng.betavariate(4.0, 1.5), 0.60, 0.98)
    elif scale == "medium":
        r = rng.betavariate(1.2, 6.0)          # mean ≈ 0.17
    else:
        r = rng.betavariate(0.9, 9.0)          # mean ≈ 0.09

    quality = clip(1.0 - r + rng.gauss(0.0, 0.05), 0.02, 0.98)

    # Observable seller metrics depend smoothly on r
    if scale == "small":
        age = int(clip(rng.gammavariate(2, 9) * (1 - 0.45 * r) + 1, 1, 96))
        tx  = int(clip(rng.lognormvariate(math.log(120), 0.8) * (1 - 0.55 * r), 5, 700))
    elif scale == "medium":
        age = int(clip(rng.gauss(42, 16), 10, 120))
        tx  = int(clip(rng.lognormvariate(math.log(1600), 0.5), 500, 6000))
    else:
        age = int(clip(rng.gauss(75, 25), 30, 180))
        tx  = int(clip(rng.lognormvariate(math.log(16000), 0.5), 5000, 80000))

    success  = clip(99.5 - 20 * (1 - quality)**1.2 + rng.gauss(0, 15 / math.sqrt(max(tx, 1))), 45, 100)
    refund   = clip(0.5  + 14 * (1 - quality)**1.3 + rng.gauss(0,  8 / math.sqrt(max(tx, 1))), 0.1, 40)
    late     = clip(1.0  + 16 * (1 - quality)**1.3 + rng.gauss(0,  6 / math.sqrt(max(tx, 1))), 0, 60)
    response = clip(rng.lognormvariate(math.log(0.8 + 9 * (1 - quality)), 0.4), 0.1, 72)
    tx30     = int(tx * min(1.0, clip(0.08 + 0.65 * r + rng.uniform(-0.08, 0.15), 0.05, 1.0)))
    verified = int(rng.random() < clip({"small": 0.45, "medium": 0.85, "big": 0.98}[scale] * (1.15 - 0.85 * r), 0.05, 0.99))
    authorized = int(rng.random() < clip({"small": 0.04, "medium": 0.20, "big": 0.60}[scale] * (1.0 - r), 0, 0.8))
    cod = clip(rng.gauss(35 + 20 * (1 - quality), 12), 0, 95)
    complaints = poisson(rng, tx * (0.0004 + 0.012 * (1 - quality) ** 2))
    products = rng.sample(
        list(PRODUCTS),
        k={"small": rng.randint(1, 3), "medium": rng.randint(2, 6), "big": rng.randint(6, 11)}[scale],
    )
    return dict(
        id=f"S{number:05d}", scale=scale, r=r, quality=quality,
        age=age, tx=tx, tx30=tx30, success=success, refund=refund,
        late=late, response=response, complaints=complaints, cod=cod,
        verified=verified, authorized=authorized, products=products,
    )


def listing(rng, s, product, index, offset):
    prefix, base_issue, prices = PRODUCTS[product]
    average = prices[index]
    scale = s["scale"]
    r = s["r"]

    quality_l = clip(s["quality"] + rng.gauss(0, 0.04), 0.01, 0.99)
    issue = clip(base_issue + offset + 9 * (1 - quality_l) ** 1.2 + rng.gauss(0, 1), 0.2, 35)

    condition = "new" if s["authorized"] else pick(rng, ["new", "refurbished", "used"], [0.85, 0.10, 0.05])

    # Warranty — higher-risk sellers give less warranty
    warranty = pick(rng, [0, 3, 6, 12],
                    [clip(0.10 + 0.40 * r, 0.05, 0.70), 0.15, 0.25, clip(0.50 - 0.40 * r, 0.05, 0.75)])

    # Price deviation depends smoothly on r (riskier = deeper discounts to attract buyers)
    dev_mean = -2.0 - 24.0 * (r ** 1.4)
    deviation = clip(rng.gauss(dev_mean, 7 + 10 * r), -65, 35)
    price = max(10, round(average * (1 + deviation / 100) / (10 if average < 10000 else 50)) * (10 if average < 10000 else 50))
    deviation = round((price / average - 1) * 100, 2)

    reviews   = poisson(rng, s["tx"] / max(1, len(s["products"])) * rng.uniform(0.05, 0.18))
    reviews30 = min(reviews, round(reviews * clip(s["tx30"] / max(s["tx"], 1) * 2.5 * rng.lognormvariate(0, 0.2), 0, 1)))

    rating = ("" if reviews == 0 else
              round(clip(5 - 3.0 * (1 - quality_l) - 0.03 * issue + rng.gauss(0, 0.2), 1, 5), 2))
    recent = ("" if not reviews30 else
              round(clip(float(rating) - rng.gauss(0.1 + 0.25 * r, 0.2), 1, 5), 2))

    # Review credibility metrics are now Gaussian with overlapping tails
    verified_reviews = ("" if not reviews else
                        round(clip(96 - 55 * r + rng.gauss(0, 9), 10, 100), 2))
    burst = ("" if not reviews else
             round(clip(10 + 65 * r + rng.gauss(0, 10), 0, 95), 2))

    age_l = max(1, round(min(rng.lognormvariate(math.log(150), 1), s["age"] * 30)))
    stock = max(1, round(rng.lognormvariate(math.log({"small": 6, "medium": 25, "big": 90}[scale]), 0.6)))

    # Listing-level risk: blend of seller risk + per-listing price and review signals
    disc_penalty = max(0.0, -deviation / 50.0)
    ver_penalty  = max(0.0, (85.0 - (float(verified_reviews) if verified_reviews != "" else 75.0)) / 75.0)
    listing_r = clip(0.65 * r + 0.20 * disc_penalty + 0.15 * ver_penalty, 0.01, 0.99)

    # Probabilistic label via logistic function — no hard threshold
    p_suspicious = 1.0 / (1.0 + math.exp(-10.0 * (listing_r - 0.52)))
    is_suspicious = int(rng.random() < p_suspicious)

    return [
        s["id"], scale, product, f"{prefix}-M{index + 1}",
        s["tx"], s["tx30"], s["age"],
        round(s["success"], 2), round(s["refund"], 2), round(s["late"], 2),
        round(s["response"], 1), s["complaints"], round(s["cod"], 1),
        s["verified"], s["authorized"], condition, warranty,
        age_l, stock, round(issue, 2),
        reviews, reviews30, rating, recent,
        "Yes" if rating != "" and float(rating) >= 3.6 else "No",
        verified_reviews, burst,
        average, deviation, price, "",
        is_suspicious,
    ]


def generate(rows, seed, output, drop_target=False):
    rng, data, number = random.Random(seed), [], 0
    offsets = {(p, i): clip(rng.gauss(0, 0.8), -1.5, 1.5) for p in PRODUCTS for i in range(5)}
    while len(data) < rows:
        number += 1
        s = seller(rng, number)
        for product in s["products"]:
            for index in rng.sample(range(5), k=rng.randint(1, 3)):
                data.append(listing(rng, s, product, index, offsets[(product, index)]))
                if len(data) == rows:
                    break
            if len(data) == rows:
                break
    rng.shuffle(data)

    # Compute price_percentile_within_model
    model_prices = {}
    for row in data:
        model_prices.setdefault(row[3], []).append(row[29])
    percentile_by_price = {}
    for mdl, prices in model_prices.items():
        values, ranks = sorted(prices), {}
        for position, price in enumerate(values, start=1):
            ranks[price] = position
        percentile_by_price[mdl] = {price: round(100 * rank / len(values), 1) for price, rank in ranks.items()}
    for row in data:
        row[30] = percentile_by_price[row[3]][row[29]]

    fields = FIELDS[:-1] if drop_target else FIELDS
    rows_to_write = [row[:-1] for row in data] if drop_target else data
    with open(output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(fields)
        writer.writerows(rows_to_write)
    print(f"Saved {len(data)} rows x {len(fields)} columns to {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", default="seller_dataset.csv")
    parser.add_argument("--drop-target", action="store_true",
                        help="Omit the is_suspicious_listing target column")
    args = parser.parse_args()
    generate(args.rows, args.seed, args.out, drop_target=args.drop_target)
