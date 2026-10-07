import { useState } from "react";
import { UpayLogo, BanglaQrIcon, ServiceIcons, PaymentIcons, OtherServiceIcons } from "./UpayIcons";
import { Bell, CreditCard, Gift, Home, User, Clock, MoreHorizontal, Eye, EyeOff } from "lucide-react";

interface UpayHomeScreenProps {
  balance: number;
  onOpenStore: () => void;
  showToast: (message: string) => void;
}

export default function UpayHomeScreen({ balance, onOpenStore, showToast }: UpayHomeScreenProps) {
  const [balanceRevealed, setBalanceRevealed] = useState(false);

  const toggleBalance = () => {
    setBalanceRevealed(!balanceRevealed);
  };

  const handleDummyClick = (serviceName: string) => {
    showToast(`"${serviceName}" is a dummy option. Only "Store" is active in this demo!`);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#f2f4f7] overflow-y-auto select-none pb-28">
      {/* 1. Mobile Status Bar */}
      <div className="sticky top-0 z-30 bg-[#FFC400] text-slate-900 px-4 pt-2 pb-1 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <span>10:12</span>
          {/* Messenger Bubble Icon */}
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current opacity-80">
            <path d="M12 2C6.48 2 2 6.03 2 11C2 13.82 3.44 16.32 5.67 17.89V21.5L9.12 19.6C10.04 19.86 11 20 12 20C17.52 20 22 15.97 22 11C22 6.03 17.52 2 12 2ZM13.06 14.19L10.74 11.72L6.22 14.19L11.19 8.91L13.51 11.38L18.03 8.91L13.06 14.19Z" />
          </svg>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span>0.00 KB/s</span>
          {/* Wifi */}
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21L24 8.98C20.93 5.9 16.69 4 12 4ZM4.54 10.6C6.67 8.98 9.24 8 12 8C14.76 8 17.33 8.98 19.46 10.6L12 18.08L4.54 10.6Z" />
          </svg>
          {/* Dual SIM signal */}
          <div className="flex space-x-0.5 items-end h-3">
            <span className="w-0.5 h-1 bg-slate-900 rounded-sm"></span>
            <span className="w-0.5 h-1.5 bg-slate-900 rounded-sm"></span>
            <span className="w-0.5 h-2 bg-slate-900 rounded-sm"></span>
            <span className="w-0.5 h-2.5 bg-slate-900 rounded-sm"></span>
          </div>
          {/* Battery 55% */}
          <div className="flex items-center border border-slate-900 rounded-[3px] px-1 py-0.5 text-[9px] font-bold h-3.5">
            55
          </div>
        </div>
      </div>

      {/* 2. Upay Top Profile Header */}
      <div className="bg-[#FFC400] px-4 pt-2 pb-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          {/* Upay Logo Avatar */}
          <div className="w-13 h-13 rounded-full bg-white shadow-md p-1 flex items-center justify-center border-2 border-white">
            <UpayLogo className="w-11 h-11" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold text-[#111827] tracking-tight leading-tight">
              Nusrat Jahan
            </h1>
            <p className="text-[13px] font-medium text-slate-700">01700000000</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Interactive Balance Pill */}
          <button
            onClick={toggleBalance}
            className="bg-[#0050A0] hover:bg-[#004085] active:scale-95 transition-all text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md flex items-center space-x-1.5"
            title="Tap to reveal balance"
          >
            <span>{balanceRevealed ? `৳ ${Number(balance).toLocaleString("en-BD", { minimumFractionDigits: 2 })}` : "Balance"}</span>
            {balanceRevealed ? <EyeOff className="w-3.5 h-3.5 opacity-80" /> : <Eye className="w-3.5 h-3.5 opacity-80" />}
          </button>

          {/* Bell Icon */}
          <button
            onClick={() => handleDummyClick("Notifications")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#0050A0] hover:bg-yellow-400 active:scale-95 transition"
          >
            <Bell className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-3.5 -mt-2 space-y-4">
        {/* 3. Top Action Grid (11 Dummy + 1 STORE Active) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* Row 1 */}
            <button
              onClick={() => handleDummyClick("Send Money")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.SendMoney />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Send Money</span>
            </button>

            <button
              onClick={() => handleDummyClick("Mobile Recharge")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.MobileRecharge />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Mobile Recharge</span>
            </button>

            <button
              onClick={() => handleDummyClick("Cash Out")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.CashOut />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Cash Out</span>
            </button>

            <button
              onClick={() => handleDummyClick("Pay Bill")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.PayBill />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Pay Bill</span>
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleDummyClick("Add Money")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.AddMoney />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Add Money</span>
            </button>

            <button
              onClick={() => handleDummyClick("Savings")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.Savings />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Savings</span>
            </button>

            <button
              onClick={() => handleDummyClick("Fund Transfer")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.FundTransfer />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Fund Transfer</span>
            </button>

            <button
              onClick={() => handleDummyClick("Request Money")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.RequestMoney />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Request Money</span>
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleDummyClick("Make Payment")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.MakePayment />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Make Payment</span>
            </button>

            <button
              onClick={() => handleDummyClick("Refer & Earn")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.ReferEarn />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">Refer & Earn</span>
            </button>

            <button
              onClick={() => handleDummyClick("NPSB")}
              className="flex flex-col items-center group active:scale-95 transition"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.NPSB />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">NPSB</span>
            </button>

            {/* STORE (THE ONLY WORKING OPTION!) */}
            <button
              onClick={onOpenStore}
              className="flex flex-col items-center group active:scale-90 transition transform hover:scale-105"
            >
              <div className="h-11 flex items-center justify-center">
                <ServiceIcons.Store />
              </div>
              <span className="text-[11px] font-extrabold text-[#0050A0] mt-1 leading-tight flex items-center space-x-0.5">
                <span>Store</span>
              </span>
            </button>
          </div>
        </div>

        {/* 4. Promotional Banner Carousel (GoZayaan Offer from screenshot) */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-white">
          <div className="relative h-32 flex">
            {/* Left sky portion */}
            <div className="w-[45%] bg-gradient-to-b from-[#29B6F6] to-[#0288D1] p-3 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="z-10">
                <p className="text-[12px] font-black leading-tight drop-shadow">
                  পাহাড় নাকি সমুদ্র?
                </p>
                <p className="text-[11px] font-bold text-amber-200 leading-tight">
                  ডেস্টিনেশন এবার কোথায়?
                </p>
              </div>
              {/* Suitcase & glasses icon representation */}
              <div className="text-right z-10">
                <span className="inline-block bg-white/20 backdrop-blur-xs text-[9px] px-2 py-0.5 rounded-full font-bold">
                  GoZayaan ✈️
                </span>
              </div>
              {/* Soft cloud shapes */}
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full"></div>
            </div>

            {/* Right yellow offer cards portion */}
            <div className="w-[55%] bg-[#FFF9C4] p-2.5 flex flex-col justify-between">
              <div className="text-right">
                <span className="bg-[#FFF59D] text-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                  ক্লিক করুন
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-800 text-center leading-tight">
                উপায় থেকে GoZayaan-এ পেমেন্ট করলেই
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-center mt-1">
                <div className="bg-[#FFD54F] rounded-lg p-1 border border-amber-400">
                  <p className="text-[8px] font-bold text-slate-800 leading-none">ডোমেস্টিক ও ইন্ট.</p>
                  <p className="text-[15px] font-black text-[#004D40] leading-tight">১০%</p>
                  <p className="text-[7px] text-slate-700 leading-none">পর্যন্ত ছাড়*</p>
                </div>
                <div className="bg-[#FFD54F] rounded-lg p-1 border border-amber-400">
                  <p className="text-[8px] font-bold text-slate-800 leading-none">হোটেল বুকিং-এ</p>
                  <p className="text-[15px] font-black text-[#004D40] leading-tight">৬৫%</p>
                  <p className="text-[7px] text-slate-700 leading-none">পর্যন্ত ছাড়*</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center space-x-1.5 py-2 bg-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0050A0]"></span>
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          </div>
        </div>

        {/* 5. Section: upay Payments */}
        <div className="space-y-2">
          <h2 className="text-[15px] font-extrabold text-[#004b96] tracking-tight">
            upay Payments
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
              {[
                { name: "Traffic Fine", Icon: PaymentIcons.TrafficFine },
                { name: "Toll Payment", Icon: PaymentIcons.TollPayment },
                { name: "Govt. Payment", Icon: PaymentIcons.GovtPayment },
                { name: "Education", Icon: PaymentIcons.Education },
                { name: "NGO", Icon: PaymentIcons.NGO },
                { name: "Insurance", Icon: PaymentIcons.Insurance },
                { name: "Donation", Icon: PaymentIcons.Donation },
                { name: "Zakat Payment", Icon: PaymentIcons.Zakat },
                { name: "Ticket", Icon: PaymentIcons.Ticket },
                { name: "GP Flexiplan", Icon: PaymentIcons.GPFlexiplan },
                { name: "Hotel", Icon: PaymentIcons.Hotel },
                { name: "Application Fee", Icon: PaymentIcons.ApplicationFee },
                { name: "Othoba", Icon: PaymentIcons.Othoba },
                { name: "Metro Rail", Icon: PaymentIcons.MetroRail },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleDummyClick(item.name)}
                  className="flex flex-col items-center active:scale-95 transition"
                >
                  <div className="h-9 flex items-center justify-center">
                    <item.Icon />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Section: Other Services */}
        <div className="space-y-2">
          <h2 className="text-[15px] font-extrabold text-[#004b96] tracking-tight">
            Other Services
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
              {[
                { name: "Payoneer", Icon: OtherServiceIcons.Payoneer },
                { name: "upay Chaka", Icon: OtherServiceIcons.UpayChaka },
                { name: "Music", Icon: OtherServiceIcons.Music },
                { name: "e-learning", Icon: OtherServiceIcons.Elearning },
                { name: "Games", Icon: OtherServiceIcons.Games },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleDummyClick(item.name)}
                  className="flex flex-col items-center active:scale-95 transition"
                >
                  <div className="h-9 flex items-center justify-center">
                    <item.Icon />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 mt-1 leading-tight">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7. Floating Quick Action Pills: upay Card & upay Offer */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => handleDummyClick("upay Card")}
            className="bg-[#FFF8E1] hover:bg-[#FFF3CD] border border-amber-200/80 rounded-2xl py-2.5 px-3 flex items-center justify-between shadow-xs active:scale-98 transition"
          >
            <span className="text-sm font-bold text-slate-800">upay Card</span>
            <div className="w-9 h-6 rounded bg-gradient-to-r from-teal-400 to-blue-500 shadow-inner flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          </button>

          <button
            onClick={() => handleDummyClick("upay Offer")}
            className="bg-[#FFF8E1] hover:bg-[#FFF3CD] border border-amber-200/80 rounded-2xl py-2.5 px-3 flex items-center justify-between shadow-xs active:scale-98 transition"
          >
            <div className="w-9 h-6 rounded bg-gradient-to-r from-blue-600 to-indigo-700 shadow-inner flex items-center justify-center">
              <Gift className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-sm font-bold text-slate-800">upay Offer</span>
          </button>
        </div>
      </div>

      {/* 8. Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="relative grid min-h-[66px] grid-cols-5 items-end bg-white border-t border-slate-200 px-2 pb-2 pt-2 shadow-lg">
          {/* Home (Active) */}
          <button className="flex w-full flex-col items-center text-[#0050A0]">
            <Home className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-bold mt-0.5">Home</span>
          </button>

          {/* Account */}
          <button onClick={() => handleDummyClick("Account")} className="flex w-full flex-col items-center text-slate-500 hover:text-slate-800">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Account</span>
          </button>

          {/* Elevated Center BANGLA QR Button */}
          <div className="relative flex h-full items-end justify-center">
            <button
              onClick={() => handleDummyClick("Bangla QR Scanner")}
              aria-label="Open Bangla QR scanner"
              className="absolute -top-6 h-15 w-15 rounded-full border-4 border-white bg-white shadow-xl flex items-center justify-center active:scale-95 transition"
            >
              <BanglaQrIcon className="w-14 h-14" />
            </button>
          </div>

          {/* History */}
          <button onClick={() => handleDummyClick("History")} className="flex w-full flex-col items-center text-slate-500 hover:text-slate-800">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">History</span>
          </button>

          {/* More */}
          <button onClick={() => handleDummyClick("More Options")} className="flex w-full flex-col items-center text-slate-500 hover:text-slate-800">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">More</span>
          </button>
        </div>

        {/* Android Home indicator bar */}
        <div className="bg-white py-1 flex justify-center">
          <div className="w-32 h-1 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
