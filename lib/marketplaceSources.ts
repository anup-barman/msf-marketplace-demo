export type SellerScale = "small" | "medium" | "big";

export interface ExternalListing {
  id: number;
  seller_id: string;
  seller_scale: SellerScale;
  product_name: string;
  model_id: string;
  seller_txn_count: number;
  txn_last_30d: number;
  seller_account_age_months: number;
  order_success_rate_pct: number;
  refund_rate_pct: number;
  late_delivery_rate_pct: number;
  avg_response_time_hours: number;
  complaint_report_count: number;
  cod_order_share_pct: number;
  seller_verified: 0 | 1;
  authorized_dealer: 0 | 1;
  product_condition: "new" | "refurbished" | "used";
  warranty_months: 0 | 3 | 6 | 12;
  listing_age_days: number;
  stock_quantity: number;
  product_issue_rate_pct: number;
  review_count_all_time: number;
  review_count_last_30d: number;
  product_rating_all_time: number | null;
  product_rating_last_30d: number | null;
  recommend_to_others: "Yes" | "No";
  verified_purchase_review_pct: number | null;
  early_review_burst_pct: number | null;
  model_avg_price_bdt: number;
  price_deviation_pct: number;
  product_price_bdt: number;
  price_percentile_within_model: number;
  is_suspicious_listing: 0 | 1;
  latent_r?: number;
  latent_quality?: number;
  created_at: string;
}

export interface ListingsApiResponse {
  rows: ExternalListing[];
  platform: SellerScale;
}

export interface StatsApiResponse {
  total: number;
  suspicious: number;
  last_hour: number;
  avg_price: number | null;
  avg_rating: number | null;
  avg_deviation: number | null;
  avg_issue: number | null;
  last_row_at: string | null;
  total_all: number;
}

export interface GeneratorStateResponse {
  enabled: boolean;
  last_tick_at: string | null;
  scale: SellerScale;
}

export interface MarketplaceSource {
  id: "a" | "b" | "c";
  name: string;
  scale: SellerScale;
  baseUrl: string;
}

export const MARKETPLACE_SOURCES: MarketplaceSource[] = [
  {
    id: "a",
    name: "Website A",
    scale: "small",
    baseUrl: process.env.NEXT_PUBLIC_WEBSITE_A_URL || "http://localhost:3001",
  },
  {
    id: "b",
    name: "Website B",
    scale: "medium",
    baseUrl: process.env.NEXT_PUBLIC_WEBSITE_B_URL || "http://localhost:3002",
  },
  {
    id: "c",
    name: "Website C",
    scale: "big",
    baseUrl: process.env.NEXT_PUBLIC_WEBSITE_C_URL || "http://localhost:3003",
  },
];
