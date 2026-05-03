const axios = require('axios');
const cheerio = require('cheerio');

async function testGoogle() {
  try {
    const res = await axios.get('https://www.google.com/search?tbm=shop&q=laptop', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(res.data);
    const items = [];
    $('.sh-dgr__grid-result').each((i, el) => {
      if (i > 5) return;
      const title = $(el).find('h3').text().trim();
      const priceText = $(el).find('span.a8Pemb').text().trim();
      const image = $(el).find('img').attr('src');
      const url = 'https://google.com' + $(el).find('a').attr('href');
      items.push({ title, priceText, image, url });
    });
    console.log(items);
  } catch(e) {
    console.error(e.message);
  }
}
testGoogle();
