/**
 * Thai Proxy Server สำหรับ TrueMoney Redeem
 *
 * Deploy บน Thai VPS (DigitalOcean Singapore ก็ได้ หรือ Thai hosting)
 *
 * วิธีใช้:
 *   1. npm install express cors
 *   2. PROXY_SECRET=your_secret_key node thai-proxy.js
 *   3. ตั้ง THAI_PROXY_URL=https://your-proxy.com ใน Supabase Edge Function secrets
 *   4. ตั้ง PROXY_SECRET=your_secret_key ใน Supabase Edge Function secrets
 *
 * หรือจะ deploy ฟรีบน:
 *   - Railway.app (มี Singapore region)
 *   - Render.com (มี Singapore region)
 *   - Thai VPS เช่น Cloudhm, Niceoppai (~100 บาท/เดือน)
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PROXY_SECRET = process.env.PROXY_SECRET || 'change-me';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'truemoney-proxy' });
});

// Redeem endpoint
app.post('/redeem', async (req, res) => {
  // Verify secret
  const secret = req.headers['x-proxy-secret'];
  if (secret !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { voucher_hash, mobile } = req.body;
  if (!voucher_hash || !mobile) {
    return res.status(400).json({ error: 'Missing voucher_hash or mobile' });
  }

  try {
    const redeemUrl = `https://gift.truemoney.com/campaign/vouchers/${voucher_hash}/redeem`;

    const tmResponse = await fetch(redeemUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S926B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        'Origin': 'https://gift.truemoney.com',
        'Referer': `https://gift.truemoney.com/campaign/?v=${voucher_hash}`,
      },
      body: JSON.stringify({ mobile, voucher_hash }),
    });

    const status = tmResponse.status;
    const text = await tmResponse.text();

    // Check Cloudflare block
    if (status === 403 && text.includes('Cloudflare')) {
      return res.status(403).json({ error: 'cloudflare_blocked', message: 'Still blocked - need Thai IP' });
    }

    // Try parse JSON
    try {
      const data = JSON.parse(text);
      return res.json({ success: true, tm_status: status, data });
    } catch {
      return res.status(502).json({ error: 'invalid_response', body_preview: text.substring(0, 300) });
    }

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: 'proxy_error', message: err.message });
  }
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`Thai proxy running on port ${PORT}`);
});
