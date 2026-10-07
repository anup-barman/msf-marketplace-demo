import { PrismaClient, ProductCategory, SellerScale, ProductCondition, RiskLevel } from "@prisma/client";
import { PRODUCT_CATEGORY_LABELS } from "./types";

const PRODUCTS = {
  MOBILE_PHONE: { prefix: "MOB", baseIssue: 3.5, prices: [12000, 22000, 38000, 65000, 140000] },
  LAPTOP: { prefix: "LAP", baseIssue: 4.0, prices: [38000, 55000, 80000, 120000, 190000] },
  SMART_TV: { prefix: "TV", baseIssue: 3.0, prices: [22000, 35000, 55000, 90000, 180000] },
  DESKTOP_COMPUTER: { prefix: "PC", baseIssue: 3.0, prices: [30000, 45000, 65000, 95000, 160000] },
  DIGITAL_CAMERA: { prefix: "CAM", baseIssue: 2.5, prices: [35000, 55000, 80000, 100000, 180000] },
  GAMING_CONSOLE: { prefix: "CON", baseIssue: 2.5, prices: [38000, 52000, 62000, 78000, 95000] },
  WIRELESS_EARBUDS: { prefix: "EAR", baseIssue: 5.0, prices: [1200, 2500, 5500, 12000, 28000] },
  BLUETOOTH_SPEAKER: { prefix: "SPK", baseIssue: 4.0, prices: [1500, 3500, 7000, 14000, 30000] },
  POWER_BANK: { prefix: "PWR", baseIssue: 4.5, prices: [1100, 1800, 3000, 4800, 8500] },
  SMARTWATCH: { prefix: "WCH", baseIssue: 4.5, prices: [2000, 4500, 9000, 22000, 45000] },
  WIFI_ROUTER: { prefix: "RTR", baseIssue: 3.0, prices: [1800, 3200, 5500, 9500, 16000] },
} as const;

function clip(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(value, high));
}

function pick<T>(rng: () => number, values: T[], weights?: number[]): T {
  if (weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = rng() * total;
    for (let i = 0; i < values.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return values[i];
    }
    return values[values.length - 1];
  }
  return values[Math.floor(rng() * values.length)];
}

function poisson(rng: () => number, mean: number): number {
  if (mean <= 0) return 0;
  if (mean > 30) return Math.max(0, Math.round(rng() * Math.sqrt(mean) + mean));
  let product = 1.0;
  const limit = Math.exp(-mean);
  let count = 0;
  while (product > limit) {
    count++;
    product *= rng();
  }
  return count - 1;
}

function gaussian(rng: () => number, mean: number = 0, stdDev: number = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}

function lognormal(rng: () => number, mu: number, sigma: number): number {
  return Math.exp(gaussian(rng, mu, sigma));
}

function gammavariate(rng: () => number, alpha: number, beta: number): number {
  if (alpha <= 1) {
    const u = rng();
    return gammavariate(rng, 1 + alpha, beta) * Math.pow(u, 1 / alpha);
  }
  const d = alpha - 1/3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      x = gaussian(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * beta;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * beta;
  }
}

function betavariate(rng: () => number, alpha: number, beta: number): number {
  const gammaAlpha = gammavariate(rng, alpha, 1);
  const gammaBeta = gammavariate(rng, beta, 1);
  return gammaAlpha / (gammaAlpha + gammaBeta);
}

interface SellerData {
  id: string;
  scale: SellerScale;
  r: number;
  quality: number;
  age: number;
  tx: number;
  tx30: number;
  success: number;
  refund: number;
  late: number;
  response: number;
  complaints: number;
  cod: number;
  verified: number;
  authorized: number;
  products: ProductCategory[];
}

