// Inject modal HTML
(function(){
  const modal = document.createElement('div');
  modal.id = 'trailerModal';
  modal.style.cssText = `
    display:none;position:fixed;inset:0;background:#000;z-index:9999;
    flex-direction:column;align-items:center;justify-content:center;gap:0;
  `;
  modal.innerHTML = `
    <canvas id="tCanvas" width="640" height="400"
      style="display:block;max-width:100%;max-height:72vh;image-rendering:pixelated;cursor:pointer;"
      title="Click to advance"></canvas>

    <!-- scene dots -->
    <div id="tDots" style="display:flex;gap:6px;margin-top:10px;"></div>

    <!-- controls row -->
    <div style="display:flex;gap:10px;margin-top:8px;align-items:center;flex-wrap:wrap;justify-content:center;padding:0 12px;">
      <button id="tPrev"
        style="font-family:'Fredoka One',cursive;font-size:15px;padding:10px 22px;
               background:#1a0a2e;border:2px solid #ffcc02;color:#ffcc02;cursor:pointer;
               letter-spacing:1px;min-width:100px;">◀ PREV</button>

      <button id="tPause"
        style="font-family:'Fredoka One',cursive;font-size:15px;padding:10px 22px;
               background:#1a0a2e;border:2px solid #ff9f1c;color:#ff9f1c;cursor:pointer;
               letter-spacing:1px;min-width:100px;">⏸ PAUSE</button>

      <button id="tNext"
        style="font-family:'Fredoka One',cursive;font-size:15px;padding:10px 22px;
               background:#ffcc02;border:2px solid #ffcc02;color:#1a0a2e;cursor:pointer;
               letter-spacing:1px;min-width:100px;">NEXT ▶</button>

      <button id="tClose"
        style="font-family:'Fredoka One',cursive;font-size:13px;padding:10px 18px;
               background:#330008;border:2px solid #ff3333;color:#ff6666;cursor:pointer;
               letter-spacing:1px;">✕ CLOSE</button>
    </div>

    <!-- progress bar -->
    <div style="width:min(640px,100%);padding:0 0;margin-top:8px;">
      <div style="width:100%;height:5px;background:#222;border-radius:3px;overflow:hidden;">
        <div id="tBar" style="height:100%;background:#ffcc02;width:0%;transition:none;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('tClose').onclick  = closeTrailer;
  document.getElementById('tNext').onclick   = trailerNext;
  document.getElementById('tPrev').onclick   = trailerPrev;
  document.getElementById('tPause').onclick  = trailerTogglePause;
  document.getElementById('tCanvas').onclick = trailerNext;
})();

// ── TRAILER SCRIPTS ──
// Each scene: { dur (frames@60fps), draw(ctx,fr,t) }
// t = 0..1 within scene, fr = global frame

// ── Shared drawing helpers ──
function tTitle(ctx,line1,line2,t,color){
  const GW=640,GH=400;
  const alpha = t<0.15 ? t/0.15 : t>0.85 ? (1-t)/0.15 : 1;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color||'#ffcc02';
  ctx.font = 'bold 52px Fredoka One';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 8;
  ctx.strokeText(line1, GW/2, GH/2 - (line2?20:0));
  ctx.fillText(line1, GW/2, GH/2 - (line2?20:0));
  if(line2){
    ctx.font = 'bold 28px Fredoka One';
    ctx.strokeText(line2, GW/2, GH/2+30);
    ctx.fillStyle = '#ff9f1c';
    ctx.fillText(line2, GW/2, GH/2+30);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

function tCard(ctx,text,alpha){
  // alpha passed directly — caller controls when it shows
  const GW=640,GH=400;
  if(alpha<=0) return;
  ctx.globalAlpha=Math.min(1,alpha);
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,GW,GH);
  ctx.fillStyle='#fff';ctx.font='bold 24px Fredoka One';ctx.textAlign='center';
  // Word wrap at 520px wide
  const words=text.split(' ');let line='',y=GH/2-20;const lines=[];
  words.forEach(w=>{
    const t2=line+(line?' ':'')+w;
    if(ctx.measureText(t2).width>520&&line){ lines.push(line); line=w; }
    else line=t2;
  });
  if(line) lines.push(line);
  const startY=GH/2-(lines.length-1)*18;
  lines.forEach((l,i)=>ctx.fillText(l,GW/2,startY+i*36));
  ctx.globalAlpha=1;ctx.textAlign='left';
}

function tLetterbox(ctx){
  ctx.fillStyle='#000';ctx.fillRect(0,0,640,50);ctx.fillRect(0,350,640,50);
}

function tEndCard(ctx,gameNum,title,sub,t){
  const GW=640,GH=400;
  const alpha=t<0.1?t/0.1:1;
  ctx.globalAlpha=alpha;
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,GW,GH);
  // Logo
  ctx.fillStyle='#ff9f1c';ctx.font='bold 14px Fredoka One';ctx.textAlign='center';
  ctx.fillText('CLUCKER ENTERTAINMENT™ PRESENTS',GW/2,80);
  ctx.fillStyle='#ffcc02';ctx.font='bold 58px Fredoka One';
  ctx.strokeStyle='#cc2200';ctx.lineWidth=6;
  ctx.strokeText('CRANKY',GW/2,160);ctx.fillText('CRANKY',GW/2,160);
  ctx.strokeText('CHICKENS',GW/2,220);ctx.fillText('CHICKENS',GW/2,220);
  ctx.fillStyle='#ff6b35';ctx.font='bold 28px Fredoka One';
  ctx.fillText(gameNum+': '+title,GW/2,265);
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='bold 16px Fredoka One';
  ctx.fillText(sub,GW/2,300);
  // Rating badge area
  ctx.fillStyle='rgba(255,204,2,0.1)';ctx.fillRect(220,320,200,30);
  ctx.strokeStyle='#ffcc02';ctx.lineWidth=1;ctx.strokeRect(220,320,200,30);
  ctx.fillStyle='#ffcc02';ctx.font='bold 13px Fredoka One';
  ctx.fillText('IN THEATERS: NEVER™',GW/2,341);
  ctx.globalAlpha=1;ctx.textAlign='left';
}

// ── TRAILER 4: IN SPACE ──
TRAILER_SCRIPTS[4] = (()=>{
  const stars=Array.from({length:60},(_,i)=>({x:(i*137+50)%640,y:(i*53+20)%360,r:Math.random()*1.5+0.3,s:Math.random()*0.05+0.01}));
  const GW=640,GH=400;

  function bg(ctx,fr){
    ctx.fillStyle='#030312';ctx.fillRect(0,0,GW,GH);
    stars.forEach(st=>{
      const tw=0.2+Math.sin(fr*st.s+st.x)*0.8;
      ctx.fillStyle=`rgba(255,255,255,${tw})`;
      ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fill();
    });
    const ng=ctx.createRadialGradient(500,120,0,500,120,180);
    ng.addColorStop(0,'rgba(108,92,231,0.18)');ng.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ng;ctx.fillRect(0,0,GW,GH);
  }

  return [
    // Scene 1: cold open — black, chicken floats in
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      tLetterbox(ctx);
      const x = Math.min(t*1.5,1)*200 + 60;
      ctx.save(); ctx.translate(x+16,200); ctx.rotate(fr*0.03); ctx.translate(-16,-16);
      drawChicken(ctx,0,0,3,0,fr); ctx.restore();
      // text appears at t>0.2, fully visible 0.3-0.85
      const alpha=t<0.2?0:t<0.3?(t-0.2)/0.1:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'IN SPACE, NO ONE CAN HEAR YOU BAWK',alpha);
    }},
    // Scene 2: reveal — Earth, rocket launches
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      tLetterbox(ctx);
      ctx.save();ctx.translate(540,280);
      ctx.fillStyle='#1a6fbf';ctx.beginPath();ctx.arc(0,0,80,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3ab54a';ctx.beginPath();ctx.arc(-20,-10,36,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(26,18,28,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(-8,-30,20,0,Math.PI*2);ctx.fill();
      ctx.restore();
      const ry = 340 - Math.min(t*2,1)*600;
      ctx.save();ctx.translate(120,ry);ctx.rotate(-Math.PI/8);
      ctx.font='40px Arial';ctx.textAlign='center';ctx.fillText('🚀',0,0);
      ctx.restore();ctx.textAlign='left';
      for(let i=0;i<5;i++){
        const py=ry+40+i*10+Math.sin(fr*0.5+i)*6;
        const px=120+Math.cos(fr*0.3+i)*8;
        const a=(5-i)/5*0.7;
        ctx.fillStyle=`rgba(255,${100+i*30},0,${a})`;
        ctx.beginPath();ctx.arc(px,py,6-i,0,Math.PI*2);ctx.fill();
      }
      const alpha=t<0.25?0:t<0.35?(t-0.25)/0.1:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'THE CORN IS UP THERE.  THEY CAN FEEL IT.',alpha);
    }},
    // Scene 3: gameplay — slingshot in space
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      for(let tx=0;tx<20;tx++) drawTile(ctx,5,tx*32,350,fr,'jaguar',8);
      tLetterbox(ctx);
      ctx.save();ctx.scale(1.4,1.4);ctx.translate(50,20);
      ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(14+220,26+160,12,4,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#a29bfe';ctx.beginPath();ctx.ellipse(14+220,18+160,12,9,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#6c5ce7';ctx.fillRect(3+220,12+160,22,12);
      ctx.fillStyle='#a29bfe';for(let i=0;i<5;i++)ctx.fillRect(5+i*4+220,6+160,3,8);
      ctx.fillStyle='#a29bfe';ctx.beginPath();ctx.arc(22+220,14+160,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fdcb6e';ctx.beginPath();ctx.arc(24+220,12+160,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.arc(25+220,12+160,1.5,0,Math.PI*2);ctx.fill();
      const bw=30;ctx.fillStyle='#333';ctx.fillRect(220,153,bw,4);ctx.fillStyle='#a29bfe';ctx.fillRect(220,153,bw*0.6,4);
      ctx.restore();
      const sx=90,G=350,forkH=80,forkTop=G-forkH-30;
      ctx.fillStyle='#8B4513';
      ctx.fillRect(sx-5,forkTop,10,forkH+8);ctx.fillRect(sx-24,forkTop,10,forkH+8);ctx.fillRect(sx+14,forkTop,10,forkH+8);
      const aimPull=Math.sin(fr*0.04)*0.5-0.6;
      const px=sx+(-0.6)*44, py=(forkTop+6)+(aimPull/Math.abs(aimPull||1))*44*Math.abs(aimPull);
      ctx.strokeStyle='#8B4513';ctx.lineWidth=3;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(sx-19,forkTop+4);ctx.lineTo(px,py);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx+19,forkTop+4);ctx.lineTo(px,py);ctx.stroke();
      ctx.save();ctx.translate(px+16,py+16);ctx.rotate(fr*0.06);ctx.translate(-16,-16);
      drawChicken(ctx,0,0,3,0,fr);ctx.restore();
      ctx.fillStyle='rgba(255,255,255,0.5)';
      let tx2=px+16,ty2=py+16,vx2=16,vy2=-8;
      for(let i=0;i<30;i++){tx2+=vx2;ty2+=vy2;vy2+=0.2;if(i%2===0){ctx.beginPath();ctx.arc(tx2,ty2,3,0,Math.PI*2);ctx.fill();}}
      if(t>0.3){
        const ft=(t-0.3)/0.7;
        const fx=px+16+ft*420, fy=py+16-ft*140+ft*ft*200;
        const ang=Math.atan2(fy-(py+16)+0.01,fx-(px+16));
        ctx.save();ctx.translate(fx,fy);ctx.rotate(ang);
        drawChicken(ctx,-16,-16,3,15,fr);ctx.restore();
        for(let i=1;i<=5;i++){
          const fp=ft-i*0.04;if(fp<0)continue;
          const tx3=px+16+fp*420,ty3=py+16-fp*140+fp*fp*200;
          ctx.fillStyle=`rgba(255,204,2,${0.5-i*0.09})`;
          ctx.beginPath();ctx.arc(tx3,ty3,4-i*0.6,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,640,28);
      ctx.fillStyle='#ffcc02';ctx.font='bold 12px Fredoka One';ctx.textAlign='center';
      ctx.fillText('Shots: 🐔🐔🐔  ·  BOSS HP: ████████  ·  HP: ❤️❤️❤️',320,19);
      ctx.textAlign='left';
    }},
    // Scene 4: cutscene beat — alien jaguar boss
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#080818';ctx.fillRect(0,0,GW,GH);
      stars.forEach(st=>{ ctx.fillStyle=`rgba(255,255,255,${0.2+Math.sin(fr*st.s)*0.5})`; ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fill(); });
      tLetterbox(ctx);
      const shk=t>0.15?Math.sin(fr*0.8)*3:0;
      ctx.save();ctx.translate(380+shk,160);ctx.scale(2.5,2.5);
      ctx.fillStyle='rgba(123,45,200,0.3)';ctx.beginPath();ctx.arc(20,30,60,0,Math.PI*2);ctx.fill();
      drawJaguarSmall(ctx,0,0,fr);ctx.restore();
      for(let i=0;i<6;i++){
        const a=fr*0.04+i/6*Math.PI*2;
        const bx=380+Math.cos(a)*110, by=200+Math.sin(a)*60;
        ctx.fillStyle=`rgba(108,92,231,${0.4+Math.sin(fr*0.1+i)*0.4})`;
        ctx.beginPath();ctx.arc(bx,by,4,0,Math.PI*2);ctx.fill();
      }
      drawChicken(ctx,60,280,0,0,fr);
      if(t>0.2){
        const bAlpha=Math.min(1,(t-0.2)/0.12);
        ctx.globalAlpha=bAlpha;
        ctx.fillStyle='rgba(40,0,80,0.95)';ctx.beginPath();ctx.roundRect(100,230,420,72,10);ctx.fill();
        ctx.strokeStyle='#a29bfe';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#a29bfe';ctx.font='bold 12px Fredoka One';ctx.textAlign='left';
        ctx.fillText('GALAXY-BRAIN JAGUAR',112,250);
        ctx.fillStyle='#fff';ctx.font='bold 14px Fredoka One';
        ctx.fillText('"Your corn? MINE now. ALL of it.',112,270);
        ctx.fillText(' Even the decorative corn. Especially that."',112,288);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
    }},
    // Scene 5: end card
    { dur:300, draw(ctx,fr,t){
      tEndCard(ctx,'IV','IN SPACE','"Houston, We Have a Clucking Problem"',t);
    }},
  ];
})();

// ── TRAILER 5: JURASSIC SQUAWK ──
TRAILER_SCRIPTS[5] = (()=>{
  const GW=640,GH=400;
  const jMap=[[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],[2,2,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2],[2,2,1,1,1,1,1,1,9,9,1,1,1,1,1,1,2,2,2,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2],[1,1,1,1,1,2,2,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];

  function bg(ctx,fr){
    for(let ty=0;ty<7;ty++) for(let tx2=0;tx2<20;tx2++){
      const t=(jMap[ty]||[])[tx2];
      if(t!==undefined) drawTile(ctx,t,tx2*32,ty*50,fr,'jungle',4);
    }
  }

  function drawTRex(ctx,x,y,fr,scale){
    scale=scale||1;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    const bob=Math.sin(fr*0.06)*4;
    ctx.fillStyle='#5c7a3e';ctx.beginPath();ctx.ellipse(30,40+bob,28,22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5c7a3e';ctx.fillRect(30,10+bob,20,30);
    ctx.beginPath();ctx.ellipse(44,14+bob,22,16,0.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a6a2e';ctx.fillRect(18,30+bob,10,6);ctx.fillRect(10,34+bob,8,4);
    ctx.fillStyle='#fffde7';for(let i=0;i<4;i++){ctx.fillRect(32+i*5,22+bob,4,5);}
    ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(52,10+bob,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(53,10+bob,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a6a2e';ctx.fillRect(18,58+bob,14,18);ctx.fillRect(36,58+bob,14,18);
    ctx.fillRect(14,74+bob,18,6);ctx.fillRect(32,74+bob,18,6);
    ctx.strokeStyle='#5c7a3e';ctx.lineWidth=14;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(2,44+bob);ctx.quadraticCurveTo(-20,50+bob,-32,38+bob);ctx.stroke();
    ctx.restore();
  }

  return [
    // Scene 1: lab scene - dark
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#060a06';ctx.fillRect(0,0,GW,GH);
      tLetterbox(ctx);
      ctx.font='30px Arial';ctx.textAlign='center';
      ctx.fillText('🧬',160,220);ctx.fillText('⚗️',320,220);ctx.fillText('🔬',480,220);
      const glow=0.3+Math.sin(fr*0.1)*0.2;
      ctx.fillStyle=`rgba(0,255,100,${glow})`;ctx.beginPath();ctx.arc(320,220,40,0,Math.PI*2);ctx.fill();
      ctx.textAlign='left';
      const alpha=t<0.15?0:t<0.28?(t-0.15)/0.13:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'CHICKENGEN LABS. TUESDAY.',alpha);
    }},
    // Scene 2: warning sirens
    { dur:300, draw(ctx,fr,t){
      const flash=Math.floor(fr/8)%2;
      ctx.fillStyle=flash?'#200000':'#100000';ctx.fillRect(0,0,GW,GH);
      if(flash){ ctx.fillStyle='rgba(255,0,0,0.15)';ctx.fillRect(0,0,GW,GH); }
      ctx.font='80px Arial';ctx.textAlign='center';ctx.fillText('⚠️',GW/2,220);ctx.textAlign='left';
      const alpha=t<0.12?0:t<0.25?(t-0.12)/0.13:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'OOPS.',alpha);
    }},
    // Scene 3: T-Rex reveal
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#0d2818';ctx.fillRect(0,0,GW,GH);
      bg(ctx,fr);
      tLetterbox(ctx);
      const rx = t<0.4 ? GW - Math.min(t/0.4,1)*(GW-280) : 280;
      const scale = t<0.4 ? 0.8+t*0.5 : 1.0;
      drawTRex(ctx,rx,120,fr,scale);
      if(t>0.25){
        const ba=Math.min(1,(t-0.25)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='#222';ctx.fillRect(GW/2-80,16,160,12);
        ctx.fillStyle='#f87171';ctx.fillRect(GW/2-80,16,160,12);
        ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(GW/2-80,16,160,12);
        ctx.fillStyle='#fff';ctx.font='bold 10px Fredoka One';ctx.textAlign='center';
        ctx.fillText('🦖 T-REXTER  ⚠️ BOSS BATTLE!',GW/2,14);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
      drawChicken(ctx,60,290,0,0,fr);
      if(t>0.45){
        const ba=Math.min(1,(t-0.45)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='rgba(0,0,0,0.9)';ctx.beginPath();ctx.roundRect(90,244,480,60,8);ctx.fill();
        ctx.strokeStyle='#ffcc02';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle='#ffcc02';ctx.font='bold 12px Fredoka One';ctx.textAlign='left';
        ctx.fillText('ABUELA ROSA (NPC)',100,262);
        ctx.fillStyle='#fff';ctx.font='bold 14px Fredoka One';
        ctx.fillText('"¡Ay dios mío! THAT is your ancestor?!"',100,282);
        ctx.fillText('"You owe me an explanation."',100,300);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
    }},
    // Scene 4: slingshot gameplay vs dino
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#0d2818';ctx.fillRect(0,0,GW,GH);
      bg(ctx,fr);
      tLetterbox(ctx);
      drawTRex(ctx,340,100,fr,1.2);
      ctx.fillStyle='#7b5c3a';ctx.fillRect(260,240,36,80);ctx.fillRect(298,210,32,110);ctx.fillRect(332,250,28,70);
      ctx.fillStyle='#5c3a18';ctx.fillRect(262,242,32,4);ctx.fillRect(300,212,28,4);
      const sx=80,G=340,forkTop=G-80-30;
      ctx.fillStyle='#8B4513';ctx.fillRect(sx-5,forkTop,10,88);ctx.fillRect(sx-24,forkTop,10,88);ctx.fillRect(sx+14,forkTop,10,88);
      const aimX=0.7,aimY=-0.5;
      const pLen=Math.hypot(aimX,aimY);
      const px=sx+(aimX/pLen)*40, py=(forkTop+6)+(aimY/pLen)*40;
      ctx.strokeStyle='#8B4513';ctx.lineWidth=3;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(sx-19,forkTop+4);ctx.lineTo(px,py);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx+19,forkTop+4);ctx.lineTo(px,py);ctx.stroke();
      drawChicken(ctx,px-16,py-16,3,0,fr);
      if(t>0.3){
        const ft=(t-0.3)/0.7;
        const fx=px+16+ft*320, fy=py+16-ft*120+ft*ft*140;
        const ang=Math.atan2(fy-(py+16)+0.01,fx-(px+16));
        ctx.save();ctx.translate(fx,fy);ctx.rotate(ang);
        drawChicken(ctx,-16,-16,3,15,fr);ctx.restore();
        for(let i=1;i<=5;i++){
          const fp=ft-i*0.05;if(fp<0)continue;
          const tx3=px+16+fp*320,ty3=py+16-fp*120+fp*fp*140;
          ctx.fillStyle=`rgba(255,204,2,${0.5-i*0.09})`;ctx.beginPath();ctx.arc(tx3,ty3,4,0,Math.PI*2);ctx.fill();
        }
        if(ft>0.9){ ctx.fillStyle='rgba(255,80,0,0.4)';ctx.fillRect(0,0,GW,GH); }
      }
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,640,28);
      ctx.fillStyle='#ffcc02';ctx.font='bold 11px Fredoka One';ctx.textAlign='center';
      ctx.fillText('Shots: 🐔🐔  ·  BOSS HP: ██████░░  ·  HP: ❤️❤️❤️',320,19);ctx.textAlign='left';
    }},
    // Scene 5: end card
    { dur:300, draw(ctx,fr,t){
      tEndCard(ctx,'V','JURASSIC SQUAWK','"Life, Uh... Finds a Bawk"',t);
    }},
  ];
})();

// ── TRAILER 6: MEDIEVAL MOLT ──
TRAILER_SCRIPTS[6] = (()=>{
  const GW=640,GH=400;
  const rMap=[[6,6,6,6,6,6,6,6,4,4,4,4,6,6,6,6,6,6,6,6],[6,5,5,5,5,5,5,4,4,4,4,4,4,5,5,5,5,5,5,6],[6,5,5,5,5,5,5,5,1,1,1,1,5,5,5,5,5,5,5,6],[6,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,5,6],[4,1,1,1,1,1,1,1,1,1,9,1,1,1,1,1,1,1,4,4],[4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4],[4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4]];

  function bg(ctx,fr){
    for(let ty=0;ty<7;ty++) for(let tx2=0;tx2<20;tx2++){
      const t=(rMap[ty]||[])[tx2];
      if(t!==undefined) drawTile(ctx,t,tx2*32,ty*53,fr,'ruins',6);
    }
  }

  function drawWeasel(ctx,x,y,fr,scale){
    scale=scale||1;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    const bob=Math.sin(fr*0.08)*3;
    ctx.fillStyle='#4a0080';ctx.beginPath();ctx.moveTo(20,15+bob);ctx.lineTo(-10,70+bob);ctx.lineTo(50,70+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#c4a0d0';ctx.beginPath();ctx.ellipse(20,36+bob,14,16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffcc02';ctx.beginPath();ctx.moveTo(4,8+bob);ctx.lineTo(4,-4+bob);ctx.lineTo(10,2+bob);ctx.lineTo(16,-8+bob);ctx.lineTo(22,2+bob);ctx.lineTo(28,-4+bob);ctx.lineTo(34,8+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ff3333';ctx.beginPath();ctx.arc(10,-2+bob,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(20,-8+bob,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(30,-2+bob,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c4a0d0';ctx.beginPath();ctx.arc(20,12+bob,13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(15,11+bob,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(25,11+bob,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a1a2e';ctx.beginPath();ctx.arc(15,11+bob,1.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(25,11+bob,1.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#aaa';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(38,20+bob);ctx.lineTo(55,-4+bob);ctx.stroke();
    ctx.strokeStyle='#ffcc02';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(34,22+bob);ctx.lineTo(42,18+bob);ctx.stroke();
    ctx.restore();
  }

  return [
    // Scene 1: scroll opening
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#2c1810';ctx.fillRect(0,0,GW,GH);
      tLetterbox(ctx);
      const sw=Math.min(600,Math.min(t*2,1)*600);
      ctx.fillStyle='#f5e6c8';ctx.fillRect(GW/2-sw/2,130,sw,140);
      ctx.strokeStyle='#8B4513';ctx.lineWidth=3;ctx.strokeRect(GW/2-sw/2,130,sw,140);
      if(sw>80){
        ctx.fillStyle='#3c1a0a';ctx.font='bold 20px Fredoka One';ctx.textAlign='center';
        ctx.fillText('HEAR YE, HEAR YE.',GW/2,168);
        if(sw>230){ ctx.fillStyle='#3c1a0a';ctx.font='bold 17px Fredoka One';ctx.fillText('THE CHICKENS HAVE RETURNED TO',GW/2,198); }
        if(sw>430){ctx.fillStyle='#cc2200';ctx.font='bold 26px Fredoka One';ctx.fillText('THE YEAR 1347.',GW/2,234);}
      }
      ctx.textAlign='left';
    }},
    // Scene 2: castle establishing shot
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#1e0e08';ctx.fillRect(0,0,GW,GH);
      bg(ctx,fr);
      tLetterbox(ctx);
      ctx.fillStyle='#2c1810';ctx.fillRect(360,60,280,280);
      ctx.fillStyle='#3c2418';
      for(let i=0;i<9;i++) ctx.fillRect(360+i*32,60,28,30);
      ctx.fillStyle='#1a0a08';ctx.fillRect(430,180,50,140);
      ctx.fillStyle='#0a0505';ctx.fillRect(448,200,16,120);
      ctx.save();ctx.translate(420,60);drawWeasel(ctx,0,0,fr,1.1);ctx.restore();
      if(t>0.35){
        const ba=Math.min(1,(t-0.35)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='rgba(60,20,5,0.95)';ctx.beginPath();ctx.roundRect(60,16,520,60,8);ctx.fill();
        ctx.strokeStyle='#ffcc02';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle='#ffcc02';ctx.font='bold 12px Fredoka One';ctx.textAlign='left';
        ctx.fillText('👑 WEASEL KING OF HENSBOROUGH',72,34);
        ctx.fillStyle='#fff';ctx.font='bold 14px Fredoka One';
        ctx.fillText('"Your corn tithe is MINE, chickens!',72,54);
        ctx.fillText(' Also your egg. Especially the egg."',72,70);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
    }},
    // Scene 3: catapult gameplay
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#1e0e08';ctx.fillRect(0,0,GW,GH);
      bg(ctx,fr);
      tLetterbox(ctx);
      ctx.fillStyle='#2c1810';ctx.fillRect(360,160,240,200);
      ctx.fillStyle='#3c2418';for(let i=0;i<7;i++) ctx.fillRect(364+i*32,160,28,24);
      ctx.fillStyle='#7b5c3a';ctx.fillRect(280,240,32,100);ctx.fillRect(314,200,28,140);ctx.fillRect(344,260,30,80);
      ctx.fillStyle='#5c3a18';ctx.fillRect(282,242,28,4);ctx.fillRect(316,202,24,4);
      const bx=40,G=340;
      ctx.fillStyle='#8B4513';ctx.beginPath();ctx.arc(bx+10,G+12,14,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(bx+60,G+12,14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5c3317';ctx.strokeStyle='#5c3317';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx+10,G+12,14,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(bx+60,G+12,14,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#8B4513';ctx.fillRect(bx+2,G-40,8,54);ctx.fillRect(bx+58,G-40,8,54);ctx.fillRect(bx+2,G-40,64,8);
      const armA=-Math.PI/3+Math.sin(fr*0.04)*0.3;
      ctx.save();ctx.translate(bx+35,G-32);ctx.rotate(armA);
      ctx.fillStyle='#5c3317';ctx.fillRect(-4,-60,8,88);
      ctx.translate(0,-66);ctx.rotate(-armA*0.3);
      drawChicken(ctx,-16,-16,3,0,fr);
      ctx.restore();
      if(t>0.4){
        const ft=(t-0.4)/0.6;
        const fx=80+ft*330, fy=200-ft*100+ft*ft*140;
        const ang=Math.atan2(fy-200+0.01,fx-80);
        ctx.save();ctx.translate(fx,fy);ctx.rotate(ang);
        drawChicken(ctx,-16,-16,3,15,fr);ctx.restore();
        for(let i=1;i<=5;i++){
          const fp=ft-i*0.05;if(fp<0)continue;
          const tx3=80+fp*330,ty3=200-fp*100+fp*fp*140;
          ctx.fillStyle=`rgba(255,204,2,${0.5-i*0.09})`;ctx.beginPath();ctx.arc(tx3,ty3,4,0,Math.PI*2);ctx.fill();
        }
        if(ft>0.92){ctx.fillStyle='rgba(255,80,0,0.35)';ctx.fillRect(0,0,GW,GH);}
      }
      ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,640,28);
      ctx.fillStyle='#ffcc02';ctx.font='bold 11px Fredoka One';ctx.textAlign='center';
      ctx.fillText('Shots: 🐔🐔🐔  ·  BOSS HP: █████░░░  ·  HP: ❤️❤️❤️',320,19);ctx.textAlign='left';
    }},
    // Scene 4: cutscene — chicken knight
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#1e0e08';ctx.fillRect(0,0,GW,GH);
      tLetterbox(ctx);
      ctx.save();ctx.translate(120,200);drawChicken(ctx,0,0,3,t>0.3?20:0,fr);
      ctx.font='22px Arial';ctx.textAlign='center';ctx.fillText('⚔️',32,-10);ctx.restore();ctx.textAlign='left';
      drawWeasel(ctx,380,150,fr,1.3);
      if(t>0.3){
        const ba=Math.min(1,(t-0.3)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='rgba(0,0,0,0.95)';ctx.beginPath();ctx.roundRect(80,290,520,72,8);ctx.fill();
        ctx.strokeStyle='#ff6b35';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle='#ff9f1c';ctx.font='bold 12px Fredoka One';ctx.textAlign='left';
        ctx.fillText('WEASEL KING',90,308);
        ctx.fillStyle='#fff';ctx.font='bold 14px Fredoka One';
        ctx.fillText('"I studied the blade for 40 years."',90,328);
        ctx.fillText('"You\'re a CHICKEN. You don\'t HAVE hands!!"',90,348);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
    }},
    // Scene 5: end card
    { dur:300, draw(ctx,fr,t){
      tEndCard(ctx,'VI','MEDIEVAL MOLT','"Ye Olde Grievances"',t);
    }},
  ];
})();

// ── TRAILER 7: WE KNOW YOU'RE HERE ──
TRAILER_SCRIPTS[7] = (()=>{
  const GW=640,GH=400;
  const stars=Array.from({length:30},(_,i)=>({x:(i*137+50)%640,y:(i*53+20)%360}));
  let glitchAmt=0;

  function bg(ctx,fr){
    ctx.fillStyle='#0a0518';ctx.fillRect(0,0,GW,GH);
    stars.forEach((st,i)=>{
      const tw=0.2+Math.sin(fr*0.04+i)*0.6;
      ctx.fillStyle=`rgba(200,150,255,${tw})`;
      ctx.beginPath();ctx.arc(st.x,st.y,1.2,0,Math.PI*2);ctx.fill();
    });
    const ng=ctx.createRadialGradient(320,200,0,320,200,300);
    ng.addColorStop(0,'rgba(60,0,100,0.4)');ng.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ng;ctx.fillRect(0,0,GW,GH);
  }

  return [
    // Scene 1: normal-seeming intro
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#0d2818';ctx.fillRect(0,0,GW,GH);
      for(let ty=0;ty<13;ty++) for(let tx2=0;tx2<20;tx2++) drawTile(ctx,1,tx2*32,ty*32,fr,'jungle',4);
      tLetterbox(ctx);
      drawChicken(ctx,300,200,3,0,fr);
      drawIguana(ctx,440,210,0.8,fr);
      drawCorn(ctx,200,200,fr);
      const alpha=t<0.18?0:t<0.3?(t-0.18)/0.12:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'Cranky Chickens VII is a normal game.',alpha);
    }},
    // Scene 2: something's off
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#0d2818';ctx.fillRect(0,0,GW,GH);
      for(let ty=0;ty<13;ty++) for(let tx2=0;tx2<20;tx2++) drawTile(ctx,1,tx2*32,ty*32,fr,'jungle',4);
      tLetterbox(ctx);
      [[80,180],[220,190],[360,185],[500,180]].forEach(([x,y])=>drawChicken(ctx,x,y,2,0,fr));
      drawIguana(ctx,290,210,0.9,fr);
      ctx.fillStyle=`rgba(255,0,50,${t*0.12})`;ctx.fillRect(0,0,GW,GH);
      const alpha=t<0.2?0:t<0.32?(t-0.2)/0.12:t>0.85?(1-(t-0.85)/0.15):1;
      tCard(ctx,'It is a completely normal game about chickens.',alpha);
    }},
    // Scene 3: glitch escalation
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      tLetterbox(ctx);
      ctx.save();ctx.translate(320,160);ctx.scale(2.5,2.5);
      drawChicken(ctx,-16,-16,2,0,fr);ctx.restore();
      ctx.fillStyle='#ff0050';ctx.font='bold 28px Fredoka One';ctx.textAlign='center';
      const pulse=0.5+Math.sin(fr*0.08)*0.5;
      ctx.globalAlpha=pulse;
      ctx.fillText('?   ?   ?   ?',GW/2,340);ctx.globalAlpha=1;
      if(t>0.25){
        const ba=Math.min(1,(t-0.25)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='rgba(255,255,255,0.97)';ctx.beginPath();ctx.roundRect(180,38,280,56,10);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.97)';ctx.beginPath();ctx.moveTo(312,92);ctx.lineTo(306,114);ctx.lineTo(320,92);ctx.fill();
        ctx.fillStyle='#1a0a2e';ctx.font='bold 15px Fredoka One';ctx.textAlign='center';
        ctx.fillText('We can see you.',GW/2,64);ctx.fillText('Hello.  :)',GW/2,84);
        ctx.globalAlpha=1;
      }
      if(t>0.5&&Math.random()<0.15){
        ctx.fillStyle=`rgba(255,0,80,0.2)`;ctx.fillRect(0,Math.random()*GH,GW,Math.random()*30+5);
        ctx.fillStyle=`rgba(0,255,200,0.15)`;ctx.fillRect(4,Math.random()*GH,GW,Math.random()*20+4);
      }
      ctx.textAlign='left';
    }},
    // Scene 4: everything wrong
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      tLetterbox(ctx);
      [[100,140,0.3],[200,200,-0.15],[340,150,0.5],[480,190,-0.4],[560,140,0.2]].forEach(([x,y,r])=>{
        ctx.save();ctx.translate(x+16,y+16);ctx.rotate(r+Math.sin(fr*0.04+x)*0.08);ctx.translate(-16,-16);
        drawChicken(ctx,0,0,2,0,fr);ctx.restore();
      });
      if(t>0.28){
        const ba=Math.min(1,(t-0.28)/0.12);
        ctx.globalAlpha=ba;
        ctx.fillStyle='rgba(0,0,0,0.92)';ctx.fillRect(120,272,400,68);
        ctx.strokeStyle='#ff0050';ctx.lineWidth=2;ctx.strokeRect(120,272,400,68);
        ctx.fillStyle='#ff0050';ctx.font='bold 15px Fredoka One';ctx.textAlign='center';
        ctx.fillText('⚠️ CONTROLLER DISCONNECTED',GW/2,298);
        ctx.fillStyle='rgba(255,255,255,0.6)';ctx.font='bold 13px Fredoka One';
        ctx.fillText('The chickens are continuing without you.',GW/2,320);
        ctx.globalAlpha=1;ctx.textAlign='left';
      }
      const vg=ctx.createRadialGradient(GW/2,GH/2,80,GW/2,GH/2,300);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(200,0,50,${t*0.4})`);
      ctx.fillStyle=vg;ctx.fillRect(0,0,GW,GH);
      if(Math.random()<0.2){
        ctx.fillStyle=`rgba(255,255,255,0.04)`;
        for(let i=0;i<20;i++) ctx.fillRect(Math.random()*GW,Math.random()*GH,Math.random()*60+4,2);
      }
    }},
    // Scene 5: end card (creepy version)
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#060010';ctx.fillRect(0,0,GW,GH);
      const alpha=t<0.1?t/0.1:1;
      ctx.globalAlpha=alpha;
      ctx.fillStyle='#ff0050';ctx.font='bold 14px Fredoka One';ctx.textAlign='center';
      ctx.fillText('CLUCKER ENTERTAINMENT™ PRESENTS',GW/2,80);
      ctx.fillStyle='#ff8888';ctx.font='bold 58px Fredoka One';
      ctx.strokeStyle='#330010';ctx.lineWidth=6;
      ctx.strokeText('CRANKY',GW/2,160);ctx.fillText('CRANKY',GW/2,160);
      ctx.strokeText('CHICKENS',GW/2,220);ctx.fillText('CHICKENS',GW/2,220);
      ctx.fillStyle='#ff6666';ctx.font='bold 26px Fredoka One';
      ctx.fillText('VII: WE KNOW YOU\'RE HERE',GW/2,265);
      ctx.fillStyle='rgba(255,100,100,0.6)';ctx.font='bold 16px Fredoka One';
      ctx.fillText('"The Chickens Have Become Aware of the Player"',GW/2,300);
      ctx.fillStyle='rgba(255,80,80,0.2)';ctx.fillRect(180,320,280,32);
      ctx.strokeStyle='#ff0050';ctx.lineWidth=1;ctx.strokeRect(180,320,280,32);
      ctx.fillStyle='#ff8888';ctx.font='bold 14px Fredoka One';
      if(Math.floor(fr/25)%2===0) ctx.fillText('RELEASE DATE: WHEN IT\'S READY',GW/2,341);
      ctx.globalAlpha=1;
      ctx.globalAlpha=0.15+Math.sin(fr*0.05)*0.1;
      drawChicken(ctx,10,340,2,0,fr);drawChicken(ctx,580,340,2,0,fr);
      drawChicken(ctx,10,10,2,0,fr);drawChicken(ctx,580,10,2,0,fr);
      ctx.globalAlpha=1;ctx.textAlign='left';
    }},
  ];
})();

