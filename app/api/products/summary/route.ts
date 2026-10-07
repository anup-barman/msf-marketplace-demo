import { getDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";

export async function GET() {
  const { productSummaries } = await getDataset();
  return Response.json(productSummaries);
}
