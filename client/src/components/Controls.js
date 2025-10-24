import React from "react";

export default function Controls({ accept, setAccept, limit, setLimit, sort, setSort }) {
  return (
    <section aria-label="Controles" className="controls">
      <div>
        <label>
          Formato:
          <select value={accept} onChange={(e) => setAccept(e.target.value)} aria-label="Selector de formato">
            <option value="application/json">JSON</option>
            <option value="application/xml">XML</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Tamaño de página:
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Ordenar:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name:asc">name:asc</option>
            <option value="name:desc">name:desc</option>
            <option value="price:asc">price:asc</option>
            <option value="price:desc">price:desc</option>
          </select>
        </label>
      </div>
    </section>
  );
}