function generateSeller(rng: () => number, number: number): SellerData {
  const scale = pick(rng, ["SMALL", "MEDIUM", "BIG"] as SellerScale[], [0.78, 0.17, 0.05]);

  let r: number;
  if (scale === "SMALL") {
    r = betavariate(rng, 1.5, 4.0);
    if (rng() < 0.08) {
      r = clip(betavariate(rng, 4.0, 1.5), 0.60, 0.98);
    }
  } else if (scale === "MEDIUM") {
    r = betavariate(rng, 1.2, 6.0);
  } else {
    r = betavariate(rng, 0.9, 9.0);
  }

  const quality = clip(1.0 - r + gaussian(rng, 0, 0.05), 0.02, 0.98);

  let age: number, tx: number;
  if (scale === "SMALL") {
    age = Math.floor(clip(gammavariate(rng, 2, 9) * (1 - 0.45 * r) + 1, 1, 96));
    tx = Math.floor(clip(lognormal(rng, Math.log(120), 0.8) * (1 - 0.55 * r), 5, 700));
  } else if (scale === "MEDIUM") {
    age = Math.floor(clip(gaussian(rng, 42, 16), 10, 120));
    tx = Math.floor(clip(lognormal(rng, Math.log(1600), 0.5), 500, 6000));
  } else {
    age = Math.floor(clip(gaussian(rng, 75, 25), 30, 180));
    tx = Math.floor(clip(lognormal(rng, Math.log(16000), 0.5), 5000, 80000));
  }

  const success = clip(99.5 - 20 * Math.pow(1 - quality, 1.2) + gaussian(rng, 0, 15 / Math.sqrt(Math.max(tx, 1))), 45, 100);
  const refund = clip(0.5 + 14 * Math.pow(1 - quality, 1.3) + gaussian(rng, 0, 8 / Math.sqrt(Math.max(tx, 1))), 0.1, 40);
  const late = clip(1.0 + 16 * Math.pow(1 - quality, 1.3) + gaussian(rng, 0, 6 / Math.sqrt(Math.max(tx, 1))), 0, 60);
  const response = clip(lognormal(rng, Math.log(0.8 + 9 * (1 - quality)), 0.4), 0.1, 72);
  const tx30 = Math.floor(tx * Math.min(1.0, clip(0.08 + 0.65 * r + (rng() - 0.5) * 0.3, 0.05, 1.0)));
  const verified = rng() < clip({ SMALL: 0.45, MEDIUM: 0.85, BIG: 0.98 }[scale] * (1.15 - 0.85 * r), 0.05, 0.99) ? 1 : 0;
  const authorized = rng() < clip({ SMALL: 0.04, MEDIUM: 0.20, BIG: 0.60 }[scale] * (1.0 - r), 0, 0.8) ? 1 : 0;
  const cod = clip(gaussian(rng, 35 + 20 * (1 - quality), 12), 0, 95);
  const complaints = poisson(rng, tx * (0.0004 + 0.012 * Math.pow(1 - quality, 2)));
  const products = pick(rng, Object.keys(PRODUCTS) as ProductCategory[], undefined);

  return {
    id: `S${number.toString().padStart(5, "0")}`,
    scale,
    r,
    quality,
    age,
    tx,
    tx30,
    success,
    refund,
    late,
    response,
    complaints,
    cod,
    verified,
    authorized,
    products: [products],
  };
}

interface ListingData {
  sellerId: string;
  scale: SellerScale;
  productName: string;
  modelId: string;
  sellerTxnCount: number;
  txnLast30d: number;
  sellerAccountAgeMonths: number;
  orderSuccessRatePct: number;
  refundRatePct: number;
  lateDeliveryRatePct: number;
  avgResponseTimeHours: number;
  complaintReportCount: number;
  codOrderSharePct: number;
  sellerVerified: boolean;
  authorizedDealer: boolean;
  productCondition: ProductCondition;
  warrantyMonths: number;
  listingAgeDays: number;
  stockQuantity: number;
  productIssueRatePct: number;
  reviewCountAllTime: number;
  reviewCountLast30d: number;
  productRatingAllTime: number | null;
  productRatingLast30d: number | null;
  recommendToOthers: string;
  verifiedPurchaseReviewPct: number | null;
  earlyReviewBurstPct: number | null;
  modelAvgPriceBdt: number;
  priceDeviationPct: number;
  productPriceBdt: number;
  pricePercentileWithinModel: number;
  isSuspiciousListing: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  riskColor: string;
  suspiciousProbability: number;
  shippingCostBdt: number;
  totalCostBdt: number;
  deliveryTimeDays: number;
  warrantyDays: number;
  returnPolicyDays: number;
  stockAvailable: boolean;
}

const offsets = new Map<string, number>();

function getOffset(product: ProductCategory, index: number): number {
  const key = `${product}-${index}`;
  if (!offsets.has(key)) {
    offsets.set(key, clip(gaussian(() => Math.random()), -1.5, 1.5));
  }
  return offsets.get(key)!;
}

