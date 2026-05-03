const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testInterception() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto('https://www.myntra.com/puma-shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const content = await page.content();
    const $ = cheerio.load(content);
    let myntraItems = [];
    $('.product-base').each((i, el) => {
      if(i < 2) myntraItems.push($(el).find('.product-brand').text());
    });
    console.log('Myntra Items with Interception:', myntraItems);

  } catch(e) { console.log(e.message); } finally { await browser.close(); }
}
testInterception();
