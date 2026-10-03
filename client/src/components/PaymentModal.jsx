import React, { useState } from "react";
import { UpayLogo } from "./UpayIcons";
import { X, Lock, AlertCircle, Delete, PlusCircle } from "lucide-react";

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  items = [],
  balance = 55000,
  onPaymentSuccess,
  onAddMoney,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const formatBDT = (amount) => {
    return `৳${Number(amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
  };

  const hasEnoughBalance = balance >= totalAmount;

  const handleKeyPress = (num) => {
    setError("");
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setError("");
    setPin((prev) => prev.slice(0, -1));
  };

  const handleConfirm = async () => {
    setError("");

    if (!hasEnoughBalance) {
      setError(`Insufficient balance. You need ${formatBDT(totalAmount - balance)} more.`);
      return;
    }

    if (pin.length !== 4) {
      setError("Please enter your 4-digit upay PIN.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pin,
          amount: totalAmount,
          items: items,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      // Success
      setPin("");
      onPaymentSuccess(data);
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Upay Yellow Top Header */}
        <div className="bg-[#FFC400] px-4 pt-3 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-white shadow-xs p-0.5 flex items-center justify-center">
              <UpayLogo className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 leading-tight">
                upay Payment Gateway
              </h3>
              <p className="text-[10px] text-slate-700 font-semibold">Secure PIN Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-yellow-400/80 hover:bg-yellow-500 flex items-center justify-center text-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Payable Amount</p>
              <h2 className="text-2xl font-black text-[#0050A0]">{formatBDT(totalAmount)}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Merchant:</span>
              <strong className="text-slate-800">upay Online Store (UPAY-MRKT-8841)</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Account:</span>
              <strong className="text-slate-800">Nusrat Jahan (01700000000)</strong>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>Available Balance:</span>
              <strong className={hasEnoughBalance ? "text-emerald-700" : "text-red-600 font-bold"}>
                {formatBDT(balance)}
              </strong>
            </div>
          </div>
        </div>

        {/* Balance Status or Warning */}
        {!hasEnoughBalance ? (
          <div className="p-4 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Insufficient upay Balance!</span>
              </div>
              <p className="text-[11px] text-red-700">
                You currently have {formatBDT(balance)}, but this order requires {formatBDT(totalAmount)}.
                Shortfall: <strong>{formatBDT(totalAmount - balance)}</strong>.
              </p>
            </div>

            <button
              onClick={() => onAddMoney(50000)}
              className="w-full bg-[#0050A0] hover:bg-[#003d7a] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top-up ৳50,000 to upay Account</span>
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* PIN Entry Instruction */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800">Enter your 4-digit upay PIN</p>
              <p className="text-[10px] text-slate-400 font-medium">
                Demo Hint: Enter default PIN <strong>1234</strong> (or any 4 digits)
              </p>
            </div>

            {/* Masked PIN Indicators */}
            <div className="flex justify-center items-center space-x-4 py-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > index
                      ? "bg-[#0050A0] border-[#0050A0] scale-110 shadow-xs"
                      : "border-slate-300 bg-white"
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-[11px] font-bold text-red-600 text-center bg-red-50 py-1 px-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-base font-extrabold text-slate-800 shadow-2xs transition flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPin("")}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-[11px] font-bold text-slate-500 transition flex items-center justify-center"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-base font-extrabold text-slate-800 shadow-2xs transition flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Confirm Payment Button */}
            <button
              onClick={handleConfirm}
              disabled={loading || pin.length !== 4}
              className="w-full bg-[#0050A0] hover:bg-[#003d7a] active:scale-98 disabled:opacity-50 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