// ── PLAYER STATE ──
// 300 frames = 5 seconds per scene at 60fps — comfortable reading pace for 8-year-olds
const SCENE_DUR = 300;
const TRAILER_SCRIPTS = {};
TRAILER_SCRIPTS['barb'] = (()=>{
  const GW=640,GH=400;
  const STARS=Array.from({length:80},(_,i)=>({x:(i*137+50)%GW,y:(i*53+20)%GH,r:Math.random()*1.2+0.3,s:Math.random()*0.05+0.01,off:Math.random()*Math.PI*2}));

  function bg(ctx,fr){
    const sky=ctx.createLinearGradient(0,0,0,GH);
    sky.addColorStop(0,'#1a0a2e'); sky.addColorStop(0.4,'#2d1044'); sky.addColorStop(1,'#3d1a0a');
    ctx.fillStyle=sky; ctx.fillRect(0,0,GW,GH);
    STARS.forEach(s=>{
      ctx.globalAlpha=0.3+Math.sin(fr*s.s+s.off)*0.5;
      ctx.fillStyle='#c8d8ff'; ctx.beginPath(); ctx.arc(s.x,s.y*0.5,s.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
    // ground
    ctx.fillStyle='#2a1a0a'; ctx.fillRect(0,GH*0.65,GW,GH*0.35);
    ctx.fillStyle='#3a2a14'; ctx.fillRect(0,GH*0.65,GW,5);
    // barn
    ctx.fillStyle='#8b2222'; ctx.fillRect(480,180,140,GH*0.45);
    ctx.fillStyle='#6b1a1a'; ctx.beginPath(); ctx.moveTo(468,180); ctx.lineTo(550,130); ctx.lineTo(632,180); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#3a1a1a'; ctx.fillRect(520,240,34,44);
    ctx.globalAlpha=0.4+Math.sin(fr*0.04)*0.2; ctx.fillStyle='#ffcc02';
    ctx.fillRect(492,196,26,20); ctx.fillRect(572,196,26,20);
    ctx.globalAlpha=1;
    // farmhouse
    ctx.fillStyle='#5a3a1a'; ctx.fillRect(30,210,130,GH*0.35);
    ctx.fillStyle='#7a5a2a'; ctx.beginPath(); ctx.moveTo(18,210); ctx.lineTo(95,165); ctx.lineTo(172,210); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=0.7+Math.sin(fr*0.05)*0.2; ctx.fillStyle='#ffeeaa';
    ctx.fillRect(46,226,32,24); ctx.fillRect(122,226,32,24);
    ctx.globalAlpha=1; ctx.strokeStyle='#8b6a30'; ctx.lineWidth=2;
    ctx.strokeRect(46,226,32,24); ctx.strokeRect(122,226,32,24);
  }

  function chick(ctx,x,y,sc){
    ctx.save(); ctx.translate(x+14,y+14); ctx.scale(sc,sc); ctx.translate(-14,-14);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(14,28,11,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff9f1c'; ctx.beginPath(); ctx.ellipse(14,18,12,11,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffcc6e'; ctx.beginPath(); ctx.ellipse(14,20,8,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff9f1c'; ctx.beginPath(); ctx.arc(14,8,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff3333'; ctx.beginPath(); ctx.moveTo(9,1);ctx.lineTo(7,-5);ctx.lineTo(12,-2);ctx.lineTo(14,-7);ctx.lineTo(16,-2);ctx.lineTo(20,-5);ctx.lineTo(18,1); ctx.closePath(); ctx.fill();
    ctx.fillStyle='white'; ctx.beginPath(); ctx.ellipse(12,7,4,5,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(19,7,4,5,0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.arc(13,8,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(20,8,2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6b00'; ctx.beginPath(); ctx.moveTo(11,12);ctx.lineTo(17,12);ctx.lineTo(14,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e08010'; ctx.beginPath(); ctx.ellipse(3,18,4,8,0.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(25,18,4,8,-0.4,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function dog(ctx,x,y,sc,happy,fr){
    ctx.save(); ctx.translate(x+14,y+16); ctx.scale(sc,sc); ctx.translate(-14,-16);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(14,30,12,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c8882a'; ctx.beginPath(); ctx.ellipse(14,20,11,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.ellipse(10,17,7,7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#c8882a'; ctx.beginPath(); ctx.arc(14,7,10,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4,3,5,12,-0.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24,3,5,12,0.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#e8a84a'; ctx.beginPath(); ctx.ellipse(4,3,3,9,-0.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(24,3,3,9,0.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#e8b87a'; ctx.beginPath(); ctx.ellipse(16,8,5,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.ellipse(17,5,2.5,1.8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3a2210'; ctx.beginPath(); ctx.arc(10,6,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(18,6,2.5,0,Math.PI*2); ctx.fill();
    if(happy>0){
      ctx.globalAlpha=happy; ctx.fillStyle='#ff6688'; ctx.beginPath(); ctx.ellipse(17,13,3,4,0.3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
      const wv=Math.sin(fr*0.15)*10; ctx.fillStyle='#c8882a'; ctx.beginPath(); ctx.ellipse(26,-2+wv,4,3,0.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function lou(ctx,x,y,sc,grump){
    ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc);
    ctx.fillStyle='#3355aa'; ctx.beginPath(); ctx.ellipse(0,10,14,14,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2244aa'; ctx.fillRect(-10,2,20,14);
    ctx.fillStyle='#e8c8a0'; ctx.beginPath(); ctx.arc(0,-8,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(-5,-16,4,0,Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(5,-16,4,0,Math.PI); ctx.fill();
    if(grump>0.5){
      ctx.strokeStyle='#553322'; ctx.lineWidth=2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-7,-10); ctx.lineTo(-2,-8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7,-10); ctx.lineTo(2,-8); ctx.stroke();
    }
    ctx.fillStyle='#553322'; ctx.beginPath(); ctx.arc(-3,-7,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3,-7,2.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#553322'; ctx.lineWidth=1.5;
    if(grump>0.5){ ctx.beginPath(); ctx.arc(0,-3,4,0.2,Math.PI-0.2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0,-5,4,Math.PI+0.2,-0.2); ctx.stroke(); }
    ctx.fillStyle='#886644'; ctx.fillRect(-10,-17,20,4); ctx.fillRect(-7,-28,14,12);
    // newspaper
    ctx.fillStyle='#f5f0e0'; ctx.fillRect(12,0,20,16);
    ctx.fillStyle='#bbb'; [3,6,9,12].forEach(yy=>ctx.fillRect(14,yy,16,1));
    ctx.restore();
  }

  return [
    // Scene 0: "A quiet evening on the ranch"
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      [220,260,310,360].forEach((cx,i)=>chick(ctx,cx,GH*0.6+Math.sin(fr*0.05+i)*4,1.0));
      lou(ctx,140,GH*0.56,1.8,1.0);
      // thought bubble
      const a=t<0.2?t/0.2:1;
      ctx.globalAlpha=a;
      ctx.fillStyle='rgba(240,235,220,0.95)'; ctx.beginPath(); ctx.roundRect(170,100,230,60,10); ctx.fill();
      ctx.fillStyle='#333'; ctx.font='bold 16px Fredoka One'; ctx.textAlign='center';
      ctx.fillText('Perfect. No more dogs.',285,138);
      [182,194,208].forEach((bx,i)=>{ ctx.fillStyle='rgba(240,235,220,0.95)'; ctx.beginPath(); ctx.arc(bx,162-i*4,4-i,0,Math.PI*2); ctx.fill(); });
      ctx.globalAlpha=1; ctx.textAlign='left';
      tLetterbox(ctx);
      tCard(ctx,'"A quiet evening on the ranch"',t<0.25?t/0.25:t>0.85?(1-t)/0.15:0);
    }},
    // Scene 1: Barb's pink car arrives
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      lou(ctx,140,GH*0.56,1.8,1.0);
      const carX=GW+80-Math.min(fr*3.5,GW-80);
      ctx.fillStyle='#dd4488'; ctx.beginPath(); ctx.roundRect(carX-50,GH*0.6,90,32,6); ctx.fill();
      ctx.fillStyle='#ee88bb'; ctx.beginPath(); ctx.roundRect(carX-40,GH*0.585,72,22,5); ctx.fill();
      ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(carX-30,GH*0.643,10,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(carX+20,GH*0.643,10,0,Math.PI*2); ctx.fill();
      if(fr>40) chick(ctx,carX+10,GH*0.555+Math.sin(fr*0.1)*4,1.2);
      [220,260,310,360].forEach((cx,i)=>chick(ctx,cx,GH*0.6+Math.sin(fr*0.05+i)*4,1.0));
      tLetterbox(ctx);
      if(fr>50){ ctx.fillStyle='#ff88cc'; ctx.font='bold 36px Fredoka One'; ctx.textAlign='center'; ctx.shadowColor='#ff44aa'; ctx.shadowBlur=16; ctx.fillText('BARB!',GW/2,90); ctx.shadowBlur=0; ctx.textAlign='left'; }
    }},
    // Scene 2: Argument — Lou vs Barb
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      lou(ctx,160,GH*0.52,2.2,1.0);
      chick(ctx,420,GH*0.52+Math.sin(fr*0.08)*5,2.0);
      dog(ctx,380,GH*0.55,1.3,0.8,fr);
      // Lou bubble
      const la=t<0.1?t/0.1:1;
      ctx.globalAlpha=la; ctx.fillStyle='rgba(255,255,255,0.96)'; ctx.beginPath(); ctx.roundRect(60,60,240,68,10); ctx.fill();
      ctx.fillStyle='#cc2200'; ctx.font='bold 18px Fredoka One'; ctx.textAlign='center'; ctx.fillText('BARBARA.',180,88);
      ctx.fillStyle='#333'; ctx.font='bold 14px Fredoka One'; ctx.fillText('We talked about this.',180,112); ctx.textAlign='left';
      // Barb bubble
      const ba=t<0.2?t/0.2:1;
      ctx.globalAlpha=ba; ctx.fillStyle='rgba(255,220,240,0.96)'; ctx.beginPath(); ctx.roundRect(340,55,260,80,10); ctx.fill();
      ctx.fillStyle='#993366'; ctx.font='bold 14px Fredoka One'; ctx.textAlign='center';
      ctx.fillText('He just needs a home!',470,82); ctx.fillText('Look at those EARS! 🐾',470,104); ctx.textAlign='left';
      ctx.globalAlpha=1;
      tLetterbox(ctx);
    }},
    // Scene 3: "Just this once." — 47 times
    { dur:300, draw(ctx,fr,t){
      ctx.fillStyle='#0d0208'; ctx.fillRect(0,0,GW,GH);
      const pulse=0.85+Math.sin(fr*0.07)*0.15;
      ctx.save(); ctx.translate(GW/2,GH/2-30); ctx.scale(pulse,pulse);
      ctx.fillStyle='#fff'; ctx.font='bold 52px Fredoka One'; ctx.textAlign='center';
      ctx.shadowColor='#ff88cc'; ctx.shadowBlur=24;
      ctx.fillText('"Just this once."',0,0); ctx.shadowBlur=0;
      ctx.restore();
      ctx.fillStyle='#ffcc02'; ctx.font='bold 24px Fredoka One'; ctx.textAlign='center';
      ctx.fillText('— Aunt Barb, 47 times',GW/2,GH/2+40);
      ctx.globalAlpha=0.5; ctx.fillStyle='#ff88cc'; ctx.font='bold 14px Fredoka One';
      ctx.fillText('(she means 47. it is 47.)',GW/2,GH/2+75);
      ctx.globalAlpha=1; ctx.textAlign='left';
      tLetterbox(ctx);
    }},
    // Scene 4: montage — dogs everywhere
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      lou(ctx,GW/2,GH*0.5,1.4,1.0);
      const positions=[[80,GH*0.58],[160,GH*0.55],[260,GH*0.62],[380,GH*0.57],[460,GH*0.6],[540,GH*0.54],[GW/2-60,GH*0.65],[GW/2+60,GH*0.63]];
      positions.forEach(([dx,dy],i)=>dog(ctx,dx,dy,0.8+Math.sin(i)*0.15,0.5,fr+i*10));
      // Lou speech
      ctx.globalAlpha=t<0.2?t/0.2:1;
      ctx.fillStyle='rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(GW/2-145,50,290,65,10); ctx.fill();
      ctx.fillStyle='#993300'; ctx.font='bold 16px Fredoka One'; ctx.textAlign='center';
      ctx.fillText('I said ONE dog. ONE.',GW/2,76); ctx.fillText('Dog. Barbara.',GW/2,100); ctx.textAlign='left';
      ctx.globalAlpha=1;
      tLetterbox(ctx);
    }},
    // Scene 5: Archie spotlight
    { dur:300, draw(ctx,fr,t){
      bg(ctx,fr);
      const grd=ctx.createRadialGradient(GW/2,GH*0.55,20,GW/2,GH*0.55,200);
      grd.addColorStop(0,'rgba(255,220,180,0.35)'); grd.addColorStop(1,'transparent');
      ctx.fillStyle=grd; ctx.fillRect(0,0,GW,GH);
      const bob=Math.sin(fr*0.07)*8;
      dog(ctx,GW/2-28,GH*0.42+bob,2.8,1.0,fr);
      ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.roundRect(GW/2-130,55,260,65,10); ctx.fill();
      ctx.fillStyle='#ffcc02'; ctx.font='bold 26px Fredoka One'; ctx.textAlign='center';
      ctx.shadowColor='#ffcc02'; ctx.shadowBlur=14; ctx.fillText('ARCHIE',GW/2,82); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,200,220,0.8)'; ctx.font='bold 14px Fredoka One';
      ctx.fillText('Kennel 7 · The Chosen One',GW/2,108); ctx.textAlign='left';
      ['❤️','🐾','❤️'].forEach((em,i)=>{ const hx=GW/2+(i-1)*60; const hy=GH*0.8+Math.sin(fr*0.08+i)*8; ctx.font='24px serif'; ctx.textAlign='center'; ctx.fillText(em,hx,hy); });
      ctx.textAlign='left';
      tLetterbox(ctx);
    }},
    // Scene 6: end card
    { dur:300, draw(ctx,fr,t){
      tEndCard(ctx,'V.5',"AUNT BARB'S RESCUE RANCH",'"He was the last one." — Aunt Barb',t);
      // Lou and dog tiny at bottom
      const a=t>0.3?Math.min(1,(t-0.3)/0.2):0;
      ctx.globalAlpha=a;
      lou(ctx,180,340,0.9,0.0);
      dog(ctx,210,330,0.8,1.0,fr);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='bold 11px Fredoka One'; ctx.textAlign='center';
      ctx.fillText('Lou is fine. He loves the dog. He will never admit it.',GW/2,390);
      ctx.globalAlpha=1; ctx.textAlign='left';
    }},
  ];
})();

let trailerActive=false, trailerID=null, trailerFr=0;
let trailerScene=0, trailerSceneFr=0;
let trailerPaused=false;
let trailerRAF=null;

function _buildDots(id){
  const dots=document.getElementById('tDots');
  const script=TRAILER_SCRIPTS[id];
  if(!dots||!script) return;
  dots.innerHTML='';
  script.forEach((_,i)=>{
    const d=document.createElement('div');
    d.style.cssText=`width:10px;height:10px;border-radius:50%;background:#444;
      border:2px solid #666;transition:background 0.2s;`;
    d.id='tdot'+i;
    dots.appendChild(d);
  });
}

function _updateDots(){
  const script=TRAILER_SCRIPTS[trailerID];
  if(!script) return;
  script.forEach((_,i)=>{
    const d=document.getElementById('tdot'+i);
    if(!d) return;
    if(i===trailerScene){
      d.style.background='#ffcc02'; d.style.borderColor='#ffcc02';
    } else if(i<trailerScene){
      d.style.background='#665500'; d.style.borderColor='#886600';
    } else {
      d.style.background='#222'; d.style.borderColor='#444';
    }
  });
}

function closeTrailer(){
  trailerActive=false; trailerPaused=false;
  if(trailerRAF){ cancelAnimationFrame(trailerRAF); trailerRAF=null; }
  document.getElementById('trailerModal').style.display='none';
}

function playTrailer(id){
  if(!TRAILER_SCRIPTS[id]){ console.warn('No trailer script for id:', id); return; }
  // Full reset first — cancel any running loop
  if(trailerRAF){ cancelAnimationFrame(trailerRAF); trailerRAF=null; }
  trailerActive=false; trailerPaused=false;

  // Now set fresh state
  trailerID=id; trailerFr=0; trailerScene=0; trailerSceneFr=0;
  trailerActive=true;

  const btn=document.getElementById('tPause');
  if(btn){ btn.textContent='⏸ PAUSE'; btn.style.color='#ff9f1c'; btn.style.borderColor='#ff9f1c'; }
  document.getElementById('tBar').style.width='0%';

  _buildDots(id);
  _updateDots();

  document.getElementById('trailerModal').style.display='flex';

  trailerRAF=requestAnimationFrame(trailerLoop);
}

function trailerNext(){
  if(!trailerActive) return;
  const script=TRAILER_SCRIPTS[trailerID];
  if(!script) return;
  trailerScene++;
  trailerSceneFr=0;
  if(trailerScene>=script.length){
    closeTrailer();
    return;
  }
  _updateDots();
  // If paused, draw the new scene's first frame immediately
  if(trailerPaused){
    const canvas=document.getElementById('tCanvas');
    const ctx=canvas.getContext('2d');
    script[trailerScene].draw(ctx,trailerFr,0);
  }
}

function trailerPrev(){
  if(!trailerActive) return;
  if(trailerScene>0){ trailerScene--; trailerSceneFr=0; _updateDots(); }
  if(trailerPaused){
    const canvas=document.getElementById('tCanvas');
    const ctx=canvas.getContext('2d');
    const script=TRAILER_SCRIPTS[trailerID];
    if(script) script[trailerScene].draw(ctx,trailerFr,0);
  }
}

function trailerTogglePause(){
  trailerPaused=!trailerPaused;
  const btn=document.getElementById('tPause');
  btn.textContent=trailerPaused?'▶ PLAY':'⏸ PAUSE';
  btn.style.color=trailerPaused?'#ffcc02':'#ff9f1c';
  btn.style.borderColor=trailerPaused?'#ffcc02':'#ff9f1c';
  if(!trailerPaused && trailerActive){
    if(trailerRAF) cancelAnimationFrame(trailerRAF);
    trailerRAF=requestAnimationFrame(trailerLoop);
  }
}

function trailerLoop(){
  // Guard — if anything killed us, stop
  if(!trailerActive || trailerPaused){ trailerRAF=null; return; }

  const canvas=document.getElementById('tCanvas');
  const ctx=canvas.getContext('2d');
  const script=TRAILER_SCRIPTS[trailerID];
  if(!script){ closeTrailer(); return; }

  const scene=script[trailerScene];
  if(!scene){ closeTrailer(); return; }

  const t=Math.min(1, trailerSceneFr/scene.dur);
  scene.draw(ctx, trailerFr, t);

  // Progress bar
  const total=script.length*SCENE_DUR;
  const elapsed=trailerScene*SCENE_DUR+trailerSceneFr;
  const bar=document.getElementById('tBar');
  if(bar) bar.style.width=(elapsed/total*100)+'%';

  _updateDots();

  // "TAP TO CONTINUE" hint near end of scene
  if(t>0.75){
    const pulse=0.5+Math.sin(trailerFr*0.15)*0.5;
    ctx.globalAlpha=pulse*(t>0.9?1:(t-0.75)/0.15);
    ctx.fillStyle='#ffcc02';ctx.font='bold 13px Fredoka One';ctx.textAlign='center';
    ctx.fillText('▶ TAP TO CONTINUE',320,390);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }

  trailerFr++;
  trailerSceneFr++;

  // Advance scene
  if(trailerSceneFr>=scene.dur){
    trailerScene++;
    trailerSceneFr=0;
    if(trailerScene>=script.length){
      closeTrailer();
      return;
    }
    _updateDots();
  }

  trailerRAF=requestAnimationFrame(trailerLoop);
}

function launchTrailer(){ playTrailer("barb"); }
