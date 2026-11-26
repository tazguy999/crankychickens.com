// Cranky Chickens room relay (Cloudflare Worker + Durable Objects).
//
// Two devices that share a 4-letter room code each open a WebSocket here, and this passes their
// messages to each other. That is all it does. It stores no game data, reads nothing, and a room
// disappears when either side leaves. Games send small number-only messages (button presses,
// block changes); there are no names and no chat.
//
// Why it exists: the direct device-to-device link (WebRTC) does not open on every home network.
// A relay only needs ordinary HTTPS, so it works anywhere the site itself works, including
// between two different houses.
//
//   wss://<host>/room/<game>-<CODE>?role=host   make a room   (close 4409 = that code is in use)
//   wss://<host>/room/<game>-<CODE>?role=join   join a room   (close 4404 = no such room, 4403 = full)
//   server -> client:  {"_":"room"}  room made      {"_":"up"}  both are here
//   close 4410 = the other side left      4429 = today's budget is used up
//   close 4408 = the room timed out       4420 = a device sent far too fast
//   "ping" -> "pong" keeps an idle connection open without waking the room.
//   GET /status   today's usage against the budget, as JSON.
//
// THE BUDGET. Cloudflare's free plan allows 100,000 Durable Object requests a day and counts every
// 20 incoming WebSocket messages as one request. Past that, Cloudflare itself starts failing requests.
// So this keeps its own running estimate (the Meter object) and acts well before that point:
//   - at DAILY_BUDGET   no new rooms open (matches already running may finish)
//   - at HARD_STOP      running rooms are closed too
//   - at 50%, 80% and 100% of the budget it POSTs one line of text to ALERT_URL, if that is set
// The estimate resets at 00:00 UTC, the same moment Cloudflare's limits do.
// Each room is also bounded on its own: a per-device message rate cap and a time limit.

const ROOM = /^\/room\/([a-z0-9]{2,10}-[A-Z]{4})$/;
const MAX_MSG = 16384;
const REPORT_EVERY = 400;                 // messages between reports to the meter (= 20 billed requests)
const RATE_WINDOW_MS = 10000, RATE_MAX = 900;   // per device: 90 messages a second, sustained. Games send about 34.
const WAIT_LIMIT_MS = 30 * 60 * 1000;     // a room nobody joins
const ROOM_LIMIT_MS = 3 * 60 * 60 * 1000; // a room in use

const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; };
const today = () => new Date().toISOString().slice(0, 10);

