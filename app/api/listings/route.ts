import type { NextRequest } from "next/server";
import { getDataset } from "@/lib/dataset";
import type { ListingsPage } from "@/lib/types";

export const dynamic = "force-dynamic";

// Supports filtering by productId, sellerId, platformId, risk level, inStockOnly, search and sorting.
export async function GET(request: NextRequest) {
  const { allListings } = await getDataset();
  const query = request.nextUrl.searchParams;
  const productId = query.get("productId");
  const platformId = query.get("platformId");
  const sellerId = query.get("sellerId");
  const risk = query.get("risk");
  const inStockOnly = query.get("inStockOnly");
  const sort = query.get("sort");
  const search = query.get("search");

  let result = [...allListings];

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
  const page = Math.max(1, Number(query.get("page") ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.get("limit") ?? 60) || 60));
  const startIndex = (page - 1) * limit;

  const body: ListingsPage = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    listings: result.slice(startIndex, startIndex + limit),
  };
  return Response.json(body);
}
