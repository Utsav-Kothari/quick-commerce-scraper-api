const puppeteer = require('puppeteer');

const scrapeBlinkit = async (productQuery = 'milk') => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.blinkit.com/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="search"]');
    await page.type('input[type="search"]', productQuery);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid="product"]')).slice(0, 5).map(p => ({
        title: p.querySelector('[data-testid="product-title"]')?.textContent.trim(),
        price: p.querySelector('[data-testid="product-price"]')?.textContent.trim(),
        availability: p.querySelector('[data-testid="product-unavailable"]') ? 'Unavailable' : 'Available'
      }));
    });

    await browser.close();
    return { query: productQuery, results };
  } catch (err) {
    await browser.close();
    return { error: err.message };
  }
};

module.exports = scrapeBlinkit;