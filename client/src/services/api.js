
function buildError(res, raw) {
  const err = new Error(`HTTP ${res.status} ${res.statusText}`);
  err.status = res.status;
  err.body = raw;
  return err;
}

function textToXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const pe = doc.querySelector("parsererror");
  if (pe) throw new Error("XML mal formado");
  return doc;
}

function elementToObject(el) {
  const obj = {};
  Array.from(el.children).forEach((child) => {
    const key = child.tagName.toLowerCase();
    if (child.children.length === 0) {
      obj[key] = child.textContent.trim();
    } else {
      obj[key] = elementToObject(child);
    }
  });
  return obj;
}

function xmlToProductArray(xmlDoc) {
  let nodes = xmlDoc.querySelectorAll("response > data > products");

  if (nodes.length === 0) {
    nodes = xmlDoc.querySelectorAll(
      "response > data > products > product, products > product, product, item, products > item"
    );
  }

  if (nodes.length === 0) {
    const root = xmlDoc.documentElement;
    nodes = root ? root.querySelectorAll("products, product") : [];
  }

  const products = Array.from(nodes).map((n) => {
    const o = elementToObject(n);
    return {
      id: o.id ?? o.productid ?? o._id ?? null,
      name: o.name ?? o.nombre ?? "",
      sku: o.sku ?? "",
      price: Number(o.price ?? o.precio ?? 0),
      description: o.description ?? o.descripcion ?? "",
      category: o.category ?? o.categoria ?? "",
      _raw: o,
    };
  });

  return Array.isArray(products) ? products : [];
}



function xmlFindTotalPages(xmlDoc) {
  const t = xmlDoc.querySelector("totalpages, totalPages, pages");
  return t ? Number(t.textContent) : 1;
}

export async function fetchProducts({ baseUrl, page, limit, accept, apiKey, signal }) {
  const url = new URL("/products", baseUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Accept": accept,
    },
    signal,
  });

  const raw = await res.text();
  if (!res.ok) throw buildError(res, raw);

if (accept === "application/json") {
  const json = JSON.parse(raw);

  let items = [];

  if (Array.isArray(json.data)) {
    items = json.data;
  } else if (Array.isArray(json.data?.products)) {
    items = json.data.products;
  } else if (Array.isArray(json.items)) {
    items = json.items;
  } else if (Array.isArray(json.products)) {
    items = json.products;
  }

  const totalPages =
    json.data?.totalPages ??
    json.totalPages ??
    json.total_pages ??
    json.pages ??
    1;


  return { items, totalPages, raw };
} else {
  const xml = textToXml(raw);
  const items = xmlToProductArray(xml);
  const totalPages = xmlFindTotalPages(xml);
  return { items, totalPages, raw };
}

}

export async function fetchProductById({ baseUrl, id, accept, apiKey, signal }) {
  const url = new URL(`/products/${encodeURIComponent(id)}`, baseUrl);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Accept": accept,
    },
    signal,
  });

  const raw = await res.text();
  if (!res.ok) throw buildError(res, raw);

  if (accept === "application/json") {
    return { data: JSON.parse(raw), raw };
  } else {
    const xml = textToXml(raw);
    const root = xml.documentElement;
    const friendly =
      root && root.children.length ? elementToObject(root) : { xml: "sin estructura" };
    return { data: friendly, raw };
  }
}