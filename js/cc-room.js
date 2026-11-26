// Cranky Chickens — CCRoom: a two-device room joined by a 4-letter code.
// One device makes a room, the other types the code, and the two then talk directly (WebRTC data channel, via PeerJS).
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
  var R = { ABC: ABC, st: 'idle', host: false, code: '', msg: '', diag: '', pending: false, onup: null, onmsg: null, ondown: null };
  var peer = null, conn = null, answered = false, timer = 0, gen = 0, wl = null, wlWant = false;

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
    var c = conn, p = peer; conn = null; peer = null; answered = false; R.pending = false; gen++;
    clearTimeout(timer); wake(false);
    try { if (c) c.close(); } catch (e){}
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
    var g = gen, code = R.code;
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
  };
  R.join = function(prefix, code){
    teardown(); R.host = false; R.msg = ''; R.diag = ''; R.st = 'joining'; R.code = code; wake(true);
    var g = gen;
    timer = setTimeout(function(){ if (gen === g && R.st === 'joining' && !conn) fail('Could not reach the room server. Check your wifi.'); }, 20000);
    loadPeer(function(){
      if (gen !== g) return;
      var p = peer = new Peer(opts());
      p.on('open', function(){ if (peer === p && !conn) wire(p.connect(prefix + code, { reliable: true, serialization: 'json' })); });
      p.on('error', function(e){ if (peer === p) peerErr(e); });
    });
  };
  R.send = function(o){ if (conn && R.st === 'up') try { conn.send(o); } catch (e){} };
  R.close = function(){ if (R.st === 'up') R.send({ t: 'bye' }); teardown(); R.st = 'idle'; R.msg = ''; R.diag = ''; };
  // For tests: wire a stand-in connection ({on, send, close}) without a room server.
  R._attach = function(c, isHost){ teardown(); R.host = !!isHost; R.msg = ''; R.diag = ''; R.st = isHost ? 'waiting' : 'joining'; wire(c); };
  window.CCRoom = R;
})();
