import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Star,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Store,
} from "lucide-react";

export default function StoreCatalogScreen({
  listings = [],
  onSelectListing,
  onBackToHome,
  onOpenCart,
  cartCount = 0,
  balance = 55000,
  onQuickAddToCart,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("sold_desc"); // 'sold_desc', 'price_asc', 'price_desc', 'rating_desc', 'risk_asc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
  };

  const editDistance = (left, right) => {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= right.length; j += 1) {
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  };

  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const fuzzyScore = (query, item) => {
    const terms = normalizeSearchText(query).split(" ").filter(Boolean);
    const fields = [
      item.product_title,
      item.model_id,
      item.seller_name,
      item.platform_name,
      item.product_id,
      item.seller_id,
    ].map(normalizeSearchText);
    const text = fields.join(" ");
    const words = text.split(" ").filter(Boolean);
    let score = 0;

    for (const term of terms) {
      const exactFieldIndex = fields.findIndex((field) => field === term);
      if (exactFieldIndex >= 0) {
        score += 300 - exactFieldIndex * 10;
        continue;
      }

      const prefixFieldIndex = fields.findIndex((field) =>
        field.split(" ").some((word) => word.startsWith(term)),
      );
      if (prefixFieldIndex >= 0) {
        score += 180 - prefixFieldIndex * 10;
        continue;
      }

      if (text.includes(term)) {
        score += 100 - text.indexOf(term) / 100;
        continue;
      }

      const closest = Math.min(...words.map((word) => editDistance(term, word)));
      if (closest > Math.max(1, Math.floor(term.length / 3))) return -1;
      score += 40 - closest * 10;
    }
    return score;
  };

  const renderRiskBadge = (risk) => {
    if (!risk) return null;
    if (risk.level === "Low") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Low Risk ({risk.score})</span>
        </span>
      );
    }
    if (risk.level === "Medium") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>Med Risk ({risk.score})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        <span>High Risk ({risk.score})</span>
      </span>
    );
  };

  // Filtered and Sorted Item Listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery.trim()) {
      result = result
        .map((item) => ({ item, score: fuzzyScore(searchQuery, item) }))
        .filter(({ score }) => score >= 0)
        .sort((left, right) => right.score - left.score)
        .map(({ item }) => item);
    }

    // Platform ID filter
    if (selectedPlatformFilter !== "all") {
      result = result.filter((item) => item.platform_id === Number(selectedPlatformFilter));
    }

    // Risk filter
    if (riskFilter !== "all") {
      result = result.filter((item) => item.seller_risk.level.toLowerCase() === riskFilter.toLowerCase());
    }

    // Stock filter
    if (inStockOnly) {
      result = result.filter((item) => item.stock_available === 1);
    }

    // Sorting
    if (searchQuery.trim() && sortBy === "sold_desc") {
      return result;
    }
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.total_cost_bdt - b.total_cost_bdt);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.total_cost_bdt - a.total_cost_bdt);
    } else if (sortBy === "sold_desc") {
      result.sort((a, b) => b.transaction_count - a.transaction_count);
    } else if (sortBy === "rating_desc") {
      result.sort((a, b) => b.all_time_rating - a.all_time_rating);
    } else if (sortBy === "risk_asc") {
      result.sort((a, b) => a.seller_risk.score - b.seller_risk.score);
    }

    return result;
  }, [listings, searchQuery, selectedPlatformFilter, riskFilter, inStockOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const visibleListings = filteredListings.slice(pageStart, pageStart + itemsPerPage);

  // Product color badge helpers
  const getProductColor = (pid) => {
    const colors = {
      1: "bg-blue-600 text-white",
      2: "bg-indigo-600 text-white",
      3: "bg-purple-600 text-white",
      4: "bg-amber-600 text-white",
      5: "bg-emerald-600 text-white",
    };
    return colors[pid] || "bg-slate-700 text-white";
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto select-none pb-20">
      {/* 1. Store Header with Upay Styling */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 pt-3 pb-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-95"
              title="Back to upay home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#FFC400] flex items-center justify-center text-blue-900 font-bold shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight flex items-center space-x-1">
                  <span>upay Store</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-sm">
                    ML Risk Scores
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">Multi-Seller Marketplace</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Upay Balance Pill */}
            <div className="bg-[#FFF8E1] border border-amber-300/80 px-2.5 py-1 rounded-full text-right">
              <p className="text-[9px] text-slate-500 font-semibold leading-none">upay Balance</p>
              <p className="text-[11px] font-extrabold text-[#0050A0] leading-tight">
                ৳{Number(balance).toLocaleString("en-BD", { maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Cart Icon */}
            <button
              onClick={onOpenCart}
              className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search products, models, sellers, or platforms..."
            className="w-full bg-slate-100 text-xs text-slate-800 rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0050A0] focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* 2. Sub-filters & Sort Bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Platform Filter */}
          <select
            value={selectedPlatformFilter}
            onChange={(e) => {
              setSelectedPlatformFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden"
          >
            <option value="all">Platform: All</option>
            <option value="1">Platform #1</option>
            <option value="2">Platform #2</option>
            <option value="3">Platform #3</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden"
          >
            <option value="all">Risk: All</option>
            <option value="low">🛡️ Low</option>
            <option value="medium">⚠️ Med</option>
            <option value="high">🚨 High</option>
          </select>
        </div>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden"
        >
          <option value="sold_desc">Items Sold (High to Low)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
          <option value="rating_desc">Rating (High to Low)</option>
          <option value="risk_asc">Lowest Risk</option>
        </select>
      </div>

      {/* Item listings */}
      {/* "and the outer overview/list when an user is viewing all the items would have items sold and the price of the item." */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong>{filteredListings.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + itemsPerPage, filteredListings.length)}</strong> of <strong>{filteredListings.length}</strong> listings
          </span>
          <label className="flex items-center space-x-1 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded text-[#0050A0]"
            />
            <span className="text-[11px] font-semibold">In Stock Only</span>
          </label>
        </div>

        <div className="space-y-3">
          {visibleListings.map((item) => {
            const devPct = item.price_deviation_percent;

            return (
              <div
                key={item.id}
                onClick={() => onSelectListing(item)}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition cursor-pointer relative group"
              >
                {/* Header row: Product ID badge & Seller info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${getProductColor(
                        item.product_id,
                      )}`}
                    >
                      {item.product_title}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Seller #{item.seller_id}
                    </span>
                  </div>

                  {/* Seller Risk Badge */}
                  {renderRiskBadge(item.seller_risk)}
                </div>

                {/* Sub-info: Platform & Rating */}
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.platform_name}</span>
                  <div className="flex items-center space-x-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{item.all_time_rating}.0</span>
                    <span className="text-[10px] text-slate-400 font-normal">review</span>
                  </div>
                </div>

                {/* MANDATORY OUTER LIST REQUIREMENTS: PRICE & ITEMS SOLD */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  {/* PRICE OF THE ITEM */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                      Price of Item
                    </p>
                    <div className="mt-1 flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-[#0050A0]">
                        {formatBDT(item.price_bdt)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{formatBDT(item.shipping_cost_bdt)} ship
                      </span>
                    </div>
                  </div>

                  {/* ITEMS SOLD */}
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                      Sales
                    </p>
                    <div className="mt-1">
                      <span className="inline-block bg-slate-100 text-slate-800 text-xs font-extrabold px-2.5 py-0.5 rounded-lg border border-slate-200">
                        🔥 {item.transaction_count.toLocaleString()} sold
                      </span>
                    </div>
                  </div>
                </div>

                {/* Market Avg Comparison & Delivery */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                  <div>
                    <span>Market Avg: <strong>{formatBDT(item.product_average_price_bdt)}</strong></span>
                    {devPct < 0 ? (
                      <span className="text-emerald-700 font-bold ml-1.5">
                        ({Math.abs(devPct)}% below avg)
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold ml-1.5">
                        (+{devPct}% vs avg)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">{item.delivery_time_days}d delivery</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    className={`text-[10px] font-bold ${
                      item.stock_available === 1 ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {item.stock_available === 1 ? "● In Stock" : "○ Out of Stock"}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectListing(item);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
                    >
                      Open Details →
                    </button>
                    {item.stock_available === 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddToCart(item);
                        }}
                        className="bg-[#0050A0] hover:bg-[#003d7a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                      >
                        + Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredListings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No listings match this search or filter.
          </div>
        )}

        {filteredListings.length > 0 && (
          <nav className="flex items-center justify-between border-t border-slate-200 pt-3" aria-label="Listing pages">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
