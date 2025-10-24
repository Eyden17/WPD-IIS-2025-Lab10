import React, { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../services/api";

function sortItems(items, sort) {
  const [field, dir] = sort.split(":");
  const sign = dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const va = a?.[field] ?? "";
    const vb = b?.[field] ?? "";
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
    return String(va).localeCompare(String(vb)) * sign;
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatNumber(n) { if (typeof n !== "number" || !Number.isFinite(n)) return "-"; return new Intl.NumberFormat("es-CR").format(n); }


export default function Products({ baseUrl, apiKey, accept, limit, sort, onOpenDetail }) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    loading: false,
    error: null,
    items: [],
    totalPages: 1,
    lastRawList: "",
  });

  useEffect(() => {
    setPage(1);
  }, [limit, accept]);

  useEffect(() => {
    if (!baseUrl || !apiKey) return;
    const ac = new AbortController();

    async function loadData() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        await delay(2000);

        const { items, totalPages, raw } = await fetchProducts({
          baseUrl,
          page,
          limit,
          accept,
          apiKey,
          signal: ac.signal,
        });

        setState({ loading: false, error: null, items, totalPages, lastRawList: raw });
      } catch (err) {
        if (err.name !== "AbortError") {
          setState({
            loading: false,
            error: err,
            items: [],
            totalPages: 1,
            lastRawList: "",
          });
        }
      }
    }

    loadData();
    return () => ac.abort();
  }, [baseUrl, apiKey, accept, page, limit]);

  const sorted = useMemo(() => sortItems(state.items, sort), [state.items, sort]);

  const renderSkeletonGrid = () => {
    const n = Math.max(6, Math.min(limit || 12, 12));
    return (
      <div className="cards">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="card sk-card skeleton" aria-hidden="true" />
        ))}
      </div>
    );
  };

  const renderCards = () => (
    <div className="cards">
      {sorted.map((p) => {
        const id = p.id ?? p.sku ?? p.name;
        return (
          <button
            key={id}
            onClick={() => onOpenDetail(id)}
            title="Abrir detalle"
            className="card"
          >
            <p className="card-title">{p.name ?? "(sin nombre)"}</p>
            {p.sku && <div className="card-meta">SKU: {p.sku}</div>}
            {"price" in p && <div className="card-meta">Precio: ₡ {formatNumber(p.price)}</div>}
          </button>
        );
      })}
    </div>
  );

  return (
    <section aria-label="Listado de productos">
      {state.loading && renderSkeletonGrid()}

      {!state.loading && state.error && (
        <div role="alert">
          <p>Error: {state.error.message}</p>
          <button className="btn" onClick={() => setPage((p) => p)}>
            Reintentar
          </button>
        </div>
      )}

      {!state.loading && !state.error && sorted.length === 0 && (
        <p>No hay productos para mostrar.</p>
      )}

      {!state.loading && !state.error && sorted.length > 0 && renderCards()}

      <nav aria-label="Paginación" className="pager">
        <button
          className="btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          ⟨ Anterior
        </button>

        <span className="page-indicator">
          Página {page} / {state.totalPages}
        </span>

        <button
          className="btn"
          onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
          disabled={page >= state.totalPages}
        >
          Siguiente ⟩
        </button>
      </nav>

    </section>
  );
}
