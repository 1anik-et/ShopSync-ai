const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function extractSelectors() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 1. Myntra
    await page.goto('https://www.myntra.com/puma-shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    let $ = cheerio.load(await page.content());
    let myntraItems = [];
    $('.product-base').each((i, el) => {
      if(i < 2) {
        myntraItems.push({
          title: $(el).find('.product-brand').text() + ' ' + $(el).find('.product-product').text(),
          price: $(el).find('.product-discountedPrice').text() || $(el).find('.product-price').text(),
          link: $(el).find('a').attr('href'),
          image: $(el).find('picture img').attr('src')
        });
      }
    });
    console.log('Myntra:', myntraItems);

    // 2. Ajio
    await page.goto('https://www.ajio.com/search/?text=puma+shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    $ = cheerio.load(await page.content());
    let ajioItems = [];
    $('.item').each((i, el) => {
      if(i < 2) {
        ajioItems.push({
          title: $(el).find('.nameCls').text(),
          price: $(el).find('.price').text(),
          link: $(el).find('a.rilrtl-products-list__link').attr('href'),
          image: $(el).find('img').attr('src')
        });
      }
    });
    console.log('Ajio:', ajioItems);

  } catch(e) { console.log(e.message); } finally { await browser.close(); }
}
extractSelectors();
