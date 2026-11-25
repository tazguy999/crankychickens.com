// Cranky Chickens — grown-ups support row.
// Reads /configs/support.json. Renders nothing until a link is filled in.
(function(){
  function safe(u){return typeof u==='string'&&/^https:\/\//.test(u)?u:'';}
  // Campaign tracking: remember utm_* from the first page visited, carry it to the shop link.
  var UTM_KEY='cc_utm';
  function readUtm(){
    try{
      var q=new URLSearchParams(location.search),found={};
      q.forEach(function(v,k){if(/^utm_/.test(k)&&/^[\w.-]{1,64}$/.test(v))found[k]=v;});
      if(Object.keys(found).length){localStorage.setItem(UTM_KEY,JSON.stringify({t:Date.now(),p:found}));return found;}
      var s=JSON.parse(localStorage.getItem(UTM_KEY)||'null');
      if(s&&Date.now()-s.t<30*864e5)return s.p;   // remember for 30 days
    }catch(e){}
    return null;
  }
  function withUtm(u){
    var p=readUtm();if(!p)return u;
    try{var url=new URL(u);Object.keys(p).forEach(function(k){url.searchParams.set(k,p[k]);});return url.toString();}catch(e){return u;}
  }
  function render(cfg){
    var tip=safe(cfg.tipUrl),merch=safe(cfg.merchUrl);
    if(merch)merch=withUtm(merch);
    if(!tip&&!merch)return;
    var host=document.getElementById('ccSupport');
    if(!host){var home=document.getElementById('homeLink');if(!home)return;host=document.createElement('div');host.id='ccSupport';home.parentNode.insertBefore(host,home);}
    var css='display:inline-block;text-decoration:none;font-family:inherit;font-size:13px;padding:8px 14px;border-radius:9px;margin:4px;border:2px solid ';
    var h='<div style="text-align:center;padding:10px 0 6px;">'+
      '<div style="font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.45);margin-bottom:4px;">FOR GROWN-UPS · HELP KEEP THE COOP RUNNING</div>';
    if(tip)h+='<a href="'+tip+'" target="_blank" rel="noopener" style="'+css+'#ffcc02;background:rgba(255,204,2,0.14);color:#ffcc02;">'+(cfg.tipLabel||'🌽 Feed the Chickens')+'</a>';
    if(merch)h+='<a href="'+merch+'" target="_blank" rel="noopener" style="'+css+'#c79bff;background:rgba(176,108,255,0.14);color:#d8bcff;">'+(cfg.merchLabel||'👕 Merch')+'</a>';
    host.innerHTML=h+'</div>';
    host.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){try{window.gtag&&gtag('event','shop_click',{link_text:(a.textContent||'').trim().slice(0,40),page:location.pathname});}catch(e){}});});
  }
  function decorate(cfg){
    var merch=safe(cfg.merchUrl);if(!merch)return;
    var base=merch.replace(/\/$/,'');
    function track(a){a.addEventListener('click',function(){try{window.gtag&&gtag('event','shop_click',{link_text:(a.textContent||'').trim().slice(0,40),page:location.pathname});}catch(e){}});}
    document.querySelectorAll('a[data-shop]').forEach(function(a){track(a);
      try{var cur=new URL(a.getAttribute('href'),location.href);var path=cur.pathname==='/'?'/':cur.pathname;a.href=withUtm(base+path);}catch(e){a.href=withUtm(merch);}
    });
  }
  fetch('/configs/support.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():{};}).then(function(cfg){render(cfg);decorate(cfg);}).catch(function(){});
})();

// Keep the screen awake while an episode is actually playing (not while paused or after it ends).
// Episode players call ccMark(T,TOTAL) every frame; T only moves during playback.
(function(){
  var orig=window.ccMark;
  if(typeof orig!=='function'||!navigator.wakeLock)return;
  var lock=null,pending=false,lastT=null,lastMove=0;
  function off(){if(lock){var l=lock;lock=null;try{l.release().catch(function(){});}catch(e){}}}
  function on(){
    if(lock||pending||document.hidden)return;
    pending=true;
    try{
      navigator.wakeLock.request('screen').then(function(l){
        pending=false;lock=l;
        l.addEventListener('release',function(){if(lock===l)lock=null;});
        if(Date.now()-lastMove>2000)off();
      },function(){pending=false;});
    }catch(e){pending=false;}
  }
  window.ccMark=function(t,total){
    if(lastT===null)lastT=t;
    else if(t!==lastT){lastT=t;lastMove=Date.now();on();}
    return orig.apply(this,arguments);
  };
  setInterval(function(){if(lock&&Date.now()-lastMove>2000)off();},1000);
})();
