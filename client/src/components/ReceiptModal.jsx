import React from "react";
import { CheckCircle2, Home, ShoppingBag } from "lucide-react";

export default function ReceiptModal({
  isOpen,
  receipt,
  onContinueShopping,
  onBackToHome,
}) {
  if (!isOpen || !receipt) return null;

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
  };

  const formattedDate = receipt.paidAt
    ? new Date(receipt.paidAt).toLocaleString("en-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[400px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Receipt Header Banner */}
        <div className="bg-emerald-600 text-white p-6 text-center space-y-2 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs mx-auto flex items-center justify-center border-2 border-white/40 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="text-lg font-black tracking-tight">Payment Successful!</h2>
            <p className="text-xs text-emerald-100 font-medium">upay Marketplace Purchase</p>
          </div>

          <div className="pt-2">
            <span className="text-3xl font-black">{formatBDT(receipt.amount)}</span>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
        </div>

        {/* Receipt Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Transaction ID</span>
              <strong className="text-slate-900 font-mono text-[11px]">
                {receipt.transactionId}
              </strong>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Payment Date</span>
              <strong className="text-slate-800">{formattedDate}</strong>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Merchant</span>
              <strong className="text-slate-800">{receipt.merchant}</strong>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Paid By</span>
              <strong className="text-slate-800">Nusrat Jahan (01700000000)</strong>
            </div>

            <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">Remaining Balance</span>
              <strong className="text-emerald-700 text-sm font-black">
                {formatBDT(receipt.newBalance)}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
              ✓
            </div>
            <p>
              Your order has been placed successfully and will be delivered by the designated seller.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onContinueShopping}
              className="w-full bg-[#0050A0] hover:bg-[#003d7a] active:scale-98 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>

            <button
              onClick={onBackToHome}
              className="w-full bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to upay Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
