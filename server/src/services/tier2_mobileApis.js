/**
 * ═══════════════════════════════════════════════════════════════════════
 *  TIER 2 — REVERSE-ENGINEERED MOBILE / INTERNAL APIs
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  WHY:  Fashion retailers optimize their mobile APIs for speed.
 *        Fetching this JSON is 100x faster than parsing HTML.
 *        No headless browser. No Puppeteer. Pure HTTP → JSON.
 *
 *  SITES: Myntra, Ajio, Nykaa Fashion
 *
 *  HOW:  Each site has internal search endpoints used by their mobile
 *        apps. We mimic the mobile request headers to get clean JSON.
 *
 *  RETURNS: { Myntra: [...products], Ajio: [...], Nykaa: [...] }
 * ═══════════════════════════════════════════════════════════════════════
 */
const { createClient, parsePrice, isValidProduct, formatProduct, randomUA } = require('./_helpers');

const MAX_PER_SITE = 10;

// ═══════════════════════════════════════════════════════════════
//  MYNTRA — Internal gateway search API
// ═══════════════════════════════════════════════════════════════
async function fetchMyntra(query) {
  const items = [];
  try {
    // Myntra's internal search API (used by their web app)
    const slug = query.toLowerCase().replace(/\s+/g, '-');
    const client = createClient({
      'Accept': 'application/json',
      'Referer': `https://www.myntra.com/${slug}`,
      'Origin': 'https://www.myntra.com',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Myntra-App': 'web',
      'X-Meta-App': 'browser',
      'X-Location-City': 'Mumbai',
      'X-Location-Region': 'Maharashtra',
    }, 'mobile');

    // Try the product listing API
    const url = `https://www.myntra.com/gateway/v2/search/${encodeURIComponent(slug)}?p=1&rows=${MAX_PER_SITE}&o=0&plaEnabled=false`;
    const res = await client.get(url);

    const products = res.data?.products
      || res.data?.response?.products
      || res.data?.results
      || [];

    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      const price = p.discountedPrice || p.price || p.mrp || 0;
      const originalPrice = p.mrp || p.price || 0;
      const imageUrl = p.searchImage
        || (p.images && p.images[0] && `https://assets.myntassets.com/${p.images[0].src}`)
        || '';
      const productUrl = `https://www.myntra.com/${p.landingPageUrl || p.productId || ''}`;

      const product = formatProduct({
        title: p.productName || p.name || p.brand + ' ' + (p.articleType || ''),
        price, originalPrice, productUrl,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://assets.myntassets.com/h_300,q_90,w_210/${imageUrl}`,
      }, 'Myntra', i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) {
    // Silently fail — Tier 2 APIs may require specific network conditions
  }

  // Fallback: try the search suggest endpoint
  if (items.length === 0) {
    try {
      const client = createClient({
        'Accept': 'application/json',
        'Referer': 'https://www.myntra.com/',
      }, 'mobile');
      const url = `https://www.myntra.com/gateway/v1/search/suggest?query=${encodeURIComponent(query)}&count=${MAX_PER_SITE}`;
      const res = await client.get(url);
      const suggestions = res.data?.query?.suggestions || res.data?.products || [];
      suggestions.slice(0, MAX_PER_SITE).forEach((s, i) => {
        if (s.type === 'PRODUCT' || s.productId) {
          const product = formatProduct({
            title: s.name || s.text || '',
            price: s.price || s.discountedPrice || 0,
            productUrl: `https://www.myntra.com/${s.url || s.landingPageUrl || ''}`,
            imageUrl: s.image || s.searchImage || '',
          }, 'Myntra', i);
          if (isValidProduct(product)) items.push(product);
        }
      });
    } catch (err) { /* final fallback below */ }
  }

  console.log(`  [Tier2/Myntra] → ${items.length} products`);
  return items;
}

// ═══════════════════════════════════════════════════════════════
//  AJIO — Internal V2 search API
// ═══════════════════════════════════════════════════════════════
async function fetchAjio(query) {
  const items = [];
  try {
    const client = createClient({
      'Accept': 'application/json',
      'Referer': 'https://www.ajio.com/',
      'Origin': 'https://www.ajio.com',
      'X-Requested-With': 'XMLHttpRequest',
    }, 'mobile');

    // Ajio's internal V2 search API
    const url = `https://www.ajio.com/api/search?searchQuery=${encodeURIComponent(query)}&currentPage=0&pageSize=${MAX_PER_SITE}&platform=site&gridColumns=5`;
    const res = await client.get(url);

    const products = res.data?.products
      || res.data?.searchResponse?.products
      || [];

    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      let img = p.images?.swatch || p.images?.default || '';
      if (img && !img.startsWith('http')) img = `https://assets.ajio.com/${img}`;
      // Some image paths use //assets format
      if (img.startsWith('//')) img = `https:${img}`;

      const product = formatProduct({
        title: `${p.brandName || ''} ${p.name || p.fnlColorVariantData?.name || ''}`.trim(),
        price: p.offerPrice || p.price?.value || p.warehouseInfo?.[0]?.offerPrice || 0,
        originalPrice: p.mrp || p.price?.mrp || 0,
        productUrl: p.url ? `https://www.ajio.com${p.url}` : '#',
        imageUrl: img,
      }, 'Ajio', i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) { /* silent */ }

  // Fallback: Ajio search suggest
  if (items.length === 0) {
    try {
      const client = createClient({
        'Accept': 'application/json',
        'Referer': 'https://www.ajio.com/',
      }, 'mobile');
      const url = `https://www.ajio.com/api/suggest?searchQuery=${encodeURIComponent(query)}&count=${MAX_PER_SITE}`;
      const res = await client.get(url);
      const products = res.data?.products || res.data?.suggestions || [];
      products.slice(0, MAX_PER_SITE).forEach((p, i) => {
        const product = formatProduct({
          title: p.name || p.title || '',
          price: p.price || 0,
          productUrl: p.url ? `https://www.ajio.com${p.url}` : '#',
          imageUrl: p.image || '',
        }, 'Ajio', i);
        if (isValidProduct(product)) items.push(product);
      });
    } catch (err) { /* final fallback below */ }
  }

  console.log(`  [Tier2/Ajio] → ${items.length} products`);
  return items;
}

// ═══════════════════════════════════════════════════════════════
//  NYKAA FASHION — Internal search API
// ═══════════════════════════════════════════════════════════════
async function fetchNykaa(query) {
  const items = [];
  try {
    const client = createClient({
      'Accept': 'application/json',
      'Referer': 'https://www.nykaafashion.com/',
      'Origin': 'https://www.nykaafashion.com',
    }, 'mobile');

    // Nykaa Fashion internal API
    const url = `https://www.nykaafashion.com/rest/appapi/V2/search?filter_format=v2&category_type=fashion&q=${encodeURIComponent(query)}&page_no=1&page_size=${MAX_PER_SITE}&sort=popularity`;
    const res = await client.get(url);

    const products = res.data?.response?.products
      || res.data?.products
      || res.data?.response?.result?.products
      || [];

    products.slice(0, MAX_PER_SITE).forEach((p, i) => {
      const product = formatProduct({
        title: `${p.brand_name || ''} ${p.name || p.title || ''}`.trim(),
        price: p.offer_price || p.final_price || p.price || 0,
        originalPrice: p.mrp || p.price || 0,
        productUrl: p.action_url ? `https://www.nykaafashion.com${p.action_url}` : '#',
        imageUrl: p.image_url || p.images?.[0] || '',
      }, 'Nykaa', i);
      if (isValidProduct(product)) items.push(product);
    });
  } catch (err) { /* silent */ }

  // Fallback: Nykaa Beauty search (for beauty products)
  if (items.length === 0) {
    try {
      const client = createClient({
        'Accept': 'application/json',
        'Referer': 'https://www.nykaa.com/',
      }, 'mobile');
      const url = `https://www.nykaa.com/search/result?q=${encodeURIComponent(query)}&root=search&page_no=1&sourcepage=search`;
      const res = await client.get(url);
      const products = res.data?.response?.products || [];
      products.slice(0, MAX_PER_SITE).forEach((p, i) => {
        const product = formatProduct({
          title: p.title || p.name || '',
          price: p.offer_price || p.price || 0,
          productUrl: p.slug ? `https://www.nykaa.com${p.slug}` : '#',
          imageUrl: p.image_url || '',
        }, 'Nykaa', i);
        if (isValidProduct(product)) items.push(product);
      });
    } catch (err) { /* silent */ }
  }

  console.log(`  [Tier2/Nykaa] → ${items.length} products`);
  return items;
}

/**
 * MAIN ENTRY POINT — Fires all Tier 2 fetches concurrently
 * @param {string} query
 * @param {string[]} sites — Which Tier 2 sites to query (from category engine)
 * @returns {Promise<object>} — { Myntra: [...], Ajio: [...], Nykaa: [...] }
 */
async function fetchTier2(query, sites = ['Myntra', 'Ajio', 'Nykaa']) {
  const fetchers = {
    'Myntra': fetchMyntra,
    'Ajio': fetchAjio,
    'Nykaa': fetchNykaa,
  };

  const results = {};
  const promises = sites
    .filter(s => fetchers[s])
    .map(site =>
      fetchers[site](query)
        .then(items => { results[site] = items; })
        .catch(err => {
          console.log(`  [Tier2/${site}] ✗ Fatal: ${err.message}`);
          results[site] = [];
        })
    );

  await Promise.allSettled(promises);
  return results;
}

module.exports = { fetchTier2 };
