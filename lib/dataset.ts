import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ExternalListing } from "./marketplaceSources";
import { MARKETPLACE_SOURCES } from "./marketplaceSources";
import type { Listing, ProductSummary, RiskLevel, RiskModelMetrics, SellerRisk } from "./types";

const PAGE_SIZE = 200;
const CACHE_MS = 3_000;
const MODEL_PATH = path.join(process.cwd(), "data", "risk_model.joblib");
const MODEL_META_PATH = path.join(process.cwd(), "data", "risk-model.json");

const PRODUCT_IDS: Record<string, number> = {
  "Mobile Phone": 1,
  Laptop: 2,
  "Smart TV": 3,
  "Desktop Computer": 4,
  "Digital Camera": 5,
  "Gaming Console": 6,
  "Wireless Earbuds": 7,
  "Bluetooth Speaker": 8,
  "Power Bank": 9,
  Smartwatch: 10,
  "Wi-Fi Router": 11,
};

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
};

interface RiskModelMetadata {
  type: string;
  version: string;
  training_rows: number;
  metrics: RiskModelMetrics;
}

export interface Dataset {
  allListings: Listing[];
  listingsByProduct: Record<number, Listing[]>;
  listingsByModel: Record<string, Listing[]>;
  productSummaries: ProductSummary[];
}

interface RiskPrediction {
  risk_score: number;
  risk_probability: number;
  risk_band: "low" | "medium" | "high";
}

interface LiveDatasetCache {
  promise: Promise<Dataset>;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __upayLiveDataset: LiveDatasetCache | undefined;
}

function numeric(value: number | string | null | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const payload = await response.json().catch(() => ({})) as unknown;
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload
      ? String(payload.error)
      : `HTTP ${response.status}`;
    throw new Error(`${url}: ${message}`);
  }
  return payload as T;
}

async function readSource(source: typeof MARKETPLACE_SOURCES[number]): Promise<ExternalListing[]> {
  const stats = await readJson<{ total: number }>(`${source.baseUrl}/api/stats`);
  const total = Math.max(0, numeric(stats.total));
  if (!total) return [];

  const pages = await Promise.all(
    Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, index) => {
      const offset = index * PAGE_SIZE;
      return readJson<{ rows: ExternalListing[] }>(
        `${source.baseUrl}/api/listings?limit=${PAGE_SIZE}&offset=${offset}&order=asc`,
      );
    }),
  );
  return pages.flatMap((page) => page.rows ?? []);
}

