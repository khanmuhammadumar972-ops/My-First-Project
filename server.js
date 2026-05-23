require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── In-memory cache ───────────────────────────────────────────────────────
const cache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCache(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

// ─── Mock historical data generator ────────────────────────────────────────
function generateHistory(basePrice, days, volatility = 0.02) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.49) * volatility);
    data.push({
      timestamp: now - i * 24 * 60 * 60 * 1000,
      price: parseFloat(price.toFixed(6))
    });
  }
  return data;
}

// ─── /api/forex ────────────────────────────────────────────────────────────
app.get('/api/forex', async (req, res) => {
  const cached = getCache('forex');
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('https://api.exchangerate.host/latest', {
      params: { base: 'USD', symbols: 'PKR,INR,EUR,GBP,SAR,AED,JPY,CNY,CAD,AUD,CHF,TRY,MXN,BRL,SGD,HKD,SEK,NOK,DKK,NZD' },
      timeout: 8000
    });

    const rates = response.data.rates || {};
    const result = {
      base: 'USD',
      timestamp: Date.now(),
      rates,
      source: 'exchangerate.host'
    };
    setCache('forex', result);
    res.json(result);
  } catch (err) {
    console.error('Forex API error:', err.message);
    // Fallback mock data
    const fallback = {
      base: 'USD',
      timestamp: Date.now(),
      rates: {
        PKR: 278.50, INR: 83.12, EUR: 0.9201, GBP: 0.7845,
        SAR: 3.7501, AED: 3.6725, JPY: 149.23, CNY: 7.2341,
        CAD: 1.3612, AUD: 1.5234, CHF: 0.8923, TRY: 30.21,
        MXN: 17.15, BRL: 4.98, SGD: 1.3401, HKD: 7.8221,
        SEK: 10.45, NOK: 10.81, DKK: 6.89, NZD: 1.6123
      },
      source: 'fallback'
    };
    res.json(fallback);
  }
});

// ─── /api/crypto ───────────────────────────────────────────────────────────
app.get('/api/crypto', async (req, res) => {
  const cached = getCache('crypto');
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,avalanche-2,chainlink,litecoin,uniswap',
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true
      },
      timeout: 8000
    });

    const result = { data: response.data, timestamp: Date.now(), source: 'coingecko' };
    setCache('crypto', result);
    res.json(result);
  } catch (err) {
    console.error('Crypto API error:', err.message);
    const fallback = {
      data: {
        bitcoin: { usd: 67543.21, usd_24h_change: 2.34, usd_market_cap: 1325000000000 },
        ethereum: { usd: 3412.56, usd_24h_change: 1.87, usd_market_cap: 410000000000 },
        binancecoin: { usd: 412.34, usd_24h_change: -0.45, usd_market_cap: 62000000000 },
        solana: { usd: 178.92, usd_24h_change: 4.21, usd_market_cap: 78000000000 },
        ripple: { usd: 0.6234, usd_24h_change: -1.23, usd_market_cap: 34000000000 },
        cardano: { usd: 0.4521, usd_24h_change: 0.87, usd_market_cap: 15900000000 },
        dogecoin: { usd: 0.0823, usd_24h_change: 3.45, usd_market_cap: 11700000000 },
        litecoin: { usd: 73.45, usd_24h_change: -0.92, usd_market_cap: 5400000000 }
      },
      timestamp: Date.now(),
      source: 'fallback'
    };
    res.json(fallback);
  }
});

// ─── /api/gold ─────────────────────────────────────────────────────────────
app.get('/api/gold', async (req, res) => {
  const cached = getCache('gold');
  if (cached) return res.json(cached);

  const METAL_API_KEY = process.env.METAL_API_KEY;

  if (METAL_API_KEY) {
    try {
      const response = await axios.get(`https://metals-api.com/api/latest`, {
        params: { access_key: METAL_API_KEY, base: 'USD', symbols: 'XAU,XAG,XPT,XPD' },
        timeout: 8000
      });
      const result = { data: response.data, timestamp: Date.now(), source: 'metals-api' };
      setCache('gold', result);
      return res.json(result);
    } catch (err) {
      console.error('Metals API error:', err.message);
    }
  }

  // Fallback with realistic data
  const fallback = {
    data: {
      rates: {
        XAU: 0.000524,  // Gold (USD per troy oz ≈ 1908)
        XAG: 0.04348,   // Silver
        XPT: 0.001033,  // Platinum
        XPD: 0.000763   // Palladium
      }
    },
    prices: {
      gold: 1908.45,
      silver: 23.01,
      platinum: 968.32,
      palladium: 1310.87
    },
    changes: {
      gold: 0.43,
      silver: -0.21,
      platinum: 1.12,
      palladium: -0.87
    },
    timestamp: Date.now(),
    source: 'fallback'
  };
  res.json(fallback);
});

