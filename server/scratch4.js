const axios = require('axios');
const cheerio = require('cheerio');

async function testEbay() {
  try {
    const res = await axios.get('https://www.ebay.com/sch/i.html?_nkw=leather+jacket', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(res.data);
    const items = [];
    $('.s-item').each((i, el) => {
      if (i > 5) return;
      const title = $(el).find('.s-item__title').text().trim();
      const priceText = $(el).find('.s-item__price').text().trim();
      let image = $(el).find('.s-item__image-img').attr('src');
      let url = $(el).find('.s-item__link').attr('href');
      items.push({ title, priceText, image, url });
    });
    console.log(items);
  } catch(e) {
    console.error(e.message);
  }
}
testEbay();
