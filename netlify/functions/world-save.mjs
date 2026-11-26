// ─────────────────────────────────────────────────────────────
//  world-save.mjs  —  Netlify function (v2) + Netlify Blobs
//  Online save files for Graydorn's World, shared between devices by a 6-letter family code.
//
//  The code is the only key: anyone who has it can read and overwrite that family's save files,
//  so it holds nothing but game progress and the three save-file names. No accounts, no email.
//
//  POST /.netlify/functions/world-save   (same-origin JSON)
//    {action:'create'}                         → {code}
//    {action:'get',   code}                    → {slots:[save|null ×3], names, namesAt}
//    {action:'put',   code, slot, data|null}   → {ok:true}        (null erases the slot, leaving {erased,savedAt})
//    {action:'names', code, names, namesAt}    → {ok:true}
//  GET  /.netlify/functions/world-save         → {ok:true, storage:true}   health check
// ─────────────────────────────────────────────────────────────
import { getStore } from '@netlify/blobs';

const STORE = 'graydorn-world-saves';
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';          // no I, L, O, 0, 1: easy to read aloud and type
const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;
const MAX_SLOT_BYTES = 400000;                           // a very well explored world is ~150 KB
const MAX_CODES_PER_DAY = 300;                           // stops someone filling storage with new codes

const json = (o, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// In-memory rate limit. It resets when the function instance does, so it is a speed bump, not a wall.
const hits = new Map();
function limited(ip, bucket, max) {
  const k = bucket + ':' + ip, now = Date.now();
  const a = (hits.get(k) || []).filter(t => now - t < 60000);
  if (a.length >= max) { hits.set(k, a); return true; }
  a.push(now); hits.set(k, a);
  if (hits.size > 5000) hits.clear();
  return false;
}

function newCode() {
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  let s = ''; for (const n of b) s += ALPHA[n % ALPHA.length];
  return s;
}
const cleanNames = n => Array.isArray(n) && n.length === 3 && n.every(x => typeof x === 'string')
  ? n.map(x => x.replace(/[\x00-\x1F\x7F<>]/g, '').trim().slice(0, 16) || 'Player') : null;

export async function handle(method, origin, host, text, store, ip) {
  if (method === 'GET') {
    await store.setJSON('_health', { t: Date.now() });
    const back = await store.get('_health', { type: 'json' });
    return json({ ok: true, storage: !!back });
  }
  if (method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (origin) { let h = ''; try { h = new URL(origin).host; } catch {} if (h !== host) return json({ error: 'Wrong origin' }, 403); }
  if (limited(ip, 'all', 90)) return json({ error: 'Too many requests. Slow down!' }, 429);
  if (text.length > MAX_SLOT_BYTES + 2000) return json({ error: 'Save is too big' }, 413);

  let body; try { body = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON' }, 400);
  const { action } = body;

  if (action === 'create') {
    if (limited(ip, 'create', 4)) return json({ error: 'Too many new codes. Try again in a minute.' }, 429);
    const dayKey = '_created/' + new Date().toISOString().slice(0, 10);
    const day = (await store.get(dayKey, { type: 'json' })) || { n: 0 };
    if (day.n >= MAX_CODES_PER_DAY) return json({ error: 'No more new codes today. Try again tomorrow.' }, 429);
    for (let tries = 0; tries < 6; tries++) {
      const code = newCode();
      if (await store.get(code + '/meta', { type: 'json' })) continue;
      await store.setJSON(code + '/meta', { created: Date.now(), names: null, namesAt: 0 });
      await store.setJSON(dayKey, { n: day.n + 1 });
      return json({ code });
    }
    return json({ error: 'Could not make a code. Try again.' }, 500);
  }

  const code = typeof body.code === 'string' ? body.code.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  if (!CODE_RE.test(code)) return json({ error: 'That is not a family code.' }, 400);
  const meta = await store.get(code + '/meta', { type: 'json' });
  if (!meta) {
    if (limited(ip, 'miss', 20)) return json({ error: 'Too many tries. Wait a minute.' }, 429);
    return json({ error: 'No adventure found with that code.', gone: true }, 404);
  }

  if (action === 'get') {
    const slots = await Promise.all([0, 1, 2].map(i => store.get(`${code}/s${i}`, { type: 'json' })));
    return json({ slots, names: meta.names || null, namesAt: meta.namesAt || 0 });
  }
  if (action === 'put') {
    const slot = body.slot;
    if (slot !== 0 && slot !== 1 && slot !== 2) return json({ error: 'Bad slot' }, 400);
    const d = body.data;
    // Erasing leaves a small marker so other devices drop their older copy instead of uploading it back.
    if (d === null) { await store.setJSON(`${code}/s${slot}`, { erased: true, savedAt: Date.now() }); return json({ ok: true }); }
    if (!d || typeof d !== 'object' || Array.isArray(d) || !d.q || typeof d.q !== 'object' || !Array.isArray(d.unlocked))
      return json({ error: 'That is not a save file.' }, 400);
    if (typeof d.savedAt !== 'number') d.savedAt = Date.now();
    await store.setJSON(`${code}/s${slot}`, d);
    return json({ ok: true });
  }
  if (action === 'names') {
    const names = cleanNames(body.names);
    if (!names) return json({ error: 'Bad names' }, 400);
    await store.setJSON(code + '/meta', { ...meta, names, namesAt: Number(body.namesAt) || Date.now() });
    return json({ ok: true });
  }
  return json({ error: 'Unknown action' }, 400);
}

export default async (req, context) => {
  const url = new URL(req.url), origin = req.headers.get('origin') || '', ip = (context && context.ip) || 'unknown';
  const text = req.method === 'POST' ? await req.text() : '';
  // Strong consistency so a save written a moment ago is what the next device reads.
  // If this runtime cannot offer it, fall back to the default store instead of failing.
  try {
    return await handle(req.method, origin, url.host, text, getStore({ name: STORE, consistency: 'strong' }), ip);
  } catch (e) {
    if (e && e.name === 'BlobsConsistencyError') {
      try { return await handle(req.method, origin, url.host, text, getStore(STORE), ip); }
      catch (e2) { console.error('world-save', e2); return json({ error: 'Server error' }, 500); }
    }
    console.error('world-save', e);
    return json({ error: 'Server error' }, 500);
  }
};
