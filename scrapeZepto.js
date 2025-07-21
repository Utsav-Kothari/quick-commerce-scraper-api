const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeZepto = async (productQuery = 'milk') => {
  console.log(`[Zepto] Launching Stealth Puppeteer...`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-IN,en;q=0.9' });
    await page.emulateTimezone('Asia/Kolkata');
    await page.setGeolocation({ latitude: 28.6139, longitude: 77.2090 });
    await page.evaluateOnNewDocument(() => {
      navigator.geolocation.getCurrentPosition = function(success) {
        success({ coords: { latitude: 28.6139, longitude: 77.2090 } });
      };
    });

    console.log(`[Zepto] Navigating to Zepto...`);
    await page.goto('https://www.zeptonow.com/', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`[URL Loaded] ${page.url()}`);
    console.log(`[Title] ${await page.title()}`);

    const placeholders = await page.$$eval('input', els => els.map(e => e.placeholder));
    console.log('[Zepto] Input placeholders found:', placeholders);

    try {
      await page.waitForSelector('[data-testid="location-popup"] button', { timeout: 5000 });
      console.log(`[Zepto] Location popup detected — closing`);
      await page.click('[data-testid="location-popup"] button');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`[Zepto] No location popup detected`);
    }

    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 60000 });
    await page.type('input[placeholder*="Search"]', productQuery);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);

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

    console.log(`[Zepto] Scraped ${results.length} products.`);
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
