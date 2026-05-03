const axios = require('axios');
const cheerio = require('cheerio');

async function testDDGLite() {
  const url = 'https://lite.duckduckgo.com/lite/';
  const res = await axios.post(url, 'q=site:ajio.com+puma+shoes', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const $ = cheerio.load(res.data);
  const links = [];
  $('a.result-url').each((i, el) => {
    links.push($(el).attr('href'));
  });
  console.log(links);
}
testDDGLite();
