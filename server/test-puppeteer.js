const puppeteer = require('puppeteer');

async function scrapeAmazon() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    // Use a very specific user agent to look like Chrome
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log("Navigating to Amazon...");
    await page.goto('https://www.amazon.in/s?k=jeans', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    const content = await page.content();
    if (content.includes('api-services-support@amazon.com') || content.includes('captcha')) {
       console.log('Blocked by Captcha/503');
    }
    
    // Scrape items
    const items = await page.evaluate(() => {
      const results = [];
      const blocks = document.querySelectorAll('div[data-component-type="s-search-result"]');
      blocks.forEach((el, i) => {
        if (i > 3) return;
        const out = {};
        const titleEl = el.querySelector('h2 span');
        if (titleEl) out.title = titleEl.innerText;
        
        const priceEl = el.querySelector('.a-price-whole');
        if (priceEl) out.price = priceEl.innerText;
        
        const imgEl = el.querySelector('img.s-image');
        if (imgEl) out.image = imgEl.src;
        
        results.push(out);
      });
      return results;
    });

    console.log(items);
  } catch (err) {
    console.error(err.message);
  } finally {
    await browser.close();
  }
}
scrapeAmazon();
