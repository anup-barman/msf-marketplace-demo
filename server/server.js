const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();
const port = process.env.PORT || 4000;
const csvPath = path.join(
  __dirname,
  "..",
  "fake_marketplace_dataset_full_features.csv",
);

app.use(cors());
app.use(express.json());

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function normalize(value, minimum, maximum) {
  if (maximum === minimum) return 0;
  return (value - minimum) / (maximum - minimum);
}

function offerScore(
  row,
  priceMin,
  priceMax,
  deliveryMin,
  deliveryMax,
  maxWarranty,
  maxReturn,
  maxTxn,
) {
  const price = Number(row.price_bdt) + Number(row.shipping_cost_bdt);
  const delivery = Number(row.delivery_time_days);
  const warranty = Number(row.warranty_days);
  const returnPolicy = Number(row.return_policy_days);
  const stock = Number(row.stock_available) === 1 ? 1 : 0;
  const rating = Number(row.all_time_rating) / 5;
  const refund = 1 - Number(row.refund_rate) / 12;
  const txn = Number(row.transaction_count);
  const sellerAge = Number(row.seller_age_days);

  const priceScore = 1 - normalize(price, priceMin, priceMax);
  const deliveryScore = 1 - normalize(delivery, deliveryMin, deliveryMax);
  const warrantyScore =
    maxWarranty > 0 ? Math.min(warranty / maxWarranty, 1) : 0;
  const returnScore = maxReturn > 0 ? Math.min(returnPolicy / maxReturn, 1) : 0;
  const stockScore = stock;
  const ratingScore = rating;
  const refundScore = clamp(refund, 0, 1);
  const experienceScore = maxTxn > 0 ? Math.log1p(txn) / Math.log1p(maxTxn) : 0;
  const sellerAgeScore = Math.min(sellerAge / 2991, 1);

  return (
    0.3 * priceScore +
    0.15 * deliveryScore +
    0.1 * warrantyScore +
    0.1 * returnScore +
    0.1 * stockScore +
    0.1 * ratingScore +
    0.05 * refundScore +
    0.05 * experienceScore +
    0.05 * sellerAgeScore
  );
}