function okOrigin(origin, env){
  if (/^https:\/\/([a-z0-9-]+\.)?crankychickens\.com$/.test(origin)) return true;
  if (env.ALLOW_ORIGINS && env.ALLOW_ORIGINS.split(',').map(s => s.trim()).includes(origin)) return true;
  if (env.ALLOW_LOCAL === '1' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}
const meter = env => env.METER.get(env.METER.idFromName('meter'));
function refuse(code, why){
  const pair = new WebSocketPair();
  pair[1].accept(); pair[1].close(code, why);
  return new Response(null, { status: 101, webSocket: pair[0] });
}

export default {
  async fetch(req, env, ctx){
    const url = new URL(req.url);
    if (url.pathname === '/') return new Response('Cranky Chickens room relay.\n', { headers: { 'content-type': 'text/plain' } });
    if (url.pathname === '/status'){
      // Cached for a minute at the edge, so looking at it (or hammering it) barely touches the budget.
      const key = new Request(url.origin + '/status'), hit = await caches.default.match(key);
      if (hit) return hit;
      const r = await meter(env).fetch('https://meter/status');
      const out = new Response(await r.text(), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*' } });
      ctx.waitUntil(caches.default.put(key, out.clone()));
      return out;
    }
    const m = url.pathname.match(ROOM);
    if (!m) return new Response('not found', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected a websocket', { status: 426 });
    if (!okOrigin(req.headers.get('Origin') || '', env)) return new Response('forbidden', { status: 403 });
    const role = url.searchParams.get('role');
    if (role !== 'host' && role !== 'join') return new Response('bad role', { status: 400 });
    // One connection costs about 3 requests: the room, this check, and the join that follows.
    const gate = await (await meter(env).fetch('https://meter/add?n=3')).json();
    if (!gate.open) return refuse(4429, 'budget');
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
  }
};

// One per room code. Holds the two sockets and passes messages across.
export class Room {
  constructor(state, env){
    this.state = state; this.env = env;
    this.unreported = 0;          // messages not yet counted by the meter
    this.rate = new Map();        // socket -> [window start, count]
    this.gone = new WeakSet();    // sockets this side has already closed (each is closed exactly once)
    state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  one(tag){ return this.state.getWebSockets(tag)[0] || null; }
  shut(ws, code, why){ if (this.gone.has(ws)) return; this.gone.add(ws); try { ws.close(code, why); } catch (e){} }
  closeAll(code, why){ for (const ws of this.state.getWebSockets()) this.shut(ws, code, why); }
  async fetch(req){
    const role = new URL(req.url).searchParams.get('role');
    const host = this.one('host'), guest = this.one('join');
    if (role === 'host'){ if (host) return refuse(4409, 'taken'); }
    else { if (!host) return refuse(4404, 'no room'); if (guest) return refuse(4403, 'full'); }
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    this.state.acceptWebSocket(server, [role]);
    if (role === 'host'){ server.send('{"_":"room"}'); await this.state.storage.setAlarm(Date.now() + WAIT_LIMIT_MS); }
    else { server.send('{"_":"up"}'); try { host.send('{"_":"up"}'); } catch (e){} await this.state.storage.setAlarm(Date.now() + ROOM_LIMIT_MS); }
    return new Response(null, { status: 101, webSocket: client });
  }
  async alarm(){ this.closeAll(4408, 'time'); }
  async report(){
    const n = this.unreported; this.unreported = 0;
    if (!n) return;
    try {
      const r = await (await meter(this.env).fetch('https://meter/add?n=' + (Math.ceil(n / 20) + 1))).json();   // +1: this call is a request too
      if (r.hard) this.closeAll(4429, 'budget');
    } catch (e){}
  }
  async webSocketMessage(ws, msg){
    if (this.gone.has(ws) || typeof msg !== 'string' || msg.length > MAX_MSG || msg.startsWith('{"_"')) return;   // control messages only come from here
    const now = Date.now(); let r = this.rate.get(ws);
    if (!r || now - r[0] > RATE_WINDOW_MS){ r = [now, 0]; this.rate.set(ws, r); }
    if (++r[1] > RATE_MAX){ this.closeAll(4420, 'too fast'); return; }
    const other = this.one(this.state.getTags(ws)[0] === 'host' ? 'join' : 'host');
    if (other) try { other.send(msg); } catch (e){}
    if (++this.unreported >= REPORT_EVERY) await this.report();
  }
  async end(ws){
    this.rate.delete(ws);
    const other = this.one(this.state.getTags(ws)[0] === 'host' ? 'join' : 'host');
    this.shut(ws, 1000, 'bye');
    if (other) this.shut(other, 4410, 'left');
    await this.state.storage.deleteAlarm();
    await this.report();
  }
  async webSocketClose(ws){ await this.end(ws); }
  async webSocketError(ws){ await this.end(ws); }
}

// One for the whole relay. Keeps today's estimated request count and decides whether rooms may open.
export class Meter {
  constructor(state, env){ this.state = state; this.env = env; this.s = null; }
  async load(){
    if (!this.s) this.s = (await this.state.storage.get('s')) || { day: today(), used: 0, alerted: 0 };
    if (this.s.day !== today()) this.s = { day: today(), used: 0, alerted: 0 };
    return this.s;
  }
  view(s){
    const budget = num(this.env.DAILY_BUDGET, 60000), hardStop = Math.max(budget, num(this.env.HARD_STOP, 85000));
    return { day: s.day, used: s.used, budget, hardStop, percent: Math.round(s.used / budget * 100), open: s.used < budget, hard: s.used >= hardStop, resets: '00:00 UTC' };
  }
  async fetch(req){
    const url = new URL(req.url), s = await this.load();
    if (url.pathname === '/add'){
      s.used += 1 + Math.min(num(url.searchParams.get('n'), 0), 100000);     // +1: calling the meter is a request too
      const v = this.view(s), level = v.percent >= 100 ? 3 : v.percent >= 80 ? 2 : v.percent >= 50 ? 1 : 0;
      if (level > s.alerted){ s.alerted = level; await this.alert(v, level); }
      await this.state.storage.put('s', s);
      return Response.json(v);
    }
    return Response.json(this.view(s));
  }
  async alert(v, level){
    if (!this.env.ALERT_URL) return;
    const text = level === 3
      ? 'Cranky Chickens rooms: today\'s budget is used up (' + v.used + ' of ' + v.budget + '). No new rooms until ' + v.resets + '.'
      : 'Cranky Chickens rooms: ' + (level === 2 ? '80' : '50') + '% of today\'s budget used (' + v.used + ' of ' + v.budget + ').';
    try { await fetch(this.env.ALERT_URL, { method: 'POST', headers: { 'content-type': 'text/plain', 'Title': 'Cranky Chickens rooms' }, body: text }); } catch (e){}
  }
}
