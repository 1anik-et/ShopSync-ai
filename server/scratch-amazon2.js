const puppeteer = require('puppeteer');
const fs = require('fs');

async function testAmazon() {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto("https://www.amazon.in/s?k=adidas", { waitUntil: 'domcontentloaded' });
    
    const html = await page.evaluate(() => {
      const block = document.querySelector('div[data-component-type="s-search-result"]');
      return block ? block.innerHTML : document.body.innerHTML.substring(0, 5000);
    });
    fs.writeFileSync('scratch.html', html);
    console.log("Done");
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await browser.close();
  }
}
testAmazon();
