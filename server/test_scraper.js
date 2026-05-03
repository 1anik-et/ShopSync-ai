const { scrapeProducts } = require('./src/services/scraperService');

async function test() {
  console.log('Testing scraper for "Jordan retro"...');
  try {
    const results = await scrapeProducts('Jordan retro');
    console.log(`Results found: ${results.length}`);
    if (results.length > 0) {
      console.log('First result:', results[0].name, results[0].price, results[0].productUrl);
    } else {
      console.log('No results found. This often happens if DuckDuckGo blocks the request or the HTML structure changed.');
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