function scoreWithModel(rows: ExternalListing[]): Promise<RiskPrediction[]> {
  return new Promise((resolve, reject) => {
    const windows = process.platform === "win32";
    const python = process.env.PYTHON_EXECUTABLE || path.join(
      process.cwd(),
      ".venv",
      windows ? "Scripts/python.exe" : "bin/python",
    );
    const script = path.join(process.cwd(), "scripts", "score_live_listings.py");
    const child = spawn(python, [script, MODEL_PATH], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", (error) => reject(new Error(`Could not start the risk model runtime: ${error.message}`)));
    child.stdin.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EPIPE") reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Risk model exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as RiskPrediction[]);
      } catch {
        reject(new Error(`Risk model returned invalid output: ${stdout.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify(rows));
  });
}

function toListing(row: ExternalListing, sourceIndex: number, prediction: RiskPrediction, model: RiskModelMetadata): Listing {
  const productId = PRODUCT_IDS[row.product_name];
  if (!productId) throw new Error(`Unsupported generated product: ${row.product_name}`);

  const sellerId = numeric(row.seller_id.replace(/\D/g, ""));
  const platformId = sourceIndex + 1;
  const level = (prediction.risk_band[0].toUpperCase() + prediction.risk_band.slice(1)) as RiskLevel;
  const price = numeric(row.product_price_bdt);
  const shipping = Math.round(Math.max(60, price * 0.015));
  const averagePrice = numeric(row.model_avg_price_bdt);
  const transactionCount = numeric(row.seller_txn_count);
  const accountAgeMonths = numeric(row.seller_account_age_months);

  const sellerRisk: SellerRisk = {
    score: prediction.risk_score,
    level,
    color: RISK_COLORS[level],
    summary: `${level} risk predicted by the live ${model.type} model`,
    model: {
      type: model.type,
      suspicious_probability: prediction.risk_probability,
      training_rows: model.training_rows,
      metrics: model.metrics,
    },
    factors: {
      refund_rate: numeric(row.refund_rate_pct),
      all_time_rating: numeric(row.product_rating_all_time),
      seller_age_days: accountAgeMonths * 30,
      transaction_count: transactionCount,
      price_deviation_percent: numeric(row.price_deviation_pct),
    },
  };

  return {
    id: `generator_${row.seller_scale}_${row.id}`,
    product_id: productId,
    model_id: row.model_id,
    product_title: `${row.product_name} (${row.model_id})`,
    seller_id: sellerId,
    seller_name: `Seller ${row.seller_id}`,
    platform_id: platformId,
    platform_name: `Website ${String.fromCharCode(64 + platformId)}`,
    seller_age_days: accountAgeMonths * 30,
    transaction_count: transactionCount,
    refund_rate: numeric(row.refund_rate_pct),
    all_time_rating: numeric(row.product_rating_all_time),
    price_bdt: price,
    shipping_cost_bdt: shipping,
    total_cost_bdt: Number((price + shipping).toFixed(2)),
    product_average_price_bdt: averagePrice,
    price_deviation_percent: numeric(row.price_deviation_pct),
    delivery_time_days: Math.max(1, Math.round(numeric(row.avg_response_time_hours) / 12) + (platformId === 1 ? 1 : 2)),
    warranty_days: numeric(row.warranty_months) * 30,
    return_policy_days: numeric(row.authorized_dealer) ? 30 : 7,
    stock_available: numeric(row.stock_quantity) > 0 ? 1 : 0,
    seller_risk: sellerRisk,
  };
}

function buildDataset(allListings: Listing[]): Dataset {
  const listingsByProduct: Record<number, Listing[]> = {};
  const listingsByModel: Record<string, Listing[]> = {};
  for (const listing of allListings) {
    (listingsByProduct[listing.product_id] ??= []).push(listing);
    (listingsByModel[listing.model_id] ??= []).push(listing);
  }

  const productSummaries: ProductSummary[] = Object.entries(listingsByProduct)
    .map(([productId, offers]) => {
      const prices = offers.map((offer) => offer.price_bdt);
      return {
        product_id: Number(productId),
        product_title: offers[0]?.product_title ?? `Product #${productId}`,
        product_average_price_bdt: offers[0]?.product_average_price_bdt ?? 0,
        min_price_bdt: Math.min(...prices),
        max_price_bdt: Math.max(...prices),
        total_listings: offers.length,
        in_stock_listings: offers.filter((offer) => offer.stock_available === 1).length,
        total_sold: offers.reduce((sum, offer) => sum + offer.transaction_count, 0),
      };
    })
    .sort((left, right) => left.product_id - right.product_id);

  return { allListings, listingsByProduct, listingsByModel, productSummaries };
}

async function loadDataset(): Promise<Dataset> {
  const [sourceResults, model] = await Promise.all([
    Promise.allSettled(MARKETPLACE_SOURCES.map(readSource)),
    Promise.resolve(JSON.parse(fs.readFileSync(MODEL_META_PATH, "utf8")) as RiskModelMetadata),
  ]);

  const successfulSources = sourceResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value.map((row) => ({ row, sourceIndex: index }));
    console.warn(`[Dataset] ${MARKETPLACE_SOURCES[index].name} is unavailable: ${result.reason}`);
    return [];
  });
  if (successfulSources.length === 0) {
    const firstFailure = sourceResults.find((result) => result.status === "rejected");
    throw new Error(firstFailure?.status === "rejected" ? `No generator websites are reachable: ${firstFailure.reason}` : "No generated listings are available");
  }

  const sourceRows = successfulSources.map(({ row }) => row);
  const predictions = await scoreWithModel(sourceRows);
  if (predictions.length !== sourceRows.length) {
    throw new Error(`Risk model scored ${predictions.length} of ${sourceRows.length} live listings`);
  }

  const listings = successfulSources.map(({ row, sourceIndex }, index) =>
    toListing(row, sourceIndex, predictions[index], model),
  );
  console.log(`[Dataset] Loaded and model-scored ${listings.length} live PostgreSQL listings from ${new Set(successfulSources.map(({ sourceIndex }) => sourceIndex)).size} generator websites.`);
  return buildDataset(listings);
}

export function getDataset(): Promise<Dataset> {
  const now = Date.now();
  if (globalThis.__upayLiveDataset && globalThis.__upayLiveDataset.expiresAt > now) {
    return globalThis.__upayLiveDataset.promise;
  }

  const promise = loadDataset().catch((error) => {
    if (globalThis.__upayLiveDataset?.promise === promise) globalThis.__upayLiveDataset = undefined;
    throw error;
  });
  globalThis.__upayLiveDataset = { promise, expiresAt: now + CACHE_MS };
  return promise;
}
