const puppeteer = require('puppeteer');

async function scrapeAmazon() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0');
    await page.goto('https://www.amazon.in/s?k=harden+basketball+shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Check elements
    const itemInfo = await page.evaluate(() => {
      const results = [];
      const blocks = document.querySelectorAll('div[data-component-type="s-search-result"]');
      blocks.forEach((el, i) => {
        if (i > 6) return;
        let isSponsored = false;
        
        // Amazon sponsored label usually has "Sponsored" text or specific child
        const sponsoredTag = el.querySelector('.puis-sponsored-label-text, .s-sponsored-label-info-icon, a[aria-label="View Sponsored information"]');
        if (sponsoredTag || el.innerText.includes('Sponsored')) isSponsored = true;
        
        const titleEl = el.querySelector('h2 a span') || el.querySelector('h2 span');
        results.push({
           title: titleEl ? titleEl.innerText : 'Unknown',
           isSponsored
        });
      });
      return results;
    });
    console.log(itemInfo);
  } catch(e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}
scrapeAmazon();
