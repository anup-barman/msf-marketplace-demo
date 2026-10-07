import { getDataset } from "@/lib/dataset";
import { findBetterDeals } from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET() {
  const dataset = await getDataset();
  const pids = Object.keys(dataset.listingsByProduct);
  const pid = Number(pids[Math.floor(Math.random() * pids.length)]);
  const offers = dataset.listingsByProduct[pid] || [];
  const baseOffer = offers[Math.floor(Math.random() * offers.length)];

  return Response.json({
    product_id: pid,
    base_seller_id: baseOffer.seller_id,
    base_offer: baseOffer,
    recommended_offers: findBetterDeals(baseOffer, dataset),
  });
}
