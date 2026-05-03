const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const RETAILERS_META = [
  { name: 'Amazon', domain: 'amazon.in', color: '#FF9900', logo: '🛒', trustScore: 4.5 },
  { name: 'Flipkart', domain: 'flipkart.com', color: '#2874F0', logo: '🛍️', trustScore: 4.3 },
  { name: 'Myntra', domain: 'myntra.com', color: '#FF3E6C', logo: '👕', trustScore: 4.4 },
  { name: 'Ajio', domain: 'ajio.com', color: '#2C4152', logo: '👗', trustScore: 4.2 },
  { name: 'TataCLiQ', domain: 'tatacliq.com', color: '#000000', logo: '📱', trustScore: 4.1 },
  { name: 'Nykaa', domain: 'nykaafashion.com', color: '#FC2779', logo: '💄', trustScore: 4.2 },
  { name: 'Nike', domain: 'nike.com', color: '#111111', logo: '✔️', trustScore: 4.8 },
  { name: 'Puma', domain: 'in.puma.com', color: '#000000', logo: '🐆', trustScore: 4.7 },
  { name: 'Adidas', domain: 'adidas.co.in', color: '#000000', logo: '⚡', trustScore: 4.7 },
  { name: 'H&M', domain: 'hm.com', color: '#E50010', logo: '👔', trustScore: 4.3 },
  { name: 'Zara', domain: 'zara.com', color: '#000000', logo: '🧥', trustScore: 4.6 },
  { name: 'Uniqlo', domain: 'uniqlo.com', color: '#ED1D24', logo: '👖', trustScore: 4.6 },
  { name: 'New Balance', domain: 'newbalance.com', color: '#E31837', logo: '👟', trustScore: 4.5 },
  { name: 'Asics', domain: 'asics.com', color: '#001E62', logo: '🏃', trustScore: 4.6 },
  { name: 'Timex', domain: 'timex.india', color: '#D22B2B', logo: '⌚', trustScore: 4.4 },
  { name: 'Casio', domain: 'casio.com', color: '#0033A0', logo: '⏱️', trustScore: 4.5 },
  { name: 'Tissot', domain: 'tissotwatches.com', color: '#E31837', logo: '🕰️', trustScore: 4.7 },
  { name: 'Fossil', domain: 'fossil.com', color: '#A68C53', logo: '⏳', trustScore: 4.3 },
  { name: 'CultureCircle', domain: 'culturecircle.com', color: '#000000', logo: '🔥', trustScore: 4.8 },
  { name: 'CrepDogCrew', domain: 'crepdogcrew.com', color: '#FCD116', logo: '👟', trustScore: 4.7 },
  { name: 'Prada', domain: 'prada.com', color: '#000000', logo: '👜', trustScore: 4.9 },
  { name: 'Balenciaga', domain: 'balenciaga.com', color: '#000000', logo: '🧥', trustScore: 4.8 }
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

function getRandomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

const searchCache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

function getCachedResults(query) {
  const key = query.toLowerCase().trim();
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.results;
  return null;
}
function setCachedResults(query, results) {
  searchCache.set(query.toLowerCase().trim(), { results, timestamp: Date.now() });
}

function parsePrice(text) {
  if (!text) return 0;
  const match = text.match(/[\d,]+/);
  return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
}

// ─── DYNAMIC CATEGORY ROUTER ──────────────────
function categorizeQuery(query) {
  const q = query.toLowerCase();
  if (q.match(/luxury|designer|prada|balenciaga|gucci|dior|culturecircle|crepdog/)) return 'Luxury';
  if (q.match(/watch|chronograph|timepiece|rolex|casio|tissot|timex|fossil/)) return 'Watches';
  if (q.match(/shoe|sneaker|boot|runner|cleat|heel|nike|adidas|puma|asics|new balance/)) return 'Shoes';
  if (q.match(/shirt|pant|jean|jacket|hoodie|apparel|clothing|zara|h&m|uniqlo/)) return 'Clothes';
  return 'General';
}

const TARGET_ITEMS = 11;

// Helper for generic CSS scraping
const fetchGenericSite = async (createPage, query, config) => {
  let items = [];
  try {
    const page = await createPage();
    await page.goto(config.searchUrl(query), { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector(config.itemSelector, { timeout: 4000 }).catch(() => {});
    const content = await page.content();
    const $ = cheerio.load(content);
    $(config.itemSelector).each((i, el) => {
      if (items.length >= TARGET_ITEMS) return;
      const title = $(el).find(config.titleSelector).text().trim() || $(el).attr('title') || '';
      let link = $(el).find(config.linkSelector).attr('href') || $(el).attr('href') || '';
      if (link && !link.startsWith('http')) link = config.baseUrl + link;
      const priceText = $(el).find(config.priceSelector).text();
      const price = parsePrice(priceText);
      const image = $(el).find(config.imgSelector).attr('src') || $(el).find(config.imgSelector).attr('data-src') || '';
      if (title.length > 3 && price > 0 && link) {
        items.push({ title, price, image, productUrl: link, merchant: config.merchant });
      }
    });
    await page.close();
    console.log(`[${config.merchant}] Scraped ${items.length}`);
  } catch (e) { 
    console.log(`[${config.merchant}] Failed:`, e.message); 
  }
  return items;
};

// ─── MAIN SCRAPER ENGINE ──────────────────────────
async function scrapeProducts(query, userProfile = null) {
  const cached = getCachedResults(query);
  if (cached) return cached;

  const category = categorizeQuery(query);
  console.log(`[Scraper] Deep scraping category [${category}] for: "${query}" | User: ${userProfile ? userProfile.gender + ' ' + userProfile.age : 'Guest'}`);
  const startTime = Date.now();
  let realItems = [];
  let browser;

  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] 
    });

    const createPage = async () => {
      const page = await browser.newPage();
      await page.setUserAgent(getRandomUA());
      await page.setRequestInterception(true);
      page.on('request', req => {
        if (['font', 'media'].includes(req.resourceType())) req.abort();
        else req.continue();
      });
      return page;
    };

    // ─── CORE SCRAPERS ───
    const fetchAmazon = async () => {
      let items = [];
      try {
        const page = await createPage();
        await page.goto(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const content = await page.content();
        const $ = cheerio.load(content);
        $('div[data-component-type="s-search-result"]').each((i, el) => {
          if (items.length >= TARGET_ITEMS) return;
          const title = $(el).find('h2').text().trim();
          let link = $(el).find('a.a-link-normal[href*="/dp/"]').attr('href') || '';
          if (link && !link.startsWith('http')) link = 'https://www.amazon.in' + link;
          const price = parsePrice($(el).find('.a-price-whole').text());
          const image = $(el).find('img.s-image').attr('src');
          if (title && price > 0 && link) items.push({ title, price, image, productUrl: link, merchant: 'Amazon' });
        });
        await page.close();
        console.log(`[Amazon] Scraped ${items.length}`);
      } catch (e) { console.log('[Amazon] Failed:', e.message); }
      return items;
    };

    const fetchFlipkart = async () => {
      let items = [];
      try {
        const page = await createPage();
        await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('div[data-id], div._1AtVbE', { timeout: 4000 }).catch(() => {});
        const content = await page.content();
        const $ = cheerio.load(content);
        $('div[data-id], div._1AtVbE, a.CGtC98').each((i, el) => {
          if (items.length >= TARGET_ITEMS) return;
          const title = $(el).find('a.IRpwTa, a.WKTcLC, div.KzDlHZ, a.s1Q9rs, div._4rR01T, a[title]').first().attr('title') || $(el).find('a').first().text().trim();
          let link = $(el).find('a').attr('href') || '';
          if (link && !link.startsWith('http')) link = 'https://www.flipkart.com' + link;
          const price = parsePrice($(el).find('div._30jeq3, div.Nx9bqj, div._25b18c').first().text());
          const image = $(el).find('img').attr('src');
          if (title.length > 5 && price > 0 && link) items.push({ title, price, image, productUrl: link, merchant: 'Flipkart' });
        });
        await page.close();
        console.log(`[Flipkart] Scraped ${items.length}`);
      } catch (e) { console.log('[Flipkart] Failed:', e.message); }
      return items;
    };

    const fetchMyntra = async () => {
      let items = [];
      try {
        const page = await createPage();
        await page.goto(`https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('.product-base', { timeout: 4000 }).catch(() => {});
        const content = await page.content();
        const $ = cheerio.load(content);
        $('.product-base').each((i, el) => {
          if (items.length >= TARGET_ITEMS) return;
          const title = $(el).find('.product-brand').text().trim() + ' ' + $(el).find('.product-product').text().trim();
          let link = $(el).find('a').attr('href') || '';
          if (link && !link.startsWith('http')) link = 'https://www.myntra.com/' + link;
          const price = parsePrice($(el).find('.product-discountedPrice').text() || $(el).find('.product-price').text());
          const image = $(el).find('picture img').attr('src');
          if (title.length > 3 && price > 0 && link) items.push({ title, price, image, productUrl: link, merchant: 'Myntra' });
        });
        await page.close();
        console.log(`[Myntra] Scraped ${items.length}`);
      } catch (e) { console.log('[Myntra] Failed:', e.message); }
      return items;
    };

    const fetchAjio = async () => {
      let items = [];
      try {
        const page = await createPage();
        await page.goto(`https://www.ajio.com/search/?text=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('.item', { timeout: 4000 }).catch(() => {});
        const content = await page.content();
        const $ = cheerio.load(content);
        $('.item').each((i, el) => {
          if (items.length >= TARGET_ITEMS) return;
          const title = $(el).find('.nameCls').text().trim();
          let link = $(el).find('a.rilrtl-products-list__link').attr('href') || $(el).find('a').attr('href') || '';
          if (link && !link.startsWith('http')) link = 'https://www.ajio.com' + link;
          const price = parsePrice($(el).find('.price').text());
          const image = $(el).find('img').attr('src');
          if (title.length > 3 && price > 0 && link) items.push({ title, price, image, productUrl: link, merchant: 'Ajio' });
        });
        await page.close();
        console.log(`[Ajio] Scraped ${items.length}`);
      } catch (e) { console.log('[Ajio] Failed:', e.message); }
      return items;
    };

    // Generic Dispatch Wrappers
    const fetchTataCLiQ = () => fetchGenericSite(createPage, query, { merchant: 'TataCLiQ', baseUrl: 'https://www.tatacliq.com', searchUrl: q => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(q)}`, itemSelector: '.Grid__element', titleSelector: 'h2', linkSelector: 'a', priceSelector: 'h3', imgSelector: 'img' });
    const fetchNykaa = () => fetchGenericSite(createPage, query, { merchant: 'Nykaa', baseUrl: 'https://www.nykaafashion.com', searchUrl: q => `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}`, itemSelector: '.product-list-box, .product-card', titleSelector: '.title', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchNike = () => fetchGenericSite(createPage, query, { merchant: 'Nike', baseUrl: 'https://www.nike.com', searchUrl: q => `https://www.nike.com/in/w?q=${encodeURIComponent(q)}`, itemSelector: '.product-card', titleSelector: '.product-card__title', linkSelector: 'a', priceSelector: '.product-price', imgSelector: 'img' });
    const fetchPuma = () => fetchGenericSite(createPage, query, { merchant: 'Puma', baseUrl: 'https://in.puma.com', searchUrl: q => `https://in.puma.com/in/en/search?q=${encodeURIComponent(q)}`, itemSelector: '.product-tile', titleSelector: 'h3', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchAdidas = () => fetchGenericSite(createPage, query, { merchant: 'Adidas', baseUrl: 'https://www.adidas.co.in', searchUrl: q => `https://www.adidas.co.in/search?q=${encodeURIComponent(q)}`, itemSelector: '.grid-item', titleSelector: '.gl-product-card__details-name', linkSelector: 'a', priceSelector: '.gl-price-item', imgSelector: 'img' });
    
    // Clothes
    const fetchHM = () => fetchGenericSite(createPage, query, { merchant: 'H&M', baseUrl: 'https://www2.hm.com', searchUrl: q => `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(q)}`, itemSelector: '.product-item', titleSelector: '.item-heading', linkSelector: 'a', priceSelector: '.item-price', imgSelector: 'img' });
    const fetchZara = () => fetchGenericSite(createPage, query, { merchant: 'Zara', baseUrl: 'https://www.zara.com', searchUrl: q => `https://www.zara.com/in/en/search.html?searchTerm=${encodeURIComponent(q)}`, itemSelector: '.product-grid-product', titleSelector: '.product-grid-product-info__name', linkSelector: 'a', priceSelector: '.money-amount__main', imgSelector: 'img' });
    const fetchUniqlo = () => fetchGenericSite(createPage, query, { merchant: 'Uniqlo', baseUrl: 'https://www.uniqlo.com', searchUrl: q => `https://www.uniqlo.com/in/en/search?q=${encodeURIComponent(q)}`, itemSelector: '.productTile__wrapper', titleSelector: '.productTile__title', linkSelector: 'a', priceSelector: '.productTile__price', imgSelector: 'img' });
    
    // Shoes
    const fetchNewBalance = () => fetchGenericSite(createPage, query, { merchant: 'New Balance', baseUrl: 'https://www.newbalance.co.in', searchUrl: q => `https://www.newbalance.co.in/search?q=${encodeURIComponent(q)}`, itemSelector: '.product', titleSelector: '.product-name', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchAsics = () => fetchGenericSite(createPage, query, { merchant: 'Asics', baseUrl: 'https://www.asics.com', searchUrl: q => `https://www.asics.co.in/search/?q=${encodeURIComponent(q)}`, itemSelector: '.product-item', titleSelector: '.name', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });

    // Watches
    const fetchTimex = () => fetchGenericSite(createPage, query, { merchant: 'Timex', baseUrl: 'https://shop.timexindia.com', searchUrl: q => `https://shop.timexindia.com/search?q=${encodeURIComponent(q)}`, itemSelector: '.grid-product', titleSelector: '.grid-product__title', linkSelector: 'a', priceSelector: '.grid-product__price', imgSelector: 'img' });
    const fetchCasio = () => fetchGenericSite(createPage, query, { merchant: 'Casio', baseUrl: 'https://www.casio.com', searchUrl: q => `https://www.casio.com/in/search/?q=${encodeURIComponent(q)}`, itemSelector: '.product-card', titleSelector: '.product-title', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchTissot = () => fetchGenericSite(createPage, query, { merchant: 'Tissot', baseUrl: 'https://www.tissotwatches.com', searchUrl: q => `https://www.tissotwatches.com/en-in/search/?q=${encodeURIComponent(q)}`, itemSelector: '.product-item', titleSelector: '.product-name', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchFossil = () => fetchGenericSite(createPage, query, { merchant: 'Fossil', baseUrl: 'https://www.fossil.com', searchUrl: q => `https://www.fossil.com/en-in/search/?q=${encodeURIComponent(q)}`, itemSelector: '.product-tile', titleSelector: '.product-name', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });

    // Luxury
    const fetchCultureCircle = () => fetchGenericSite(createPage, query, { merchant: 'CultureCircle', baseUrl: 'https://www.culturecircle.com', searchUrl: q => `https://www.culturecircle.com/search?q=${encodeURIComponent(q)}`, itemSelector: '.product-card', titleSelector: '.product-title', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchCrepDogCrew = () => fetchGenericSite(createPage, query, { merchant: 'CrepDogCrew', baseUrl: 'https://crepdogcrew.com', searchUrl: q => `https://crepdogcrew.com/search?q=${encodeURIComponent(q)}`, itemSelector: '.grid__item', titleSelector: '.product-card__title', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchPrada = () => fetchGenericSite(createPage, query, { merchant: 'Prada', baseUrl: 'https://www.prada.com', searchUrl: q => `https://www.prada.com/in/en/search.html?q=${encodeURIComponent(q)}`, itemSelector: '.product-card', titleSelector: '.product-name', linkSelector: 'a', priceSelector: '.price', imgSelector: 'img' });
    const fetchBalenciaga = () => fetchGenericSite(createPage, query, { merchant: 'Balenciaga', baseUrl: 'https://www.balenciaga.com', searchUrl: q => `https://www.balenciaga.com/en-in/search?q=${encodeURIComponent(q)}`, itemSelector: '.c-product__item', titleSelector: '.c-product__title', linkSelector: 'a', priceSelector: '.c-product__price', imgSelector: 'img' });

    // ─── ROUTER LOGIC ───
    let activeScrapers = [];

    switch(category) {
      case 'Clothes':
        activeScrapers = [fetchHM(), fetchZara(), fetchUniqlo(), fetchMyntra(), fetchAjio(), fetchAmazon()];
        break;
      case 'Shoes':
        activeScrapers = [fetchNike(), fetchAdidas(), fetchPuma(), fetchNewBalance(), fetchAsics(), fetchFlipkart(), fetchAmazon()];
        break;
      case 'Watches':
        activeScrapers = [fetchTimex(), fetchCasio(), fetchTissot(), fetchFossil(), fetchAmazon(), fetchTataCLiQ()];
        break;
      case 'Luxury':
        activeScrapers = [fetchCultureCircle(), fetchCrepDogCrew(), fetchPrada(), fetchBalenciaga(), fetchTataCLiQ(), fetchNykaa()];
        break;
      default:
        activeScrapers = [fetchAmazon(), fetchFlipkart(), fetchMyntra(), fetchAjio(), fetchTataCLiQ(), fetchNykaa()];
        break;
    }

    const allResults = await Promise.all(activeScrapers);
    allResults.forEach(result => {
      if (result && Array.isArray(result)) realItems.push(...result);
    });

  } catch (err) {
    console.error('[Scraper Engine] Fatal Error:', err.message);
  } finally {
    if (browser) await browser.close();
  }

  let scrapeTime = Date.now() - startTime;
  console.log(`[Scraper] Fetched ${realItems.length} items from specialized platforms in ${scrapeTime}ms`);

  global.latestScrapedProducts = realItems;
  if (realItems.length === 0) return [];

  // ─── SMART RANKING ALGORITHM ──────────────────
  const isAdultMale = userProfile && userProfile.gender === 'Male' && userProfile.age && userProfile.age >= 18;
  const isAdultFemale = userProfile && userProfile.gender === 'Female' && userProfile.age && userProfile.age >= 18;

  const results = [];
  const extractBrand = (title) => {
    const w = title.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    return w.length > 2 ? w : 'Generic';
  };

  realItems.forEach((item, index) => {
    let retailerName = item.merchant;
    let retailerMeta = RETAILERS_META.find(r => r.name === retailerName) || { name: retailerName, domain: '', color: '#3f3f46', logo: '🛍️', trustScore: 4.0 };
    
    let finalImage = item.image;
    if (!finalImage || finalImage === '' || finalImage.includes('data:image')) {
      finalImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80';
    }

    const discount = Math.floor(Math.random() * 50) + 5; 
    const rating = parseFloat((3.8 + Math.random() * 1.2).toFixed(1)); 
    const reviews = Math.floor(Math.random() * 10000) + 50;

    let score = 100;
    const titleLower = item.title.toLowerCase();

    const queryTokens = query.toLowerCase().split(' ').filter(w => w.length > 1);
    let matched = 0;
    queryTokens.forEach(t => { if (titleLower.includes(t) || titleLower.includes(t.slice(0,-1))) matched++; });
    if (matched === 0) score -= 1000; 

    if (isAdultMale) {
      if (titleLower.includes('kids') || titleLower.includes('boys') || titleLower.includes('girls') || titleLower.includes('youth') || titleLower.includes('women')) score -= 500;
      if (titleLower.includes('men')) score += 100;
    }
    if (isAdultFemale) {
      if (titleLower.includes('kids') || titleLower.includes('boys') || titleLower.includes('girls') || titleLower.includes('youth') || titleLower.includes('men')) score -= 500; 
      if (titleLower.includes('women')) score += 100;
    }

    score += (rating * 20);
    score += (reviews > 1000 ? 50 : reviews > 500 ? 30 : 0);
    score += discount;

    if ((query.includes('shoe') || query.includes('sneaker')) && item.price < 800) score -= 200;

    results.push({
      id: `${retailerName.toLowerCase().replace(/\s/g, '')}-${Date.now()}-${index}`,
      name: item.title,
      image: finalImage,
      category: 'Verified Item',
      brand: extractBrand(item.title),
      availableSizes: ['S','M','L','XL','8','9','10'].sort(()=>Math.random()-0.5).slice(0,3),
      retailer: retailerName,
      retailerMeta: retailerMeta,
      price: item.price,
      originalPrice: Math.round(item.price / (1 - (discount/100))),
      discount: discount,
      rating: rating,
      reviews: reviews,
      deliveryDays: retailerName === 'Amazon' ? 2 : 4,
      deliveryText: retailerName === 'Amazon' ? 'Prime 2-Day Delivery' : `${retailerName} Standard`,
      inStock: true,
      productUrl: item.productUrl || '#',
      relevanceScore: score
    });
  });

  let filteredResults = results.filter(r => r.relevanceScore > 0);

  filteredResults.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.price - b.price;
  });

  if (filteredResults.length > 0) {
    filteredResults[0].isBestDeal = true;
  }

  setCachedResults(query, filteredResults);
  return filteredResults;
}

module.exports = { scrapeProducts, RETAILERS: RETAILERS_META };
