/**
 * Category Engine — Dynamic Search Intent Analyzer
 * The BRAIN of the hybrid system. Determines which retailers to
 * fire based on what the user is searching for.
 *
 * If user types "Nike Air Jordans" → intent: sneakers → priority: CDC, CultureCircle, Myntra
 * If user types "blue denim jacket" → intent: fashion → priority: Zara, H&M, Ajio
 */

const CATEGORY_RULES = [
  {
    type: 'sneakers',
    keywords: /\b(shoe|shoes|sneaker|sneakers|boot|boots|runner|runners|kicks|cleat|cleats|jordan|air\s?force|air\s?max|yeezy|dunk|slide|slides|slipper|slippers|sandal|sandals|nike|adidas|puma|asics|new\s?balance|reebok|converse|vans|skechers)\b/i,
    prioritySites: ['CrepDogCrew', 'CultureCircle', 'Myntra', 'Flipkart'],
    allSites: ['CrepDogCrew', 'CultureCircle', 'Myntra', 'Flipkart', 'Amazon', 'Ajio', 'Nykaa', 'TataCLiQ'],
  },
  {
    type: 'fashion',
    keywords: /\b(shirt|shirts|t-shirt|tshirt|tee|dress|dresses|jacket|jackets|hoodie|hoodies|jeans|jean|pant|pants|trouser|trousers|kurta|kurti|saree|lehenga|top|tops|skirt|skirts|blazer|coat|sweatshirt|sweater|cardigan|polo|chinos|shorts|apparel|clothing|outfit|zara|h&m|hm|uniqlo|mango|forever\s?21|gap)\b/i,
    prioritySites: ['Zara', 'H&M', 'Myntra', 'Ajio'],
    allSites: ['Zara', 'H&M', 'Myntra', 'Ajio', 'Amazon', 'Flipkart', 'Nykaa', 'TataCLiQ'],
  },
  {
    type: 'watches',
    keywords: /\b(watch|watches|chronograph|timepiece|wristwatch|smartwatch|analog|digital\s?watch|casio|tissot|timex|fossil|seiko|titan|rolex|g-shock|gshock|fitbit|garmin|apple\s?watch)\b/i,
    prioritySites: ['Amazon', 'Flipkart', 'TataCLiQ'],
    allSites: ['Amazon', 'Flipkart', 'TataCLiQ', 'Myntra', 'Ajio', 'Nykaa'],
  },
  {
    type: 'luxury',
    keywords: /\b(luxury|designer|prada|balenciaga|gucci|dior|louis\s?vuitton|chanel|versace|fendi|burberry|valentino|givenchy|saint\s?laurent|celine|bottega|off-white|premium|high-end)\b/i,
    prioritySites: ['CultureCircle', 'CrepDogCrew', 'Nykaa'],
    allSites: ['CultureCircle', 'CrepDogCrew', 'Nykaa', 'Myntra', 'Ajio', 'Amazon', 'TataCLiQ'],
  },
  {
    type: 'beauty',
    keywords: /\b(makeup|lipstick|foundation|mascara|eyeshadow|blush|concealer|skincare|serum|moisturizer|sunscreen|perfume|fragrance|cologne|deodorant|nykaa|lakme|maybelline|loreal)\b/i,
    prioritySites: ['Nykaa', 'Amazon', 'Flipkart'],
    allSites: ['Nykaa', 'Amazon', 'Flipkart', 'Myntra', 'TataCLiQ'],
  },
  {
    type: 'electronics',
    keywords: /\b(phone|laptop|tablet|headphone|earphone|earbuds|speaker|camera|tv|television|monitor|keyboard|mouse|charger|cable|powerbank|samsung|apple|oneplus|realme|xiaomi|sony|jbl|boat|bose)\b/i,
    prioritySites: ['Amazon', 'Flipkart', 'TataCLiQ'],
    allSites: ['Amazon', 'Flipkart', 'TataCLiQ'],
  },
];

const DEFAULT_INTENT = {
  type: 'general',
  prioritySites: ['Amazon', 'Flipkart', 'Myntra', 'Ajio'],
  allSites: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'H&M', 'Zara', 'TataCLiQ', 'CrepDogCrew', 'CultureCircle'],
};

/**
 * Analyze a search query and determine intent + which sites to hit.
 * @param {string} query
 * @returns {{ type: string, prioritySites: string[], allSites: string[], limitPerSite: number }}
 */
function analyzeSearchIntent(query) {
  if (!query || typeof query !== 'string') {
    return { ...DEFAULT_INTENT, limitPerSite: 10 };
  }

  const q = query.trim().toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.test(q)) {
      return {
        type: rule.type,
        prioritySites: [...rule.prioritySites],
        allSites: [...rule.allSites],
        limitPerSite: 10,
      };
    }
  }

  return { ...DEFAULT_INTENT, limitPerSite: 10 };
}

module.exports = { analyzeSearchIntent };
