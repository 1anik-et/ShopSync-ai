/**
 * ═══════════════════════════════════════════════════════════════════════
 *  TIER 1 — SerpApi Google Shopping (THE BROAD NET)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  SINGLE API CALL → 80 results → auto-detect retailer from `source`
 *  Caps each retailer to MAX_PER_RETAILER to ensure diversity.
 *  Builds direct retailer search URLs (never Google redirect).
 * ═══════════════════════════════════════════════════════════════════════
 */
const { createClient, parsePrice, isValidProduct, formatProduct } = require('./_helpers');
const cheerio = require('cheerio');

const MAX_PER_RETAILER = 10; // Cap per retailer for diversity

// ─── Source → Retailer mapping ───────────────────────────
const SOURCE_MAP = {
  'amazon':            'Amazon',    'amazon.in':          'Amazon',
  'flipkart':          'Flipkart',  'flipkart.com':       'Flipkart',
  'myntra':            'Myntra',    'myntra.com':         'Myntra',
  'ajio':              'Ajio',      'ajio.com':           'Ajio',
  'tatacliq':          'TataCLiQ',  'tata cliq':          'TataCLiQ',  'tatacliq.com': 'TataCLiQ',
  'nykaa':             'Nykaa',     'nykaa fashion':      'Nykaa',     'nykaafashion': 'Nykaa',
  'h&m':               'H&M',      'hm':                 'H&M',       'hm.com': 'H&M', 'h & m': 'H&M',
  'zara':              'Zara',      'zara.com':           'Zara',
  'bewakoof':          'Bewakoof',  'bewakoof.com':       'Bewakoof',
  'snitch':            'Snitch',    'snitch.co.in':       'Snitch',    'snitch.com': 'Snitch',
  'meesho':            'Meesho',    'meesho.com':         'Meesho',
  'jiomart':           'JioMart',   'jiomart.com':        'JioMart',
  'croma':             'Croma',     'croma.com':          'Croma',
  'reliance digital':  'Reliance Digital',
  'snapdeal':          'Snapdeal',  'snapdeal.com':       'Snapdeal',
  'nike':              'Nike',      'nike.com':           'Nike',
  'adidas':            'Adidas',    'adidas.co.in':       'Adidas',
  'puma':              'Puma',      'puma.com':           'Puma',
  'virgio':            'Virgio',
  'limeroad':          'LimeRoad',
  'crepdogcrew':       'CrepDogCrew',
  'culturecircle':     'CultureCircle',
  'offduty india':     'OffDuty',   'offduty':            'OffDuty',
  'the souled store':  'The Souled Store',
  'uniqlo india':      'Uniqlo',    'uniqlo':             'Uniqlo',
  'wrogn':             'WROGN',
  'pepe jeans':        'Pepe Jeans',
  'levi strauss india':'Levi\'s',   'levi\'s':            'Levi\'s',
  'marks & spencer':   'Marks & Spencer', 'marks and spencer': 'Marks & Spencer',
  'jack & jones':      'Jack & Jones',
  'only':              'Only',
  'van heusen':        'Van Heusen',
  'the pant project':  'The Pant Project',
  'decathlon sports india': 'Decathlon', 'decathlon': 'Decathlon',
  'wildcraft official':'Wildcraft',  'wildcraft':         'Wildcraft',
  'columbia sportswear':'Columbia',
  'manyavar':          'Manyavar',
  'superdry india':    'Superdry',   'superdry':          'Superdry',
  'woodland':          'Woodland',
  'the indian garage co': 'Indian Garage',
  'allen solly':       'Allen Solly',
  'peter england':     'Peter England',
  'raymond':           'Raymond',
  'benetton':          'Benetton',   'united colors of benetton': 'Benetton',
  'max':               'Max Fashion', 'max fashion':      'Max Fashion',
  'westside':          'Westside',
  'fabindia':          'FabIndia',
  'w for woman':       'W',
  'global desi':       'Global Desi',
  'urbanic':           'Urbanic',
  'shein':             'Shein',
};

