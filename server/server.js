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

// In-memory data store directly loaded from the CSV file
let allListings = [];
let listingsByProduct = {};
let productSummaries = [];
let userState = {
  name: "Nusrat Jahan",
  phone: "01700000000",
  balance: 55000.0,
  defaultPin: "1234",
};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

function normalize(value, minimum, maximum) {
  if (maximum === minimum) return 0;
  return (value - minimum) / (maximum - minimum);
}

// 1. Seller Risk Analysis (Low, Medium, or High)
// Evaluated from the CSV features: refund_rate, all_time_rating, seller_age_days, transaction_count, price_deviation_percent
function calculateRisk(row) {
  const refund = Number(row.refund_rate); // 1 - 12
  const rating = Number(row.all_time_rating); // 2 - 5
  const age = Number(row.seller_age_days); // 44 - 2991
  const tx = Number(row.transaction_count); // 32 - 9992
  const dev = Number(row.price_deviation_percent); // -70.9% to +68.99%

  // 1. Refund Rate penalty (0 to 35)
  const refundPenalty = (refund / 12) * 35;

  // 2. Rating penalty (0 to 30): rating 5 -> 0, rating 2 -> 30
  const ratingPenalty = ((5 - rating) / 3) * 30;

  // 3. Experience penalty (0 to 15): age and transactions
  const ageFactor = 1 - Math.min(age / 1500, 1);
  const txFactor = 1 - Math.min(tx / 4000, 1);
  const expPenalty = (ageFactor * 0.4 + txFactor * 0.6) * 15;

  // 4. Price anomaly penalty (0 to 20):
  // Severe undercutting (-20% or more) signals counterfeit/dispute risk
  let devPenalty = 0;
  if (dev < -20) {
    devPenalty = Math.min(Math.max((-dev - 20) / 30, 0), 1) * 20;
  }

  const rawScore = refundPenalty + ratingPenalty + expPenalty + devPenalty;
  const score = Math.min(Math.max(Math.round(rawScore), 5), 98);

  let level = "Low";
  let color = "#10b981"; // green
  let summary = "Low dispute rate, established seller metrics";

  if (score >= 65) {
    level = "High";
    color = "#ef4444"; // red
    summary = "High refund or low customer rating detected";
  } else if (score >= 38) {
    level = "Medium";
    color = "#f59e0b"; // amber
    summary = "Moderate risk. Standard marketplace seller metrics";
  }

  return {
    score,
    level,
    color,
    summary,
    factors: {
      refund_rate: refund,
      all_time_rating: rating,
      seller_age_days: age,
      transaction_count: tx,
      price_deviation_percent: dev,
    },
  };
}

// Composite offer score for ranking offers
function offerScore(row, priceMin, priceMax, deliveryMin, deliveryMax, maxWarranty, maxReturn, maxTxn) {
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
  const warrantyScore = maxWarranty > 0 ? Math.min(warranty / maxWarranty, 1) : 0;
  const returnScore = maxReturn > 0 ? Math.min(returnPolicy / maxReturn, 1) : 0;
  const stockScore = stock;
  const ratingScore = rating;
  const refundScore = clamp(refund, 0, 1);
  const experienceScore = maxTxn > 0 ? Math.log1p(txn) / Math.log1p(maxTxn) : 0;
  const sellerAgeScore = Math.min(sellerAge / 2991, 1);

  return (
    0.35 * priceScore +
    0.15 * deliveryScore +
    0.1 * warrantyScore +
    0.1 * returnScore +
    0.1 * stockScore +
    0.1 * ratingScore +
    0.05 * refundScore +
    0.05 * experienceScore
  );
}

