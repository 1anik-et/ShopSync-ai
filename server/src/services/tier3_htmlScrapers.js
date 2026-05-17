/**
 * ═══════════════════════════════════════════════════════════════════════
 *  TIER 3 — TARGETED HTML SCRAPERS (Cheerio, NO Puppeteer)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  WHY:  Niche brand sites and Shopify stores don't have public APIs
 *        and aren't well-indexed by Google Shopping. But they DO serve
 *        lightweight HTML or Shopify JSON that Cheerio can parse instantly.
 *
 *  SITES: CrepDogCrew, CultureCircle (Shopify JSON),
 *         Zara, H&M (targeted HTML + JSON endpoints)
 *
 *  NO PUPPETEER. NO HEADLESS BROWSER. Just HTTP → parse → done.
 *
 *  RETURNS: { CrepDogCrew: [...], CultureCircle: [...], Zara: [...], 'H&M': [...] }
 * ═══════════════════════════════════════════════════════════════════════
 */
const cheerio = require('cheerio');
const { createClient, parsePrice, isValidProduct, formatProduct } = require('./_helpers');

const MAX_PER_SITE = 10;

// ═══════════════════════════════════════════════════════════════
//  SHOPIFY STORES — CrepDogCrew & CultureCircle
//  Both run on Shopify, so we use the /search/suggest.json endpoint
// ═══════════════════════════════════════════════════════════════
async function fetchShopifyStore(query, storeName, baseUrl) {
  const items = [];
  try {
    const client = createClient({
      'Accept': 'application/json',
      'Referer': `${baseUrl}/`,
    });

    // Shopify's built-in search suggest API — returns structured JSON
    const url = `${baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${MAX_PER_SITE}`;
    const res = await client.get(url);

    const products = res.data?.resources?.results?.products || [];
    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      let img = p.image || p.featured_image?.url || '';
      if (img && img.startsWith('//')) img = `https:${img}`;

      const product = formatProduct({
        title: p.title || '',
        price: parsePrice(p.price),
        originalPrice: p.compare_at_price ? parsePrice(p.compare_at_price) : null,
        productUrl: `${baseUrl}${p.url || `/products/${p.handle}`}`,
        imageUrl: img,
      }, storeName, i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) {
    // Shopify API failed, try HTML fallback
    try {
      const client = createClient();
      const res = await client.get(`${baseUrl}/search?q=${encodeURIComponent(query)}&type=product`);
      const $ = cheerio.load(res.data);

      $('.grid__item, .product-card, .collection-product-card').each((i, el) => {
        if (items.length >= MAX_PER_SITE) return;
        const title = $(el).find('.product-card__title, .product__title, h3').first().text().trim();
        let link = $(el).find('a').first().attr('href') || '';
        if (link && !link.startsWith('http')) link = `${baseUrl}${link}`;
        const price = parsePrice($(el).find('.price-item, .price, .money').first().text());
        let image = $(el).find('img').first().attr('src') || '';
        if (image.startsWith('//')) image = `https:${image}`;

        if (title.length > 3 && price > 0) {
          const product = formatProduct({ title, price, productUrl: link, imageUrl: image }, storeName, items.length);
          if (isValidProduct(product)) items.push(product);
        }
      });
    } catch (err2) { /* both failed */ }
  }

  console.log(`  [Tier3/${storeName}] → ${items.length} products`);
  return items;
}

// Convenience wrappers
const fetchCrepDogCrew   = (query) => fetchShopifyStore(query, 'CrepDogCrew',   'https://crepdogcrew.com');
const fetchCultureCircle = (query) => fetchShopifyStore(query, 'CultureCircle', 'https://www.culturecircle.com');

// ═══════════════════════════════════════════════════════════════
//  ZARA — Product search via internal JSON API
// ═══════════════════════════════════════════════════════════════
async function fetchZara(query) {
  const items = [];
  try {
    const client = createClient({
      'Accept': 'application/json',
      'Referer': 'https://www.zara.com/in/',
      'Origin': 'https://www.zara.com',
    });

    // Zara's internal search API
    const url = `https://www.zara.com/in/en/search?searchTerm=${encodeURIComponent(query)}&ajax=true`;
    const res = await client.get(url);

    // Zara returns nested JSON with product groups
    const products = res.data?.products
      || res.data?.productGroups?.flatMap(g => g.elements?.flatMap(e => e.commercialComponents || []))
      || [];

    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      const name = p.name || p.commercialName || '';
      const price = p.price / 100 || p.salePrice / 100 || parsePrice(p.priceFormatted);
      let img = '';
      if (p.xmedia && p.xmedia.length > 0) {
        const media = p.xmedia[0];
        img = `https://static.zara.net/photos/${media.path}/w/400/${media.name}.jpg?ts=${media.timestamp}`;
      } else if (p.image) {
        img = p.image;
      }

      const product = formatProduct({
        title: name,
        price,
        productUrl: p.seo?.keyword ? `https://www.zara.com/in/en/${p.seo.keyword}-p${p.seo.seoProductId}.html` : `https://www.zara.com/in/en/search?searchTerm=${encodeURIComponent(query)}`,
        imageUrl: img,
      }, 'Zara', i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) { /* silent */ }

  // Fallback: Cheerio scrape Zara's search page
  if (items.length === 0) {
    try {
      const client = createClient({
        'Referer': 'https://www.zara.com/in/',
      });
      const res = await client.get(`https://www.zara.com/in/en/search?searchTerm=${encodeURIComponent(query)}`);
      const $ = cheerio.load(res.data);

      // Try to extract JSON from script tags
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          if (Array.isArray(data)) {
            data.filter(d => d['@type'] === 'Product').slice(0, MAX_PER_SITE).forEach((p, j) => {
              const product = formatProduct({
                title: p.name || '',
                price: p.offers?.price || 0,
                productUrl: p.url || '#',
                imageUrl: p.image || '',
              }, 'Zara', j);
              if (isValidProduct(product)) items.push(product);
            });
          }
        } catch (e) { /* not valid JSON */ }
      });
    } catch (err2) { /* both failed */ }
  }

  console.log(`  [Tier3/Zara] → ${items.length} products`);
  return items;
}

