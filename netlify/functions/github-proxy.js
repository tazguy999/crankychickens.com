// ─────────────────────────────────────────────────────────────
//  github-proxy.js  —  Netlify serverless function
//  Token lives in Netlify env vars, never in client HTML.
//
//  Supported actions (POST body: { action, ...params }):
//    get_submissions   → read lore/submissions.json from kids-preview
//    save_submissions  → write lore/submissions.json to kids-preview
//    merge_to_main     → merge kids-preview → main
// ─────────────────────────────────────────────────────────────

const REPO  = 'tazguy999/crankychickens.com';
const BRANCH = 'kids-preview';
const PATH  = 'lore/submissions.json';

// Allowed origins — tighten if needed
const ALLOWED_ORIGINS = [
  'https://crankychickens.com',
  'https://kids-preview--crankychickens.netlify.app',
  'http://localhost',
  'null', // file:// for local preview
];

exports.handler = async (event) => {
  const origin = event.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const CORS = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };
  }

  const TOKEN = process.env.GITHUB_TOKEN;
  if (!TOKEN) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Server misconfigured — missing GITHUB_TOKEN env var' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action } = body;

  // ── GET SUBMISSIONS ──
  if (action === 'get_submissions') {
    try {
      const res = await ghFetch(`/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`, TOKEN);
      if (res.status === 404) {
        return ok(CORS, { submissions: [] });
      }
      const data = await res.json();
      const submissions = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
      return ok(CORS, { submissions, sha: data.sha });
    } catch (e) {
      return err(CORS, e.message);
    }
  }

  // ── SAVE SUBMISSIONS ──
  if (action === 'save_submissions') {
    const { submissions, sha, commitMsg } = body;
    if (!submissions) return err(CORS, 'Missing submissions');
    try {
      const content = Buffer.from(JSON.stringify(submissions, null, 2)).toString('base64');
      const res = await ghFetch(`/repos/${REPO}/contents/${PATH}`, TOKEN, 'PUT', {
        message: commitMsg || '🐉 Mission Control: update submissions',
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      });
      const data = await res.json();
      if (!res.ok) return err(CORS, data.message || 'GitHub write failed');
      return ok(CORS, { sha: data.content?.sha });
    } catch (e) {
      return err(CORS, e.message);
    }
  }

  // ── MERGE TO MAIN ──
  if (action === 'merge_to_main') {
    try {
      const res = await ghFetch(`/repos/${REPO}/merges`, TOKEN, 'POST', {
        base: 'main',
        head: BRANCH,
        commit_message: '🐉 Merge kids-preview: Dragon Scribe lore approved by Nick',
      });
      if (res.status === 204 || res.status === 201) return ok(CORS, { merged: true });
      const data = await res.json();
      if (data.message?.toLowerCase().includes('already')) return ok(CORS, { merged: true, note: 'already up to date' });
      return err(CORS, data.message || 'Merge failed');
    } catch (e) {
      return err(CORS, e.message);
    }
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
};

// ── HELPERS ──
async function ghFetch(path, token, method = 'GET', body) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`https://api.github.com${path}`, opts);
}

function ok(cors, data) {
  return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}
function err(cors, msg) {
  return { statusCode: 500, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) };
}
