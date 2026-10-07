"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CircleAlert, LoaderCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  MARKETPLACE_SOURCES,
  type ExternalListing,
  type GeneratorStateResponse,
  type ListingsApiResponse,
  type MarketplaceSource,
  type SellerScale,
  type StatsApiResponse,
} from "@/lib/marketplaceSources";

type SourceData = {
  listings: ExternalListing[];
  stats: StatsApiResponse | null;
  generator: GeneratorStateResponse | null;
  error: string | null;
  loading: boolean;
};

type SourceDataMap = Record<MarketplaceSource["id"], SourceData>;
type ViewFilter = "all" | SellerScale;

const EMPTY_SOURCE: SourceData = { listings: [], stats: null, generator: null, error: null, loading: true };
const EMPTY_DATA: SourceDataMap = { a: { ...EMPTY_SOURCE }, b: { ...EMPTY_SOURCE }, c: { ...EMPTY_SOURCE } };
const FILTERS: { id: ViewFilter; label: string }[] = [
  { id: "all", label: "All websites" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "big", label: "Enterprise" },
];

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as unknown;
  const errorMessage = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error
    : null;
  if (!response.ok) throw new Error(errorMessage || `Request failed (${response.status})`);
  return body as T;
}

function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return `৳${value.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function sourceForScale(scale: SellerScale) {
  return MARKETPLACE_SOURCES.find((source) => source.scale === scale)!;
}

export default function MarketplaceDashboard() {
  const [data, setData] = useState<SourceDataMap>(EMPTY_DATA);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<Set<MarketplaceSource["id"]>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const results = await Promise.all(MARKETPLACE_SOURCES.map(async (source) => {
      try {
        const [listings, stats, generator] = await Promise.all([
          readJson<ListingsApiResponse>(`${source.baseUrl}/api/listings?limit=60`),
          readJson<StatsApiResponse>(`${source.baseUrl}/api/stats`),
          readJson<GeneratorStateResponse>(`${source.baseUrl}/api/state`),
        ]);
        return [source.id, { listings: listings.rows || [], stats, generator, error: null, loading: false }] as const;
      } catch (error) {
        return [source.id, { listings: [], stats: null, generator: null, error: error instanceof Error ? error.message : "Could not connect", loading: false }] as const;
      }
    }));
    setData((current) => {
      const updated = { ...current };
      for (const [id, result] of results) updated[id] = result;
      return updated;
    });
    if (manual) setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const listings = useMemo(() => MARKETPLACE_SOURCES
    .flatMap((source) => data[source.id].listings)
    .filter((listing) => filter === "all" || listing.seller_scale === filter)
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()), [data, filter]);

  const connectedCount = MARKETPLACE_SOURCES.filter((source) => !data[source.id].loading && !data[source.id].error).length;
  const totalListings = MARKETPLACE_SOURCES.reduce((sum, source) => sum + (data[source.id].stats?.total ?? 0), 0);
  const totalSuspicious = MARKETPLACE_SOURCES.reduce((sum, source) => sum + (data[source.id].stats?.suspicious ?? 0), 0);
  const globalTotal = MARKETPLACE_SOURCES.reduce((max, source) => Math.max(max, data[source.id].stats?.total_all ?? 0), 0);

  const toggleGenerator = async (source: MarketplaceSource, enabled: boolean) => {
    setPending((current) => new Set(current).add(source.id));
    setActionError(null);
    try {
      const generator = await readJson<GeneratorStateResponse>(`${source.baseUrl}/api/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setData((current) => ({ ...current, [source.id]: { ...current[source.id], generator, error: null } }));
    } catch (error) {
      setActionError(`${source.name}: ${error instanceof Error ? error.message : "Could not update generator"}`);
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(source.id);
        return next;
      });
    }
  };

  const toggleAll = async () => {
    const shouldEnable = MARKETPLACE_SOURCES.some((source) => !data[source.id].generator?.enabled);
    await Promise.all(MARKETPLACE_SOURCES.map((source) => toggleGenerator(source, shouldEnable)));
  };

  return (
    <main className="min-h-screen bg-[#080D18] text-slate-100 px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> upay Store</Link>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300"><Wifi size={21} /></span>
              <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Marketplace network</h1><p className="mt-1 text-sm text-slate-400">Live listings and seller health across three platforms</p></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{connectedCount} of 3 connected</span>
            <button onClick={() => void refresh(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Listings across platforms" value={totalListings.toLocaleString()} note={`Shared database total: ${globalTotal.toLocaleString()}`} />
          <SummaryCard label="Flagged as suspicious" value={totalSuspicious.toLocaleString()} note={totalListings ? `${((totalSuspicious / totalListings) * 100).toFixed(1)}% of connected listings` : "Waiting for source data"} accent="amber" />
          <SummaryCard label="Active generators" value={`${MARKETPLACE_SOURCES.filter((source) => data[source.id].generator?.enabled).length} / 3`} note="Each source generates listings independently" accent="emerald" />
        </section>

        {actionError && <div role="alert" className="rounded-xl border border-rose-900/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{actionError}</div>}

        <section className="grid gap-3 lg:grid-cols-3">
          {MARKETPLACE_SOURCES.map((source) => {
            const sourceData = data[source.id];
            const isPending = pending.has(source.id);
            return (
              <article key={source.id} className="rounded-2xl border border-slate-800 bg-[#101827] p-5 shadow-lg shadow-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{source.name}</p><h2 className="mt-1 text-xl font-bold capitalize">{source.scale} sellers</h2><p className="mt-1 truncate text-xs text-slate-500">{source.baseUrl}</p></div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${sourceData.error ? "bg-rose-400/10 text-rose-300" : sourceData.loading ? "bg-slate-700/60 text-slate-300" : "bg-emerald-400/10 text-emerald-300"}`}>
                    {sourceData.error ? <WifiOff size={13} /> : <Wifi size={13} />}{sourceData.error ? "Offline" : sourceData.loading ? "Connecting" : "Online"}
                  </span>
                </div>
                {sourceData.error ? <p className="mt-5 flex min-h-14 items-start gap-2 text-sm text-rose-300"><CircleAlert size={16} className="mt-0.5 shrink-0" />{sourceData.error}</p> : <>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <Metric label="Items" value={sourceData.stats?.total.toLocaleString() ?? "—"} />
                    <Metric label="Suspicious" value={sourceData.stats?.suspicious.toLocaleString() ?? "—"} />
                    <Metric label="Avg. price" value={formatMoney(sourceData.stats?.avg_price)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Rating {sourceData.stats?.avg_rating?.toFixed(2) ?? "—"}</span><span>Last update {formatTime(sourceData.stats?.last_row_at)}</span>
                  </div>
                </>}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                  <div><p className="text-sm font-semibold">Generator</p><p className="mt-0.5 text-xs text-slate-500">{sourceData.generator?.enabled ? `Running · ${formatTime(sourceData.generator.last_tick_at)}` : "Paused"}</p></div>
                  <button onClick={() => void toggleGenerator(source, !sourceData.generator?.enabled)} disabled={isPending || Boolean(sourceData.error) || !sourceData.generator} aria-pressed={Boolean(sourceData.generator?.enabled)} className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${sourceData.generator?.enabled ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}>
                    {isPending ? <LoaderCircle size={15} className="animate-spin" /> : null}{sourceData.generator?.enabled ? "Pause" : "Start"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101827]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
            <div><h2 className="text-lg font-bold">Live listing feed</h2><p className="mt-1 text-xs text-slate-500">Latest records from all reachable sources, refreshed every 5 seconds</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => void toggleAll()} disabled={pending.size > 0 || connectedCount === 0} className="rounded-lg border border-cyan-800 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-40">Toggle all generators</button>
              <div className="flex rounded-lg bg-slate-900 p-1">
                {FILTERS.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${filter === item.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>{item.label}</button>)}
              </div>
            </div>
          </div>
          {listings.length === 0 ? <div className="px-5 py-14 text-center"><p className="font-semibold text-slate-300">{connectedCount ? "No listings for this view yet" : "Waiting for marketplace websites"}</p><p className="mt-2 text-sm text-slate-500">Check that source websites are running on ports 3001, 3002, and 3003.</p></div> : <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Product</th><th className="px-4 py-3">Platform</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Risk</th><th className="px-5 py-3">Listed</th></tr></thead>
              <tbody className="divide-y divide-slate-800/80">{listings.map((listing) => {
                const source = sourceForScale(listing.seller_scale);
                const suspicious = listing.is_suspicious_listing === 1;
                return <tr key={`${listing.seller_scale}-${listing.id}`} className="hover:bg-white/[0.025]">
                  <td className="px-5 py-3.5"><div className="font-semibold text-slate-100">{listing.product_name}</div><div className="mt-0.5 text-xs text-slate-500">{listing.model_id} · {listing.product_condition}</div></td>
                  <td className="px-4 py-3.5"><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs capitalize text-slate-300">{source.name} · {listing.seller_scale}</span></td>
                  <td className="px-4 py-3.5"><div>{listing.seller_id}</div><div className="mt-0.5 text-xs text-slate-500">{listing.seller_txn_count.toLocaleString()} orders</div></td>
                  <td className="px-4 py-3.5 font-semibold">{formatMoney(listing.product_price_bdt)}<div className={`mt-0.5 text-xs ${listing.price_deviation_pct < 0 ? "text-emerald-400" : "text-slate-500"}`}>{listing.price_deviation_pct > 0 ? "+" : ""}{listing.price_deviation_pct.toFixed(1)}% vs market</div></td>
                  <td className="px-4 py-3.5">{listing.product_rating_all_time == null ? "—" : `${listing.product_rating_all_time.toFixed(1)} / 5`}</td>
                  <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${suspicious ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"}`}>{suspicious ? "Review" : "Clear"}</span></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{formatTime(listing.created_at)} <ArrowUpRight size={12} className="ml-1 inline" /></td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
        </section>
        <footer className="text-center text-xs text-slate-600">Source endpoints are open and unauthenticated · Refresh interval 5 seconds</footer>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, note, accent = "cyan" }: { label: string; value: string; note: string; accent?: "cyan" | "amber" | "emerald" }) {
  const color = accent === "amber" ? "text-amber-300" : accent === "emerald" ? "text-emerald-300" : "text-cyan-300";
  return <article className="rounded-2xl border border-slate-800 bg-[#101827] p-5"><p className="text-sm text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-900/80 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-bold">{value}</p></div>;
}
