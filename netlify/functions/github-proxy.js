const REPO = 'tazguy999/crankychickens.com';
const BRANCH = 'kids-preview';
const PATH = 'lore/submissions.json';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod === 'GET') return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ok' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  const TOKEN = process.env.GITHUB_TOKEN;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action } = body;

  if (action === 'get_submissions') {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' }
      });
      if (res.status === 404) return { statusCode: 200, headers: CORS, body: JSON.stringify({ submissions: [] }) };
      const data = await res.json();
      const submissions = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ submissions, sha: data.sha }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  if (action === 'save_submissions') {
    const { submissions, sha, commitMsg } = body;
    try {
      const content = Buffer.from(JSON.stringify(submissions, null, 2)).toString('base64');
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg || 'update', content, branch: BRANCH, ...(sha ? { sha } : {}) })
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: data.message }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sha: data.content?.sha }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  if (action === 'get_file') {
    const { path: filePath, branch: fileBranch = BRANCH } = body;
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${fileBranch}`, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' }
      });
      if (res.status === 404) return { statusCode: 200, headers: CORS, body: JSON.stringify({ content: null, sha: null }) };
      const data = await res.json();
      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, sha: data.sha }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  if (action === 'save_file') {
    const { path: filePath, branch: fileBranch = BRANCH, content: fileContent, sha, commitMsg } = body;
    try {
      const encoded = Buffer.from(fileContent).toString('base64');
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg || `update ${filePath}`, content: encoded, branch: fileBranch, ...(sha ? { sha } : {}) })
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: data.message }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ sha: data.content?.sha }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  if (action === 'merge_to_main') {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/merges`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ base: 'main', head: BRANCH, commit_message: '🐉 Merge kids-preview' })
      });
      if (res.status === 204 || res.status === 201) return { statusCode: 200, headers: CORS, body: JSON.stringify({ merged: true }) };
      const data = await res.json();
      if (data.message?.toLowerCase().includes('already')) return { statusCode: 200, headers: CORS, body: JSON.stringify({ merged: true }) };
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: data.message }) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  if (action === 'claude_complete') {
    const { system, messages, max_tokens = 1000 } = body;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens, ...(system ? { system } : {}), messages })
      });
      const data = await res.json();
      if (!res.ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: data.error?.message }) };
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    } catch (e) { return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) }; }
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
};
