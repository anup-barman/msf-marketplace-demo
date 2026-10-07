import type { BetterDeal, Listing, ListingDetail } from "./types";
import type { Dataset } from "./dataset";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function normalize(value: number, minimum: number, maximum: number): number {
  if (maximum === minimum) return 0;
  return (value - minimum) / (maximum - minimum);
}

interface ScoreBounds {
  priceMin: number;
  priceMax: number;
  deliveryMin: number;
  deliveryMax: number;
  maxWarranty: number;
  maxReturn: number;
  maxTxn: number;
}

// Composite offer score for ranking offers of the same model.
function offerScore(row: Listing, bounds: ScoreBounds): number {
  const price = Number(row.price_bdt) + Number(row.shipping_cost_bdt);
  const delivery = Number(row.delivery_time_days);
  const warranty = Number(row.warranty_days);
  const returnPolicy = Number(row.return_policy_days);
  const stock = Number(row.stock_available) === 1 ? 1 : 0;
  const rating = Number(row.all_time_rating) / 5;
  const refund = 1 - Number(row.refund_rate) / 12;
  const txn = Number(row.transaction_count);

  const priceScore = 1 - normalize(price, bounds.priceMin, bounds.priceMax);
  const deliveryScore = 1 - normalize(delivery, bounds.deliveryMin, bounds.deliveryMax);
  const warrantyScore = bounds.maxWarranty > 0 ? Math.min(warranty / bounds.maxWarranty, 1) : 0;
  const returnScore = bounds.maxReturn > 0 ? Math.min(returnPolicy / bounds.maxReturn, 1) : 0;
  const refundScore = clamp(refund, 0, 1);
  const experienceScore = bounds.maxTxn > 0 ? Math.log1p(txn) / Math.log1p(bounds.maxTxn) : 0;

  return (
    0.35 * priceScore +
    0.15 * deliveryScore +
    0.1 * warrantyScore +
    0.1 * returnScore +
    0.1 * stock +
    0.1 * rating +
    0.05 * refundScore +
    0.05 * experienceScore
  );
}

// Finds comparable offers for the exact same model, not merely the same product category.
export function findBetterDeals(baseOffer: Listing, dataset: Dataset): BetterDeal[] {
  const productOffers = dataset.listingsByModel[baseOffer.model_id] || [];
  if (productOffers.length < 2) return [];

  const baseTotal = baseOffer.price_bdt + baseOffer.shipping_cost_bdt;
  const baseRisk = baseOffer.seller_risk.score;

  const prices = productOffers.map((r) => r.price_bdt + r.shipping_cost_bdt);
  const deliveryTimes = productOffers.map((r) => r.delivery_time_days);
  const bounds: ScoreBounds = {
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    deliveryMin: Math.min(...deliveryTimes),
    deliveryMax: Math.max(...deliveryTimes),
    maxWarranty: Math.max(...productOffers.map((r) => r.warranty_days)),
    maxReturn: Math.max(...productOffers.map((r) => r.return_policy_days)),
    maxTxn: Math.max(...productOffers.map((r) => r.transaction_count)),
  };

  const baseScore = offerScore(baseOffer, bounds);

  return productOffers
    .filter((o) => o.id !== baseOffer.id && o.stock_available === 1)
    .map((cand): BetterDeal | null => {
      const candTotal = cand.price_bdt + cand.shipping_cost_bdt;
      const candRisk = cand.seller_risk.score;
      const score = offerScore(cand, bounds);

      const priceSavings = baseTotal - candTotal;
      const isCheaper = priceSavings >= 100;
      const hasBetterRisk = candRisk < baseRisk - 10;
      const hasFasterDelivery = cand.delivery_time_days < baseOffer.delivery_time_days;
      const hasBetterWarranty = cand.warranty_days > baseOffer.warranty_days;
      const hasBetterRating = cand.all_time_rating > baseOffer.all_time_rating;
      const inStock = cand.stock_available === 1;

      const isBetter =
        (isCheaper && candRisk <= baseRisk) ||
        (score > baseScore + 0.06 && candTotal <= baseTotal && candRisk <= baseRisk + 5) ||
        (candTotal <= baseTotal + 300 &&
          hasBetterRisk &&
          (hasFasterDelivery || hasBetterWarranty || hasBetterRating));

      if (!isBetter) return null;

      const reasons: string[] = [];
      if (priceSavings > 0) {
        reasons.push(
          `Save ৳${Math.round(priceSavings).toLocaleString("en-BD")} (${Math.round((priceSavings / baseTotal) * 100)}% cheaper)`,
        );
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
    .filter((deal): deal is BetterDeal => deal !== null)
    .sort((a, b) => {
      if (b.savings_bdt !== a.savings_bdt) return b.savings_bdt - a.savings_bdt;
      return a.seller_risk.score - b.seller_risk.score;
    });
}

// Listing enriched with the 4 mandatory attributes and its comparable-model better deals.
export function withDealDetails(listing: Listing, dataset: Dataset): ListingDetail {
  const betterDeals = findBetterDeals(listing, dataset);
  return {
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
  };
}
