const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testPuppeteerScrapers() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  try {
    // Test Flipkart
    const page1 = await browser.newPage();
    await page1.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page1.goto('https://www.flipkart.com/search?q=puma+shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const fkContent = await page1.content();
    const $1 = cheerio.load(fkContent);
    const fkTitle = $1('a.IRpwTa, a.WKTcLC, div.KzDlHZ, a.s1Q9rs, div._4rR01T').first().text().trim();
    console.log('Flipkart Title:', fkTitle);

    // Test Myntra
    const page2 = await browser.newPage();
    await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page2.goto('https://www.myntra.com/puma-shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const myntraContent = await page2.content();
    const $2 = cheerio.load(myntraContent);
    const myntraTitle = $2('.product-brand').first().text().trim() + ' ' + $2('.product-product').first().text().trim();
    console.log('Myntra Title:', myntraTitle);

    // Test Ajio
    const page3 = await browser.newPage();
    await page3.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page3.goto('https://www.ajio.com/search/?text=puma+shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const ajioContent = await page3.content();
    const $3 = cheerio.load(ajioContent);
    const ajioTitle = $3('.nameCls').first().text().trim();
    console.log('Ajio Title:', ajioTitle);

  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}
testPuppeteerScrapers();
