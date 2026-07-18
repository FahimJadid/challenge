const test = require('node:test');
const assert = require('node:assert');
const cheerio = require('cheerio');
const { extractProducts, toProduct } = require('../src/parser');

const baseUrl = 'https://www.eldorado.com.uy/bebidas/bebidas-sin-alcohol/jugos-y-jugos-en-polvo?page=1';

// Build a category page with the same JSON-LD and __STATE__ shape the real site uses.
function pageWith(itemList, state) {
  const ld = itemList ? `<script type="application/ld+json">${JSON.stringify(itemList)}</script>` : '';
  const st = state ? `<template data-varname="__STATE__"><script>${JSON.stringify(state)}</script></template>` : '';
  return cheerio.load(`<html><head>${ld}</head><body>${st}</body></html>`);
}

const sampleList = {
  '@type': 'ItemList',
  itemListElement: [
    {
      item: {
        '@id': 'https://www.eldorado.com.uy/jugo-ades-manzana-1lt/p',
        name: 'Jugo Ades Manzana 1Lt',
        image: 'https://eldoradouy.vtexassets.com/arquivos/ids/1/a.jpg',
        offers: { lowPrice: 123, priceCurrency: 'UYU', offers: [{ price: 123, priceCurrency: 'UYU' }] },
      },
    },
    {
      item: {
        '@id': '/jugo-clight-naranja-8gr/p',
        name: 'Jugo Clight Naranja 8Gr',
        image: ['https://eldoradouy.vtexassets.com/arquivos/ids/2/b.jpg'],
        offers: { lowPrice: 27, priceCurrency: 'UYU', offers: [{ price: 27, priceCurrency: 'UYU' }] },
      },
    },
  ],
};

const breadcrumb = {
  'ROOT.breadcrumb.2': {
    name: 'Jugos y Jugos en Polvo',
    href: '/bebidas/bebidas-sin-alcohol/jugos-y-jugos-en-polvo',
    __typename: 'SearchBreadcrumb',
  },
};

test('extracts every product with the required fields', () => {
  const products = extractProducts(pageWith(sampleList, breadcrumb), baseUrl);
  assert.equal(products.length, 2);
  for (const product of products) {
    assert.ok(product.name);
    assert.equal(typeof product.price, 'number');
    assert.match(product.url, /^https:\/\//);
    assert.match(product.image, /^https:\/\//);
    assert.equal(product.category, 'Jugos y Jugos en Polvo');
  }
});

test('resolves relative product URLs against the category URL', () => {
  const products = extractProducts(pageWith(sampleList, breadcrumb), baseUrl);
  assert.equal(products[1].url, 'https://www.eldorado.com.uy/jugo-clight-naranja-8gr/p');
});

test('returns nothing when the page has no product data', () => {
  assert.deepEqual(extractProducts(pageWith(null, null), baseUrl), []);
});

test('prefers the concrete offer price over the aggregate lowPrice', () => {
  const item = {
    name: 'Test',
    '@id': 'https://x/p',
    image: 'https://x/i.jpg',
    offers: { lowPrice: 99, priceCurrency: 'UYU', offers: [{ price: 50, priceCurrency: 'UYU' }] },
  };
  assert.equal(toProduct(item, 'Cat', baseUrl).price, 50);
});

test('falls back to lowPrice, and to null when no price exists', () => {
  const withLow = { name: 'A', '@id': 'https://x/p', offers: { lowPrice: 42 } };
  assert.equal(toProduct(withLow, 'Cat', baseUrl).price, 42);

  const noPrice = { name: 'B', '@id': 'https://x/p', offers: {} };
  assert.equal(toProduct(noPrice, 'Cat', baseUrl).price, null);
});
