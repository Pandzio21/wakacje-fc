// Vercel Serverless Function - przechowuje dane meczów w Redis (Upstash / Vercel KV)
// Vercel KV zostało wygaszone -> użyj integracji "Upstash for Redis" z Marketplace.
// Panel: Vercel -> projekt -> Storage -> Create Database -> Upstash for Redis -> Connect.

import { createClient } from '@vercel/kv';

const KEY = 'wakacje-fc-data';

// Łapiemy zmienne niezależnie od tego, jak nazwie je integracja.
function getCreds() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_API_URL ||
    process.env.KV_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_API_TOKEN;
  return { url, token };
}

let _kv = null;
function kvClient() {
  if (_kv) return _kv;
  const { url, token } = getCreds();
  if (!url || !token) return null;
  _kv = createClient({ url, token });
  return _kv;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const kv = kvClient();
  if (!kv) {
    // Brak podłączonej bazy — nie wywalamy 500, dajemy czytelny komunikat.
    if (req.method === 'GET') {
      return res.status(404).json({ error: 'Brak podłączonej bazy danych' });
    }
    return res.status(503).json({
      error: 'Baza nie jest podłączona. W Vercel: Storage → Upstash for Redis → Connect, potem Redeploy.',
    });
  }

  try {
    if (req.method === 'GET') {
      const data = await kv.get(KEY);
      if (!data) {
        return res.status(404).json({ error: 'No data yet' });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid body' });
      }
      await kv.set(KEY, body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
