"""Generate labelled synthetic marketplace listings without third-party packages.

Examples:
  python3 generate_seller_dataset.py --rows 100000 --seed 7 --out risk_training.csv
  python3 generate_seller_dataset.py --rows 3000 --seed 11 --out store_listings.csv
"""
import argparse
import csv
import math
import random

PRODUCTS = {
    "Mobile Phone": ("MOB", 3.5, [12000, 22000, 38000, 65000, 140000]),
    "Laptop": ("LAP", 4.0, [38000, 55000, 80000, 120000, 190000]),
    "Smart TV": ("TV", 3.0, [22000, 35000, 55000, 90000, 180000]),
    "Desktop Computer": ("PC", 3.0, [30000, 45000, 65000, 95000, 160000]),
    "Digital Camera": ("CAM", 2.5, [35000, 55000, 80000, 100000, 180000]),
    "Gaming Console": ("CON", 2.5, [38000, 52000, 62000, 78000, 95000]),
    "Wireless Earbuds": ("EAR", 5.0, [1200, 2500, 5500, 12000, 28000]),
    "Bluetooth Speaker": ("SPK", 4.0, [1500, 3500, 7000, 14000, 30000]),
    "Power Bank": ("PWR", 4.5, [1100, 1800, 3000, 4800, 8500]),
    "Smartwatch": ("WCH", 4.5, [2000, 4500, 9000, 22000, 45000]),
    "Wi-Fi Router": ("RTR", 3.0, [1800, 3200, 5500, 9500, 16000]),
}
HIGH_VALUE = ["Mobile Phone", "Laptop", "Smart TV", "Digital Camera", "Gaming Console"]
FIELDS = ["seller_id", "seller_scale", "product_name", "model_id", "seller_txn_count", "txn_last_30d", "seller_account_age_months", "order_success_rate_pct", "refund_rate_pct", "late_delivery_rate_pct", "avg_response_time_hours", "complaint_report_count", "cod_order_share_pct", "seller_verified", "authorized_dealer", "product_condition", "warranty_months", "listing_age_days", "stock_quantity", "product_issue_rate_pct", "review_count_all_time", "review_count_last_30d", "product_rating_all_time", "product_rating_last_30d", "recommend_to_others", "verified_purchase_review_pct", "early_review_burst_pct", "model_avg_price_bdt", "price_deviation_pct", "product_price_bdt", "price_percentile_within_model", "is_suspicious_listing"]

def clip(value, low, high): return max(low, min(value, high))
def pick(rng, values, weights=None): return rng.choices(values, weights=weights, k=1)[0] if weights else rng.choice(values)
def poisson(rng, mean):
    if mean <= 0: return 0
    if mean > 30: return max(0, round(rng.gauss(mean, math.sqrt(mean))))
    product, limit, count = 1.0, math.exp(-mean), 0
    while product > limit:
        count, product = count + 1, product * rng.random()
    return count - 1

def seller(rng, number):
    scale = pick(rng, ["small", "medium", "big"], [.78, .17, .05]); shady = scale == "small" and rng.random() < .09; sophisticated = shady and rng.random() < .30
    if shady: age, tx, quality = (rng.randint(4, 12) if sophisticated else rng.randint(1, 5)), (rng.randint(40, 300) if sophisticated else rng.randint(3, 59)), (rng.betavariate(4, 3) if sophisticated else rng.betavariate(1.5, 5))
    elif scale == "small": age, tx, quality = int(clip(rng.gammavariate(2, 9)+1, 1, 96)), int(clip(rng.lognormvariate(math.log(120), .8), 5, 700)), rng.betavariate(4.5, 2)
    elif scale == "medium": age, tx, quality = int(clip(rng.gauss(42,16),10,120)), int(clip(rng.lognormvariate(math.log(1600),.5),500,6000)), rng.betavariate(6,2)
    else: age, tx, quality = int(clip(rng.gauss(75,25),30,180)), int(clip(rng.lognormvariate(math.log(16000),.5),5000,80000)), rng.betavariate(9,2)
    success = clip(99.5-22*(1-quality)**1.2+rng.gauss(0,25/math.sqrt(tx)),40,100); refund = clip(.5+12*(1-quality)**1.3+rng.gauss(0,10/math.sqrt(tx)),.1,40); late = clip(1+14*(1-quality)**1.3+rng.gauss(0,8/math.sqrt(tx)),0,60)
    response = clip(rng.lognormvariate(math.log(.8+9*(1-quality)),.4),.1,72); tx30 = int(tx*(rng.uniform(.4,.7) if sophisticated else rng.uniform(.6,1) if shady else min(1,rng.lognormvariate(0,.3)/max(age,1))))
    verified = int(rng.random() < ((.3 if sophisticated else .05) if shady else {"small":.45,"medium":.85,"big":.98}[scale])); authorized = int(not shady and rng.random() < {"small":.04,"medium":.20,"big":.60}[scale])
    cod = clip(rng.gauss(35 if sophisticated else 20,12) if shady else rng.gauss(*{"small":(55,15),"medium":(45,12),"big":(35,10)}[scale]),0,95); complaints = poisson(rng, tx*(.0004+.010*(1-quality)**2)*(4 if shady else 1))
    products = rng.sample(HIGH_VALUE if shady else list(PRODUCTS), k=rng.randint(1,3) if shady else {"small":rng.randint(1,3),"medium":rng.randint(2,6),"big":rng.randint(6,11)}[scale])
    return dict(id=f"S{number:05d}",scale=scale,shady=shady,sophisticated=sophisticated,age=age,tx=tx,tx30=tx30,quality=quality,success=success,refund=refund,late=late,response=response,complaints=complaints,cod=cod,verified=verified,authorized=authorized,products=products)

