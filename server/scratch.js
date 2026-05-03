const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const query = 'jeans';
  console.log('Testing Amazon...');
  try {
    const amz = await axios.get(`https://www.amazon.in/s?k=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const $ = cheerio.load(amz.data);
    const amzItems = $('div[data-component-type="s-search-result"]');
    console.log('Amazon items found:', amzItems.length);
    amzItems.each((i, el) => {
      const title = $(el).find('h2 a span').text().trim();
      const priceText = $(el).find('.a-price .a-offscreen').first().text().trim();
      const img = $(el).find('img.s-image').attr('src');
      console.log(`- Amz: ${title.substring(0,20)} | ${priceText} | Img: ${!!img}`);
    });
  } catch(e) {
    console.error('Amazon error', e.message);
  }

  console.log('\nTesting Flipkart...');
  try {
    const fk = await axios.get(`https://www.flipkart.com/search?q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const $ = cheerio.load(fk.data);
    const fkItems = $('a[target="_blank"]');
    console.log('Flipkart items found:', fkItems.length);
    fkItems.each((i, el) => {
      let title = $(el).find('div[class*="s1Q9rs"], div[class*="irpwTa"], div[class*="_4rR01T"]').text().trim();
      if (!title) title = $(el).find('img').attr('alt');
      const priceText = $(el).find('div[class*="_30jeq3"]').text().trim() || $(el).find('div:contains("₹")').last().text();
      const img = $(el).find('img').attr('src');
      if (title && priceText && img) {
         console.log(`- FK: ${title.substring(0,20)} | ${priceText} | Img: ${!!img}`);
      }
    });
  } catch(e) {
    console.error('Flipkart error', e.message);
  }
}

test();
