import { getDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

export async function GET() {
  const { allListings } = await getDataset();
  return Response.json({ ok: true, message: "upay Marketplace API is running", totalListings: allListings.length });
}
