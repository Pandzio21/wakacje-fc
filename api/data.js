// Vercel Serverless Function — przechowuje dane meczów w Redis (Upstash).
// Obsługuje OBA warianty poświadczeń:
//   1) REST API  -> KV_REST_API_URL + KV_REST_API_TOKEN (lub UPSTASH_REDIS_REST_*)
//   2) TCP        -> REDIS_URL (rediss://...), przez klienta ioredis
// Dzięki temu działa niezależnie od tego, jakie zmienne ustawi integracja.

import { createClient } from '@vercel/kv';
import Redis from 'ioredis';

const KEY = 'wakacje-fc-data';

const REST_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TCP_URL    = process.env.REDIS_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_URL;

let _store = null;

function getStore() {
  if (_store) return _store;

  // Preferuj REST (idealny dla serverless), jeśli są poświadczenia.
  if (REST_URL && REST_TOKEN) {
    const kv = createClient({ url: REST_URL, token: REST_TOKEN });
    _store = {
      kind: 'rest',
      get: () => kv.get(KEY),            // @vercel/kv sam deserializuje JSON
      set: (obj) => kv.set(KEY, obj),
    };
    return _store;
  }

  // W przeciwnym razie użyj zwykłego połączenia TCP z REDIS_URL.
  if (TCP_URL) {
    const redis = new Redis(TCP_URL, { maxRetriesPerRequest: 3, enableReadyCheck: true });
    redis.on('error', (e) => console.error('Redis error:', e && e.message));
    _store = {
      kind: 'tcp',
      get: async () => { const raw = await redis.get(KEY); return raw ? JSON.parse(raw) : null; },
      set: (obj) => redis.set(KEY, JSON.stringify(obj)),
    };
    return _store;
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getStore();
  if (!store) {
    if (req.method === 'GET') {
      return res.status(404).json({ error: 'Brak poświadczeń Redis' });
    }
    return res.status(503).json({
      error: 'Brak poświadczeń bazy (REDIS_URL lub KV_REST_API_*). Podłącz store w Vercel → Storage i zrób Redeploy.',
    });
  }

  try {
    if (req.method === 'GET') {
      const data = await store.get();
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
      await store.set(body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