function loadOffers() {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push({
          ...row,
          seller_id: Number(row.seller_id),
          platform_id: Number(row.platform_id),
          seller_age_days: Number(row.seller_age_days),
          transaction_count: Number(row.transaction_count),
          refund_rate: Number(row.refund_rate),
          all_time_rating: Number(row.all_time_rating),
          product_id: Number(row.product_id),
          price_bdt: Number(row.price_bdt),
          product_average_price_bdt: Number(row.product_average_price_bdt),
          price_deviation_percent: Number(row.price_deviation_percent),
          shipping_cost_bdt: Number(row.shipping_cost_bdt),
          delivery_time_days: Number(row.delivery_time_days),
          warranty_days: Number(row.warranty_days),
          return_policy_days: Number(row.return_policy_days),
          stock_available: Number(row.stock_available),
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function compareAgainstBaseOffer(
  rows,
  productId,
  baseSellerId,
  scoreThreshold = 0.03,
) {
  const productOffers = rows.filter(
    (row) => row.product_id === Number(productId),
  );

  if (!productOffers.length) {
    return {
      product_id: Number(productId),
      base_seller_id: Number(baseSellerId),
      base_offer: null,
      recommended_offers: [],
    };
  }

  const baseOffer = productOffers.find(
    (row) => row.seller_id === Number(baseSellerId),
  );

  if (!baseOffer) {
    return {
      product_id: Number(productId),
      base_seller_id: Number(baseSellerId),
      base_offer: null,
      recommended_offers: [],
    };
  }

  const prices = productOffers.map(
    (row) => Number(row.price_bdt) + Number(row.shipping_cost_bdt),
  );
  const deliveryTimes = productOffers.map((row) =>
    Number(row.delivery_time_days),
  );
  const warranties = productOffers.map((row) => Number(row.warranty_days));
  const returnDays = productOffers.map((row) => Number(row.return_policy_days));
  const maxTxn = Math.max(
    ...productOffers.map((row) => Number(row.transaction_count)),
  );

  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const deliveryMin = Math.min(...deliveryTimes);
  const deliveryMax = Math.max(...deliveryTimes);
  const maxWarranty = Math.max(...warranties);
  const maxReturn = Math.max(...returnDays);

  const baseTotal =
    Number(baseOffer.price_bdt) + Number(baseOffer.shipping_cost_bdt);
  const baseScore = offerScore(
    baseOffer,
    priceMin,
    priceMax,
    deliveryMin,
    deliveryMax,
    maxWarranty,
    maxReturn,
    maxTxn,
  );

  const alternatives = productOffers
    .filter((row) => row.seller_id !== Number(baseSellerId))
    .map((row) => {
      const candidateScore = offerScore(
        row,
        priceMin,
        priceMax,
        deliveryMin,
        deliveryMax,
        maxWarranty,
        maxReturn,
        maxTxn,
      );
      const candidateTotal =
        Number(row.price_bdt) + Number(row.shipping_cost_bdt);
      const isBetter =
        candidateScore > baseScore + scoreThreshold &&
        candidateTotal <= baseTotal;

      if (!isBetter) return null;

      return {
        seller_id: row.seller_id,
        total_cost_bdt: Number(candidateTotal.toFixed(2)),
        price_bdt: Number(row.price_bdt),
        shipping_cost_bdt: Number(row.shipping_cost_bdt),
        delivery_time_days: Number(row.delivery_time_days),
        warranty_days: Number(row.warranty_days),
        return_policy_days: Number(row.return_policy_days),
        stock_available: Number(row.stock_available),
        score: Number(candidateScore.toFixed(4)),
        score_gap: Number((candidateScore - baseScore).toFixed(4)),
        reason: {
          lower_total_cost: candidateTotal < baseTotal,
          better_delivery:
            Number(row.delivery_time_days) <
            Number(baseOffer.delivery_time_days),
          better_warranty:
            Number(row.warranty_days) > Number(baseOffer.warranty_days),
          better_return_policy:
            Number(row.return_policy_days) >
            Number(baseOffer.return_policy_days),
          in_stock: Number(row.stock_available) === 1,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    product_id: Number(productId),
    base_seller_id: Number(baseSellerId),
    base_offer: {
      seller_id: baseOffer.seller_id,
      price_bdt: Number(baseOffer.price_bdt),
      shipping_cost_bdt: Number(baseOffer.shipping_cost_bdt),
      total_cost_bdt: Number(baseTotal.toFixed(2)),
      delivery_time_days: Number(baseOffer.delivery_time_days),
      warranty_days: Number(baseOffer.warranty_days),
      return_policy_days: Number(baseOffer.return_policy_days),
      stock_available: Number(baseOffer.stock_available),
      score: Number(baseScore.toFixed(4)),
    },
    recommended_offers: alternatives,
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Marketplace API is running" });
});

app.get("/api/recommendation/random", async (req, res) => {
  try {
    const rows = await loadOffers();
    const productIds = [...new Set(rows.map((row) => row.product_id))];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const productOffers = rows.filter((row) => row.product_id === productId);
    const baseOffer =
      productOffers[Math.floor(Math.random() * productOffers.length)];

    const result = compareAgainstBaseOffer(
      rows,
      productId,
      baseOffer.seller_id,
    );
    res.json(result);
  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ message: "Failed to generate recommendation" });
  }
});

app.get("/api/recommendation", async (req, res) => {
  try {
    const { productId, baseSellerId } = req.query;

    if (!productId || !baseSellerId) {
      return res
        .status(400)
        .json({ message: "productId and baseSellerId are required" });
    }

    const rows = await loadOffers();
    const result = compareAgainstBaseOffer(
      rows,
      Number(productId),
      Number(baseSellerId),
    );
    res.json(result);
  } catch (error) {
    console.error("Error comparing offers:", error);
    res.status(500).json({ message: "Failed to compare offers" });
  }
});

app.listen(port, () => {
  console.log(`Marketplace backend running on http://localhost:${port}`);
});