// 2. Suggest Better Deals
// Finds alternative seller listings for the exact same product_id that offer better deals
function findBetterDeals(productId, currentSellerId) {
  const productOffers = listingsByProduct[productId] || [];
  const baseOffer = productOffers.find((o) => o.seller_id === Number(currentSellerId));

  if (!baseOffer) return [];

  const baseTotal = baseOffer.price_bdt + baseOffer.shipping_cost_bdt;
  const baseRisk = baseOffer.seller_risk.score;

  const prices = productOffers.map((r) => r.price_bdt + r.shipping_cost_bdt);
  const deliveryTimes = productOffers.map((r) => r.delivery_time_days);
  const warranties = productOffers.map((r) => r.warranty_days);
  const returnDays = productOffers.map((r) => r.return_policy_days);
  const maxTxn = Math.max(...productOffers.map((r) => r.transaction_count));

  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const deliveryMin = Math.min(...deliveryTimes);
  const deliveryMax = Math.max(...deliveryTimes);
  const maxWarranty = Math.max(...warranties);
  const maxReturn = Math.max(...returnDays);

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

  const candidates = productOffers
    .filter((o) => o.seller_id !== Number(currentSellerId))
    .map((cand) => {
      const candTotal = cand.price_bdt + cand.shipping_cost_bdt;
      const candRisk = cand.seller_risk.score;
      const score = offerScore(
        cand,
        priceMin,
        priceMax,
        deliveryMin,
        deliveryMax,
        maxWarranty,
        maxReturn,
        maxTxn,
      );

      const priceSavings = baseTotal - candTotal;
      const isCheaper = priceSavings >= 100;
      const hasBetterRisk = candRisk < baseRisk - 10;
      const hasFasterDelivery = cand.delivery_time_days < baseOffer.delivery_time_days;
      const hasBetterWarranty = cand.warranty_days > baseOffer.warranty_days;
      const hasBetterRating = cand.all_time_rating > baseOffer.all_time_rating;
      const inStock = cand.stock_available === 1;

      // Better deal condition
      const isBetter =
        (isCheaper && (cand.seller_risk.level !== "High" || baseOffer.seller_risk.level === "High")) ||
        (score > baseScore + 0.04 && candTotal <= baseTotal) ||
        (candTotal <= baseTotal + 300 && hasBetterRisk && (hasFasterDelivery || hasBetterWarranty || hasBetterRating));

      if (!isBetter) return null;

      const reasons = [];
      if (priceSavings > 0) {
        reasons.push(`Save ৳${Math.round(priceSavings).toLocaleString("en-BD")} (${Math.round((priceSavings / baseTotal) * 100)}% cheaper)`);
      }
      if (hasBetterRisk) {
        reasons.push(`Lower seller risk (${cand.seller_risk.level} Risk, Score ${candRisk})`);
      }
      if (hasFasterDelivery) {
        reasons.push(`Faster delivery: ${cand.delivery_time_days} days (vs ${baseOffer.delivery_time_days} days)`);
      }
      if (hasBetterWarranty) {
        reasons.push(`Longer warranty: ${cand.warranty_days} days (vs ${baseOffer.warranty_days} days)`);
      }
      if (hasBetterRating) {
        reasons.push(`Higher rating: ${cand.all_time_rating}★ (vs ${baseOffer.all_time_rating}★)`);
      }
      if (inStock && baseOffer.stock_available === 0) {
        reasons.push("In stock");
      }

      return {
        ...cand,
        savings_bdt: Math.max(0, Math.round(priceSavings)),
        savings_percent: priceSavings > 0 ? Math.round((priceSavings / baseTotal) * 100) : 0,
        composite_score: Number(score.toFixed(4)),
        reasons: reasons.length > 0 ? reasons : ["Better overall seller value and service"],
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.savings_bdt !== a.savings_bdt) return b.savings_bdt - a.savings_bdt;
      return a.seller_risk.score - b.seller_risk.score;
    })
    .slice(0, 10);

  return candidates;
}

