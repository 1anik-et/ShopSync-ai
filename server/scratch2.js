const axios = require('axios');
const cheerio = require('cheerio');

async function testDDG() {
  const query = 'jordan';
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:amazon.in ${query}`)}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(res.data);
    const items = [];
    $('.result').each((i, el) => {
      const title = $(el).find('.result__title a').text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      const link = $(el).find('.result__url').attr('href');
      items.push({ title, snippet, link });
    });
    console.log(items);
  } catch(e) {
    console.error(e.message);
  }
}
testDDG();
