/**
 * Compare Service
 * Orchestrates product comparison across retailers.
 * Uses the scraper's built-in cache for speed.
 */
const { scrapeProducts, RETAILERS } = require('./scraperService');
const axios = require('axios');
const cheerio = require('cheerio');

async function compareProducts(query) {
  if (!query || query.trim().length < 2) {
    return { query, totalResults: 0, bestDeal: null, retailers: [], results: [] };
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  // Scrape live data (scraper has built-in 2-minute cache)
  let results = await scrapeProducts(normalizedQuery);

  // Sort by price (lowest first) for best deal detection
  if (results.length > 0) {
    results.sort((a, b) => a.price - b.price);
    results[0].isBestDeal = true;
  }

  // Compute retailer summary
  const retailerMap = {};
  for (const r of results) {
    if (!retailerMap[r.retailer]) {
      retailerMap[r.retailer] = { name: r.retailer, count: 0, ...r.retailerMeta };
    }
    retailerMap[r.retailer].count++;
  }
  const retailersSummary = Object.values(retailerMap).sort((a, b) => b.count - a.count);

  return {
    query,
    totalResults: results.length,
    bestDeal: results.length > 0 ? results[0] : null,
    retailers: retailersSummary,
    results,
  };
}

async function compareDeal(url) {
  let title = 'Product Search';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
    const $ = cheerio.load(res.data);
    title = $('title').text().trim() || $('h1').first().text().trim();
    
    // Clean the title (remove site names, 'Buy Online', etc.)
    title = title.split('|')[0].split('-')[0].replace(/Buy.*Online/ig, '').trim();
    if (!title) throw new Error('Empty title');
  } catch (err) {
    console.error(`[Deal Scraper] Failed to fetch URL ${url}:`, err.message);
    try {
      // Extract something from the URL as fallback
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(p => p.length > 3);
      if (parts.length > 0) {
        title = parts[parts.length - 1].replace(/[-_]/g, ' ');
      }
    } catch(e) {}
  }

  // Extract just the core product name (first 4-6 words) for a clean search
  const words = title.split(/\s+/).filter(w => w.length > 1 && !['buy', 'online', 'for', 'men', 'women', 'price', 'india', 'at', 'best'].includes(w.toLowerCase()));
  title = words.slice(0, 5).join(' ');

  if (!title) title = 'Product Search';

  // Run the normal compare with the extracted title
  const results = await compareProducts(title);
  
  // Update the query in the response to the extracted title so the user sees what was searched
  results.query = title;
  return results;
}

module.exports = { compareProducts, compareDeal };