// Load all item listings from CSV file
function initDataset() {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const sellerId = Number(row.seller_id);
        const platformId = Number(row.platform_id);
        const productId = Number(row.product_id);
        const price = Number(row.price_bdt);
        const shipping = Number(row.shipping_cost_bdt);
        const avgPrice = Number(row.product_average_price_bdt);

        const listing = {
          id: `item_${productId}_${sellerId}`,
          product_id: productId,
          product_title: `Product #${productId}`,
          seller_id: sellerId,
          seller_name: `Seller #${sellerId}`,
          platform_id: platformId,
          platform_name: `Platform #${platformId}`,
          seller_age_days: Number(row.seller_age_days),
          transaction_count: Number(row.transaction_count), // items sold
          refund_rate: Number(row.refund_rate),
          all_time_rating: Number(row.all_time_rating), // product review rating (1 to 5 stars)
          price_bdt: price, // price of the item
          shipping_cost_bdt: shipping,
          total_cost_bdt: Number((price + shipping).toFixed(2)),
          product_average_price_bdt: avgPrice, // average market price
          price_deviation_percent: Number(row.price_deviation_percent),
          delivery_time_days: Number(row.delivery_time_days),
          warranty_days: Number(row.warranty_days),
          return_policy_days: Number(row.return_policy_days),
          stock_available: Number(row.stock_available),
          seller_risk: calculateRisk(row), // seller risk analysis (Low, Medium, High)
        };

        rows.push(listing);
      })
      .on("end", () => {
        allListings = rows;

        // Group by product_id
        listingsByProduct = {};
        const productIds = [...new Set(allListings.map((r) => r.product_id))].sort((a, b) => a - b);

        productIds.forEach((pid) => {
          listingsByProduct[pid] = allListings.filter((o) => o.product_id === pid);
        });

        // Compute product level summaries directly from CSV
        productSummaries = productIds.map((pid) => {
          const offers = listingsByProduct[pid] || [];
          const prices = offers.map((o) => o.price_bdt);
          const totalSold = offers.reduce((sum, o) => sum + o.transaction_count, 0);
          const inStockOffers = offers.filter((o) => o.stock_available === 1);

          return {
            product_id: pid,
            product_title: `Product #${pid}`,
            product_average_price_bdt: offers[0] ? offers[0].product_average_price_bdt : 0,
            min_price_bdt: Math.min(...prices),
            max_price_bdt: Math.max(...prices),
            total_listings: offers.length,
            in_stock_listings: inStockOffers.length,
            total_sold: totalSold,
          };
        });

        console.log(`[Dataset] Loaded ${allListings.length} item listings across ${productIds.length} products directly from CSV.`);
        resolve();
      })
      .on("error", reject);
  });
}

// API Routes

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "upay Marketplace API is running", totalListings: allListings.length });
});

// 2. User profile & balance
app.get("/api/user", (req, res) => {
  res.json(userState);
});