function calculateRiskScore(listing: Omit<ListingData, "riskScore" | "riskLevel" | "riskColor" | "suspiciousProbability">): { riskScore: number; riskLevel: RiskLevel; riskColor: string; suspiciousProbability: number } {
  const discPenalty = Math.max(0.0, -listing.priceDeviationPct / 50.0);
  const verPenalty = Math.max(0.0, (85.0 - (listing.verifiedPurchaseReviewPct || 75.0)) / 75.0);
  const sellerRisk = listing.refundRatePct / 40 * 0.3 + (100 - listing.orderSuccessRatePct) / 55 * 0.2 + listing.lateDeliveryRatePct / 60 * 0.1 + (1 - listing.sellerVerified ? 1 : 0) * 0.15 + discPenalty * 0.25;
  const riskScore = clip(sellerRisk, 0.01, 0.99);
  
  let riskLevel: RiskLevel;
  let riskColor: string;
  if (riskScore < 0.33) {
    riskLevel = "LOW";
    riskColor = "#10b981";
  } else if (riskScore < 0.66) {
    riskLevel = "MEDIUM";
    riskColor = "#f59e0b";
  } else {
    riskLevel = "HIGH";
    riskColor = "#ef4444";
  }
  
  const suspiciousProbability = 1.0 / (1.0 + Math.exp(-10.0 * (riskScore - 0.52)));

  return { riskScore, riskLevel, riskColor, suspiciousProbability };
}

function generateListing(rng: () => number, seller: SellerData, product: ProductCategory, index: number): ListingData {
  const { prefix, baseIssue, prices } = PRODUCTS[product];
  const average = prices[index];
  const scale = seller.scale;
  const r = seller.r;
  const qualityL = clip(seller.quality + gaussian(rng, 0, 0.04), 0.01, 0.99);
  const issue = clip(baseIssue + getOffset(product, index) + 9 * Math.pow(1 - qualityL, 1.2) + gaussian(rng, 0, 1), 0.2, 35);

  const condition = seller.authorized === 1 ? "NEW" : pick(rng, ["NEW", "REFURBISHED", "USED"] as ProductCondition[], [0.85, 0.10, 0.05]);

  const warrantyWeights = [
    clip(0.10 + 0.40 * r, 0.05, 0.70),
    0.15,
    0.25,
    clip(0.50 - 0.40 * r, 0.05, 0.75),
  ];
  const warranty = pick(rng, [0, 3, 6, 12], warrantyWeights);

  const devMean = -2.0 - 24.0 * Math.pow(r, 1.4);
  const deviation = clip(gaussian(rng, devMean, 7 + 10 * r), -65, 35);
  const price = Math.max(10, Math.round(average * (1 + deviation / 100) / (average < 10000 ? 10 : 50)) * (average < 10000 ? 10 : 50));
  const actualDeviation = Math.round((price / average - 1) * 100 * 100) / 100;

  const reviews = poisson(rng, seller.tx / Math.max(1, seller.products.length) * rng() * 0.13 + 0.05);
  const reviews30 = Math.min(reviews, Math.round(reviews * clip(seller.tx30 / Math.max(seller.tx, 1) * 2.5 * lognormal(rng, 0, 0.2), 0, 1)));

  const rating = reviews === 0 ? null : Math.round(clip(5 - 3.0 * (1 - qualityL) - 0.03 * issue + gaussian(rng, 0, 0.2), 1, 5) * 100) / 100;
  const recent = reviews30 === 0 ? null : Math.round(clip((rating || 5) - gaussian(rng, 0.1 + 0.25 * r, 0.2), 1, 5) * 100) / 100;

  const verifiedReviews = reviews === 0 ? null : Math.round(clip(96 - 55 * r + gaussian(rng, 0, 9), 10, 100) * 100) / 100;
  const burst = reviews === 0 ? null : Math.round(clip(10 + 65 * r + gaussian(rng, 0, 10), 0, 95) * 100) / 100;

  const ageL = Math.max(1, Math.floor(Math.min(lognormal(rng, Math.log(150), 1), seller.age * 30)));
  const stock = Math.max(1, Math.floor(lognormal(rng, Math.log({ SMALL: 6, MEDIUM: 25, BIG: 90 }[scale]), 0.6)));

  const discPenalty = Math.max(0.0, -actualDeviation / 50.0);
  const verPenalty = Math.max(0.0, (85.0 - (verifiedReviews || 75.0)) / 75.0);
  const listingR = clip(0.65 * r + 0.20 * discPenalty + 0.15 * verPenalty, 0.01, 0.99);
  const pSuspicious = 1.0 / (1.0 + Math.exp(-10.0 * (listingR - 0.52)));
  const isSuspicious = rng() < pSuspicious;

  const { riskScore, riskLevel, riskColor, suspiciousProbability } = calculateRiskScore({
    refundRatePct: listing.refundRatePct,
    orderSuccessRatePct: listing.orderSuccessRatePct,
    lateDeliveryRatePct: listing.lateDeliveryRatePct,
    sellerVerified: listing.sellerVerified,
    priceDeviationPct: actualDeviation,
    verifiedPurchaseReviewPct: verifiedReviews,
  });

  const shipping = Math.round(Math.max(60, price * 0.015));
  const deliveryDays = Math.max(1, Math.round(seller.response / 12) + 1);

  return {
    sellerId: seller.id,
    scale: seller.scale,
    productName: PRODUCT_CATEGORY_LABELS[product],
    modelId: `${prefix}-M${index + 1}`,
    sellerTxnCount: seller.tx,
    txnLast30d: seller.tx30,
    sellerAccountAgeMonths: seller.age,
    orderSuccessRatePct: Math.round(seller.success * 100) / 100,
    refundRatePct: Math.round(seller.refund * 100) / 100,
    lateDeliveryRatePct: Math.round(seller.late * 100) / 100,
    avgResponseTimeHours: Math.round(seller.response * 10) / 10,
    complaintReportCount: seller.complaints,
    codOrderSharePct: Math.round(seller.cod * 10) / 10,
    sellerVerified: seller.verified === 1,
    authorizedDealer: seller.authorized === 1,
    productCondition: condition,
    warrantyMonths: warranty,
    listingAgeDays: ageL,
    stockQuantity: stock,
    productIssueRatePct: Math.round(issue * 100) / 100,
    reviewCountAllTime: reviews,
    reviewCountLast30d: reviews30,
    productRatingAllTime: rating,
    productRatingLast30d: recent,
    recommendToOthers: rating !== null && rating >= 3.6 ? "Yes" : "No",
    verifiedPurchaseReviewPct: verifiedReviews,
    earlyReviewBurstPct: burst,
    modelAvgPriceBdt: average,
    priceDeviationPct: actualDeviation,
    productPriceBdt: price,
    pricePercentileWithinModel: 50,
    isSuspiciousListing: isSuspicious,
    riskScore,
    riskLevel,
    riskColor,
    suspiciousProbability,
    shippingCostBdt: shipping,
    totalCostBdt: Number((price + shipping).toFixed(2)),
    deliveryTimeDays: deliveryDays,
    warrantyDays: warranty * 30,
    returnPolicyDays: seller.authorized === 1 ? 30 : 7,
    stockAvailable: stock > 0,
  };
}

