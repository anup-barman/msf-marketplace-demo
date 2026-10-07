export type RiskLevel = "Low" | "Medium" | "High";

export interface RiskModelMetrics {
  rows?: number;
  positive_rate?: number;
  roc_auc?: number;
  pr_auc?: number;
  brier?: number;
  [key: string]: unknown;
}

export interface SellerRisk {
  score: number;
  level: RiskLevel;
  color: string;
  summary: string;
  model: {
    type: string;
    suspicious_probability: number;
    training_rows: number;
    metrics: RiskModelMetrics;
  };
  factors: {
    refund_rate: number;
    all_time_rating: number;
    seller_age_days: number;
    transaction_count: number;
    price_deviation_percent: number;
  };
}

export interface Listing {
  id: string;
  product_id: number;
  model_id: string;
  product_title: string;
  seller_id: number;
  seller_name: string;
  platform_id: number;
  platform_name: string;
  seller_age_days: number;
  transaction_count: number;
  refund_rate: number;
  all_time_rating: number;
  price_bdt: number;
  shipping_cost_bdt: number;
  total_cost_bdt: number;
  product_average_price_bdt: number;
  price_deviation_percent: number;
  delivery_time_days: number;
  warranty_days: number;
  return_policy_days: number;
  stock_available: 0 | 1;
  seller_risk: SellerRisk;
}

export interface BetterDeal extends Listing {
  savings_bdt: number;
  savings_percent: number;
  composite_score: number;
  reasons: string[];
}

export interface MandatoryAttributes {
  price_bdt: number;
  seller_risk: SellerRisk;
  product_average_price_bdt: number;
  all_time_rating: number;
}

export interface ListingDetail extends Listing {
  mandatory_attributes?: MandatoryAttributes;
  has_better_deals?: boolean;
  better_deals_count?: number;
  better_deals?: BetterDeal[];
}

export interface ProductSummary {
  product_id: number;
  product_title: string;
  product_average_price_bdt: number;
  min_price_bdt: number;
  max_price_bdt: number;
  total_listings: number;
  in_stock_listings: number;
  total_sold: number;
}

export interface ListingsPage {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  listings: Listing[];
}

export interface UserState {
  name: string;
  phone: string;
  balance: number;
}

export interface CartItem {
  listing: Listing;
  quantity: number;
}

export interface PaymentReceipt {
  success: true;
  message: string;
  transactionId: string;
  amount: number;
  newBalance: number;
  paidAt: string;
  merchant: string;
  merchantId: string;
  itemsCount: number;
}

// Account & Auth types
export interface Account {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  balance: number;
  address?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  account: Account | null;
  token: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  account?: Omit<Account, "password">;
}

// Recommendation types (real-time streaming)
export interface RecommendationSource {
  api: "behavior" | "catalog" | "review";
  weight: number;
  fetchedAt: string;
}

export interface RecommendedDeal extends BetterDeal {
  recommendation_score: number;
  sources: RecommendationSource[];
  rank: number;
}

export interface RecommendationRequest {
  listingId: string;
  productId: number;
  modelId: string;
  baseSellerId: number;
  userId?: string;
  limit?: number;
}

export interface RecommendationResponse {
  listingId: string;
  recommendations: RecommendedDeal[];
  totalFound: number;
  generatedAt: string;
  sourcesUsed: string[];
}

export type RecommendationStreamStatus = "connecting" | "streaming" | "complete" | "error";

export interface RecommendationStreamChunk {
  type: "start" | "delta" | "complete" | "error";
  listingId?: string;
  recommendation?: RecommendedDeal;
  recommendations?: RecommendedDeal[];
  totalFound?: number;
  sourcesUsed?: string[];
  generatedAt?: string;
  message?: string;
}
