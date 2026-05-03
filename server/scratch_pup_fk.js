const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function testFlipkart() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://www.flipkart.com/search?q=puma+shoes', { waitUntil: 'domcontentloaded', timeout: 15000 });
    let $ = cheerio.load(await page.content());
    let fkItems = [];
    $('div[data-id], div._1AtVbE, a.CGtC98, a.VJA3rP').each((i, el) => {
      if(i < 3) {
        fkItems.push({
          title: $(el).find('a.IRpwTa, a.WKTcLC, div.KzDlHZ, a.s1Q9rs, div._4rR01T, a[title]').first().attr('title') || $(el).find('a').text(),
          price: $(el).find('div._30jeq3, div.Nx9bqj, div._25b18c').first().text(),
          link: $(el).find('a').attr('href')
        });
      }
    });
    console.log('Flipkart:', fkItems);
  } catch(e) { console.log(e.message); } finally { await browser.close(); }
}
testFlipkart();