// ─── /api/news ─────────────────────────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  const cached = getCache('news');
  if (cached) return res.json(cached);

  const NEWS_API_KEY = process.env.NEWS_API_KEY;

  if (NEWS_API_KEY) {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'forex currency exchange rate gold bitcoin',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 12,
          apiKey: NEWS_API_KEY
        },
        timeout: 8000
      });
      const result = { articles: response.data.articles, timestamp: Date.now(), source: 'newsapi' };
      setCache('news', result);
      return res.json(result);
    } catch (err) {
      console.error('News API error:', err.message);
    }
  }

  // Fallback mock news
  const fallback = {
    articles: [
      { title: 'US Dollar Strengthens Amid Fed Rate Decision Uncertainty', source: { name: 'Reuters' }, publishedAt: new Date(Date.now() - 3600000).toISOString(), url: '#', description: 'The US dollar gained against major currencies as markets await clarity on Federal Reserve interest rate policy.' },
      { title: 'Bitcoin Surges Past $67K as Institutional Demand Grows', source: { name: 'CoinDesk' }, publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '#', description: 'Bitcoin reached a new monthly high as institutional investors continue accumulating the flagship cryptocurrency.' },
      { title: 'Gold Prices Hold Steady Near $1,900 Amid Geopolitical Tensions', source: { name: 'Bloomberg' }, publishedAt: new Date(Date.now() - 10800000).toISOString(), url: '#', description: 'Gold maintained its position as a safe-haven asset with prices stabilizing near $1,900 per troy ounce.' },
      { title: 'PKR Recovers Slightly Against USD in Inter-Bank Market', source: { name: 'Dawn News' }, publishedAt: new Date(Date.now() - 14400000).toISOString(), url: '#', description: 'The Pakistani rupee showed modest gains in the inter-bank market supported by improving current account data.' },
      { title: 'EUR/USD Hits 3-Week High on Strong Eurozone PMI Data', source: { name: 'FX Street' }, publishedAt: new Date(Date.now() - 18000000).toISOString(), url: '#', description: 'The euro gained against the dollar after stronger-than-expected PMI manufacturing data from Germany.' },
      { title: 'INR Stabilizes as RBI Signals Continued Intervention', source: { name: 'Economic Times' }, publishedAt: new Date(Date.now() - 21600000).toISOString(), url: '#', description: 'The Indian rupee held firm as the Reserve Bank of India signaled readiness to intervene to curb volatility.' },
      { title: 'Saudi Riyal Peg Remains Firm Despite Oil Price Volatility', source: { name: 'Arab News' }, publishedAt: new Date(Date.now() - 25200000).toISOString(), url: '#', description: 'The SAR/USD peg continues to hold at 3.75 as Saudi Arabia maintains its currency policy amid oil market swings.' },
      { title: 'Ethereum ETF Approval Speculation Boosts Crypto Markets', source: { name: 'CryptoNews' }, publishedAt: new Date(Date.now() - 28800000).toISOString(), url: '#', description: 'Speculation around a potential Ethereum spot ETF approval sent crypto markets broadly higher on Thursday.' },
      { title: 'AED Remains One of World\'s Most Stable Currencies in 2024', source: { name: 'Gulf News' }, publishedAt: new Date(Date.now() - 32400000).toISOString(), url: '#', description: 'The UAE dirham continues to demonstrate exceptional stability, reinforcing Dubai\'s status as a global financial hub.' },
      { title: 'Silver Demand Surges on Green Energy Transition Narrative', source: { name: 'Kitco' }, publishedAt: new Date(Date.now() - 36000000).toISOString(), url: '#', description: 'Silver prices received a boost from growing industrial demand tied to solar panel manufacturing and EV batteries.' },
      { title: 'GBP/USD Eyes 1.28 Level as UK Inflation Data Looms', source: { name: 'Daily FX' }, publishedAt: new Date(Date.now() - 39600000).toISOString(), url: '#', description: 'The British pound is trading near key resistance as traders position ahead of UK consumer price index data.' },
      { title: 'Emerging Market Currencies Under Pressure as Dollar Rallies', source: { name: 'Financial Times' }, publishedAt: new Date(Date.now() - 43200000).toISOString(), url: '#', description: 'A broad dollar rally put pressure on emerging market currencies including the Turkish lira and Brazilian real.' }
    ],
    timestamp: Date.now(),
    source: 'fallback'
  };
  res.json(fallback);
});

