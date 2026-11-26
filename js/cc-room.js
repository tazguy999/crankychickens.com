// Cranky Chickens — CCRoom: a two-device room joined by a 4-letter code.
// One device makes a room, the other types the code, and their messages pass through our small relay
// (services/relay, a Cloudflare Worker at crankychickens-com.nweber6.workers.dev). If the relay cannot be reached, it falls back to a
// direct device-to-device link (WebRTC data channel, via PeerJS), which works on some networks and not others.
// No names, no chat, no accounts: games send their own small number-only messages and must validate what arrives.
// No UI here. A game reads CCRoom.st / code / msg / diag each frame and draws its own screens.
//   CCRoom.make('ccblk-')        make a room      -> st 'making' -> 'waiting' (code is ready) -> 'up'
//   CCRoom.join('ccblk-', code)  join a room      -> st 'joining' -> 'up'
//   CCRoom.send(obj)             only while 'up'
//   CCRoom.close()               leave / cancel   -> st 'idle'
//   CCRoom.onup(isHost), CCRoom.onmsg(obj), CCRoom.ondown(reason)   callbacks set by the game
// On any failure st returns to 'idle' with msg (for people) and diag (for debugging) filled in.
(function(){
  'use strict';
  var HERE = (document.currentScript && document.currentScript.src) || '';
  var PEER_SRC = HERE ? HERE.replace(/cc-room\.js.*$/, 'vendor/peerjs.min.js') : '../js/vendor/peerjs.min.js';
  var ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ';        // no I, L or O: they look like 1 and 0
  var R = { ABC: ABC, st: 'idle', host: false, code: '', msg: '', diag: '', pending: false, viaRelay: false, onup: null, onmsg: null, ondown: null };
  var peer = null, conn = null, rc = null, answered = false, timer = 0, gen = 0, wl = null, wlWant = false;
  // Where the relay lives. window.CC_RELAY = '' turns it off (direct link only); a ws:// URL points at a test relay.
  R.relayUrl = function(){ return window.CC_RELAY !== undefined ? window.CC_RELAY : 'wss://crankychickens-com.nweber6.workers.dev'; };

  // A relay connection that looks like a PeerJS one: on('open'|'data'|'close'|'error'), send(obj), close().
  //   'room'  the room is made (host only)      'open'  both devices are here
  //   'close' (code) after it was reached: 4409 code taken, 4404 no such room, 4403 full, 4410 the other side left
  //   'error' the relay was never reached, so the caller can try the direct link instead
  // Sends are gathered for 30ms and go out as one frame, which keeps a fast game well inside the relay's free allowance.
  R.relay = function(room, role){
    var h = {}, q = [], flushT = 0, pingT = 0, openT = 0, opened = false, up = false, done = false, ws = null;
    var emit = function(e, a){ if (h[e]) try { h[e](a); } catch (err){} };
    var flush = function(){ flushT = 0; if (q.length && ws && ws.readyState === 1) try { ws.send(JSON.stringify(q)); } catch (err){} q = []; };
    var stop = function(){ clearTimeout(flushT); clearInterval(pingT); clearTimeout(openT); };
    var c = {
      relay: true,
      on: function(e, f){ h[e] = f; },
      send: function(o){ if (!up || done) return; q.push(o); if (!flushT) flushT = setTimeout(flush, 30); },
      close: function(){ if (done) return; if (flushT){ clearTimeout(flushT); flush(); } done = true; stop(); try { ws.close(1000); } catch (err){} }
    };
    setTimeout(function(){
      if (done) return;
      try { ws = new WebSocket(R.relayUrl() + '/room/' + room + '?role=' + role); } catch (err){ done = true; emit('error'); return; }
      openT = setTimeout(function(){ if (!opened && !done){ done = true; stop(); try { ws.close(); } catch (err){} emit('error'); } }, 6000);
      ws.onopen = function(){ opened = true; clearTimeout(openT); pingT = setInterval(function(){ if (ws.readyState === 1) try { ws.send('ping'); } catch (err){} }, 25000); };
      ws.onmessage = function(ev){
        if (done || typeof ev.data !== 'string' || ev.data === 'pong') return;
        var d; try { d = JSON.parse(ev.data); } catch (err){ return; }
        if (Array.isArray(d)){ for (var i = 0; i < d.length && i < 400; i++) emit('data', d[i]); }
        else if (d && d._ === 'room') emit('room');
        else if (d && d._ === 'up'){ up = true; emit('open'); }
      };
      ws.onclose = function(ev){ if (done) return; done = true; stop(); if (opened) emit('close', ev.code); else emit('error'); };
      ws.onerror = function(){};
    }, 0);
    return c;
  };
  var RESTING = 'Friend play is resting for today. It comes back tomorrow.';
  R.RESTING = RESTING;
  function wireRelay(c, prefix, code, role){
    rc = c;
    c.on('room', function(){ if (rc === c && R.st === 'making') R.st = 'waiting'; });
    c.on('open', function(){
      if (rc !== c) return;
      conn = c; R.viaRelay = true; clearTimeout(timer); R.st = 'up'; R.pending = false; R.msg = ''; R.diag = '';
      if (R.onup) try { R.onup(R.host); } catch (e){}
    });
    c.on('data', function(d){
      if (rc !== c || !d || typeof d !== 'object') return;
      if (d.t === 'bye'){ fail('Your friend left.'); return; }
      if (R.st === 'up' && R.onmsg) try { R.onmsg(d); } catch (e){}
    });
    c.on('close', function(why){
      if (rc !== c) return;
      if (R.st === 'up'){ fail(why === 4429 ? RESTING : why === 4408 ? 'That room ran out of time. Make a new one.' : 'Your friend left.'); return; }
      rc = null;
      if (role === 'host'){ if (why === 4409) R.make(prefix); else fail(why === 4429 ? RESTING : 'The room closed. Make a new one.'); }
      else if (why === 4404) peerJoin(prefix, code);          // not on the relay: the room may have been made the direct way
      else fail(why === 4403 ? 'That room already has two players.' : why === 4429 ? RESTING : 'Could not reach the room. Check your wifi.');
    });
    c.on('error', function(){ if (rc !== c) return; rc = null; if (role === 'host') peerMake(prefix, code); else peerJoin(prefix, code); });
  }

  function wake(on){
    wlWant = on;
    try {
      if (on){
        if (!wl && navigator.wakeLock && !document.hidden) navigator.wakeLock.request('screen').then(function(l){
          if (!wlWant){ l.release().catch(function(){}); return; }
          wl = l; l.addEventListener('release', function(){ if (wl === l) wl = null; });
        }).catch(function(){});
      } else if (wl){ var l = wl; wl = null; l.release().catch(function(){}); }
    } catch (e){}
  }
  document.addEventListener('visibilitychange', function(){ if (!document.hidden && wlWant) wake(true); });
  addEventListener('pagehide', function(){ if (R.st === 'up') R.send({ t: 'bye' }); });

  function opts(){ var o = { debug: 0 }, x = window.CC_PEER || window.MSB_PEER || {}; for (var k in x) o[k] = x[k]; return o; }
  function code4(){
    var s = '', r = new Uint32Array(4);
    try { crypto.getRandomValues(r); } catch (e){ for (var i = 0; i < 4; i++) r[i] = Math.floor(Math.random() * 4294967296); }
    for (var j = 0; j < 4; j++) s += ABC[r[j] % ABC.length];
    return s;
  }
  function teardown(){
    var c = conn, p = peer, r = rc; conn = null; peer = null; rc = null; answered = false; R.pending = false; R.viaRelay = false; gen++;
    clearTimeout(timer); wake(false);
    try { if (c) c.close(); } catch (e){}
    try { if (r && r !== c) r.close(); } catch (e){}
    try { if (p) p.destroy(); } catch (e){}
  }
  function fail(msg, diag){ var wasUp = R.st === 'up'; teardown(); R.st = 'idle'; R.msg = msg || ''; R.diag = diag || ''; if (wasUp && R.ondown) try { R.ondown(R.msg); } catch (e){} }
  // Why a join did not finish: did the other side answer, and which network paths each side offered.
  function why(c){
    var pc = c && c.peerConnection; if (!pc) return Promise.resolve('no link');
    var base = (answered ? 'answered' : 'no answer') + ' · ice ' + pc.iceConnectionState, q;
    try {
      q = pc.getStats().then(function(st){
        var L = {}, Rm = {}, ok = 0;
        st.forEach(function(r){
          if (r.type === 'local-candidate') L[r.candidateType] = (L[r.candidateType] || 0) + 1;
          else if (r.type === 'remote-candidate') Rm[r.candidateType] = (Rm[r.candidateType] || 0) + 1;
          else if (r.type === 'candidate-pair' && r.state === 'succeeded') ok++;
        });
        var f = function(o){ return Object.keys(o).map(function(k){ return k + ' ' + o[k]; }).join(', ') || 'none'; };
        return base + ' · mine: ' + f(L) + ' · theirs: ' + f(Rm) + ' · paths ok: ' + ok;
      });
    } catch (e){ q = Promise.resolve(base); }
    return Promise.race([q, new Promise(function(r){ setTimeout(function(){ r(base); }, 1200); })]).catch(function(){ return base; });
  }
  function loadPeer(cb){
    if (window.Peer) return cb();
    var s = document.createElement('script'); s.src = PEER_SRC;
    s.onload = function(){ if (window.Peer) cb(); else fail('Friend play could not load. Try again.'); };
    s.onerror = function(){ fail('Friend play could not load. Check your wifi.'); };
    document.head.appendChild(s);
  }
  function peerErr(e){
    if (R.st === 'up') return;                 // room-server hiccups do not matter once the two devices talk directly
    var t = e && e.type;
    fail(t === 'peer-unavailable' ? 'No room with that code. Check the letters!' : t === 'browser-incompatible' ? 'This browser cannot do friend play.' : 'Could not reach the room server. Check your wifi.');
  }
  function joinFail(c){
    if (conn !== c) return;
    var ans = answered, g = gen;
    why(c).then(function(d){ if (gen !== g) return; fail(ans ? 'These two devices could not reach each other on this network.' : 'Your friend’s device did not answer. Keep its screen on the room code.', d); });
  }
  function wire(c){
    conn = c; answered = false;
    var pc = c.peerConnection, g = gen;
    if (pc && pc.addEventListener) pc.addEventListener('signalingstatechange', function(){ if (conn === c && pc.signalingState === 'stable' && pc.remoteDescription) answered = true; });
    var hostDrop = function(){
      if (conn !== c || R.st === 'up') return;
      conn = null; R.pending = false; clearTimeout(timer);
      R.msg = 'A friend tried to join but it did not connect. Try the code again.';
      why(c).then(function(d){ if (gen === g) R.diag = d; try { c.close(); } catch (e){} });
    };
    var drop = function(){
      if (conn !== c) return;
      if (R.st === 'up') fail('Your friend left.');
      else if (R.host) hostDrop(); else joinFail(c);
    };
    clearTimeout(timer);
    timer = setTimeout(function(){ if (conn === c && R.st !== 'up'){ if (R.host) hostDrop(); else joinFail(c); } }, 20000);
    c.on('open', function(){
      if (conn !== c) return;
      clearTimeout(timer); R.st = 'up'; R.pending = false; R.msg = ''; R.diag = '';
      if (R.onup) try { R.onup(R.host); } catch (e){}
    });
    c.on('data', function(d){
      if (conn !== c || !d || typeof d !== 'object') return;
      if (d.t === 'bye'){ fail('Your friend left.'); return; }
      if (R.st === 'up' && R.onmsg) try { R.onmsg(d); } catch (e){}
    });
    c.on('close', drop); c.on('error', drop);
  }

  R.make = function(prefix){
    teardown(); R.host = true; R.msg = ''; R.diag = ''; R.st = 'making'; R.code = code4(); wake(true);
    if (R.relayUrl()) wireRelay(R.relay(prefix + R.code, 'host'), prefix, R.code, 'host'); else peerMake(prefix, R.code);
  };
  function peerMake(prefix, code){
    var g = gen;
    loadPeer(function(){
      if (gen !== g) return;
      var p = peer = new Peer(prefix + code, opts());
      p.on('open', function(){ if (peer === p && R.st === 'making') R.st = 'waiting'; });
      p.on('connection', function(c){
        if (peer !== p || R.st === 'up'){ try { c.close(); } catch (e){} return; }
        if (conn){ var o = conn; conn = null; try { o.close(); } catch (e){} }      // a fresh try replaces one that never finished
        R.pending = true; R.msg = ''; R.diag = ''; wire(c);
      });
      p.on('error', function(e){ if (peer !== p) return; if (e && e.type === 'unavailable-id' && R.st !== 'up') R.make(prefix); else peerErr(e); });
      p.on('disconnected', function(){ if (peer === p && R.st !== 'up') try { p.reconnect(); } catch (e){} });
    });
  }
  R.join = function(prefix, code){
    teardown(); R.host = false; R.msg = ''; R.diag = ''; R.st = 'joining'; R.code = code; wake(true);
    var g = gen;
    timer = setTimeout(function(){ if (gen === g && R.st === 'joining' && !conn) fail('Could not reach the room server. Check your wifi.'); }, 20000);
    if (R.relayUrl()) wireRelay(R.relay(prefix + code, 'join'), prefix, code, 'join'); else peerJoin(prefix, code);
  };
  function peerJoin(prefix, code){
    var g = gen;
    loadPeer(function(){
      if (gen !== g) return;
      var p = peer = new Peer(opts());
      p.on('open', function(){ if (peer === p && !conn) wire(p.connect(prefix + code, { reliable: true, serialization: 'json' })); });
      p.on('error', function(e){ if (peer === p) peerErr(e); });
    });
  }
  R.send = function(o){ if (conn && R.st === 'up') try { conn.send(o); } catch (e){} };
  R.close = function(){ if (R.st === 'up') R.send({ t: 'bye' }); teardown(); R.st = 'idle'; R.msg = ''; R.diag = ''; };
  // For tests: wire a stand-in connection ({on, send, close}) without a room server.
  R._attach = function(c, isHost){ teardown(); R.host = !!isHost; R.msg = ''; R.diag = ''; R.st = isHost ? 'waiting' : 'joining'; wire(c); };
  window.CCRoom = R;
})();
