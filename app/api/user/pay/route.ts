import { getUserStore } from "@/lib/userStore";

export const dynamic = "force-dynamic";

interface PayRequest {
  pin?: string | number;
  amount?: number | string;
  items?: unknown[];
}

export async function POST(request: Request) {
  const { pin, amount, items } = ((await request.json().catch(() => ({}))) ?? {}) as PayRequest;
  const user = getUserStore();

  if (!pin || !/^\d{4}$/.test(pin.toString())) {
    return Response.json({ success: false, message: "Please enter a valid 4-digit upay PIN." }, { status: 400 });
  }

  if (pin.toString() !== user.defaultPin) {
    return Response.json({ success: false, message: "Incorrect upay PIN. Please try again." }, { status: 401 });
  }

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return Response.json({ success: false, message: "Invalid payment amount." }, { status: 400 });
  }

  if (user.balance < payAmount) {
    const shortfall = payAmount - user.balance;
    return Response.json(
      {
        success: false,
        insufficientBalance: true,
        message: `Insufficient upay Balance. You need ৳${shortfall.toLocaleString("en-BD", { minimumFractionDigits: 2 })} more.`,
        currentBalance: user.balance,
        requiredAmount: payAmount,
        shortfall,
      },
      { status: 400 },
    );
  }

  user.balance = Number((user.balance - payAmount).toFixed(2));

  const transactionId = `UPAY${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  return Response.json({
    success: true,
    message: "Payment successful!",
    transactionId,
    amount: payAmount,
    newBalance: user.balance,
    paidAt: new Date().toISOString(),
    merchant: "upay Online Store",
    merchantId: "UPAY-MRKT-8841",
    itemsCount: Array.isArray(items) ? items.length : 1,
  });
}