// 3. User payment with PIN & Balance verification
app.post("/api/user/pay", (req, res) => {
  const { pin, amount, items } = req.body;

  if (!pin || pin.toString().length !== 4) {
    return res.status(400).json({ success: false, message: "Please enter a valid 4-digit upay PIN." });
  }

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid payment amount." });
  }

  if (userState.balance < payAmount) {
    const shortfall = payAmount - userState.balance;
    return res.status(400).json({
      success: false,
      insufficientBalance: true,
      message: `Insufficient upay Balance. You need ৳${shortfall.toLocaleString("en-BD", { minimumFractionDigits: 2 })} more.`,
      currentBalance: userState.balance,
      requiredAmount: payAmount,
      shortfall: shortfall,
    });
  }

  // Deduct balance
  userState.balance = Number((userState.balance - payAmount).toFixed(2));

  const transactionId = `UPAY${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  res.json({
    success: true,
    message: "Payment successful!",
    transactionId,
    amount: payAmount,
    newBalance: userState.balance,
    paidAt: new Date().toISOString(),
    merchant: "upay Online Store",
    merchantId: "UPAY-MRKT-8841",
    itemsCount: items ? items.length : 1,
  });
});

// 4. Top-up balance (demo helper)
app.post("/api/user/topup", (req, res) => {
  const { amount = 50000 } = req.body;
  userState.balance += Number(amount);
  res.json({ success: true, balance: userState.balance, message: `Added ৳${amount} to upay Balance.` });
});

// 5. Product summaries (Product #1 to Product #5 stats directly from CSV)
app.get("/api/products/summary", (req, res) => {
  res.json(productSummaries);
});

// 6. Get Item Listings directly from CSV
// Supports filtering by productId, sellerId, platformId, risk level, inStockOnly, search and sorting
app.get("/api/listings", (req, res) => {
  let result = [...allListings];
  const { productId, platformId, sellerId, risk, inStockOnly, sort, search, page = 1, limit = 60 } = req.query;

  if (productId && productId !== "all") {
    result = result.filter((item) => item.product_id === Number(productId));
  }

  if (platformId && platformId !== "all") {
    result = result.filter((item) => item.platform_id === Number(platformId));
  }

  if (sellerId) {
    result = result.filter((item) => item.seller_id === Number(sellerId));
  }

  if (risk && risk !== "all") {
    result = result.filter((item) => item.seller_risk.level.toLowerCase() === risk.toLowerCase());
  }

  if (inStockOnly === "true") {
    result = result.filter((item) => item.stock_available === 1);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (item) =>
        item.seller_name.toLowerCase().includes(q) ||
        item.product_title.toLowerCase().includes(q) ||
        item.seller_id.toString().includes(q) ||
        item.platform_id.toString().includes(q) ||
        item.price_bdt.toString().includes(q),
    );
  }

  // Sorting
  if (sort === "price_asc") {
    result.sort((a, b) => a.total_cost_bdt - b.total_cost_bdt);
  } else if (sort === "price_desc") {
    result.sort((a, b) => b.total_cost_bdt - a.total_cost_bdt);
  } else if (sort === "sold_desc") {
    result.sort((a, b) => b.transaction_count - a.transaction_count);
  } else if (sort === "rating_desc") {
    result.sort((a, b) => b.all_time_rating - a.all_time_rating);
  } else if (sort === "risk_asc") {
    result.sort((a, b) => a.seller_risk.score - b.seller_risk.score);
  }

  const total = result.length;
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  const startIndex = (p - 1) * l;
  const paginated = result.slice(startIndex, startIndex + l);

  res.json({
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    listings: paginated,
  });
});

// 7. Get specific Item Listing with the 4 MANDATORY items, statistics & better deals
app.get("/api/listings/:productId/:sellerId", (req, res) => {
  const productId = Number(req.params.productId);
  const sellerId = Number(req.params.sellerId);

  const productListings = listingsByProduct[productId] || [];
  const listing = productListings.find((o) => o.seller_id === sellerId);

  if (!listing) {
    return res.status(404).json({ message: "Item listing not found in dataset" });
  }

  // Find better deals for this exact product_id
  const betterDeals = findBetterDeals(productId, sellerId);

  res.json({
    listing: {
      ...listing,
      // The 4 mandatory items explicitly structured
      mandatory_attributes: {
        price_bdt: listing.price_bdt, // 1. Price of the item
        seller_risk: listing.seller_risk, // 2. Seller risk (Low, Medium, High)
        product_average_price_bdt: listing.product_average_price_bdt, // 3. Average market price of this item
        all_time_rating: listing.all_time_rating, // 4. Product review (1 to 5 stars)
      },
      has_better_deals: betterDeals.length > 0,
      better_deals_count: betterDeals.length,
      better_deals: betterDeals,
    },
  });
});

// Backwards compatibility routes for /api/products and /api/offers
app.get("/api/products", (req, res) => {
  res.json(productSummaries);
});

app.get("/api/offers/:productId/:sellerId", (req, res) => {
  const productId = Number(req.params.productId);
  const sellerId = Number(req.params.sellerId);
  const productListings = listingsByProduct[productId] || [];
  const listing = productListings.find((o) => o.seller_id === sellerId);
  if (!listing) return res.status(404).json({ message: "Offer not found" });
  const betterDeals = findBetterDeals(productId, sellerId);
  res.json({
    product: {
      id: productId,
      name: `Product #${productId}`,
      category: `Category ${productId}`,
    },
    offer: {
      ...listing,
      mandatory_attributes: {
        price_bdt: listing.price_bdt,
        seller_risk: listing.seller_risk,
        product_average_price_bdt: listing.product_average_price_bdt,
        all_time_rating: listing.all_time_rating,
      },
      has_better_deals: betterDeals.length > 0,
      better_deals_count: betterDeals.length,
      better_deals: betterDeals,
    },
  });
});

app.get("/api/recommendation/random", (req, res) => {
  const pids = Object.keys(listingsByProduct);
  const pid = Number(pids[Math.floor(Math.random() * pids.length)]);
  const offers = listingsByProduct[pid] || [];
  const baseOffer = offers[Math.floor(Math.random() * offers.length)];
  const betterDeals = findBetterDeals(pid, baseOffer.seller_id);
  res.json({
    product_id: pid,
    base_seller_id: baseOffer.seller_id,
    base_offer: baseOffer,
    recommended_offers: betterDeals,
  });
});

// Start server
initDataset()
  .then(() => {
    // If running in standalone or restart
    const serverInstance = app.listen(port, () => {
      console.log(`upay Marketplace backend running on http://localhost:${port}`);
    });
    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} already in use, reusing running process.`);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to initialize dataset:", err);
    process.exit(1);
  });