function detectRetailer(source) {
  if (!source) return null;
  const s = source.toLowerCase().trim();
  if (SOURCE_MAP[s]) return SOURCE_MAP[s];
  // Partial match
  for (const [key, name] of Object.entries(SOURCE_MAP)) {
    if (s.includes(key) || key.includes(s)) return name;
  }
  // If source looks like a domain, clean it
  if (s.includes('.')) {
    const clean = s.replace(/\.com$|\.in$|\.co\.in$/, '').replace(/^www\./, '');
    if (SOURCE_MAP[clean]) return SOURCE_MAP[clean];
  }
  return source; // Use raw source name
}

// ─── Build direct retailer URLs ──────────────────────────
function buildRetailerUrl(title, retailer) {
  const q = encodeURIComponent(title);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  
  const urlMap = {
    'Amazon':          `https://www.amazon.in/s?k=${q}`,
    'Flipkart':        `https://www.flipkart.com/search?q=${q}`,
    'Myntra':          `https://www.myntra.com/${slug}`,
    'Ajio':            `https://www.ajio.com/search/?text=${q}`,
    'TataCLiQ':        `https://www.tatacliq.com/search/?searchCategory=all&text=${q}`,
    'Nykaa':           `https://www.nykaafashion.com/search/?q=${q}`,
    'H&M':             `https://www2.hm.com/en_in/search-results.html?q=${q}`,
    'Zara':            `https://www.zara.com/in/en/search?searchTerm=${q}`,
    'Bewakoof':        `https://www.bewakoof.com/search/${q}`,
    'Snitch':          `https://www.snitch.co.in/search?q=${q}`,
    'Meesho':          `https://www.meesho.com/search?q=${q}`,
    'Nike':            `https://www.nike.com/in/w?q=${q}`,
    'Adidas':          `https://www.adidas.co.in/search?q=${q}`,
    'Puma':            `https://in.puma.com/in/en/search?q=${q}`,
    'Croma':           `https://www.croma.com/searchB?q=${q}`,
    'JioMart':         `https://www.jiomart.com/search/${q}`,
    'Snapdeal':        `https://www.snapdeal.com/search?keyword=${q}`,
    'The Souled Store': `https://www.thesouledstore.com/search?q=${q}`,
    'Uniqlo':          `https://www.uniqlo.com/in/en/search?q=${q}`,
    'Levi\'s':         `https://www.levi.in/search?q=${q}`,
    'Pepe Jeans':      `https://www.pepejeans.in/search?q=${q}`,
    'Marks & Spencer': `https://www.marksandspencer.in/search?q=${q}`,
    'Jack & Jones':    `https://www.jackjones.in/search?q=${q}`,
    'Van Heusen':      `https://www.vanheusen.com/search?q=${q}`,
    'OffDuty':         `https://www.offdutyindia.com/search?q=${q}`,
    'WROGN':           `https://www.wrogn.com/search?q=${q}`,
    'The Pant Project': `https://www.thepantproject.com/search?q=${q}`,
    'Only':            `https://www.only.in/search?q=${q}`,
    'Decathlon':       `https://www.decathlon.in/search?query=${q}`,
    'Wildcraft':       `https://www.wildcraft.com/search?q=${q}`,
    'Columbia':        `https://www.columbiasportswear.co.in/search?q=${q}`,
    'Manyavar':        `https://www.manyavar.com/search?q=${q}`,
    'Superdry':        `https://www.superdry.in/search?q=${q}`,
    'Woodland':        `https://www.woodlandworldwide.com/search?q=${q}`,
    'Allen Solly':     `https://www.allensolly.com/search?q=${q}`,
    'Peter England':   `https://www.peterengland.com/search?q=${q}`,
    'Benetton':        `https://in.benetton.com/search?q=${q}`,
    'Max Fashion':     `https://www.maxfashion.in/search?q=${q}`,
    'FabIndia':        `https://www.fabindia.com/search?q=${q}`,
    'CrepDogCrew':     `https://crepdogcrew.com/search?q=${q}`,
    'CultureCircle':   `https://www.culturecircle.com/search?q=${q}`,
    'Virgio':          `https://virgio.com/search?q=${q}`,
    'Indian Garage':   `https://www.theindiangarage.com/search?q=${q}`,
    'Urbanic':         `https://www.urbanic.com/search?q=${q}`,
  };

  return urlMap[retailer] || `https://www.google.com/search?q=${q}+${encodeURIComponent(retailer)}+buy+online+India`;
}

