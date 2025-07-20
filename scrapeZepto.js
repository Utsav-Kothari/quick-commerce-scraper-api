const puppeteer = require('puppeteer');

const scrapeZepto = async (productQuery = 'milk') => {
  console.log(`[Zepto] Launching Puppeteer...`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    console.log(`[Zepto] Opening Zepto site...`);
    await page.goto('https://www.zeptonow.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Try to dismiss location popup if it appears
    try {
      await page.waitForSelector('[data-testid="location-popup"] button', { timeout: 5000 });
      console.log(`[Zepto] Location popup detected — attempting to close`);
      await page.click('[data-testid="location-popup"] button');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`[Zepto] No location popup found — continuing`);
    }

    console.log(`[Zepto] Waiting for search input...`);
    await page.waitForSelector('input[placeholder="Search for products"]', { timeout: 60000 });
    await page.type('input[placeholder="Search for products"]', productQuery);
    await page.keyboard.press('Enter');

    await page.waitForTimeout(7000);
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
    const html = await page.content();
    console.log(`[Zepto HTML Dump]:\n${html.substring(0, 1000)}...`);
    await browser.close();
    return { error: err.message };
  }
};

module.exports = scrapeZepto;
