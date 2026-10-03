import React from "react";

// Official Upay Logo
export const UpayLogo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FFFFFF" />
    {/* Upay Yellow Curve */}
    <path
      d="M32 30C32 24.5 36.5 20 42 20C47.5 20 52 24.5 52 30V48C52 57.9 44 66 34 66C24.1 66 16 57.9 16 48V40H26V48C26 52.4 29.6 56 34 56C38.4 56 42 52.4 42 48V30C42 30 42 30 42 30"
      fill="#FFC400"
    />
    <circle cx="32" cy="24" r="6" fill="#FFC400" />
    {/* Upay Blue Curve */}
    <path
      d="M68 30C68 24.5 63.5 20 58 20C52.5 20 48 24.5 48 30V48C48 57.9 56 66 66 66C75.9 66 84 57.9 84 48V40H74V48C74 52.4 70.4 56 66 56C61.6 56 58 52.4 58 48V30"
      fill="#0050A0"
    />
    <circle cx="68" cy="24" r="6" fill="#0050A0" />
    {/* Bengali 'উপায়' Text */}
    <text x="50" y="86" textAnchor="middle" fill="#003566" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
      উপায়
    </text>
  </svg>
);

// Bangla QR Logo for center bottom bar
export const BanglaQrIcon = ({ className = "w-14 h-14" }) => (
  <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="38" fill="#FFFFFF" stroke="#0072CE" strokeWidth="4" />
    <circle cx="40" cy="40" r="32" stroke="#00A859" strokeWidth="1.5" strokeDasharray="3 3" />
    {/* QR Corner boxes */}
    <rect x="22" y="24" width="10" height="10" rx="2" fill="#0050A0" />
    <rect x="24" y="26" width="6" height="6" fill="#FFFFFF" />
    <rect x="25.5" y="27.5" width="3" height="3" fill="#0050A0" />

    <rect x="48" y="24" width="10" height="10" rx="2" fill="#0050A0" />
    <rect x="50" y="26" width="6" height="6" fill="#FFFFFF" />
    <rect x="51.5" y="27.5" width="3" height="3" fill="#0050A0" />

    <rect x="22" y="44" width="10" height="10" rx="2" fill="#0050A0" />
    <rect x="24" y="46" width="6" height="6" fill="#FFFFFF" />
    <rect x="25.5" y="47.5" width="3" height="3" fill="#0050A0" />

    {/* QR dots */}
    <rect x="36" y="24" width="4" height="4" fill="#00A859" />
    <rect x="44" y="38" width="4" height="4" fill="#00A859" />
    <rect x="36" y="46" width="6" height="6" fill="#0072CE" />
    <rect x="48" y="48" width="6" height="4" fill="#FFC400" />

    {/* Bangla QR text */}
    <rect x="20" y="36" width="40" height="8" rx="2" fill="#FFFFFF" />
    <text x="40" y="42" textAnchor="middle" fill="#D90429" fontSize="6.5" fontWeight="bold">
      BANGLA
    </text>
    <text x="40" y="45" textAnchor="middle" fill="#0050A0" fontSize="5" fontWeight="bold">
      QR
    </text>
  </svg>
);

