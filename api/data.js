// Vercel Serverless Function - przechowuje dane meczów w Vercel KV (Redis)
// Dokumentacja: https://vercel.com/docs/storage/vercel-kv

import { kv } from '@vercel/kv';

const KEY = 'wakacje-fc-data';

export default async function handler(req, res) {
  // Allow CORS for safety (not strictly needed on same domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
