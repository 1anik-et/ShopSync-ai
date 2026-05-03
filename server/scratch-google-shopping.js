const puppeteer = require('puppeteer');

async function scrapeGoogleShopping(query) {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const html = await page.evaluate(() => {
        const els = document.querySelectorAll('div[data-docid], .sh-dgr__grid-result, .sh-pr__product-results-grid > div');
        if (els.length > 0) return els[0].innerHTML;
        return document.body.innerHTML.substring(0, 5000);
    });
    
    console.log(html);
  } catch(e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}
scrapeGoogleShopping('adidas basketball shoes');
