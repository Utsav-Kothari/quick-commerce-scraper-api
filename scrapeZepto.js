const puppeteer = require('puppeteer');

const scrapeZepto = async (productQuery = 'milk') => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[placeholder="Search for products"]');
    await page.type('input[placeholder="Search for products"]', productQuery);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid="product-tile"]')).slice(0, 5).map(p => ({
        title: p.querySelector('[data-testid="product-title"]')?.textContent.trim(),
        price: p.querySelector('[data-testid="product-price"]')?.textContent.trim(),
        availability: p.querySelector('[data-testid="product-out-of-stock"]') ? 'Unavailable' : 'Available'
      }));
    });

    await browser.close();
    return { query: productQuery, results };
  } catch (err) {
    await browser.close();
    return { error: err.message };
  }
};

module.exports = scrapeZepto;