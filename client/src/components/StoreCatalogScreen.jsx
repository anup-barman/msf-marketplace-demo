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
  productSummaries = [],
  onSelectListing,
  onBackToHome,
  onOpenCart,
  cartCount = 0,
  balance = 55000,
  onQuickAddToCart,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("sold_desc"); // 'sold_desc', 'price_asc', 'price_desc', 'rating_desc', 'risk_asc'

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_title.toLowerCase().includes(q) ||
          item.seller_name.toLowerCase().includes(q) ||
          item.platform_name.toLowerCase().includes(q) ||
          item.product_id.toString().includes(q) ||
          item.seller_id.toString().includes(q) ||
          item.price_bdt.toString().includes(q),
      );
    }

    // Product ID filter
    if (selectedProductFilter !== "all") {
      result = result.filter((item) => item.product_id === Number(selectedProductFilter));
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
  }, [listings, searchQuery, selectedProductFilter, selectedPlatformFilter, riskFilter, inStockOnly, sortBy]);

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
                    CSV Listings
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Product ID, Seller ID, Platform..."
            className="w-full bg-slate-100 text-xs text-slate-800 rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0050A0] focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Product ID Filter Pills */}
        <div className="flex space-x-1.5 overflow-x-auto py-2 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedProductFilter("all")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
              selectedProductFilter === "all"
                ? "bg-[#0050A0] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Products ({listings.length})
          </button>
          {[1, 2, 3, 4, 5].map((pid) => (
            <button
              key={pid}
              onClick={() => setSelectedProductFilter(pid.toString())}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                selectedProductFilter === pid.toString()
                  ? "bg-[#0050A0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Product #{pid}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Sub-filters & Sort Bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Platform Filter */}
          <select
            value={selectedPlatformFilter}
            onChange={(e) => setSelectedPlatformFilter(e.target.value)}
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
            onChange={(e) => setRiskFilter(e.target.value)}
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
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden"
        >
          <option value="sold_desc">Items Sold (High to Low)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
          <option value="rating_desc">Rating (High to Low)</option>
          <option value="risk_asc">Lowest Risk</option>
        </select>
      </div>

      {/* 3. Products Quick Stats Summary from CSV */}
      {selectedProductFilter === "all" && productSummaries.length > 0 && (
        <div className="px-3.5 pt-3">
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-3 text-white shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                CSV Dataset Overview (2,734 Listings)
              </span>
              <span className="text-[10px] text-slate-300">5 Products</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center">
              {productSummaries.map((p) => (
                <button
                  key={p.product_id}
                  onClick={() => setSelectedProductFilter(p.product_id.toString())}
                  className="bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition"
                >
                  <p className="text-[10px] font-bold text-amber-200">Prod #{p.product_id}</p>
                  <p className="text-[9px] font-medium text-slate-200">
                    {formatBDT(p.product_average_price_bdt)}
                  </p>
                  <p className="text-[8px] text-slate-400">{p.total_listings} offers</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Outer Overview / Item Listings List */}
      {/* "and the outer overview/list when an user is viewing all the items would have items sold and the price of the item." */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong>{filteredListings.length}</strong> item listings
          </span>
          <label className="flex items-center space-x-1 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-[#0050A0]"
            />
            <span className="text-[11px] font-semibold">In Stock Only</span>
          </label>
        </div>

        <div className="space-y-3">
          {filteredListings.slice(0, 50).map((item) => {
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
                      Product #{item.product_id}
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
                  <span>Platform #{item.platform_id}</span>
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
      </div>
    </div>
  );
}
