const axios = require('axios');
const cheerio = require('cheerio');

async function testDDG() {
  try {
    const query = 'site:hm.com/en_in "t-shirt"';
    const res = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(res.data);
    let results = [];
    $('.result__body').each((i, el) => {
      const title = $(el).find('.result__title').text().trim();
      const link = $(el).find('.result__url').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();
      results.push({ title, link, snippet });
    });
    console.log(results.slice(0, 3));
  } catch(e) { console.error('Error:', e.message); }
}

testDDG();
