import { getDataset } from "@/lib/dataset";
import { withDealDetails } from "@/lib/deals";

export const dynamic = "force-dynamic";

// Backwards-compatible offer lookup by product and seller.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; sellerId: string }> },
) {
  const { productId: productIdParam, sellerId: sellerIdParam } = await params;
  const productId = Number(productIdParam);
  const sellerId = Number(sellerIdParam);
  const dataset = await getDataset();
  const listing = (dataset.listingsByProduct[productId] || []).find((o) => o.seller_id === sellerId);

  if (!listing) {
    return Response.json({ message: "Offer not found" }, { status: 404 });
  }

  return Response.json({
    product: {
      id: productId,
      name: `Product #${productId}`,
      category: `Category ${productId}`,
    },
    offer: withDealDetails(listing, dataset),
  });
}
