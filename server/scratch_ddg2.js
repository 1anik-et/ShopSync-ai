const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDDG() {
  const url = 'https://html.duckduckgo.com/html/?q=site:ajio.com+puma+shoes';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const $ = cheerio.load(res.data);
  const results = [];
  $('.result').each((i, el) => {
    const title = $(el).find('.result__title').text().trim();
    const link = $(el).find('.result__snippet').attr('href') || $(el).find('.result__url').attr('href');
    if (title && link) results.push({ title, link });
  });
  console.log(results);
}
scrapeDDG();
