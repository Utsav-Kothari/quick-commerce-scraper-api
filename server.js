const express = require('express');
const cors = require('cors');
const scrapeBlinkit = require('./scrapeBlinkit');
const scrapeZepto = require('./scrapeZepto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/scrape-blinkit', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param missing' });
  const result = await scrapeBlinkit(query);
  res.json(result);
});

app.get('/scrape-zepto', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param missing' });
  const result = await scrapeZepto(query);
  res.json(result);
});

app.get('/compare-all', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query param missing' });

  const [blinkit, zepto] = await Promise.all([
    scrapeBlinkit(query),
    scrapeZepto(query)
  ]);

  const combined = [
    ...(zepto.results || []).map(r => ({ ...r, source: 'Zepto' })),
    ...(blinkit.results || []).map(r => ({ ...r, source: 'Blinkit' }))
  ];

  combined.sort((a, b) => parseFloat(a.price.replace(/[^\d.]/g, '')) - parseFloat(b.price.replace(/[^\d.]/g, '')));

  res.json({ query, results: combined });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});