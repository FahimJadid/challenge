// Prices are rendered client-side, so we read products from the page's JSON-LD, not the DOM.
function extractProducts($, baseUrl) {
  const itemList = findItemList($);
  if (!itemList) return [];

  const category = categoryName($, baseUrl);
  return (itemList.itemListElement || [])
    .map((entry) => entry.item)
    .filter(Boolean)
    .map((item) => toProduct(item, category, baseUrl));
}

function findItemList($) {
  let itemList = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    const data = tryParse($(el).text());
    if (data && data['@type'] === 'ItemList') itemList = data;
  });
  return itemList;
}

function toProduct(item, category, baseUrl) {
  const offers = item.offers || {};
  const offer = (offers.offers && offers.offers[0]) || offers;
  const image = Array.isArray(item.image) ? item.image[0] : item.image;
  const price = Number(offer.price ?? offers.lowPrice);

  return {
    name: item.name,
    price: Number.isFinite(price) ? price : null,
    currency: offer.priceCurrency || offers.priceCurrency || null,
    url: absoluteUrl(item['@id'], baseUrl),
    image: absoluteUrl(image, baseUrl),
    category,
  };
}

// Category name comes from the breadcrumb cached in VTEX's __STATE__.
function categoryName($, baseUrl) {
  const state = tryParse($('template[data-varname="__STATE__"]').text());
  const path = cleanPath(new URL(baseUrl).pathname);

  if (state) {
    const crumbs = Object.values(state).filter(
      (v) => v && v.__typename === 'SearchBreadcrumb' && v.name
    );
    const match =
      crumbs.find((c) => cleanPath(c.href) === path) ||
      crumbs.sort((a, b) => b.href.length - a.href.length)[0];
    if (match) return match.name;
  }

  return titleFromSlug(path);
}

function absoluteUrl(href, baseUrl) {
  try {
    return href ? new URL(href, baseUrl).toString() : null;
  } catch {
    return null;
  }
}

function tryParse(text) {
  try {
    return JSON.parse((text || '').trim());
  } catch {
    return null;
  }
}

function cleanPath(path) {
  return (path || '').replace(/\/+$/, '').toLowerCase();
}

function titleFromSlug(path) {
  const slug = path.split('/').filter(Boolean).pop() || '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { extractProducts, toProduct };
