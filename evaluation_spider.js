const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { extractProducts } = require('./src/parser');

// Fetch one page of the category and return its products.
async function run(input) {
  if (!input || !input.url) {
    console.error('Error: Input object with URL is required.');
    return [];
  }

  const url = input.url;
  console.log(`Attempting to scrape: ${url} (page ${input.page})`);

  const response = await fetchWithRetry(url, input.page);
  const $ = cheerio.load(response.data);

  return extractProducts($, url);
}

async function fetchWithRetry(url, page, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await axios.get(url, {
        params: { page },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
    } catch (error) {
      if (attempt >= attempts || !isRetryable(error)) throw error;
      console.error(`Request failed (attempt ${attempt}/${attempts}): ${error.message} - retrying...`);
      await sleep(attempt * 1000);
    }
  }
}

// Retry on network errors and temporary server responses, but not on a real 4xx.
function isRetryable(error) {
  const status = error.response && error.response.status;
  return !status || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function option(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=')[1] : fallback;
}

// last path segment of the category URL, used as the output file name
function categorySlug(url) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).pop() || 'products';
  } catch {
    return 'products';
  }
}

const category = option('category', 'https://www.eldorado.com.uy/bebidas/bebidas-sin-alcohol/jugos-y-jugos-en-polvo');
const pagesArg = option('pages');
const pages = pagesArg === undefined ? Infinity : Number(pagesArg); // without --pages, walk the whole category
const limit = option('limit') ? Number(option('limit')) : null;
const outFile = option('out') || `output/${categorySlug(category)}.json`;

if (pagesArg !== undefined && (!Number.isInteger(pages) || pages < 1)) {
  console.error('Error: --pages must be a positive whole number.');
  process.exit(1);
}

if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
  console.error('Error: --limit must be a positive whole number.');
  process.exit(1);
}

async function main() {
  const products = [];
  const seen = new Set();

  for (let page = 1; page <= pages; page++) {
    if (page > 1) await sleep(700); // small delay to avoid hammering the server
    const scrapingInput = { url: category, page };
    const found = await run(scrapingInput);
    if (found.length === 0) break; // an empty page means we've reached the end

    for (const product of found) {
      if (!seen.has(product.url)) {
        seen.add(product.url);
        products.push(product);
      }
    }

    if (limit && products.length >= limit) break;
  }

  const result = limit ? products.slice(0, limit) : products;

  result.forEach((product, i) => {
    console.log(`${i + 1}. ${product.name}  |  ${product.currency} ${product.price}`);
    console.log(`   ${product.url}`);
  });

  const output = {
    category: result.length ? result[0].category : 'unknown',
    categoryUrl: category,
    scrapedAt: new Date().toISOString(),
    count: result.length,
    products: result,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(`\nCategory: ${output.category}`);
  console.log(`Products found: ${output.count}`);
  console.log(`Saved to ${outFile}`);
}

main().catch((error) => {
  console.error('Scraping failed:', error.message);
  process.exit(1);
});
