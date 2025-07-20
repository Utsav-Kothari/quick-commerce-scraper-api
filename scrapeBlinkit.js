const puppeteer = require('puppeteer');

const scrapeBlinkit = async (productQuery = 'milk') => {
  console.log(`[Blinkit] Launching Puppeteer...`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    console.log(`[Blinkit] Opening Blinkit site...`);
    await page.goto('https://www.blinkit.com/', { waitUntil: 'networkidle2' });

    console.log(`[Blinkit] Waiting for search box...`);
    await page.waitForSelector('input[type="search"]');
    await page.type('input[type="search"]', productQuery);
    await page.keyboard.press('Enter');

    console.log(`[Blinkit] Waiting for results to load...`);
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="product"]')).slice(0, 5);
      return items.map(p => ({
        title: p.querySelector('[data-testid="product-title"]')?.textContent.trim() || 'No title',
        price: p.querySelector('[data-testid="product-price"]')?.textContent.trim() || 'No price',
        availability: p.querySelector('[data-testid="product-unavailable"]') ? 'Unavailable' : 'Available'
      }));
    });

    console.log(`[Blinkit] Found ${results.length} results`);
    await browser.close();
    return { query: productQuery, results };
  } catch (err) {
    console.error(`[Blinkit Error] ${err.message}`);
    await browser.close();
    return { error: err.message };
  }
};

module.exports = scrapeBlinkit;