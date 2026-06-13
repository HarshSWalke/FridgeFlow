const BASE_URL = 'https://world.openfoodfacts.org';

const CATEGORY_MAP = [
  { key: 'dairy', category: 'Dairy' },
  { key: 'milk', category: 'Dairy' },
  { key: 'cheese', category: 'Dairy' },
  { key: 'yogurt', category: 'Dairy' },
  { key: 'vegetables', category: 'Vegetables' },
  { key: 'vegetable', category: 'Vegetables' },
  { key: 'fruit', category: 'Fruits' },
  { key: 'fruits', category: 'Fruits' },
  { key: 'dry', category: 'Dry Goods' },
  { key: 'cereal', category: 'Dry Goods' },
  { key: 'bread', category: 'Dry Goods' },
  { key: 'snack', category: 'Snacks' },
  { key: 'snacks', category: 'Snacks' },
  { key: 'beverage', category: 'Beverages' },
  { key: 'drink', category: 'Beverages' },
  { key: 'juice', category: 'Beverages' },
  { key: 'water', category: 'Beverages' },
];

const normalizeCategory = (value) => {
  if (!value) return 'Other';
  const token = value.toString().toLowerCase();
  const match = CATEGORY_MAP.find((entry) => token.includes(entry.key));
  return match ? match.category : 'Other';
};

const normalizeQuantity = (quantityText) => {
  if (!quantityText) return null;
  const normalized = quantityText.toString().trim().toLowerCase();
  const match = normalized.match(/([\d.,]+)\s*(kg|g|l|ml|pcs|pc|count|ct|packets|packet|bottles|bottle|packs|pack)/i);
  if (!match) return null;

  let [_, value, unit] = match;
  value = parseFloat(value.replace(/,/g, '.'));
  if (Number.isNaN(value)) return null;

  unit = unit.toLowerCase();
  if (unit === 'pc') unit = 'pcs';
  if (unit === 'count' || unit === 'ct') unit = 'pcs';
  if (unit === 'packet' || unit === 'pack') unit = 'packets';
  if (unit === 'bottle') unit = 'bottles';

  return { quantity: value, unit };
};

const normalizeProduct = (product) => {
  const name = product.product_name || product.generic_name || product.brands || 'Unknown Product';
  const brand = product.brands || product.brand_owner || '';
  const categories = product.categories_tags || product.categories || [];
  const rawQuantity = product.quantity || '';
  const quantityInfo = normalizeQuantity(rawQuantity);

  const category = normalizeCategory(
    Array.isArray(categories) ? categories.join(' ') : categories.toString()
  );

  return {
    code: product.code,
    name,
    brand,
    category,
    rawQuantity,
    quantity: quantityInfo?.quantity || null,
    unit: quantityInfo?.unit || 'pcs',
    image: product.image_thumb_url || product.image_url || null,
    source: 'openfoodfacts',
  };
};

export const searchProducts = async (query, limit = 8) => {
  if (!query || !query.toString().trim()) {
    return [];
  }

  const searchUrl = `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;
  console.log('Open Food Facts search URL:', searchUrl);

  let response;
  try {
    response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'FridgeFlow/1.0',
      },
    });
  } catch (err) {
    console.error('Open Food Facts fetch failed', { url: searchUrl, error: err.message });
    throw new Error('Open Food Facts temporarily unavailable');
  }

  if (response.status === 503) {
    const body = await response.text().catch(() => '');
    console.warn('Open Food Facts service unavailable', { url: searchUrl, status: response.status, body: body.slice(0, 200) });
    throw new Error('Open Food Facts temporarily unavailable');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Open Food Facts search failed', { url: searchUrl, status: response.status, body: body.slice(0, 200) });
    throw new Error(`Open Food Facts search failed (${response.status})`);
  }

  const data = await response.json();
  const products = Array.isArray(data.products) ? data.products : [];

  return products.map(normalizeProduct).filter((item) => item.name);
};

export const lookupProductByBarcode = async (barcode) => {
  if (!barcode) {
    throw new Error('Barcode is required');
  }

  const url = `${BASE_URL}/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FridgeFlow/1.0',
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Open Food Facts barcode lookup failed', { url, status: response.status, body: body.slice(0, 200) });
    throw new Error('Open Food Facts barcode lookup failed');
  }

  const data = await response.json();
  if (!data || data.status !== 1 || !data.product) {
    throw new Error('Product not found for barcode');
  }

  return normalizeProduct(data.product);
};
