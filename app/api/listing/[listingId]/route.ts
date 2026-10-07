import { getDataset } from "@/lib/dataset";
import { withDealDetails } from "@/lib/deals";

export const dynamic = "force-dynamic";

// A single listing with the 4 mandatory attributes and comparable-model better deals.
export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const dataset = await getDataset();
  const listing = dataset.allListings.find((item) => item.id === listingId);

  if (!listing) {
    return Response.json({ message: "Item listing not found in dataset" }, { status: 404 });
  }

  return Response.json({ listing: withDealDetails(listing, dataset) });
}