// ─── /api/predictions ──────────────────────────────────────────────────────
app.get('/api/predictions', async (req, res) => {
  // Generate predictions based on mock momentum/volatility analysis
  const predictions = [
    { symbol: 'BTC/USD', name: 'Bitcoin', direction: 'up', confidence: 78, momentum: 2.34, signal: 'STRONG BUY', reason: 'Bullish divergence + volume spike' },
    { symbol: 'ETH/USD', name: 'Ethereum', direction: 'up', confidence: 65, momentum: 1.87, signal: 'BUY', reason: 'ETF speculation + network activity high' },
    { symbol: 'EUR/USD', name: 'Euro', direction: 'up', confidence: 61, momentum: 0.42, signal: 'HOLD', reason: 'Strong PMI data but Fed uncertainty' },
    { symbol: 'GBP/USD', name: 'British Pound', direction: 'up', confidence: 55, momentum: 0.28, signal: 'HOLD', reason: 'Mixed UK economic signals' },
    { symbol: 'XAU/USD', name: 'Gold', direction: 'volatile', confidence: 52, momentum: 0.43, signal: 'WATCH', reason: 'Geopolitical risk + dollar competition' },
    { symbol: 'USD/PKR', name: 'Pak Rupee', direction: 'down', confidence: 62, momentum: -0.85, signal: 'CAUTION', reason: 'Structural pressures persist' },
    { symbol: 'USD/INR', name: 'Indian Rupee', direction: 'stable', confidence: 70, momentum: -0.12, signal: 'STABLE', reason: 'RBI intervention expected' },
    { symbol: 'SOL/USD', name: 'Solana', direction: 'up', confidence: 71, momentum: 4.21, signal: 'BUY', reason: 'Network upgrade catalyst + DeFi growth' },
    { symbol: 'USD/TRY', name: 'Turkish Lira', direction: 'down', confidence: 80, momentum: -2.1, signal: 'SELL', reason: 'Persistent inflation + policy concerns' },
    { symbol: 'XAG/USD', name: 'Silver', direction: 'up', confidence: 66, momentum: 0.95, signal: 'BUY', reason: 'Industrial demand + green energy boost' }
  ];

  res.json({ predictions, timestamp: Date.now(), model: 'CurrencyVisionX-v1.0' });
});

// ─── /api/history/:symbol ──────────────────────────────────────────────────
app.get('/api/history/:symbol', (req, res) => {
  const { symbol } = req.params;
  const { days = 30 } = req.query;

  const basePrices = {
    USD: 1, EUR: 0.92, GBP: 0.78, PKR: 278, INR: 83,
    SAR: 3.75, AED: 3.67, JPY: 149, BTC: 67000, ETH: 3400,
    XAU: 1908, XAG: 23, SOL: 178
  };

  const base = basePrices[symbol.toUpperCase()] || 1;
  const volatility = ['BTC', 'ETH', 'SOL'].includes(symbol.toUpperCase()) ? 0.04 : 0.015;

  const history = generateHistory(base, parseInt(days), volatility);
  res.json({ symbol: symbol.toUpperCase(), history, days: parseInt(days) });
});

// ─── Serve index.html ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 CURRENCY VISION X running at http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET /api/forex`);
  console.log(`   GET /api/crypto`);
  console.log(`   GET /api/gold`);
  console.log(`   GET /api/news`);
  console.log(`   GET /api/predictions`);
  console.log(`   GET /api/history/:symbol?days=30\n`);
});