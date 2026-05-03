const axios = require('axios');
const cheerio = require('cheerio');

async function testLite() {
  const query = 'Jordan retro site:amazon.in OR site:flipkart.com';
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  console.log('Fetching:', url);
  
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(res.data);
    const results = $('table tr');
    console.log('Found table rows:', results.length);
    
    // In DDG Lite, results are often in a table
    $('tr').each((i, el) => {
      const link = $(el).find('a.result-link');
      if (link.length > 0) {
        console.log(`[${i}] Title: ${link.text().trim()}`);
      }
    });
    
    if (results.length === 0) {
        console.log('Full content:', res.data.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLite();
