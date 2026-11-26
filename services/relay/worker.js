// Cranky Chickens room relay (Cloudflare Worker + Durable Object).
//
// Two devices that share a 4-letter room code each open a WebSocket here, and this passes their
// messages to each other. That is all it does. It stores nothing, reads nothing, and a room
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
//   close 4410 = the other side left
//   "ping" -> "pong" keeps an idle connection open without waking the room.

const ROOM = /^\/room\/([a-z0-9]{2,10}-[A-Z]{4})$/;
const MAX_MSG = 16384;

function okOrigin(origin, env){
  if (/^https:\/\/([a-z0-9-]+\.)?crankychickens\.com$/.test(origin)) return true;
  if (env.ALLOW_ORIGINS && env.ALLOW_ORIGINS.split(',').map(s => s.trim()).includes(origin)) return true;
  if (env.ALLOW_LOCAL === '1' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if (url.pathname === '/') return new Response('Cranky Chickens room relay.\n', { headers: { 'content-type': 'text/plain' } });
    const m = url.pathname.match(ROOM);
    if (!m) return new Response('not found', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected a websocket', { status: 426 });
    if (!okOrigin(req.headers.get('Origin') || '', env)) return new Response('forbidden', { status: 403 });
    const role = url.searchParams.get('role');
    if (role !== 'host' && role !== 'join') return new Response('bad role', { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
  }
};

export class Room {
  constructor(state){
    this.state = state;
    state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  one(tag){ return this.state.getWebSockets(tag)[0] || null; }
  async fetch(req){
    const role = new URL(req.url).searchParams.get('role');
    const host = this.one('host'), guest = this.one('join');
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    const refuse = (code, why) => { server.accept(); server.close(code, why); return new Response(null, { status: 101, webSocket: client }); };
    if (role === 'host'){ if (host) return refuse(4409, 'taken'); }
    else { if (!host) return refuse(4404, 'no room'); if (guest) return refuse(4403, 'full'); }
    this.state.acceptWebSocket(server, [role]);
    if (role === 'host') server.send('{"_":"room"}');
    else { server.send('{"_":"up"}'); try { host.send('{"_":"up"}'); } catch (e){} }
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg){
    if (typeof msg !== 'string' || msg.length > MAX_MSG || msg.startsWith('{"_"')) return;   // control messages only come from here
    const other = this.one(this.state.getTags(ws)[0] === 'host' ? 'join' : 'host');
    if (other) try { other.send(msg); } catch (e){}
  }
  end(ws){
    const other = this.one(this.state.getTags(ws)[0] === 'host' ? 'join' : 'host');
    try { ws.close(1000, 'bye'); } catch (e){}
    if (other) try { other.close(4410, 'left'); } catch (e){}
  }
  webSocketClose(ws){ this.end(ws); }
  webSocketError(ws){ this.end(ws); }
}
