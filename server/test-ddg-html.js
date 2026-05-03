const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDDG(query) {
  try {
    const res = await axios.post('https://html.duckduckgo.com/html/', `q=site:amazon.in/dp+${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const $ = cheerio.load(res.data);
    const results = [];
    $('.result__title').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const url = $(el).find('a').attr('href');
      if (title.length > 5) {
         // remove generic branding "Amazon.in: "
         results.push({ title: title.replace(/^Amazon\.in[:\- ]+/i, ''), url });
      }
    });
    console.log(results.slice(0, 5));
  } catch (err) {
    console.error(err.message);
  }
}

scrapeDDG('jeans');
