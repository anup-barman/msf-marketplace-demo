import { getUserStore } from "@/lib/userStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { amount = 50000 } = ((await request.json().catch(() => ({}))) ?? {}) as { amount?: number | string };
  const topUp = Number(amount);

  if (isNaN(topUp) || topUp <= 0) {
    return Response.json({ success: false, message: "Invalid top-up amount." }, { status: 400 });
  }

  const user = getUserStore();
  user.balance += topUp;
  return Response.json({ success: true, balance: user.balance, message: `Added ৳${topUp} to upay Balance.` });
}
