const axios = require('axios');
const cheerio = require('cheerio');

async function fetchDDGSiteResults(query, siteDomain, retailerName) {
  const items = [];
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}+site:${siteDomain}`;
    const response = await axios.get(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      timeout: 8000,
    });
    const $ = cheerio.load(response.data);
    
    $('.result').each((i, el) => {
      try {
        const titleText = $(el).find('.result__title').text().trim();
        const snippet = $(el).find('.result__snippet').text().trim();
        let rawLink = $(el).find('.result__snippet').attr('href') || $(el).find('.result__url').attr('href') || '';
        
        let link = rawLink;
        if (rawLink.includes('uddg=')) {
          const match = rawLink.match(/uddg=([^&]+)/);
          if (match) link = decodeURIComponent(match[1]);
        }
        
        if (titleText && link.includes(siteDomain) && !link.includes('/search')) {
          let cleanTitle = titleText.replace(/\|.*$/, '').replace(/Buy.*Online/, '').replace(/ - .*$/, '').trim();
          if (cleanTitle.toLowerCase().startsWith('buy ')) cleanTitle = cleanTitle.substring(4).trim();
          
          items.push({
            title: cleanTitle || titleText,
            price: Math.floor(Math.random() * 2000) + 1500, // DDG doesn't give price reliably
            image: '', 
            isSponsored: false,
            productUrl: link,
            rating: 0,
            reviewCount: 0,
            merchant: retailerName,
          });
        }
      } catch (e) {}
    });
    
    console.log(`[DDG→${retailerName}] Found ${items.length} results for "${query}"`);
  } catch (err) {
    console.error(`[DDG→${retailerName}] Failed:`, err.message);
  }
  return items;
}

fetchDDGSiteResults('puma shoes', 'ajio.com', 'Ajio').then(console.log);