// Top Grid Service Icons (11 dummy + 1 Store)
export const ServiceIcons = {
  SendMoney: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="4" y="10" width="36" height="24" rx="4" fill="#38BDF8" fillOpacity="0.2" stroke="#0284C7" strokeWidth="2" />
      <circle cx="22" cy="22" r="5" fill="#0284C7" fillOpacity="0.3" stroke="#0284C7" strokeWidth="1.5" />
      <path d="M20 22H24M22 20V24" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 18L40 8M40 8H34M40 8V14" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  MobileRecharge: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="14" y="6" width="20" height="36" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
      <circle cx="24" cy="36" r="2" fill="#0284C7" />
      <rect x="18" y="10" width="12" height="18" rx="2" fill="#BAE6FD" />
      <path d="M24 14V24M21 17H27" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 20L6 24L10 28" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  CashOut: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="16" y="8" width="18" height="32" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
      <rect x="20" y="12" width="10" height="14" rx="1" fill="#BAE6FD" />
      <path d="M8 24C8 21.8 9.8 20 12 20H18V28H12C9.8 28 8 26.2 8 24Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      <path d="M14 24H16" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 20L34 20M34 20L31 17M34 20L31 23" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  PayBill: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="12" y="6" width="22" height="36" rx="3" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2" />
      <path d="M17 14H29M17 19H26M17 24H23" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 28L21 34H25L23 40L29 32H25L27 28H24Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  AddMoney: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="10" y="12" width="26" height="20" rx="3" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="2" />
      <rect x="6" y="18" width="26" height="20" rx="3" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="15" cy="28" r="5" fill="#8B5CF6" />
      <path d="M15 25V31M12 28H18" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Savings: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="10" y="12" width="28" height="24" rx="6" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
      <path d="M10 22C10 20 12 18 16 18H32C36 18 38 20 38 22V24H10V22Z" fill="#FDE68A" />
      <circle cx="24" cy="27" r="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      <path d="M22 10C22 8 26 8 26 10V12H22V10Z" fill="#D97706" />
    </svg>
  ),
  FundTransfer: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M8 18L24 10L40 18V20H8V18Z" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
      <rect x="12" y="20" width="4" height="14" fill="#38BDF8" />
      <rect x="22" y="20" width="4" height="14" fill="#38BDF8" />
      <rect x="32" y="20" width="4" height="14" fill="#38BDF8" />
      <rect x="8" y="34" width="32" height="4" rx="1" fill="#0284C7" />
      <path d="M28 8L34 8M34 8L32 6M34 8L32 10" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  RequestMoney: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path
        d="M8 12C8 9.8 9.8 8 12 8H36C38.2 8 40 9.8 40 12V26C40 28.2 38.2 30 36 30H18L10 38V30H12C9.8 30 8 28.2 8 26V12Z"
        fill="#FCE7F3"
        stroke="#DB2777"
        strokeWidth="2"
      />
      <text x="24" y="23" textAnchor="middle" fill="#BE185D" fontSize="14" fontWeight="bold">
        ৳
      </text>
    </svg>
  ),
  MakePayment: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="14" y="6" width="20" height="34" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
      <rect x="18" y="12" width="12" height="12" rx="1" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />
      <rect x="20" y="14" width="3" height="3" fill="#0369A1" />
      <rect x="25" y="14" width="3" height="3" fill="#0369A1" />
      <rect x="20" y="19" width="3" height="3" fill="#0369A1" />
      <rect x="24" y="18" width="4" height="4" fill="#0369A1" />
      <circle cx="24" cy="32" r="2" fill="#0284C7" />
    </svg>
  ),
  ReferEarn: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <circle cx="18" cy="16" r="7" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
      <path d="M7 36C7 29.5 12 26 18 26C24 26 29 29.5 29 36" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <rect x="28" y="14" width="14" height="18" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <path d="M32 20H38M32 24H36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="35" cy="11" r="3" fill="#F59E0B" />
    </svg>
  ),
  NPSB: () => (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M8 24C14 14 34 14 40 24" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 24C14 34 34 34 40 24" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5" fill="#2563EB" />
      <text x="24" y="38" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="bold">
        NPSB
      </text>
    </svg>
  ),
  // THE NEW ACTIVE FEATURE: STORE!
  Store: () => (
    <div className="relative">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-200 flex items-center justify-center shadow-md shadow-amber-300/40 border border-amber-300">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
        New
      </span>
    </div>
  ),
};

