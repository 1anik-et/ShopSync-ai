/**
 * ═══════════════════════════════════════════════════════════════════════
 *  THE ORCHESTRATOR — apiSearchService.js
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  FLOW:
 *  1. Category Engine → intent + priorities
 *  2. Promise.allSettled fires ALL tiers at the SAME millisecond
 *  3. Merge → Deduplicate → Score → Rank → Return
 *
 *  KEY OPTIMIZATION: Tier 1 (SerpApi) now returns products from ALL
 *  retailers in a SINGLE call. Tier 2 & 3 are supplementary — they
 *  add niche products that Google Shopping doesn't index.
 * ═══════════════════════════════════════════════════════════════════════
 */
const { analyzeSearchIntent } = require('../utils/categoryEngine');
const { fetchTier1 } = require('./tier1_serpapi');
const { fetchTier2 } = require('./tier2_mobileApis');
const { fetchTier3 } = require('./tier3_htmlScrapers');
const { getRetailerMeta, RETAILERS_META } = require('./_helpers');

// ─── In-Memory Cache ─────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ─── Relevance Scoring ───────────────────────────────────
function scoreProduct(product, query, prioritySites, userProfile) {
  let score = 100;
  const titleLower = product.title.toLowerCase();
  const queryLower = query.toLowerCase();

  // Normalize compound words (t-shirt / tshirt / t shirt)
  const normTitle = titleLower.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  const normQuery = queryLower.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

  // Basic plural handling
  const queryStemmed = normQuery.endsWith('s') && !normQuery.endsWith('ss') ? normQuery.slice(0, -1) : normQuery;

  // Full phrase match (strongest signal)
  if (normTitle.includes(normQuery) || normTitle.includes(queryStemmed)) {
    score += 300;
  } else if (normTitle.includes(normQuery.replace(/\s/g, '')) || normTitle.includes(queryStemmed.replace(/\s/g, ''))) {
    score += 250;
  } else {
    // Token-level matching
    const tokens = normQuery.split(/\s+/).filter(w => w.length > 1);
    const joined = tokens.join('');
    let matched = 0;
    tokens.forEach(t => { 
      const tStem = t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
      if (normTitle.includes(t) || normTitle.includes(tStem)) matched++; 
    });
    if (joined.length > 2 && (normTitle.includes(joined) || normTitle.includes(joined.endsWith('s') ? joined.slice(0, -1) : joined))) matched = tokens.length;
    const total = Math.max(tokens.length, 1);
    score += (matched / total) * 200;
    if (matched === 0) score -= 1000;
  }

  // Priority site boost (increase significantly to push H&M, Zara, etc. above Amazon, but keep Amazon visible)
  if (prioritySites.includes(product.retailer)) {
    score += 250;
  }

  // User profile filtering
  if (userProfile) {
    if (userProfile.gender === 'Male' && /\b(kids|boys|girls|youth|women)\b/i.test(titleLower)) score -= 500;
    if (userProfile.gender === 'Female' && /\b(kids|boys|girls|youth|men|mens)\b/i.test(titleLower)) score -= 500;
  }

  return score;
}

const pendingRequests = new Map();

