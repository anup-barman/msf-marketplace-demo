import { useEffect, useState } from "react";
import "./App.css";

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComparison = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommendation/random");
      if (!response.ok) {
        throw new Error("Failed to fetch recommendation");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Could not load marketplace recommendation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MFS Marketplace</p>
          <h1>Better Deal Finder</h1>
        </div>
        <button className="refresh-btn" onClick={fetchComparison}>
          Refresh
        </button>
      </header>

      {loading && <div className="status-card">Loading recommendation...</div>}
      {error && <div className="status-card error">{error}</div>}

      {!loading && result && (
        <>
          <section className="base-card">
            <div className="card-header">
              <span className="badge">Base offer</span>
              <span className="small-text">Product #{result.product_id}</span>
            </div>

            <div className="offer-row">
              <div>
                <p className="label">Seller</p>
                <h2>#{result.base_seller_id}</h2>
              </div>
              <div>
                <p className="label">Total</p>
                <h2>{formatCurrency(result.base_offer.total_cost_bdt)}</h2>
              </div>
            </div>

            <div className="meta-grid">
              <div>
                <span>Price</span>
                <strong>{formatCurrency(result.base_offer.price_bdt)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>
                  {formatCurrency(result.base_offer.shipping_cost_bdt)}
                </strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{result.base_offer.delivery_time_days} days</strong>
              </div>
              <div>
                <span>Warranty</span>
                <strong>{result.base_offer.warranty_days} days</strong>
              </div>
              <div>
                <span>Return</span>
                <strong>{result.base_offer.return_policy_days} days</strong>
              </div>
              <div>
                <span>Stock</span>
                <strong>
                  {result.base_offer.stock_available === 1
                    ? "In stock"
                    : "Out of stock"}
                </strong>
              </div>
            </div>
          </section>

          <section className="recommendations">
            <div className="section-title-row">
              <h3>Recommended alternatives</h3>
              <span>{result.recommended_offers.length} found</span>
            </div>

            {result.recommended_offers.length === 0 ? (
              <div className="empty-state">
                No better deal found for this product.
              </div>
            ) : (
              result.recommended_offers.map((offer) => (
                <article key={offer.seller_id} className="deal-card">
                  <div className="deal-topline">
                    <div>
                      <p className="label">Seller</p>
                      <h4>#{offer.seller_id}</h4>
                    </div>
                    <div className="score-pill">{offer.score.toFixed(4)}</div>
                  </div>

                  <div className="deal-price">
                    {formatCurrency(offer.total_cost_bdt)}
                  </div>

                  <div className="reason-list">
                    {offer.reason.lower_total_cost && (
                      <span>Lower total cost</span>
                    )}
                    {offer.reason.better_delivery && (
                      <span>Faster delivery</span>
                    )}
                    {offer.reason.better_warranty && (
                      <span>Longer warranty</span>
                    )}
                    {offer.reason.better_return_policy && (
                      <span>Better return policy</span>
                    )}
                    {offer.reason.in_stock && <span>In stock</span>}
                  </div>

                  <ul className="offer-meta">
                    <li>Price: {formatCurrency(offer.price_bdt)}</li>
                    <li>Shipping: {formatCurrency(offer.shipping_cost_bdt)}</li>
                    <li>Delivery: {offer.delivery_time_days} days</li>
                    <li>Warranty: {offer.warranty_days} days</li>
                    <li>Return: {offer.return_policy_days} days</li>
                  </ul>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default App;
