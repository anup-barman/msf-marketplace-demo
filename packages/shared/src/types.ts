import type { Prisma } from "@prisma/client";

export type ProductCategory = Prisma.ProductCategory;
export type RiskLevel = Prisma.RiskLevel;
export type SellerScale = Prisma.SellerScale;
export type ProductCondition = Prisma.ProductCondition;

export interface ListingWithRelations {
  id: string;
  websiteId: string;
  productCategory: ProductCategory;
  productName: string;
  modelId: string;
  productTitle: string;
  sellerId: string;
  sellerScale: SellerScale;
  sellerTxnCount: number;
  sellerTxnCount30d: number;
  sellerAccountAgeMonths: number;
  sellerVerified: boolean;
  authorizedDealer: boolean;
  orderSuccessRatePct: number;
  refundRatePct: number;
  lateDeliveryRatePct: number;
  avgResponseTimeHours: number;
  complaintReportCount: number;
  codOrderSharePct: number;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratorSettings {
  id: string;
  websiteId: string;
  isEnabled: boolean;
  intervalMs: number;
  rowsPerTick: number;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationLog {
  id: string;
  websiteId: string;
  rowsAdded: number;
  success: boolean;
  error: string | null;
  createdAt: Date;
}

export interface ListingsPage {
  listings: ListingWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListingFilters {
  productCategory?: ProductCategory;
  riskLevel?: RiskLevel;
  sellerScale?: SellerScale;
  inStockOnly?: boolean;
  search?: string;
  sortBy?: "created_desc" | "price_asc" | "price_desc" | "sold_desc" | "rating_desc" | "risk_asc";
  page?: number;
  limit?: number;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  MOBILE_PHONE: "Mobile Phone",
  LAPTOP: "Laptop",
  SMART_TV: "Smart TV",
  DESKTOP_COMPUTER: "Desktop Computer",
  DIGITAL_CAMERA: "Digital Camera",
  GAMING_CONSOLE: "Gaming Console",
  WIRELESS_EARBUDS: "Wireless Earbuds",
  BLUETOOTH_SPEAKER: "Bluetooth Speaker",
  POWER_BANK: "Power Bank",
  SMARTWATCH: "Smartwatch",
  WIFI_ROUTER: "Wi-Fi Router",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
};

export function formatBDT(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export const WEBSITE_CONFIG = {
  web1: {
    name: "Electronics Hub",
    slug: "electronics-hub",
    description: "Mobile phones, laptops, and desktop computers",
    productCategories: ["MOBILE_PHONE", "LAPTOP", "DESKTOP_COMPUTER"] as ProductCategory[],
    themeColor: "#0050A0",
  },
  web2: {
    name: "Entertainment Store",
    slug: "entertainment-store",
    description: "Smart TVs, cameras, and gaming consoles",
    productCategories: ["SMART_TV", "DIGITAL_CAMERA", "GAMING_CONSOLE"] as ProductCategory[],
    themeColor: "#7c3aed",
  },
  web3: {
    name: "Accessories Plus",
    slug: "accessories-plus",
    description: "Earbuds, speakers, power banks, smartwatches, and routers",
    productCategories: ["WIRELESS_EARBUDS", "BLUETOOTH_SPEAKER", "POWER_BANK", "SMARTWATCH", "WIFI_ROUTER"] as ProductCategory[],
    themeColor: "#db2777",
  },
} as const;

export type WebsiteKey = keyof typeof WEBSITE_CONFIG;