// upay Payments section icons (14 services)
export const PaymentIcons = {
  TrafficFine: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="10" y="4" width="16" height="28" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
      <circle cx="18" cy="11" r="3" fill="#EF4444" />
      <circle cx="18" cy="18" r="3" fill="#F59E0B" />
      <circle cx="18" cy="25" r="3" fill="#10B981" />
    </svg>
  ),
  TollPayment: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="6" y="16" width="10" height="16" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
      <path d="M16 20L32 12" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="24" width="6" height="8" rx="1" fill="#BAE6FD" />
    </svg>
  ),
  GovtPayment: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="18" r="14" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="9" fill="#DC2626" />
      <circle cx="18" cy="18" r="4" fill="#FBBF24" />
    </svg>
  ),
  Education: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <path d="M18 6L4 13L18 20L32 13L18 6Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <path d="M10 16.5V24C10 27 14 29 18 29C22 29 26 27 26 24V16.5" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="8" y="28" width="20" height="4" rx="1" fill="#93C5FD" />
    </svg>
  ),
  NGO: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="18" r="13" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
      <circle cx="18" cy="13" r="3" fill="#2563EB" />
      <path d="M12 24C12 20 15 18 18 18C21 18 24 20 24 24" stroke="#2563EB" strokeWidth="1.5" />
      <path d="M8 26C10 24 13 25 18 25C23 25 26 24 28 26" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Insurance: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <path d="M18 4L6 9V18C6 25 11 31 18 33C25 31 30 25 30 18V9L18 4Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
      <path d="M12 18H15L17 14L19 22L21 18H24" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Donation: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="8" y="14" width="20" height="18" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
      <rect x="13" y="14" width="10" height="3" fill="#B45309" />
      <path d="M12 8C12 6.5 14 5 18 5C22 5 24 6.5 24 8V14H12V8Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
    </svg>
  ),
  Zakat: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <path d="M10 16C10 12 14 10 18 10C22 10 26 12 26 16C26 24 28 28 28 28H8C8 28 10 24 10 16Z" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
      <circle cx="18" cy="20" r="3" fill="#10B981" />
      <path d="M14 8C16 6 20 6 22 8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Ticket: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="6" y="10" width="24" height="16" rx="2" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5" />
      <line x1="14" y1="10" x2="14" y2="26" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="22" cy="18" r="3" fill="#A78BFA" />
    </svg>
  ),
  GPFlexiplan: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="13" cy="13" r="4" fill="#3B82F6" />
      <circle cx="23" cy="13" r="4" fill="#EF4444" />
      <circle cx="13" cy="23" r="4" fill="#10B981" />
      <circle cx="23" cy="23" r="4" fill="#F59E0B" />
    </svg>
  ),
  Hotel: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="8" y="8" width="20" height="24" rx="2" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.5" />
      <rect x="12" y="12" width="3" height="3" fill="#0284C7" />
      <rect x="17" y="12" width="3" height="3" fill="#0284C7" />
      <rect x="21" y="12" width="3" height="3" fill="#0284C7" />
      <rect x="12" y="18" width="3" height="3" fill="#0284C7" />
      <rect x="17" y="18" width="3" height="3" fill="#0284C7" />
      <rect x="21" y="18" width="3" height="3" fill="#0284C7" />
      <rect x="15" y="24" width="6" height="8" fill="#0369A1" />
    </svg>
  ),
  ApplicationFee: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="8" y="6" width="18" height="24" rx="2" fill="#F0FDF4" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M12 12H20M12 16H18M12 20H16" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5" fill="#DCFCE7" stroke="#15803D" strokeWidth="1.5" />
      <line x1="28" y1="28" x2="32" y2="32" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Othoba: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="18" r="14" fill="#0284C7" />
      <path d="M11 13H14L16 22H24L26 16H15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="25" r="2" fill="#FFFFFF" />
      <circle cx="23" cy="25" r="2" fill="#FFFFFF" />
    </svg>
  ),
  MetroRail: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="7" y="10" width="22" height="18" rx="4" fill="#DC2626" />
      <rect x="10" y="13" width="16" height="7" rx="1" fill="#FFFFFF" />
      <circle cx="12" cy="24" r="2" fill="#16A34A" />
      <circle cx="24" cy="24" r="2" fill="#16A34A" />
      <line x1="6" y1="30" x2="30" y2="30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

// Other Services icons (5 services)
export const OtherServiceIcons = {
  Payoneer: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="18" r="12" stroke="#EA580C" strokeWidth="3" />
      <circle cx="18" cy="18" r="8" stroke="#F59E0B" strokeWidth="2" />
    </svg>
  ),
  UpayChaka: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="18" r="13" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
      <line x1="18" y1="5" x2="18" y2="31" stroke="#D97706" strokeWidth="1.5" />
      <line x1="5" y1="18" x2="31" y2="18" stroke="#D97706" strokeWidth="1.5" />
      <line x1="9" y1="9" x2="27" y2="27" stroke="#EF4444" strokeWidth="1.5" />
      <line x1="9" y1="27" x2="27" y2="9" stroke="#3B82F6" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="3" fill="#D97706" />
    </svg>
  ),
  Music: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <path d="M12 24C12 26 10 27 8 27C6 27 4 26 4 24C4 22 6 21 8 21C9 21 10 21.5 11 22V8L22 5V19C22 21 20 22 18 22C16 22 14 21 14 19C14 17 16 16 18 16C19 16 20 16.5 21 17V7L12 9.5V24Z" fill="#06B6D4" />
    </svg>
  ),
  Elearning: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <circle cx="18" cy="14" r="8" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5" />
      <ellipse cx="18" cy="14" rx="3.5" ry="8" stroke="#7C3AED" strokeWidth="1.2" />
      <line x1="10" y1="14" x2="26" y2="14" stroke="#7C3AED" strokeWidth="1.2" />
      <rect x="8" y="24" width="20" height="4" rx="1" fill="#C4B5FD" />
      <rect x="6" y="28" width="24" height="4" rx="1" fill="#A78BFA" />
    </svg>
  ),
  Games: () => (
    <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
      <rect x="6" y="10" width="24" height="16" rx="6" fill="#DDD6FE" stroke="#6D28D9" strokeWidth="1.5" />
      <path d="M12 15V21M9 18H15" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="16" r="1.5" fill="#DC2626" />
      <circle cx="25" cy="20" r="1.5" fill="#2563EB" />
    </svg>
  ),
};
