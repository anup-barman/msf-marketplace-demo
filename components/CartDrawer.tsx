import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Wallet,
  AlertCircle,
  Package,
} from "lucide-react";
import type { CartItem } from "@/lib/types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart?: CartItem[];
  onUpdateQuantity: (listingId: string, quantity: number) => void;
  onRemoveItem: (listingId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: (total: number, items: CartItem[]) => void;
  balance?: number;
  onAddMoney: (amount?: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  balance = 55000,
  onAddMoney,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const formatBDT = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.listing.price_bdt || 0) * item.quantity, 0);
  const shippingTotal = cart.reduce((sum, item) => sum + (item.listing.shipping_cost_bdt || 0) * item.quantity, 0);
  const totalAmount = subtotal + shippingTotal;

  const hasEnoughBalance = balance >= totalAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-[430px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#0050A0] text-white flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Your Cart</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {cart.length} item listing{cart.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] text-red-600 font-bold hover:underline"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Browse live items and compare deals from connected sellers.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#0050A0] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const listing = item.listing;
              const risk = listing.seller_risk;

              return (
                <div
                  key={listing.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex space-x-3 relative group"
                >
                  {/* Item badge block */}
                  <div className="w-14 h-14 rounded-xl bg-[#0050A0] text-white overflow-hidden shrink-0 flex flex-col items-center justify-center font-bold">
                    <Package className="w-5 h-5 text-amber-300 mb-0.5" />
                    <span className="text-[10px] leading-none">#{listing.product_id}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate pr-4">
                        Product #{listing.product_id}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(listing.id)}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium">
                      {listing.seller_name} ({listing.platform_name})
                    </p>

                    {/* Risk Badge */}
                    <div className="mt-0.5">
                      {risk.level === "Low" && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Low Risk ({risk.score})</span>
                        </span>
                      )}
                      {risk.level === "Medium" && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          <span>Med Risk ({risk.score})</span>
                        </span>
                      )}
                      {risk.level === "High" && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-red-700 bg-red-100/70 px-1.5 py-0.2 rounded">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>High Risk ({risk.score})</span>
                        </span>
                      )}
                    </div>

                    {/* Price and Quantity */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-[#0050A0]">
                        {formatBDT(listing.price_bdt * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(listing.id, item.quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(listing.id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 p-4 bg-white space-y-3 shadow-lg">
            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Listings Subtotal</span>
                <span className="font-semibold">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Total</span>
                <span className="font-semibold">{formatBDT(shippingTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-1.5">
                <span>Total Amount</span>
                <span className="text-[#0050A0] text-base">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            {/* Upay Balance Checker */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                hasEnoughBalance
                  ? "bg-blue-50/70 border-blue-200 text-blue-950"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 leading-tight">Available upay Balance</p>
                  <p className="font-extrabold text-xs">{formatBDT(balance)}</p>
                </div>
              </div>

              {!hasEnoughBalance && (
                <button
                  onClick={() => onAddMoney(50000)}
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-2xs"
                >
                  + Add ৳50,000
                </button>
              )}
            </div>

            {/* Insufficient Warning */}
            {!hasEnoughBalance && (
              <div className="flex items-center space-x-1.5 text-[11px] text-red-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Insufficient balance! You need {formatBDT(totalAmount - balance)} more to purchase.
                </span>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout(totalAmount, cart);
              }}
              className="w-full bg-[#0050A0] hover:bg-[#003d7a] active:scale-98 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Proceed to Payment with upay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
