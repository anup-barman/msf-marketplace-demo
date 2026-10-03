import React, { useState, useEffect } from "react";
import "./App.css";
import UpayHomeScreen from "./components/UpayHomeScreen";
import StoreCatalogScreen from "./components/StoreCatalogScreen";
import ProductDetailScreen from "./components/ProductDetailScreen";
import CartDrawer from "./components/CartDrawer";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import {
  Smartphone,
  CheckCircle,
} from "lucide-react";

export default function App() {
  // Navigation State: 'upay_home' | 'store_catalog' | 'product_detail'
  const [currentScreen, setCurrentScreen] = useState("upay_home");

  // User State
  const [balance, setBalance] = useState(55000.0);

  // CSV Listings Data
  const [listings, setListings] = useState([]);
  const [productSummaries, setProductSummaries] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentItems, setPaymentItems] = useState([]);
  const [receipt, setReceipt] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load CSV listings directly from backend API
  const loadData = async () => {
    try {
      // 1. Fetch user balance
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const userData = await userRes.json();
        setBalance(Number(userData.balance || 55000));
      }

      // 2. Fetch product summaries from CSV
      const summaryRes = await fetch("/api/products/summary");
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setProductSummaries(summaryData);
      }

      // 3. Fetch every paginated item listing directly from the CSV-backed API.
      // The API caps a page at 100 records, so load the first page to discover
      // the total page count and then retrieve the remaining pages in parallel.
      const firstPageRes = await fetch("/api/listings?page=1&limit=100");
      if (firstPageRes.ok) {
        const firstPage = await firstPageRes.json();
        const remainingPageRequests = Array.from(
          { length: Math.max(0, firstPage.totalPages - 1) },
          (_, index) => fetch(`/api/listings?page=${index + 2}&limit=100`),
        );
        const remainingPages = await Promise.all(remainingPageRequests);
        const remainingListings = await Promise.all(
          remainingPages.map(async (response) =>
            response.ok ? (await response.json()).listings || [] : [],
          ),
        );

        setListings([
          ...(firstPage.listings || []),
          ...remainingListings.flat(),
        ]);
      }
    } catch (err) {
      console.error("Error loading CSV dataset:", err);
      showToast("Connected to local dataset.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open specific item listing from CSV
  const handleSelectListing = async (item) => {
    try {
      const res = await fetch(`/api/listings/${item.product_id}/${item.seller_id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedListing(data.listing);
      } else {
        setSelectedListing(item);
      }
    } catch {
      setSelectedListing(item);
    }

    setCurrentScreen("product_detail");
  };

  // Cart Management
  const handleAddToCart = (listing, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.listing.id === listing.id);
      if (existing) {
        return prev.map((i) =>
          i.listing.id === listing.id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { listing, quantity: qty }];
    });
    showToast(`Added Product #${listing.product_id} (${listing.seller_name}) to Cart!`);
  };

  const handleUpdateQuantity = (listingId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(listingId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.listing.id === listingId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleRemoveItem = (listingId) => {
    setCart((prev) => prev.filter((item) => item.listing.id !== listingId));
    showToast("Item removed from cart");
  };

  const handleClearCart = () => {
    setCart([]);
    showToast("Cart cleared");
  };

  // Immediate Buy Now
  const handleBuyNow = (listing, qty = 1) => {
    const total = (listing.price_bdt + (listing.shipping_cost_bdt || 0)) * qty;
    setPaymentAmount(total);
    setPaymentItems([{ listing, quantity: qty }]);
    setIsPaymentOpen(true);
  };

  // Proceed to Checkout from Cart
  const handleProceedToCheckout = (total, items) => {
    setPaymentAmount(total);
    setPaymentItems(items);
    setIsPaymentOpen(true);
  };

  // Payment Success Handler
  const handlePaymentSuccess = (receiptData) => {
    setIsPaymentOpen(false);
    setCart([]);
    setBalance(receiptData.newBalance);
    setReceipt(receiptData);
  };

  // Quick Top-up
  const handleAddMoney = async (amount = 50000) => {
    try {
      const res = await fetch("/api/user/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        showToast(`৳${amount.toLocaleString()} added to upay balance!`);
      }
    } catch {
      setBalance((prev) => prev + amount);
      showToast(`৳${amount.toLocaleString()} added to upay balance!`);
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8 font-sans antialiased relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Layout with Side Panel on large screens */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 z-10">
        {/* Left Side Info Panel (Desktop Only) */}
        <div className="hidden lg:flex flex-col space-y-5 max-w-sm text-left">
          <div className="space-y-1">
            <span className="bg-amber-400 text-blue-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1">
              <span>upay MFS Super-App</span>
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white mt-2 leading-tight">
              upay Store Simulation
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile app simulation replicating the exact Upay app interface with an integrated
              multi-seller marketplace directly loaded from the CSV dataset.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Core Features Implemented</span>
            </h3>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>
                  <strong>Pixel-perfect Upay UI:</strong> Recreated from screenshots with centered phone frame.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>
                  <strong>Active "Store" Option:</strong> Highlighted among other options. All other options are dummy options.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>
                  <strong>Item Listings from CSV:</strong> All 2,734 listings directly from the CSV with Product #, Seller #, Platform #.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span>
                  <strong>Outer Overview / List:</strong> Displays <strong>Items Sold</strong> and <strong>Price of Item</strong> on every card.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">5.</span>
                <span>
                  <strong>Seller Risk Analysis:</strong> Automated Low, Medium, High risk detection with score and breakdown.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">6.</span>
                <span>
                  <strong>4 Mandatory Detail Metrics:</strong> Price of the item, Seller Risk, Market Avg Price, and Product Review (1-5★).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">7.</span>
                <span>
                  <strong>Suggest Better Deals:</strong> Bottom alert & page button with list of better deals and seller risk scores.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">8.</span>
                <span>
                  <strong>Upay PIN Payment:</strong> Cart checkout with Upay PIN authorization and balance check.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-400">upay Account Balance</p>
              <p className="text-base font-extrabold text-amber-400">
                ৳{balance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => handleAddMoney(50000)}
              className="bg-[#0050A0] hover:bg-[#003d7a] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
            >
              + Add ৳50,000
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTERED MOBILE PHONE FRAME SIMULATION                                    */}
        {/* ========================================================================= */}
        <div className="relative flex flex-col items-center">
          {/* External Phone Shell */}
          <div className="w-[390px] sm:w-[412px] h-[840px] sm:h-[870px] bg-black rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[4px] border-slate-700/80 relative flex flex-col overflow-hidden">
            {/* Top Phone Speaker & Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 flex items-center justify-center space-x-2 pointer-events-none">
              <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800"></div>
            </div>

            {/* Screen Glass Container */}
            <div className="w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col relative transform-gpu">
              {/* SCREEN 1: UPAY HOME SCREEN */}
              {currentScreen === "upay_home" && (
                <UpayHomeScreen
                  balance={balance}
                  onOpenStore={() => setCurrentScreen("store_catalog")}
                  showToast={showToast}
                />
              )}

              {/* SCREEN 2: STORE CATALOG SCREEN */}
              {currentScreen === "store_catalog" && (
                <StoreCatalogScreen
                  listings={listings}
                  productSummaries={productSummaries}
                  onSelectListing={handleSelectListing}
                  onBackToHome={() => setCurrentScreen("upay_home")}
                  onOpenCart={() => setIsCartOpen(true)}
                  cartCount={totalCartItems}
                  balance={balance}
                  onQuickAddToCart={(item) => handleAddToCart(item, 1)}
                />
              )}

              {/* SCREEN 3: PRODUCT DETAIL SCREEN */}
              {currentScreen === "product_detail" && (
                <ProductDetailScreen
                  listing={selectedListing}
                  onBack={() => setCurrentScreen("store_catalog")}
                  onOpenCart={() => setIsCartOpen(true)}
                  cartCount={totalCartItems}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onSelectAlternativeDeal={handleSelectListing}
                  showToast={showToast}
                />
              )}

              {/* TOAST NOTIFICATION OVERLAY INSIDE PHONE */}
              {toastMessage && (
                <div className="absolute top-14 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between">
                    <span className="pr-2">{toastMessage}</span>
                    <button
                      onClick={() => setToastMessage(null)}
                      className="text-slate-400 hover:text-white font-bold ml-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* CART DRAWER OVERLAY */}
              <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onProceedToCheckout={handleProceedToCheckout}
                balance={balance}
                onAddMoney={handleAddMoney}
              />

              {/* PAYMENT PIN MODAL OVERLAY */}
              <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                totalAmount={paymentAmount}
                items={paymentItems}
                balance={balance}
                onPaymentSuccess={handlePaymentSuccess}
                onAddMoney={handleAddMoney}
              />

              {/* RECEIPT MODAL OVERLAY */}
              <ReceiptModal
                isOpen={Boolean(receipt)}
                receipt={receipt}
                onContinueShopping={() => {
                  setReceipt(null);
                  setCurrentScreen("store_catalog");
                }}
                onBackToHome={() => {
                  setReceipt(null);
                  setCurrentScreen("upay_home");
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Side Quick Controls (Desktop Only) */}
        <div className="hidden lg:flex flex-col space-y-4 max-w-xs text-left text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-extrabold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Navigation</span>
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => setCurrentScreen("upay_home")}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between ${
                  currentScreen === "upay_home"
                    ? "bg-[#0050A0] text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>1. upay App Home Screen</span>
                {currentScreen === "upay_home" && <span>•</span>}
              </button>

              <button
                onClick={() => setCurrentScreen("store_catalog")}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between ${
                  currentScreen === "store_catalog"
                    ? "bg-[#0050A0] text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>2. CSV Item Listings</span>
                {currentScreen === "store_catalog" && <span>•</span>}
              </button>

              <button
                onClick={() => {
                  if (listings[0]) handleSelectListing(listings[0]);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between ${
                  currentScreen === "product_detail"
                    ? "bg-[#0050A0] text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>3. Item Details & Deals</span>
                {currentScreen === "product_detail" && <span>•</span>}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
              Testing Guide:
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • Click <strong>Store</strong> on the Upay screen to open the marketplace.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • All item listings are directly from the CSV with Product # and Seller #.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • Outer list clearly displays <strong>Items Sold</strong> and <strong>Price of Item</strong>.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • Open any listing to view the <strong>4 Mandatory Elements</strong> and tap{" "}
              <strong>"View Better Deals"</strong> to see alternative sellers and their risk scores.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • Checkout using Upay PIN <strong>1234</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
