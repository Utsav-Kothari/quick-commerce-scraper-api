const puppeteer = require('puppeteer');

const scrapeZepto = async (productQuery = 'milk') => {
  console.log(`[Zepto] Launching Puppeteer...`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    console.log(`[Zepto] Opening Zepto site...`);
    await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2' });

    console.log(`[Zepto] Waiting for search input...`);
    await page.waitForSelector('input[placeholder="Search for products"]');
    await page.type('input[placeholder="Search for products"]', productQuery);
    await page.keyboard.press('Enter');

    console.log(`[Zepto] Waiting for results...`);
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="product-tile"]')).slice(0, 5);
      return items.map(p => ({
        title: p.querySelector('[data-testid="product-title"]')?.textContent.trim() || 'No title',
        price: p.querySelector('[data-testid="product-price"]')?.textContent.trim() || 'No price',
        availability: p.querySelector('[data-testid="product-out-of-stock"]') ? 'Unavailable' : 'Available'
      }));
    });

    console.log(`[Zepto] Found ${results.length} results`);
    await browser.close();
    return { query: productQuery, results };
  } catch (err) {
    console.error(`[Zepto Error] ${err.message}`);
    await browser.close();
    return { error: err.message };
  }
};

module.exports = scrapeZepto;