// ─── Main Entry ──────────────────────────────────────────
async function getUnifiedResults(query, userProfile = null) {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const cacheKey = q.toLowerCase();

  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`  [Orchestrator] Cache HIT for "${q}"`);
    return cached;
  }

  // Deduplicate concurrent requests (e.g. search and compare hitting at exactly the same time)
  if (pendingRequests.has(cacheKey)) {
    console.log(`  [Orchestrator] Awaiting pending request for "${q}"`);
    return pendingRequests.get(cacheKey);
  }

  const promise = (async () => {
    const startTime = Date.now();
    const intent = analyzeSearchIntent(q);

    console.log(`\n  ╔══════════════════════════════════════════════════════╗`);
    console.log(`  ║  🔍 QUERY: "${q}"`);
    console.log(`  ║  🧠 INTENT: ${intent.type.toUpperCase()}`);
    console.log(`  ║  ⭐ PRIORITY: [${intent.prioritySites.join(', ')}]`);
    console.log(`  ╚══════════════════════════════════════════════════════╝\n`);

    // Determine which Tier 3 sites to scrape (Shopify stores only — they're not on Google Shopping)
    const tier3Sites = intent.allSites.filter(s => ['CrepDogCrew', 'CultureCircle'].includes(s));

    console.log(`  ┌─ TIER 1 (SerpApi):        [ALL retailers in single call]`);
    console.log(`  ├─ TIER 2 (Mobile APIs):    [Myntra, Ajio, Nykaa]`);
    console.log(`  └─ TIER 3 (HTML Scrapers):  [${tier3Sites.join(', ') || 'none'}]\n`);

  // ═══════════════════════════════════════════════════════
  //  🚀 FIRE ALL 3 TIERS SIMULTANEOUSLY
  // ═══════════════════════════════════════════════════════
  const tier2Sites = intent.allSites.filter(s => ['Myntra', 'Ajio', 'Nykaa'].includes(s));

  const [tier1Result, tier2Result, tier3Result] = await Promise.allSettled([
    fetchTier1(q, intent.allSites),
    tier2Sites.length > 0 ? fetchTier2(q, tier2Sites) : Promise.resolve({}),
    tier3Sites.length > 0 ? fetchTier3(q, tier3Sites) : Promise.resolve({}),
  ]);

  // ─── Merge all results ─────────────────────────────────
  let allProducts = [];

  [
    { name: 'Tier1', result: tier1Result },
    { name: 'Tier2', result: tier2Result },
    { name: 'Tier3', result: tier3Result },
  ].forEach(({ name, result }) => {
    if (result.status === 'fulfilled' && result.value) {
      Object.entries(result.value).forEach(([retailer, products]) => {
        if (products && products.length > 0) {
          allProducts.push(...products);
        }
      });
    } else if (result.status === 'rejected') {
      console.log(`  ❌ ${name} REJECTED: ${result.reason?.message}`);
    }
  });

  // ─── Deduplicate by title similarity ───────────────────
  const seen = new Set();
  allProducts = allProducts.filter(p => {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ─── Score, enrich, and sort ───────────────────────────
  const scored = allProducts.map(product => {
    const relevanceScore = scoreProduct(product, q, intent.prioritySites, userProfile);
    const retailerMeta = getRetailerMeta(product.retailer);
    const discount = product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : Math.floor(Math.random() * 30) + 5;

    return {
      id: product.id,
      name: product.title,
      image: product.imageUrl,
      category: intent.type === 'general' ? 'Product' : intent.type.charAt(0).toUpperCase() + intent.type.slice(1),
      brand: extractBrand(product.title),
      availableSizes: generateSizes(intent.type),
      retailer: product.retailer,
      retailerMeta: { name: product.retailer, ...retailerMeta },
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      discount,
      rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
      reviews: Math.floor(Math.random() * 10000) + 50,
      deliveryDays: product.retailer === 'Amazon' ? 2 : product.retailer === 'Flipkart' ? 3 : 5,
      deliveryText: product.retailer === 'Amazon' ? 'Prime 2-Day' : `${product.retailer} Standard`,
      inStock: true,
      productUrl: product.productUrl || '#',
      relevanceScore,
    };
  });

  // Filter out irrelevant (negative score) and placeholder prices
  let finalResults = scored.filter(r => r.relevanceScore > 0 && r.price > 10);
  finalResults.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.price - b.price;
  });

  // Mark best deal
  if (finalResults.length > 0) {
    const cheapest = [...finalResults].sort((a, b) => a.price - b.price)[0];
    cheapest.isBestDeal = true;
  }

  const elapsed = Date.now() - startTime;

  // ─── Summary ───────────────────────────────────────────
  const retailerCounts = {};
  finalResults.forEach(r => { retailerCounts[r.retailer] = (retailerCounts[r.retailer] || 0) + 1; });
  console.log(`\n  ╔══════════════════════════════════════════════════════╗`);
  console.log(`  ║  ⚡ ${finalResults.length} RESULTS in ${elapsed}ms`);
  Object.entries(retailerCounts).forEach(([r, c]) => {
    console.log(`  ║    ${r}: ${c} products`);
  });
  console.log(`  ╚══════════════════════════════════════════════════════╝\n`);

    global.latestScrapedProducts = finalResults;
    if (finalResults.length > 0) {
      setCache(cacheKey, finalResults);
    }
    return finalResults;
  })();

  pendingRequests.set(cacheKey, promise);
  try {
    const result = await promise;
    pendingRequests.delete(cacheKey);
    return result;
  } catch (err) {
    pendingRequests.delete(cacheKey);
    throw err;
  }
}

// ─── Helpers ─────────────────────────────────────────────
function extractBrand(title) {
  const w = title.split(' ');
  const b = w[0]?.replace(/[^a-zA-Z0-9&]/g, '');
  return b && b.length > 1 ? b : 'Generic';
}

function generateSizes(type) {
  if (type === 'sneakers') return ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'].sort(() => Math.random() - 0.5).slice(0, 4);
  if (type === 'watches') return ['One Size'];
  return ['S', 'M', 'L', 'XL'].sort(() => Math.random() - 0.5).slice(0, 3);
}

module.exports = { getUnifiedResults };
