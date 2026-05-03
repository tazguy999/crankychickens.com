// netlify/edge-functions/auth-gate.js
// Protects specific pages with a password form.
// Passwords live in Netlify env vars — never in source code.

const PROTECTED_PAGES = {
  '/mission-control.html':      { envVar: 'MISSION_CONTROL_PASSWORD',  user: 'nick',   label: '🚀 Mission Control' },
  '/games/dragon-scribe.html':  { envVar: 'DRAGON_SCRIBE_PASSWORD',    user: 'scribe', label: '🐉 Dragon Scribe Workshop' },
  '/games/cannon-master.html':  { envVar: 'CANNON_MASTER_PASSWORD',    user: 'cannon', label: '💥 Cannon Master HQ' },
};

const COOKIE_PREFIX = 'cc_auth_';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export default async function handler(request, context) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Never intercept function calls or API paths
  if(path.startsWith('/.netlify/') || path.startsWith('/api/')) return context.next();

  const config = PROTECTED_PAGES[path];
  if (!config) return context.next();

  const correctPassword = Deno.env.get(config.envVar);
  if (!correctPassword) {
    return new Response('This page is not yet configured. The site owner needs to set the ' + config.envVar + ' environment variable.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const cookieName = COOKIE_PREFIX + config.envVar;

  // Check existing auth cookie
  const cookies = parseCookies(request.headers.get('cookie') || '');
  if (cookies[cookieName] === await hashPassword(correctPassword)) {
    return context.next();
  }

  // Handle POST — password submission
  if (request.method === 'POST') {
    const formData = await request.formData();
    const submitted = formData.get('password');
    if (submitted === correctPassword) {
      const hashed = await hashPassword(correctPassword);
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': path,
          'Set-Cookie': `${cookieName}=${hashed}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
      return response;
    }
    return new Response(renderLoginPage(config.label, true), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Show login page
  return new Response(renderLoginPage(config.label, false), {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cc_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
  );
}

function renderLoginPage(label, wrongPassword) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${label} — Login</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{
  background:#050810;
  min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:'Nunito',sans-serif;
  padding:20px;
}
body::before{
  content:'';position:fixed;inset:0;
  background:radial-gradient(ellipse at 50% 50%,rgba(100,150,255,0.06),transparent 70%);
  pointer-events:none;
}
.card{
  background:linear-gradient(135deg,#0d1220,#111827);
  border:2px solid rgba(100,150,255,0.2);
  border-radius:20px;padding:36px 28px;
  width:100%;max-width:360px;
  text-align:center;
  box-shadow:0 8px 40px rgba(0,0,0,0.6);
  position:relative;z-index:1;
}
.logo{font-size:52px;margin-bottom:10px;}
.title{
  font-family:'Fredoka One',cursive;
  font-size:clamp(18px,5vw,24px);
  color:#ffcc02;
  text-shadow:0 0 20px rgba(255,204,2,0.4);
  margin-bottom:4px;
}
.sub{font-size:13px;color:rgba(100,150,255,0.6);margin-bottom:24px;letter-spacing:1px;}
.error{
  background:rgba(230,57,70,0.12);
  border:1px solid rgba(230,57,70,0.3);
  border-radius:10px;padding:8px 14px;
  color:#ff8888;font-size:13px;margin-bottom:16px;
}
input[type=password]{
  width:100%;background:#0a1020;
  border:2px solid rgba(100,150,255,0.2);
  border-radius:12px;padding:14px 16px;
  color:#fff;font-size:18px;font-family:'Nunito',sans-serif;
  outline:none;text-align:center;letter-spacing:3px;
  transition:border-color 0.2s;margin-bottom:16px;
}
input[type=password]:focus{border-color:rgba(100,150,255,0.5);}
button{
  width:100%;
  background:linear-gradient(135deg,#4455ff,#2233cc);
  border:none;border-radius:12px;padding:14px;
  font-family:'Fredoka One',cursive;font-size:18px;
  color:#fff;cursor:pointer;letter-spacing:1px;
  box-shadow:0 4px 20px rgba(68,85,255,0.4);
  transition:transform 0.1s,filter 0.1s;
}
button:active{transform:scale(0.97);filter:brightness(1.1);}
.back{
  margin-top:16px;font-size:12px;
  color:rgba(100,150,255,0.4);
}
.back a{color:rgba(100,150,255,0.6);text-decoration:none;}
.back a:hover{color:rgba(100,150,255,0.9);}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🔐</div>
  <div class="title">${label}</div>
  <div class="sub">CRANKY CHICKENS</div>
  ${wrongPassword ? '<div class="error">Wrong password — try again!</div>' : ''}
  <form method="POST">
    <input type="password" name="password" placeholder="••••••••" autofocus autocomplete="current-password">
    <button type="submit">ENTER</button>
  </form>
  <div class="back"><a href="/">← Back to crankychickens.com</a></div>
</div>
</body>
</html>`;
}

export const config = {
  path: ['/mission-control.html', '/games/dragon-scribe.html', '/games/cannon-master.html'],
};
