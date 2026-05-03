const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://html.duckduckgo.com/html/?q=site:ajio.com+puma+shoes', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(res => {
  const $ = cheerio.load(res.data);
  $('.result__title a').each((i, el) => console.log($(el).text(), $(el).attr('href')));
}).catch(e => console.error(e.message));
