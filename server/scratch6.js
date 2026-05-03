const axios = require('axios');
const cheerio = require('cheerio');

async function testGoogle() {
  try {
    const res = await axios.get('https://www.google.com/search?tbm=shop&q=laptop', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(res.data);
    
    // Fallback parser since class names change
    // Usually item containers have some specific generic attributes or structure
    const items = [];
    $('div').each((i, el) => {
      const text = $(el).text();
      // look for $ symbol and h3-like structure
      if ($(el).find('img').length > 0 && text.includes('$')) {
        const title = $(el).find('h3').text() || $(el).find('div[role="heading"]').text() || $(el).find('a > div').first().text();
        const price = text.match(/\$[\d,]+\.?\d*/)?.[0];
        const img = $(el).find('img').attr('src');
        if (title && title.length > 10 && price && img && img.startsWith('http')) {
           items.push({ title, price, img });
        }
      }
    });

    console.log(items.slice(0, 5));
  } catch(e) {
    console.error(e.message);
  }
}
testGoogle();