/**
 * ONE SerpApi call → products grouped by retailer
 */
async function fetchAllFromSerpApi(query, apiKey) {
  const results = {};
  try {
    const client = createClient({ 'Accept': 'application/json' });
    const res = await client.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        gl: 'in',
        hl: 'en',
        google_domain: 'google.co.in',
        num: 100,
        api_key: apiKey,
      },
      timeout: 12000, // SerpApi responds in <1s normally, but can take longer
    });

    const items = res.data?.shopping_results || [];

    items.forEach((item, i) => {
      const retailer = detectRetailer(item.source);
      if (!retailer) return;
      if (!results[retailer]) results[retailer] = [];
      if (results[retailer].length >= MAX_PER_RETAILER) return; // diversity cap

      const product = formatProduct({
        title: item.title || '',
        price: item.extracted_price || parsePrice(item.price),
        originalPrice: item.extracted_old_price || null,
        productUrl: buildRetailerUrl(item.title || '', retailer),
        imageUrl: item.thumbnail || '',
      }, retailer, results[retailer].length);

      if (isValidProduct(product)) {
        results[retailer].push(product);
      }
    });

    const total = Object.values(results).reduce((s, a) => s + a.length, 0);
    Object.entries(results).forEach(([r, a]) => console.log(`  [SerpApi] ${r}: ${a.length}`));
    console.log(`  [SerpApi] TOTAL: ${total} from ${Object.keys(results).length} retailers`);

  } catch (err) {
    console.log(`  [SerpApi] ✗ ${err.message}`);
  }
  return results;
}

/**
 * Fallback: Cheerio scrape Amazon when no SerpApi key
 */
async function scrapeAmazonDirect(query) {
  try {
    const client = createClient({
      'Referer': 'https://www.amazon.in/',
      'Upgrade-Insecure-Requests': '1',
      'Cookie': 'session-id=0; i18n-prefs=INR',
    });
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
    const res = await client.get(url, { maxRedirects: 10, timeout: 8000 });
    const $ = cheerio.load(res.data);
    const items = [];
    $('div[data-component-type="s-search-result"]').each((i, el) => {
      if (items.length >= 15) return;
      if ($(el).find('.s-label-popover-default').length > 0) return;
      const brand = $(el).find('h2').first().text().trim();
      const name = $(el).find('.a-text-normal').first().text().trim();
      const title = name ? `${brand} ${name}`.trim() : brand;
      let link = $(el).find('h2 a.a-link-normal').first().attr('href') || '';
      if (link && !link.startsWith('http')) link = 'https://www.amazon.in' + link;
      const price = parsePrice($(el).find('.a-price .a-price-whole').first().text());
      const image = $(el).find('img.s-image').attr('src') || '';
      if (title.length > 5 && price > 0 && link) {
        const p = formatProduct({ title, price, productUrl: link, imageUrl: image }, 'Amazon', items.length);
        if (isValidProduct(p)) items.push(p);
      }
    });
    console.log(`  [Amazon/Cheerio] → ${items.length}`);
    return { Amazon: items };
  } catch (err) {
    console.log(`  [Amazon/Cheerio] ✗ ${err.message}`);
    return {};
  }
}

async function fetchTier1(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (apiKey) return fetchAllFromSerpApi(query, apiKey);
  console.log(`  [Tier1] ⚠ No SERPAPI_KEY`);
  return scrapeAmazonDirect(query);
}

module.exports = { fetchTier1 };
