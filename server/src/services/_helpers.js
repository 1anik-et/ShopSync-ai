/**
 * _helpers.js — Shared Utilities for the Hybrid Fetching System
 * Every tier imports from here. This is the ONLY place axios clients,
 * validators, price parsers, and retailer metadata live.
 */
const axios = require('axios');

// ─── Rotating User-Agents ────────────────────────────────
const DESKTOP_UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
];
const MOBILE_UAS = [
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
];

const randomUA = (type = 'desktop') => {
  const list = type === 'mobile' ? MOBILE_UAS : DESKTOP_UAS;
  return list[Math.floor(Math.random() * list.length)];
};

// ─── Axios Client Factory ────────────────────────────────
function createClient(extraHeaders = {}, type = 'desktop') {
  return axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': randomUA(type),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      ...extraHeaders,
    },
    maxRedirects: 5,
  });
}

// ─── Price Parsing ───────────────────────────────────────
function parsePrice(text) {
  if (!text) return 0;
  if (typeof text === 'number') return Math.round(text);
  const cleaned = String(text).replace(/[^\d.,]/g, '');
  const match = cleaned.match(/([\d,]+)(\.?\d*)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''), 10) || 0;
}

// ─── Product Validation ─────────────────────────────────
function isValidProduct(item) {
  if (!item) return false;
  if (!item.title || item.title.trim().length < 5) return false;
  if (!item.price || item.price <= 0) return false;
  if (!item.productUrl || item.productUrl === '#') return false;
  // Reject placeholder / broken images
  const img = item.imageUrl || '';
  if (img.includes('data:image')) return false;
  if (img.includes('unsplash.com')) return false;
  if (img.includes('placeholder')) return false;
  if (img.includes('no-image')) return false;
  return true;
}

// ─── Product Formatting ─────────────────────────────────
function formatProduct(raw, retailer, index = 0) {
  const price = parsePrice(raw.price);
  const originalPrice = raw.originalPrice
    ? parsePrice(raw.originalPrice)
    : Math.round(price * (1 + Math.random() * 0.3 + 0.05));
  return {
    id: `${retailer.toLowerCase().replace(/[\s&]/g, '')}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    title: String(raw.title || '').trim().slice(0, 200),
    price,
    originalPrice: Math.max(originalPrice, price),
    retailer,
    productUrl: raw.productUrl || '#',
    imageUrl: raw.imageUrl || '',
  };
}

// ─── Retailer Metadata ──────────────────────────────────
const RETAILERS_META = {
  'Amazon':          { domain: 'amazon.in',          color: '#FF9900', logo: '🛒', trustScore: 4.5 },
  'Flipkart':        { domain: 'flipkart.com',       color: '#2874F0', logo: '🛍️', trustScore: 4.3 },
  'Myntra':          { domain: 'myntra.com',          color: '#FF3E6C', logo: '👕', trustScore: 4.4 },
  'Ajio':            { domain: 'ajio.com',            color: '#2C4152', logo: '👗', trustScore: 4.2 },
  'Nykaa':           { domain: 'nykaafashion.com',    color: '#FC2779', logo: '💄', trustScore: 4.2 },
  'TataCLiQ':        { domain: 'tatacliq.com',        color: '#6C2EB9', logo: '🏬', trustScore: 4.1 },
  'H&M':             { domain: 'hm.com',              color: '#E50010', logo: '👔', trustScore: 4.3 },
  'Zara':            { domain: 'zara.com',             color: '#1a1a1a', logo: '🧥', trustScore: 4.6 },
  'CrepDogCrew':     { domain: 'crepdogcrew.com',     color: '#FCD116', logo: '👟', trustScore: 4.7 },
  'CultureCircle':   { domain: 'culturecircle.com',   color: '#1a1a1a', logo: '🔥', trustScore: 4.8 },
  'Bewakoof':        { domain: 'bewakoof.com',        color: '#FDD835', logo: '😎', trustScore: 4.0 },
  'Snitch':          { domain: 'snitch.co.in',        color: '#000000', logo: '🔥', trustScore: 4.1 },
  'Meesho':          { domain: 'meesho.com',          color: '#570741', logo: '🛒', trustScore: 3.8 },
  'JioMart':         { domain: 'jiomart.com',         color: '#0078D4', logo: '🏪', trustScore: 4.0 },
  'Nike':            { domain: 'nike.com',            color: '#111111', logo: '✓', trustScore: 4.8 },
  'Adidas':          { domain: 'adidas.co.in',        color: '#000000', logo: '🏃', trustScore: 4.7 },
  'Puma':            { domain: 'puma.com',            color: '#000000', logo: '🐆', trustScore: 4.6 },
  'Snapdeal':        { domain: 'snapdeal.com',        color: '#E40046', logo: '🛒', trustScore: 3.5 },
  'Croma':           { domain: 'croma.com',           color: '#00843D', logo: '📱', trustScore: 4.3 },
  'Reliance Digital': { domain: 'reliancedigital.in', color: '#003DA5', logo: '⚡', trustScore: 4.2 },
  'Virgio':          { domain: 'virgio.com',          color: '#2D5F2D', logo: '🌿', trustScore: 4.0 },
  'LimeRoad':        { domain: 'limeroad.com',        color: '#E91E63', logo: '👗', trustScore: 3.9 },
  'Other':           { domain: '',                    color: '#6B7280', logo: '🛍️', trustScore: 3.5 },
  // Auto-discovered from SerpApi
  'OffDuty':         { domain: 'offdutyindia.com',    color: '#4A4A4A', logo: '🧢', trustScore: 4.0 },
  'The Souled Store': { domain: 'thesouledstore.com', color: '#E91E63', logo: '🎨', trustScore: 4.2 },
  'Uniqlo India':    { domain: 'uniqlo.com',          color: '#C41230', logo: '🎌', trustScore: 4.5 },
  'WROGN':           { domain: 'wrogn.com',           color: '#1A1A1A', logo: '🔥', trustScore: 3.9 },
  'Pepe Jeans':      { domain: 'pepejeans.in',        color: '#003087', logo: '👖', trustScore: 4.3 },
  'Levi Strauss India': { domain: 'levi.in',          color: '#C41230', logo: '👖', trustScore: 4.6 },
  'Marks & Spencer': { domain: 'marksandspencer.in',  color: '#1A1A1A', logo: '🏷️', trustScore: 4.4 },
  'Only':            { domain: 'only.in',             color: '#000000', logo: '👗', trustScore: 4.0 },
  'Savana':          { domain: 'savana.in',            color: '#2D5F2D', logo: '🌿', trustScore: 3.8 },
  'The Pant Project': { domain: 'thepantproject.com',  color: '#1E3A5F', logo: '👖', trustScore: 4.1 },
};

function getRetailerMeta(name) {
  if (RETAILERS_META[name]) return RETAILERS_META[name];
  // Auto-generate a consistent color for unknown retailers
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = '#' + ((hash >> 0) & 0xFFFFFF).toString(16).padStart(6, '0');
  return { domain: '', color, logo: '🛍️', trustScore: 3.8 };
}

module.exports = {
  createClient, randomUA, parsePrice, isValidProduct,
  formatProduct, getRetailerMeta, RETAILERS_META,
};
