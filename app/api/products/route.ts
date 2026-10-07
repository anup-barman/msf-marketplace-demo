import { getDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

// Backwards-compatible alias of /api/products/summary.
export async function GET() {
  const { productSummaries } = await getDataset();
  return Response.json(productSummaries);
}
