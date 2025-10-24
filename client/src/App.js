import React, { useState } from "react";
import "./App.css";
import Controls from "./components/Controls";
import Products from "./components/Products";
import ProductDetail from "./components/ProductDetail";
import Modal from "./components/Modal";

const BASE_URL = process.env.REACT_APP_API_BASE;
const API_KEY = process.env.REACT_APP_API_KEY;

export default function App() {
  const [accept, setAccept] = useState("application/json");
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState("name:asc");
  const [detailId, setDetailId] = useState(null);
  const [detailCache, setDetailCache] = useState(() => new Map());
  const canQuery = Boolean(BASE_URL && API_KEY);

  return (
    <main className="main">
      <h1 className="h1">Lab 10 – Productos</h1>

      <Controls
        accept={accept}
        setAccept={setAccept}
        limit={limit}
        setLimit={setLimit}
        sort={sort}
        setSort={setSort}
      />

      {!canQuery && (
        <p role="alert">
          Falta configurar <code>REACT_APP_API_BASE</code> o <code>REACT_APP_API_KEY</code> en el archivo <code>.env</code>.
        </p>
      )}

      {canQuery && (
        <>
          <Products
            baseUrl={BASE_URL}
            apiKey={API_KEY}
            accept={accept}
            limit={limit}
            sort={sort}
            onOpenDetail={(id) => setDetailId(id)}
          />

          <Modal open={Boolean(detailId)} onClose={() => setDetailId(null)} title="Detalle del producto">
            {detailId && (
              <ProductDetail
                baseUrl={BASE_URL}
                apiKey={API_KEY}
                accept={accept}
                productId={detailId}
                onClose={() => setDetailId(null)}
                cache={detailCache}
                setCache={setDetailCache}
              />
            )}
          </Modal>
        </>
      )}
    </main>
  );
}
