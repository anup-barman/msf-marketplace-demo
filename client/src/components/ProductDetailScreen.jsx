import React, { useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Truck,
  RotateCcw,
  Award,
  Package,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Check,
  Flame,
  ArrowRight,
  Share2,
  Calendar,
  Layers,
} from "lucide-react";

export default function ProductDetailScreen({
  listing,
  onBack,
  onOpenCart,
  cartCount = 0,
  onAddToCart,
  onBuyNow,
  onSelectAlternativeDeal,
  showToast,
}) {
  const [quantity, setQuantity] = useState(1);
  const [showBetterDealsModal, setShowBetterDealsModal] = useState(false);
  const [betterDealsPage, setBetterDealsPage] = useState(1);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-slate-500">Loading item listing details...</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-[#0050A0] text-white text-xs font-bold rounded-xl"
        >
          Return to Store
        </button>
      </div>
    );
  }

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
  };

  const mandatory = listing.mandatory_attributes || {
    price_bdt: listing.price_bdt,
    seller_risk: listing.seller_risk,
    product_average_price_bdt: listing.product_average_price_bdt,
    all_time_rating: listing.all_time_rating,
  };

  const risk = mandatory.seller_risk || listing.seller_risk;
  const currentPrice = mandatory.price_bdt || listing.price_bdt;
  const avgPrice = mandatory.product_average_price_bdt || listing.product_average_price_bdt;
  const rating = mandatory.all_time_rating || listing.all_time_rating || 5;
  const totalCost = listing.total_cost_bdt || currentPrice + (listing.shipping_cost_bdt || 0);

  const priceDiff = avgPrice - currentPrice;
  const priceDiffPct = Math.round((priceDiff / avgPrice) * 100);

  const betterDeals = listing.better_deals || [];
  const hasBetterDeals = betterDeals.length > 0;
  const betterDealsPerPage = 6;
  const betterDealsTotalPages = Math.max(1, Math.ceil(betterDeals.length / betterDealsPerPage));
  const visibleBetterDeals = betterDeals.slice(
    (betterDealsPage - 1) * betterDealsPerPage,
    betterDealsPage * betterDealsPerPage,
  );
  const openBetterDeals = () => {
    setBetterDealsPage(1);
    setShowBetterDealsModal(true);
  };
  const maxSavings = hasBetterDeals
    ? Math.max(...betterDeals.map((d) => d.savings_bdt || 0))
    : 0;

  const renderStars = (score) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= score ? "text-amber-400 fill-amber-400" : "text-slate-300"
          }`}
        />,
      );
    }
    return stars;
  };

  const getProductColor = (pid) => {
    const colors = {
      1: "from-blue-600 to-indigo-700",
      2: "from-indigo-600 to-purple-700",
      3: "from-purple-600 to-pink-700",
      4: "from-amber-500 to-orange-600",
      5: "from-emerald-600 to-teal-700",
    };
    return colors[pid] || "from-slate-700 to-slate-900";
  };

  return (
    <div className="relative flex flex-col h-full bg-[#f8fafc] overflow-y-auto select-none pb-28">
      {/* 1. Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center px-2 truncate flex-1">
          <p className="text-xs font-bold text-slate-900 truncate">
            {listing.product_title} — {listing.seller_name}
          </p>
          <p className="text-[10px] text-slate-500 font-medium">{listing.platform_name}</p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => showToast(`Listing link for ${listing.product_title} copied!`)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenCart}
            className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Item Banner Graphic (No fake brand names - based on Product ID from CSV) */}
      <div className="bg-white p-4 border-b border-slate-200">
        <div
          className={`relative w-full h-44 rounded-2xl bg-gradient-to-tr ${getProductColor(
            listing.product_id,
          )} p-5 text-white flex flex-col justify-between shadow-sm overflow-hidden`}
        >
          <div className="flex justify-between items-start z-10">
            <div>
              <span className="bg-white/20 backdrop-blur-xs text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                CSV Marketplace Listing
              </span>
              <h1 className="text-2xl font-black mt-1">{listing.product_title}</h1>
            </div>
            <span className="bg-white text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
              {listing.seller_name}
            </span>
          </div>

          <div className="flex justify-between items-end z-10 text-xs">
            <div>
              <p className="text-[10px] text-white/80">Platform</p>
              <p className="font-bold">{listing.platform_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/80">Market Average</p>
              <p className="font-extrabold text-sm">{formatBDT(avgPrice)}</p>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          <Layers className="w-28 h-28 text-white/5 absolute -right-2 top-2 pointer-events-none" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Offered by </span>
            <strong className="text-slate-900 font-bold">{listing.seller_name}</strong>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded">
            {listing.platform_name}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* ========================================================================= */}
        {/* 3. THE 4 MANDATORY THINGS DISPLAYED WHEN AN USER OPENS AN ITEM            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 border-2 border-blue-600/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
                4 Mandatory Item Attributes
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Key Metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* MANDATORY 1: Price of the item */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                  1. Price of the Item
                </p>
                <div className="mt-1">
                  <span className="text-xl font-black text-blue-950">
                    {formatBDT(currentPrice)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 pt-1.5 border-t border-blue-200/50">
                Shipping: <strong>{formatBDT(listing.shipping_cost_bdt)}</strong>
                <br />
                Total: <strong>{formatBDT(totalCost)}</strong>
              </p>
            </div>

            {/* MANDATORY 3: Average Market Price of this item */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  3. Average Market Price
                </p>
                <div className="mt-1">
                  <span className="text-xl font-black text-slate-900">
                    {formatBDT(avgPrice)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[10px] font-bold">
                {priceDiff >= 0 ? (
                  <span className="text-emerald-700 flex items-center space-x-0.5">
                    <TrendingDown className="w-3 h-3 shrink-0" />
                    <span>{priceDiffPct}% below average</span>
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center space-x-0.5">
                    <TrendingUp className="w-3 h-3 shrink-0" />
                    <span>{Math.abs(priceDiffPct)}% above average</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MANDATORY 2: Seller Risk Analysis (Low, Medium, or High) */}
          <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  2. Seller Risk Analysis
                </span>
                <span className="text-[10px] text-slate-400">({risk.score}/100)</span>
              </div>

              {risk.level === "Low" && (
                <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Low Risk</span>
                </span>
              )}
              {risk.level === "Medium" && (
                <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Medium Risk</span>
                </span>
              )}
              {risk.level === "High" && (
                <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                  <span>High Risk</span>
                </span>
              )}
            </div>

            {/* Visual Risk Meter */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${risk.score}%`,
                    backgroundColor: risk.color || (risk.level === "Low" ? "#10b981" : risk.level === "Medium" ? "#f59e0b" : "#ef4444"),
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                <span>0 (Safe)</span>
                <span>34 (Medium)</span>
                <span>67 (High Risk)</span>
                <span>100</span>
              </div>
            </div>

            {/* Detailed Risk Factors from CSV */}
            <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-slate-100">
              <div className="bg-slate-100/70 rounded-lg p-1">
                <p className="text-[8px] text-slate-500 font-semibold">Refund Rate</p>
                <p className="text-[11px] font-extrabold text-slate-800">{risk.factors.refund_rate}%</p>
              </div>
              <div className="bg-slate-100/70 rounded-lg p-1">
                <p className="text-[8px] text-slate-500 font-semibold">Rating</p>
                <p className="text-[11px] font-extrabold text-slate-800">{risk.factors.all_time_rating}★</p>
              </div>
              <div className="bg-slate-100/70 rounded-lg p-1">
                <p className="text-[8px] text-slate-500 font-semibold">Seller Age</p>
                <p className="text-[11px] font-extrabold text-slate-800">{risk.factors.seller_age_days}d</p>
              </div>
              <div className="bg-slate-100/70 rounded-lg p-1">
                <p className="text-[8px] text-slate-500 font-semibold">Orders</p>
                <p className="text-[11px] font-extrabold text-slate-800">{risk.factors.transaction_count}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 italic">"{risk.summary}"</p>
          </div>

          {/* MANDATORY 4: Product Review (1 to 5 stars) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                4. Product Review
              </p>
              <div className="flex items-center space-x-1.5 mt-1">
                <div className="flex space-x-0.5">{renderStars(rating)}</div>
                <span className="text-sm font-black text-slate-900 ml-1">
                  {rating}.0 <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                {listing.transaction_count.toLocaleString()} sold
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BETTER DEAL AVAILABLE EXTRA OPTION / BANNER                               */}
        {/* ========================================================================= */}
        {hasBetterDeals ? (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="bg-white text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center space-x-1 shadow-xs">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>Better Deal Available!</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-100">
                  {betterDeals.length} alternatives found
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black leading-tight">
                  Better deal available for {listing.product_title}!
                </h4>
                <p className="text-[11px] text-amber-100 mt-0.5">
                  Save up to {formatBDT(maxSavings)} from other sellers who offer better prices or lower risk scores.
                </p>
              </div>

              {/* Extra option button as requested */}
              <button
                onClick={openBetterDeals}
                className="w-full bg-white hover:bg-amber-50 active:scale-98 text-slate-900 font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <span>View All Better Deals & Seller Risk Scores ({betterDeals.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
              </button>
            </div>
            <Sparkles className="w-20 h-20 text-white/10 absolute -right-3 -bottom-3" />
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center space-x-2.5 text-emerald-900">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold">No better comparable offer found</p>
              <p className="text-[10px] text-emerald-700">
                No same-model listing currently meets the lower-price or lower-risk criteria.
              </p>
            </div>
          </div>
        )}

        {/* 4. Other Key Statistics from CSV */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Listing Specifications & Statistics
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Delivery Time</p>
                <p className="font-bold text-slate-800">{listing.delivery_time_days} days</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Warranty</p>
                <p className="font-bold text-slate-800">{listing.warranty_days} days</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Return Policy</p>
                <p className="font-bold text-slate-800">{listing.return_policy_days} days</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Stock Availability</p>
                <p className={`font-bold ${listing.stock_available === 1 ? "text-emerald-700" : "text-red-600"}`}>
                  {listing.stock_available === 1 ? "In Stock" : "Out of Stock"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Seller Age</p>
                <p className="font-bold text-slate-800">{listing.seller_age_days} days</p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl">
              <TrendingDown className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400">Price Deviation</p>
                <p className="font-bold text-slate-800">{listing.price_deviation_percent}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BETTER DEALS MODAL / SHEET                                             */}
      {/* ========================================================================= */}
      {showBetterDealsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 max-w-[430px] mx-auto w-full">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-current" />
                  <h3 className="text-sm font-black text-slate-900">
                    Better Deals for {listing.product_title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Alternative sellers offering lower price, lower risk, or faster delivery
                </p>
              </div>
              <button
                onClick={() => setShowBetterDealsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current vs Better Summary */}
            <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500">Current Seller:</span>
                <span className="font-bold text-slate-800 ml-1">
                  {formatBDT(totalCost)} ({listing.seller_name})
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-orange-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                {betterDeals.length} Alternatives
              </span>
            </div>

            {/* List of Better Deals with Risk Scores */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {visibleBetterDeals.map((deal) => {
                const dealRisk = deal.seller_risk || {};
                const dealTotal = deal.total_cost_bdt || deal.price_bdt + deal.shipping_cost_bdt;

                return (
                  <div
                    key={deal.seller_id}
                    className="border border-slate-200 rounded-2xl p-3.5 hover:border-blue-400 bg-white shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-extrabold text-slate-900">
                            {deal.seller_name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {deal.platform_name}
                        </p>
                      </div>

                      {/* MANDATORY: Risk Score of the Seller */}
                      <div>
                        {dealRisk.level === "Low" && (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Risk Score: {dealRisk.score} (Low)</span>
                          </span>
                        )}
                        {dealRisk.level === "Medium" && (
                          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>Risk Score: {dealRisk.score} (Med)</span>
                          </span>
                        )}
                        {dealRisk.level === "High" && (
                          <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Risk Score: {dealRisk.score} (High)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Savings */}
                    <div className="flex items-baseline justify-between bg-slate-50 p-2 rounded-xl">
                      <div>
                        <span className="text-base font-black text-[#0050A0]">
                          {formatBDT(dealTotal)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                          ({formatBDT(deal.price_bdt)} + {formatBDT(deal.shipping_cost_bdt)} ship)
                        </span>
                      </div>

                      {deal.savings_bdt > 0 && (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Save {formatBDT(deal.savings_bdt)} ({deal.savings_percent}% OFF)
                        </span>
                      )}
                    </div>

                    {/* Why this is a better deal */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Why this is a better deal:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {deal.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="bg-blue-50 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-blue-100 flex items-center space-x-1"
                          >
                            <span>✓</span>
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta stats from CSV */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Rating: <strong>{deal.all_time_rating}★</strong></span>
                      <span>Delivery: <strong>{deal.delivery_time_days} days</strong></span>
                      <span>Warranty: <strong>{deal.warranty_days} days</strong></span>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setShowBetterDealsModal(false);
                          onSelectAlternativeDeal(deal);
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl transition"
                      >
                        Switch to this Deal
                      </button>
                      <button
                        onClick={() => {
                          setShowBetterDealsModal(false);
                          onAddToCart(deal, 1);
                        }}
                        className="flex-1 bg-[#0050A0] hover:bg-[#003d7a] text-white text-xs font-bold py-2 rounded-xl transition shadow-xs"
                      >
                        Add this Deal to Cart
                      </button>
                    </div>
                  </div>
                );
              })}

              {betterDeals.length > betterDealsPerPage && (
                <nav className="flex items-center justify-between border-t border-slate-200 pt-3" aria-label="Better deal pages">
                  <button
                    type="button"
                    onClick={() => setBetterDealsPage((page) => Math.max(1, page - 1))}
                    disabled={betterDealsPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Page {betterDealsPage} of {betterDealsTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBetterDealsPage((page) => Math.min(betterDealsTotalPages, page + 1))}
                    disabled={betterDealsPage === betterDealsTotalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STICKY BOTTOM ACTION BAR (WITH BETTER DEAL NOTIFICATION IF AVAILABLE)    */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl">
        {/* Suggest Better Deal bottom banner if available */}
        {hasBetterDeals && (
          <div
            onClick={openBetterDeals}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-bold cursor-pointer hover:opacity-95 transition"
          >
            <div className="flex items-center space-x-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Better deal available! Save up to {formatBDT(maxSavings)}</span>
            </div>
            <span className="underline shrink-0 text-[10px] uppercase font-black ml-2">
              View ({betterDeals.length}) →
            </span>
          </div>
        )}

        <div className="p-3 flex items-center space-x-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 font-bold active:scale-95 transition"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-extrabold text-slate-800">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-700 font-bold active:scale-95 transition"
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={() => onAddToCart(listing, quantity)}
            disabled={listing.stock_available === 0}
            className="flex-1 bg-amber-400 hover:bg-amber-500 active:scale-98 disabled:opacity-50 text-slate-900 font-extrabold text-xs py-3 px-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>

          {/* Buy Now */}
          <button
            onClick={() => onBuyNow(listing, quantity)}
            disabled={listing.stock_available === 0}
            className="flex-1 bg-[#0050A0] hover:bg-[#003d7a] active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs py-3 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1"
          >
            <span>Buy Now</span>
          </button>
        </div>

        {/* Android Home indicator bar */}
        <div className="bg-white pb-1 flex justify-center">
          <div className="w-32 h-1 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
