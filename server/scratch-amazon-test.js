const puppeteer = require('puppeteer');

async function testAmazon() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto("https://www.amazon.in/s?k=adidas", { waitUntil: 'domcontentloaded' });
    
    const items = await page.evaluate(() => {
      const results = [];
      const blocks = document.querySelectorAll('div[data-component-type="s-search-result"]');
      blocks.forEach((el) => {
         const h2InsideA = el.querySelector('a.a-link-normal h2');
         const aTag = h2InsideA ? h2InsideA.closest('a') : null;
         
         results.push({
           aTag: !!aTag,
           href: aTag ? aTag.getAttribute('href') : null,
           text: h2InsideA ? h2InsideA.innerText.trim() : null
         });
      });
      return results;
    });
    console.log(items.slice(0, 3));
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await browser.close();
  }
}
testAmazon();