export async function generateListingsForWebsite(
  prisma: PrismaClient,
  websiteId: string,
  productCategories: ProductCategory[],
  count: number,
  seed: number = Date.now()
): Promise<number> {
  const rng = (() => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  })();

  const data: ListingData[] = [];
  let sellerNumber = 0;

  while (data.length < count) {
    sellerNumber++;
    const seller = generateSeller(rng, sellerNumber);
    
    for (const product of seller.products) {
      if (!productCategories.includes(product)) continue;
      
      for (let i = 0; i < rng() * 3 + 1; i++) {
        const index = Math.floor(rng() * 5);
        data.push(generateListing(rng, seller, product, index));
        if (data.length >= count) break;
      }
      if (data.length >= count) break;
    }
  }

  const modelPrices = new Map<string, number[]>();
  for (const row of data) {
    const prices = modelPrices.get(row.modelId) || [];
    prices.push(row.productPriceBdt);
    modelPrices.set(row.modelId, prices);
  }

  const percentileByModel = new Map<string, Map<number, number>>();
  for (const [modelId, prices] of modelPrices) {
    const sorted = [...prices].sort((a, b) => a - b);
    const rankMap = new Map<number, number>();
    for (let i = 0; i < sorted.length; i++) {
      rankMap.set(sorted[i], Math.round((i + 1) / sorted.length * 100 * 10) / 10);
    }
    percentileByModel.set(modelId, rankMap);
  }

  for (const row of data) {
    const percentiles = percentileByModel.get(row.modelId);
    if (percentiles) {
      row.pricePercentileWithinModel = percentiles.get(row.productPriceBdt) || 50;
    }
  }

  const result = await prisma.listing.createMany({
    data: data.map(d => ({
      ...d,
      websiteId,
      productCategory: d.productName as ProductCategory,
    })),
    skipDuplicates: false,
  });

  return result.count;
}

export async function getGeneratorSettings(prisma: PrismaClient, websiteId: string) {
  return prisma.generatorSettings.findUnique({ where: { websiteId } });
}

export async function updateGeneratorSettings(
  prisma: PrismaClient,
  websiteId: string,
  data: { isEnabled?: boolean; intervalMs?: number; rowsPerTick?: number }
) {
  return prisma.generatorSettings.upsert({
    where: { websiteId },
    update: data,
    create: { websiteId, ...data },
  });
}

export async function logGeneration(
  prisma: PrismaClient,
  websiteId: string,
  rowsAdded: number,
  success: boolean,
  error?: string
) {
  return prisma.generationLog.create({
    data: { websiteId, rowsAdded, success, error },
  });
}