// ═══════════════════════════════════════════════════════════════
//  H&M — Product search via internal API
// ═══════════════════════════════════════════════════════════════
async function fetchHM(query) {
  const items = [];
  try {
    const client = createClient({
      'Accept': 'application/json',
      'Referer': 'https://www2.hm.com/en_in/',
      'Origin': 'https://www2.hm.com',
    });

    // H&M India search API
    const url = `https://www2.hm.com/en_in/search-results/_jcr_content/search.display.json?q=${encodeURIComponent(query)}&page-size=${MAX_PER_SITE}&page=0&sort=stock`;
    const res = await client.get(url);

    const products = res.data?.products || [];
    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      let img = p.image?.find(im => im.src)?.src || p.defaultArticle?.images?.[0]?.src || '';
      if (img && !img.startsWith('http')) img = `https:${img}`;

      const product = formatProduct({
        title: p.title || p.name || '',
        price: parsePrice(p.price?.value || p.price) || parsePrice(p.whitePrice?.value),
        originalPrice: parsePrice(p.redPrice?.value) || null,
        productUrl: p.swatches?.[0]?.articleLink
          ? `https://www2.hm.com${p.swatches[0].articleLink}`
          : `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(query)}`,
        imageUrl: img,
      }, 'H&M', i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) { /* silent */ }

  // Fallback: Cheerio scrape
  if (items.length === 0) {
    try {
      const client = createClient();
      const res = await client.get(`https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(query)}`);
      const $ = cheerio.load(res.data);

      // Look for product data in script tags
      $('script').each((i, el) => {
        const text = $(el).html() || '';
        if (text.includes('productListing') || text.includes('products')) {
          try {
            const match = text.match(/products\s*[:=]\s*(\[[\s\S]*?\])/);
            if (match) {
              const data = JSON.parse(match[1]);
              data.slice(0, MAX_PER_SITE).forEach((p, j) => {
                const product = formatProduct({
                  title: p.title || p.name || '',
                  price: parsePrice(p.price),
                  productUrl: p.link ? `https://www2.hm.com${p.link}` : '#',
                  imageUrl: p.image || '',
                }, 'H&M', j);
                if (isValidProduct(product)) items.push(product);
              });
            }
          } catch (e) { /* not valid JSON */ }
        }
      });
    } catch (err2) { /* both failed */ }
  }

  console.log(`  [Tier3/H&M] → ${items.length} products`);
  return items;
}

/**
 * MAIN ENTRY POINT — Fires all Tier 3 scrapers concurrently
 * @param {string} query
 * @param {string[]} sites — Which Tier 3 sites to scrape (from category engine)
 * @returns {Promise<object>} — { CrepDogCrew: [...], CultureCircle: [...], Zara: [...], 'H&M': [...] }
 */
async function fetchTier3(query, sites = ['CrepDogCrew', 'CultureCircle', 'Zara', 'H&M']) {
  const fetchers = {
    'CrepDogCrew':   fetchCrepDogCrew,
    'CultureCircle': fetchCultureCircle,
    'Zara':          fetchZara,
    'H&M':           fetchHM,
  };

  const results = {};
  const promises = sites
    .filter(s => fetchers[s])
    .map(site =>
      fetchers[site](query)
        .then(items => { results[site] = items; })
        .catch(err => {
          console.log(`  [Tier3/${site}] ✗ Fatal: ${err.message}`);
          results[site] = [];
        })
    );

  await Promise.allSettled(promises);
  return results;
}

module.exports = { fetchTier3 };
