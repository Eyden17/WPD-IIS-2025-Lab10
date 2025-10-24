import React, { useState, useEffect } from "react";
import { fetchProductById } from "../services/api";

function toNumber(n) { const num = Number(n); return Number.isFinite(num) ? num : undefined; }
function unwrapPayload(envelope) {
  if (!envelope || typeof envelope !== "object") return envelope;
  const d = envelope.data ?? envelope.result ?? envelope.item ?? envelope.product ?? envelope.Product ?? null;
  return d ?? envelope;
}
function normalizeProduct(data) {
  const u = unwrapPayload(data);
  const src = (u && (u.product ?? u.Product)) || u || {};
  const id = src.id ?? src.productid ?? src._id ?? src.Id ?? src.ID;
  const name = src.name ?? src.nombre ?? src.Name ?? src.Nombre;
  const sku = src.sku ?? src.SKU ?? src.Sku;
  const price = toNumber(src.price ?? src.precio ?? src.Price ?? src.Precio);
  const stock = toNumber(src.stock ?? src.existencias ?? src.Stock ?? src.Existencias);
  const category = src.category ?? src.categoria ?? src.Category ?? src.Categoria;
  const description = src.description ?? src.descripcion ?? src.Description ?? src.Descripcion;
  return { id, name, sku, price, stock, category, description, _raw: src };
}
function formatNumber(n) { if (typeof n !== "number" || !Number.isFinite(n)) return "-"; return new Intl.NumberFormat("es-CR").format(n); }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function Switch({ checked, onChange, label }) {
  const id = "sw-" + Math.random().toString(36).slice(2, 8);
  return (
    <label htmlFor={id} className="switch">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      <span className="switch-label">{label}</span>
    </label>
  );
}

export default function ProductDetail({
  baseUrl,
  apiKey,
  accept,
  productId,
  onClose,
  cache,
  setCache,
}) {
  const [state, setState] = useState({ loading: false, error: null, data: null, raw: "" });
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const cached = cache.get(productId);
    if (cached && cached.accept === accept) {
      setState({ loading: false, error: null, data: cached.data, raw: cached.raw });
      return;
    }

    const ac = new AbortController();
    async function loadDetail() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        await delay(2000); // demo skeleton
        const { data, raw } = await fetchProductById({ baseUrl, id: productId, accept, apiKey, signal: ac.signal });
        setCache((prev) => { const c = new Map(prev); c.set(productId, { data, raw, accept }); return c; });
        setState({ loading: false, error: null, data, raw });
      } catch (err) {
        if (err.name !== "AbortError") setState({ loading: false, error: err, data: null, raw: "" });
      }
    }
    loadDetail();
    return () => ac.abort();
  }, [productId, accept, apiKey, baseUrl, setCache, cache]);

  if (!productId) return null;

  const renderSkeletonCard = () => (
    <div className="detail-card">
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line lg" />
      </div>
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line md" />
      </div>
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line md" />
      </div>
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line md" />
      </div>
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line md" />
      </div>
      <div className="detail-row">
        <div className="detail-label skeleton sk-line sm" />
        <div className="detail-value skeleton sk-line lg" />
      </div>
    </div>
  );

  return (
    <section aria-label="Detalle de producto">
      <div className="detail-toolbar">
        <Switch checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} label="Ver Raw" />
      </div>

      {state.loading && renderSkeletonCard()}

      {!state.loading && state.error && (
        <div role="alert">
          <p>Error: {state.error.message}</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(state.error.body ?? "").slice(0, 500)}
          </pre>
        </div>
      )}

      {!state.loading && !state.error && state.data && (
        showRaw ? (
          <pre className="pre-raw">
            {(() => {
              try {
                const parsed = JSON.parse(state.raw);
                return JSON.stringify(parsed, null, 2);
              } catch {
                return state.raw.replace(/></g, ">\n<");
              }
            })()}
          </pre>
        ) : (
          (() => {
            const p = normalizeProduct(state.data);
            return (
              <div className="detail-card">
                <div className="detail-row">
                  <div className="detail-label">ID</div>
                  <div className="detail-value">{p.id ?? "-"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Nombre</div>
                  <div className="detail-value">{p.name ?? "-"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">SKU</div>
                  <div className="detail-value">{p.sku ?? "-"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Precio</div>
                  <div className="detail-value">₡ {p.price !== undefined ? formatNumber(p.price) : "-"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Stock</div>
                  <div className="detail-value">{p.stock !== undefined ? formatNumber(p.stock) : "-"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Categoría</div>
                  <div className="detail-value">{p.category ?? "-"}</div>
                </div>
                {p.description ? (
                  <div className="detail-row">
                    <div className="detail-label">Descripción</div>
                    <div className="detail-value">{p.description}</div>
                  </div>
                ) : null}
              </div>
            );
          })()
        )
      )}
    </section>
  );
}