def listing(rng, s, product, index, offset):
    prefix, base_issue, prices = PRODUCTS[product]; average = prices[index]; quality = clip(s["quality"]+rng.gauss(0,.05),.01,.99); shady, scale = s["shady"], s["scale"]
    issue = clip(base_issue+offset+9*(1-quality)**1.2+rng.gauss(0,1),.2,35); condition = "new" if s["authorized"] else (pick(rng,["new","refurbished","used"],{"small":[.84,.10,.06],"medium":[.92,.06,.02],"big":[.98,.02,0]}[scale]) if not shady else pick(rng,["new","refurbished"],[.8,.2]))
    warranty = pick(rng,[0,3,6,12],[.65,.20,.10,.05] if shady else ([0,.05,.15,.80] if s["authorized"] else [.20,.15,.25,.40])); mean, sd = {"small":(0,4),"medium":(-1.5,3.5),"big":(-2.5,3)}[scale]; deviation = clip(rng.gauss(mean,sd),-10,10)
    if shady and rng.random() < (.6 if s["sophisticated"] else .85): deviation = -rng.uniform(12,35 if s["sophisticated"] else 70)
    elif not shady and condition != "new": deviation = -rng.uniform(12,55)
    elif not shady and rng.random() < .03: deviation = rng.uniform(-45,40)
    price = max(10,round(average*(1+deviation/100)/(10 if average<10000 else 50))*(10 if average<10000 else 50)); deviation = round((price/average-1)*100,2)
    reviews = rng.randint(8,69) if shady and rng.random()<.5 else poisson(rng,s["tx"]/max(1,len(s["products"]))*rng.uniform(.05,.18)); reviews30 = min(reviews,round(reviews*clip(s["tx30"]/max(s["tx"],1)*2.5*rng.lognormvariate(0,.2),0,1)))
    rating = "" if reviews == 0 else round(clip((rng.gauss(4.75,.15) if shady else 5-3.2*(1-quality)-.04*issue+rng.gauss(0,.2)),1,5),2); recent = "" if not reviews30 else round(clip(float(rating)-(rng.uniform(.2,2) if shady else rng.gauss(0,.2)),1,5),2)
    verified_reviews = "" if not reviews else round(rng.uniform(8,75) if shady else clip(97-10*(1-quality)+rng.gauss(0,4),5,100),2); burst = "" if not reviews else round(rng.uniform(30,90) if shady else rng.betavariate(2,14)*100,2)
    age = rng.randint(1,59) if shady else max(1,round(min(rng.lognormvariate(math.log(150),1),s["age"]*30))); stock = rng.randint(60,400) if shady and rng.random()<.8 else max(1,round(rng.lognormvariate(math.log({"small":6,"medium":25,"big":90}[scale]),.6)))
    return [s["id"],scale,product,f"{prefix}-M{index+1}",s["tx"],s["tx30"],s["age"],round(s["success"],2),round(s["refund"],2),round(s["late"],2),round(s["response"],1),s["complaints"],round(s["cod"],1),s["verified"],s["authorized"],condition,warranty,age,stock,round(issue,2),reviews,reviews30,rating,recent,"Yes" if rating != "" and float(rating)>=3.6 else "No",verified_reviews,burst,average,deviation,price,"",int(shady)]

def generate(rows, seed, output):
    rng, data, number = random.Random(seed), [], 0; offsets = {(p,i):clip(rng.gauss(0,.8),-1.5,1.5) for p in PRODUCTS for i in range(5)}
    while len(data) < rows:
        number += 1; s = seller(rng,number)
        for product in s["products"]:
            for index in rng.sample(range(5),k=rng.randint(1,3)):
                data.append(listing(rng,s,product,index,offsets[(product,index)]))
                if len(data) == rows: break
            if len(data) == rows: break
    rng.shuffle(data); model_prices = {}
    for row in data: model_prices.setdefault(row[3],[]).append(row[29])
    percentile_by_price = {}
    for model, prices in model_prices.items():
        values, ranks = sorted(prices), {}
        for position, price in enumerate(values, start=1): ranks[price] = position
        percentile_by_price[model] = {price: round(100 * rank / len(values), 1) for price, rank in ranks.items()}
    for row in data: row[30] = percentile_by_price[row[3]][row[29]]
    with open(output,"w",newline="",encoding="utf-8") as file:
        writer = csv.writer(file); writer.writerow(FIELDS); writer.writerows(data)
    print(f"Saved {len(data)} rows x {len(FIELDS)} columns to {output}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(); parser.add_argument("--rows",type=int,default=1000); parser.add_argument("--seed",type=int,default=42); parser.add_argument("--out",default="seller_dataset.csv"); args = parser.parse_args(); generate(args.rows,args.seed,args.out)
