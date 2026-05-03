const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cheerio = require('cheerio');

async function testPuppeteerGoogle() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    await page.goto('https://www.google.com/search?q=site:ajio.com+puma+shoes', { waitUntil: 'domcontentloaded' });
    const content = await page.content();
    const $ = cheerio.load(content);
    console.log('Title:', $('title').text());
    let results = 0;
    $('div.g').each((i, el) => {
      const link = $(el).find('a').first().attr('href');
      if (link && link.includes('ajio.com')) results++;
    });
    console.log('Found real results:', results);
  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}
testPuppeteerGoogle();
