/* Graydorn & Batdorn trailers for the home page trailer player.
   Each trailer is a list of scenes: { dur (frames at 60fps), draw(ctx, globalFrame, t 0..1) }.
   Drawn with the shared notebook-comic sprite library (js/graydorn-sprites.js).
   Public pages use hero names only, never real names. */
(function(){
if(typeof TRAILER_SCRIPTS==='undefined'||!window.GBS)return;
const B=window.GBS,W=640,H=400,GY=356,INK='#1d1a1f',YEL='#ffe14d',PINK='#ea4f8c';
try{document.fonts.load('20px "Permanent Marker"');document.fonts.load('20px "Patrick Hand"')}catch(e){}
const MARK='"Permanent Marker", "Comic Sans MS", cursive',HAND='"Patrick Hand", "Comic Sans MS", cursive';
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=p=>{p=cl(p);return 1-Math.pow(1-p,3)};
const pop=(s,at,d=.3)=>{const p=cl((s-at)/d)-1;return s<=at?0:1+2.2*p*p*p+1.2*p*p};
let C;

/* scene wrapper: fn(s = seconds into the scene, gt = global seconds, t = 0..1) */
function S(dur,fn){return{dur,draw(c,fr,t){c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;C=c;B.setG(c);B.setClock(fr/60);fn(t*dur/60,fr/60,t);c.restore()}}}
function flip(x,fn){C.save();C.translate(x,0);C.scale(-1,1);fn();C.restore()}
function scaled(x,y,k,fn){C.save();C.translate(x,y);C.scale(k,k);fn();C.restore()}
function big(text,x,y,size,fill='#fff',max=600,stroke=INK){
  if(size<2)return;C.font=size+'px '+MARK;const w=C.measureText(text).width;if(w>max)size=size*max/w;
  B.txt(text,x,y,size,fill,stroke);
}
function wrap(text,font,max){C.font=font;const out=[];let line='';
  text.split(' ').forEach(w=>{const t=line?line+' '+w:w;if(C.measureText(t).width>max&&line){out.push(line);line=w}else line=t});
  if(line)out.push(line);return out}
/* yellow narrator box, comic style */
function cap(text,y=12){
  const size=20,lines=wrap(text,size+'px '+HAND,W-70);C.font=size+'px '+HAND;
  const w=Math.max(...lines.map(l=>C.measureText(l).width))+26,h=lines.length*24+12,x=12;
  B.seed(900+text.length);B.poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],YEL,1.2,3);
  lines.forEach((l,i)=>B.txt(l,x+13,y+19+i*24,size,INK,null,'left','Patrick Hand'));
}
function say(x,y,lines,tx,ty,size=20){
  C.font=size+'px '+HAND;const tw=Math.max(...lines.map(l=>C.measureText(l).width));
  const w=tw*.72+20,h=lines.length*size*.62+14;x=cl(x,w+6,W-w-6);
  B.bubble(x,y,w,h,tx,ty,lines,size);
}
function bar(text){ /* place-name strip, bottom left */
  C.font='22px '+MARK;const w=C.measureText(text).width+36;B.seed(950+text.length);
  B.poly([[14,H-64],[14+w,H-66],[16+w,H-24],[12,H-22]],INK,1.2,0);B.txt(text,14+w/2,H-43,22,YEL,null);
}
function paper(){
  C.fillStyle='#fbf8ef';C.fillRect(0,0,W,H);
  C.strokeStyle='#bcd4ea';C.lineWidth=1.5;for(let y=38;y<H;y+=32){C.beginPath();C.moveTo(0,y);C.lineTo(W,y);C.stroke()}
  C.strokeStyle='#e8868c';C.beginPath();C.moveTo(48,0);C.lineTo(48,H);C.stroke();
}
function titleCard(lines,s){ /* lines: [text, appears at (s), fill, size] */
  paper();const gap=Math.min(74,300/lines.length),y0=H/2-(lines.length-1)*gap/2-8;
  lines.forEach(([text,at,fill,size],i)=>{const k=pop(s,at);if(k<=0)return;
    C.save();C.translate(W/2,y0+i*gap);C.rotate(i%2?.025:-.03);C.scale(k,k);big(text,0,0,size||44,fill||YEL,540);C.restore()});
}
function endCard(o){return S(o.dur||390,(s,gt)=>{
  paper();
  B.txt('GRAYDORN & BATDORN',W/2,46,24,INK,null);
  B.txt('A KIDS STUDIO ORIGINAL',W/2,72,13,'#7a7386',null,'center','Patrick Hand');
  C.save();C.translate(W/2,H/2-6);C.rotate(-.03);
  B.seed(980);B.poly([[-118,-92],[118,-92],[118,-52],[-118,-52]],INK,1.5,0);
  B.txt(o.k,0,-72,26,YEL,null);
  const k=pop(s,.25);if(k>0){C.save();C.scale(k,k);big(o.title,0,-4,58,o.fill||YEL,560);C.restore()}
  C.restore();
  if(s>.9){const ls=wrap(o.sub,'21px '+HAND,470);ls.forEach((l,i)=>B.txt(l,W/2,252+i*25,21,INK,null,'center','Patrick Hand'))}
  if(s>1.5)B.stamp(W/2,328,o.stamp||'OUT NOW',-.06,o.soon?PINK:'#2f9a4a',.8*pop(s,1.5));
  if(o.art)o.art(s,gt);
})}

/* ---------- backgrounds ---------- */
const street=scroll=>B.scenery(W,H,GY,scroll||0,1);
const haunt=scroll=>B.hscenery(W,H,GY,scroll||0,1);
function yard(dusk){
  C.fillStyle=dusk?'#f0b78c':'#bfe3f7';C.fillRect(0,0,W,H);B.seed(31);
  for(let x=-10;x<W;x+=44)B.poly([[x,GY-40],[x+36,GY-40],[x+36,GY-120],[x+18,GY-134],[x,GY-120]],dusk?'#d9c2a4':'#f4ecdc',1,2.5);
  B.poly([[-10,GY-44],[W+10,GY-48],[W+10,H+10],[-10,H+10]],dusk?'#6fae58':'#8fce6a',2,3);
}
function oak(x,dusk){
  B.seed(21);const br=dusk?'#5a4038':'#7a5a40';
  B.blob(x+130,70,170,58,dusk?'#4f7a44':'#5fa653',6,16,3);
  B.limb(x,GY-196,x+250,GY-214,18,br);
  B.poly([[x-40,GY-20],[x+40,GY-20],[x+28,-10],[x-28,-10]],br,2,3.5);
  B.blob(x,GY-110,14,20,INK,1,10,2.5);
}
function room(wall,floor){
  C.fillStyle=wall;C.fillRect(0,0,W,H);B.seed(51);
  B.poly([[-10,GY-40],[W+10,GY-44],[W+10,H+10],[-10,H+10]],floor,2,3);
}
function cave(){
  C.fillStyle='#2e2b40';C.fillRect(0,0,W,H);B.seed(41);
  B.blob(320,250,330,220,'#3d3957',6,18,0);
  for(let x=6;x<W;x+=62)B.poly([[x,-6],[x+36,-6],[x+18,22+((x*7)%40)]],'#bfe3ff',1,2.5);
  B.poly([[-10,GY-30],[W+10,GY-34],[W+10,H+10],[-10,H+10]],'#b98a5e',2,3);
  for(let x=20;x<W;x+=52){B.line(x,72+Math.sin(x)*6,x+52,72+Math.sin(x+52)*6,2);B.blob(x+26,84+Math.sin(x+26)*6,6,8,B.RAINBOW[((x/52)|0)%6],.5,8,2)}
}
function swirlBg(gt){
  C.fillStyle='#2a1746';C.fillRect(0,0,W,H);
  for(let k=0;k<4;k++)B.spiral(W/2,H/2,440,gt*1.4+k*Math.PI/2,['#8a3fd1','#2f9a4a','#e0508a','#5bb8f2'][k],20,3);
}
function badlands(){
  C.fillStyle='#f6d9a8';C.fillRect(0,0,W,H);B.seed(61);
  B.poly([[40,GY-40],[190,GY-40],[150,GY-150],[90,GY-160]],'#d9a468',2,3);B.poly([[420,GY-40],[620,GY-40],[590,GY-120],[470,GY-135]],'#d9a468',2,3);
  B.poly([[-10,GY-40],[W+10,GY-44],[W+10,H+10],[-10,H+10]],'#c9955c',2,3);
  B.blob(300,GY+4,46,10,INK,1,10,2.5);B.blob(540,GY-10,34,8,INK,1,10,2.5);
}
const snow=(drift=30)=>B.snow(W,H,1/60,drift);
function witchHat(x,y,s){B.seed(71);const hx=x+20*s,hy=y-43*s;
  B.poly([[hx-11*s,hy],[hx+11*s,hy],[hx+5*s,hy-30*s]],'#2a2140',.8,2.5);B.blob(hx,hy,19*s,4.5*s,'#2a2140',.6,10,2.5);B.line(hx-9*s,hy-5*s,hx+9*s,hy-5*s,3,'#f28a2e')}
const GEM=[['#3d7fe0','FREEZE!'],['#e0384f','TOASTY!'],['#f2b632','SPLOOSH!']];

/* ══════════ ISSUE #1 — THE BARK LADY STRIKES! ══════════ */
TRAILER_SCRIPTS.gb1=[
  S(300,(s,gt)=>{street();B.graydorn(220,GY,.9,{t:gt});B.dino(290,GY-2,1.9);
    if(s>1.4)B.heart(268,GY-160-Math.sin(gt*3)*4,13*pop(s,1.4));
    snow();cap("One snowy day on Graydorn's street...");
    if(s>2.3)say(450,150,['Me and Dino.','Best day EVER.'],262,GY-112)}),
  S(330,(s,gt)=>{street();const got=s>2.3,bx=760-ease(s/1.5)*420,brk=s>.6&&Math.floor(gt*4)%2===0;
    B.graydorn(130,GY,.9,{t:gt,mood:'shock'});if(!got)B.dino(250,GY-2,1.9);
    B.barkLady(bx,GY,.95,{t:gt,run:s<1.5,bark:brk,dino:got});
    if(brk)B.burst(cl(bx-120,90,560),GY-200,34,'BARK!',YEL,20,3);
    snow();cap('...out of nowhere came THE BARK LADY!');
    if(s>2.9)big('SHE TOOK DINO!',320,112,52*pop(s,2.9),'#ff6b6b')}),
  S(330,(s,gt)=>{street(gt*240);
    flip(510,()=>B.barkLady(0,GY,.9,{t:gt,run:true,dino:true}));
    B.graydorn(160,GY,.9,{t:gt,run:true,mood:'determined'});
    for(let k=0;k<3;k++){const p=(s*.9+k/3)%1;B.snowball(205+p*240,GY-110-Math.sin(p*Math.PI)*46,10)}
    snow(160);
    if(s>.5&&s<3.3)say(260,96,['Get Dino back!'],190,GY-128,24);
    if(s>3.5)big('THE CHASE IS ON!',320,96,44*pop(s,3.5),YEL)}),
  S(360,(s,gt)=>{street(gt*240);
    flip(540,()=>B.barkLady(0,GY,.85,{t:gt,run:true,dino:true,bark:true}));
    const k=cl(s/3.4),bx=-90+k*520,by=262+Math.sin(k*Math.PI*2)*22;
    [[300,160],[390,215],[455,140]].forEach(([x,y],i)=>{if(bx+70<x)B.burst(x,y,26,'BARK!',YEL,15,i);else if(bx<x+70)B.burst(x,y,36,'POW!','#ff6b6b',22,i+5)});
    B.batdorn(bx,by,.8,{fly:true,t:gt});snow(160);
    cap("So Graydorn called his dad. Well... his dad's secret self.");
    if(s>3.7)big('BATDORN!',320,318,60*pop(s,3.7),'#5bb8f2')}),
  S(390,(s,gt)=>{street();cap('Then big sister revealed HER secret...');
    if(s<1.7){B.charlie(170,GY,.9,{t:gt,scope:true});if(s>.5)big('CHARLIESCOPE!',400,170,40*pop(s,.5),'#ffd23d',400)}
    else{const L=[['kitty','CINNAMON','POUNCE!','#ffb84d'],['pink','STRAWBERRY','PURR BLAST!','#ff9ecb'],['wolf','SUMMER','AWOOOOO!','#d9d9e8']],q=s-1.7,i=Math.min(2,Math.floor(q/1.55)),p=cl((q-i*1.55)/1.55);
      if(p<.14)B.burst(210+p*200,GY-60,60,'',  '#fff',10,9);
      B.stuffy(L[i][0],200+p*190,GY-(i===0?Math.abs(Math.sin(p*9))*22:0),gt);
      B.burst(500,170,62,L[i][2],L[i][3],L[i][2].length>8?16:21,i);
      big(L[i][1],250,112,34,'#fff',320);
      B.txt('She turns into her stuffies!',320,H-54,20,INK,null,'center','Patrick Hand')}
    snow()}),
  endCard({k:'ISSUE #1',title:'THE BARK LADY STRIKES!',sub:'A comic + a chase game. She took Dino. Go get him back.',stamp:'OUT NOW'})
];

/* ══════════ ISSUE #2 — HALLOWEEN MAYHEM! ══════════ */
TRAILER_SCRIPTS.gb2=[
  S(300,(s,gt)=>{haunt(gt*14);B.ghost(110,170+Math.sin(gt*2)*10,1,gt);B.ghost(400,150+Math.cos(gt*2)*12,2,gt);
    B.graydorn(210,GY,.9,{t:gt});B.dino(285,GY-2,1.9);witchHat(285,GY-2,1.9);
    B.falling(W,H,1/60,30);cap('Halloween night at the spooky house on the hill...')}),
  S(330,(s,gt)=>{haunt();const up=ease((s-.8)/.5);
    B.charlie(130,GY,.85,{t:gt});
    B.blob(430,GY+4,70,11,INK,1,12,2.5);
    if(s>.8){C.save();C.beginPath();C.rect(0,0,W,GY+6);C.clip();B.molerat(430,GY+150-up*150,1.6,{t:gt});C.restore()}
    if(s>.8&&s<1.6)B.burst(430,GY-160,40,'POP!','#ffb84d',22,4);
    B.falling(W,H,1/60,30);cap('...up through the floorboards popped CAPTAIN MOLERAT!');
    if(s>1.9&&s<3.6)say(250,150,['SAPPHIRE!!'],150,GY-150,26);
    if(s>3.7)big('HE STOLE SAPPHIRE!',320,150,44*pop(s,3.7),'#ff6b6b')}),
  S(390,(s,gt)=>{haunt();const gi=Math.floor(s/1.3)%3,q=(s%1.3)/1.3;
    scaled(92,GY-170+Math.sin(gt*3)*6,1.2,()=>B.starterJar(0,0));
    B.jewels(190,GY,.9,{t:gt,gem:gi,dash:true});
    B.ghost(470+q*30,190,3,gt);
    if(q>.25)B.burst(450,180,64,GEM[gi][1],GEM[gi][0],22,gi+7);
    B.falling(W,H,1/60,30);cap('So two NEW heroes stepped up.');
    big('JEWELS!',480,300,40,'#a9d0ff',260)}),
  S(420,(s,gt)=>{haunt();
    if(s<2.6){const sh=s>.5?Math.sin(gt*40)*3:0;B.dino(150+sh,GY,4.2);
      if(s>.5){B.burst(450,170,84,'MASSIVE ROAR!','#ffb84d',20,2);B.ghost(520+s*60,250-s*30,4,gt);B.ghost(560+s*70,120-s*20,5,gt)}}
    else{const d=ease((s-2.6)/.45),land=s>3.05;
      B.molerat(400,GY,1.5,{t:gt,pup:false,squish:land});
      B.dino(372,-80+d*(GY-48+80),3);
      if(land&&s<3.6)B.burst(400,GY-20,56,'',  '#fff',10,6);
      if(land)B.burst(190,170,84,'DINO BUTT SIT!','#6fd38b',19,3);
      if(s>4.2)scaled(540,GY,pop(s,4.2),()=>B.poop(0,0,1.2))}
    B.falling(W,H,1/60,30);cap('...and DINO.')}),
  S(360,(s,gt)=>{haunt();const f=ease((s-1.5)/.7),done=s>2.2;
    B.jewels(140,GY,.9,{t:gt,gem:0});
    B.molerat(440,GY,1.4,{t:gt,pup:false});B.ghost(540,GY-70,6,done?0:gt);
    if(s>1.5)B.blanket(210+f*270,GY-130+f*95,120,34,done?0:Math.sin(gt*8)*.2,1);
    if(done){B.sleepyZ(430,GY-90);B.sleepyZ(545,GY-120)}
    B.falling(W,H,1/60,30);cap('Her super move: one very cozy blanket.');
    if(s>.4&&s<2.4)say(280,140,["I'm tired..."],160,GY-165,26)}),
  endCard({k:'ISSUE #2',title:'HALLOWEEN MAYHEM!',sub:'A comic + a game. One haunted house. One sneaky molerat.',stamp:'OUT NOW'})
];

/* ══════════ ISSUE #3 — THE SKY TORE OPEN ══════════ */
const FALL=[['scratchy',120,0,1],['pearl',235,.5,1],['auntBarb',405,1,.9],['kevin',320,1.5,1.1],['elJaguar',530,2,.85]];
TRAILER_SCRIPTS.gb3=[
  S(360,(s,gt)=>{room('#f6e3c5','#d9b98c');B.charlie(170,GY,.9,{t:gt});
    B.seed(81);B.poly([[340,GY-20],[520,GY-20],[512,GY-76],[348,GY-76]],'#f7b5cf',1.2,3);B.poly([[340,GY-76],[520,GY-76],[516,GY-92],[344,GY-92]],'#fffaf0',1.2,3);
    for(let k=0;k<11;k++){const x=356+k*15;B.line(x,GY-92,x,GY-116,4,B.RAINBOW[k%6]);
      if(s<1.7)B.blob(x,GY-123+Math.sin(gt*12+k)*1.5,3.5,6,'#ffb84d',.4,8,1.5);else if(s<2.5){C.globalAlpha=1-(s-1.7)/.8;B.blob(x+(s-1.7)*8,GY-126-(s-1.7)*30,5,4,'#cfcfd6',.6,8,0);C.globalAlpha=1}}
    cap('She blew out all eleven candles. And made a wish.');
    if(s>2.5)say(410,150,['I wish the whole farm','could come here.','ESPECIALLY Scratchy.'],215,GY-150,19)}),
  S(300,(s,gt)=>{street();const k=ease(s/1.6);
    if(k>.02)B.skyTear(320,120,120*k,44*k,gt);
    B.graydorn(110,GY,.9,{t:gt,mood:'shock'});B.charlie(540,GY,.85,{t:gt});
    snow();cap('The sky took the request seriously.');
    if(s>.4&&s<2.4)big('RRRRIP!',320,232,54*pop(s,.4),'#c9a6ff');
    if(s>2.7)B.txt('(politely)',320,190,26,'#fff',INK,'center','Patrick Hand')}),
  S(390,(s,gt)=>{street();B.skyTear(320,104,120,40,gt);
    FALL.forEach(([k,x,d,sc],i)=>{if(s<d)return;const p=cl((s-d)/1.1),y=-60+(GY+60)*Math.min(1,p*p*1.05);
      C.save();if(p<1){C.translate(x,y);C.rotate(Math.sin(gt*6+i)*.5);C.translate(-x,-y)}
      B[k](x,Math.min(y,GY),sc,{t:gt,excited:true,juice:true,dance:s>4.2});C.restore()});
    snow(40);cap('And out fell... THE CRANKY CHICKENS.');
    if(s>3.6)say(200,196,['Why is it COLD.'],128,GY-78,24)}),
  S(420,(s,gt)=>{street();
    B.auntBarb(110,GY,1.25,{t:gt,juice:true,talk:s<3});
    B.kevin(330,GY,1.6,{t:gt,asleep:true});B.sleepyZ(372,GY-56);
    if(s>1.4){B.seed(83);B.line(330,GY-64,330,GY-108,4);B.poly([[248,GY-150],[412,GY-150],[412,GY-106],[248,GY-106]],'#fffaf0',1,3);B.txt('DO NOT MOVE KEVIN',330,GY-128,14,'#d33',null)}
    B.elJaguar(545,GY,1.25,{t:gt,dance:true,talk:s>3.2});
    snow();
    if(s>.4&&s<3.1)say(240,110,['Juice box, dear?','I packed forty-seven.'],128,GY-108,20);
    if(s>3.3)say(430,96,['Five, six, seven, EIGHT!'],540,GY-108,20)}),
  S(420,(s,gt)=>{street();const brk=s<2.1&&Math.floor(gt*4)%2===0;
    B.scratchy(180,GY,1.9,{t:gt,talk:s>2.2&&s<3.8});
    B.barkLady(480,GY,.95,{t:gt,bark:brk,dino:false});
    if(brk)B.burst(340,150,50,'BARK!',YEL,28,3);
    snow();
    if(s>2.2&&s<4)say(300,130,['...No.'],200,GY-120,34);
    if(s>4.2){big('SOMEBODY CRANKIER',320,84,38*pop(s,4.2),'#ff9f1c');big('JUST MOVED IN.',320,128,38*pop(s,4.5),'#ff9f1c')}}),
  endCard({k:'ISSUE #3',title:'THE SKY TORE OPEN',fill:'#ff9f1c',sub:'The Cranky Chickens crossover. Read it, then play Crankytown.',stamp:'OUT NOW'})
];

/* ══════════ ISSUE #4 — BEFORE THE BARK ══════════ */
TRAILER_SCRIPTS.gb4=[
  S(390,(s,gt)=>{yard();const th=cl((s-.4)/.9);
    B.graydorn(140,GY,.9,{t:gt});
    B.doodle(450,GY,1,{t:gt,ball:th>=1});
    if(s>.4&&th<1)B.ball(190+th*215,GY-120-Math.sin(th*Math.PI)*70,9);
    cap('Before the bark... there was a very good girl.');
    if(s>1.6&&s<3.9)say(250,150,["Who's the goodest girl?"],170,GY-128,21);
    if(s>4.1)say(330,150,['It is me.'],410,GY-112,26)}),
  S(420,(s,gt)=>{yard(true);oak(70,true);
    B.squirrel(150,GY-208,.85,{k:0});B.squirrel(235,GY-211,.85,{k:1});B.squirrel(305,GY-213,.6,{k:2});
    B.loaf(520,GY-14,2);B.loaf(565,GY-10,3);
    cap('Then came... THE HYPNO SQUIRRELS.');
    if(s>.7&&s<2.3)say(470,215,['We want the yard.'],190,GY-250,22);
    else if(s>=2.3&&s<4)say(470,215,['And the bread.'],272,GY-250,22);
    else if(s>=4.2)say(470,215,['Nuts.'],325,GY-244,28)}),
  S(360,(s,gt)=>{swirlBg(gt);
    B.squirrel(100,GY,1,{k:0});B.squirrel(545,GY,1,{k:1,dir:-1});
    B.doodle(330,GY,1.35,{t:gt,mood:'hypno'});
    big('LOOK INTO OUR EYES...',320,52,36,'#fff');
    if(s>2.6)big('TAKE WHAT THEY LOVE MOST.',320,H-52,28*pop(s,2.6),YEL)}),
  S(390,(s,gt)=>{street();const brk=Math.floor(gt*4)%2===0;
    B.squirrel(80,GY,.9,{k:1,dizzy:true});
    B.barkLady(350,GY,1.25,{t:gt,bark:brk,dino:false});
    if(brk){B.burst(180,200,40,'BARK!',YEL,22,1);B.burst(540,170,46,'BARK!',YEL,26,2)}else B.burst(520,270,36,'BARK!',YEL,20,3);
    snow();cap('And the goodest girl became... THE BARK LADY.');
    if(s>2.3)say(170,110,['It worked TOO well!'],100,GY-90,20);
    if(s<.6){C.globalAlpha=1-s/.6;C.fillStyle='#fff';C.fillRect(0,0,W,H);C.globalAlpha=1}}),
  S(420,(s,gt)=>{street();B.charlie(190,GY,.9,{t:gt,scope:true});
    if(s>.7){B.beam(240,GY-136,500,GY-170,5);B.spiral(530,GY-172,34,-gt*6,'#8a3fd1',5,2.5)}
    snow();
    if(s>1.1&&s<3.7)say(380,96,["She's not mean.","She's HYPNOTIZED!"],215,GY-160,22);
    if(s>3.9){big("WE DON'T FIGHT HER.",320,70,36*pop(s,3.9),'#fff');big('WE RESCUE HER.',320,116,46*pop(s,4.4),YEL)}}),
  S(450,(s,gt)=>{room('#e6ecf2','#b9c2cf');
    B.jewels(110,GY,.9,{t:gt,gem:0,point:true});B.batdorn(540,GY,.72,{t:gt});
    B.seed(85);B.poly([[215,130],[445,126],[448,262],[212,266]],'#fffaf0',1.2,3);
    B.txt('FORM 1',330,152,20,INK,null);B.txt('HERO NAME:',330,180,17,'#7a7386',null,'center','Patrick Hand');B.line(240,230,420,230,2);
    const second=s>3.2;B.txt(second?'BATDORN':'"Dad"',330,212,second?30:32,'#2c5ea8',null);
    if(s>1.3&&!second)B.stamp(385,246,'DENIED',-.2,'#d33',.6*pop(s,1.3));
    if(s>4.2)B.stamp(385,246,'APPROVED',-.2,'#2f9a4a',.6*pop(s,4.2));
    cap('Mom runs HERO Resources. Nobody saves the day without paperwork.')}),
  S(390,(s,gt)=>{cave();B.dogBed(400,GY-4);
    B.graydorn(110,GY,.85,{t:gt});B.batdorn(215,GY,.68,{t:gt});
    cap('So they built a secret lair: THE DORN DEN.');
    if(s>2.6)big('ONE BED IS STILL EMPTY.',320,128,32*pop(s,2.6),'#fff')}),
  endCard({k:'ISSUE #4',title:'BEFORE THE BARK',sub:'The origin story. Watch it like a show or read it like a comic.',stamp:'NEW!'})
];

/* ══════════ GRAYDORN'S WORLD ══════════ */
const HEROES=[['graydorn',62,.78,'GRAYDORN',128],['batdorn',165,.62,'BATDORN',150],['charlie',272,.72,'CHARLIESCOPE',176],['jewels',378,.72,'JEWELS',150],['dino',462,1.9,'DINO',112],['scratchy',578,1.35,'SCRATCHY',136]];
const SQUAD=[['kitty',56,'CINNAMON','#ffb84d'],['pink',190,'STRAWBERRY','#ff9ecb'],['pup',322,'SAPPHIRE','#bfe3ff'],['wolf',500,'SUMMER','#d9d9e8']];
TRAILER_SCRIPTS.gbw=[
  S(360,s=>titleCard([['ONE GIANT WORLD.',.3],['12 KILOMETERS WIDE.',1.3,'#5bb8f2'],['TEN HEROES.',2.3],['ZERO GAME OVERS.',3.3,PINK]],s)),
  S(450,(s,gt)=>{street(gt*130);
    HEROES.forEach(([k,x,sc,name,lh],i)=>{if(s<.4+i*.55)return;const o={t:gt,run:true,mood:'determined'};
      if(k==='dino')B.dino(x,GY-2,sc);else B[k](x,GY,sc,o);
      B.txt(name,x+(k==='dino'?26:0),GY-lh,16,YEL,INK)});
    snow(90);cap('Play as everybody.')}),
  S(390,(s,gt)=>{C.fillStyle='#bfe3f7';C.fillRect(0,0,W,H);B.seed(33);B.blob(120,70,60,20,'#fff',3,12,2.5);B.blob(470,100,74,22,'#fff',3,12,2.5);
    B.poly([[-10,GY-44],[W+10,GY-48],[W+10,H+10],[-10,H+10]],'#8fce6a',2,3);
    SQUAD.forEach(([k,x,name,col],i)=>{if(s<.4+i*.6)return;B.stuffy(k,x,GY-(k==='kitty'?Math.abs(Math.sin(gt*6))*14:0),gt);B.txt(name,x+26,GY-(k==='wolf'?152:124),17,col,INK)});
    cap('Even the STUFFY SQUAD.');
    if(s>3.4)big('10 HEROES TO UNLOCK',320,128,40*pop(s,3.4),YEL)}),
  S(480,(s,gt)=>{const shot=Math.min(2,Math.floor(s/2.66));
    if(shot===0){haunt(gt*200);B.ghost(430,170+Math.sin(gt*3)*12,1,gt);B.ghost(550,230+Math.cos(gt*3)*10,2,gt);B.graydorn(170,GY,.85,{t:gt,run:true,mood:'determined'});B.falling(W,H,1/60,120);bar('SPOOKY WOODS')}
    else if(shot===1){badlands();B.molerat(440,GY,1.3,{t:gt,run:true,pup:false});B.charlie(150,GY,.8,{t:gt});say(270,130,['MOLERATS!!'],170,GY-140,24);bar('MOLERAT TUNNELS')}
    else{street();B.skyTear(180,96,76,28,gt);B.coop(460,GY-30,.95,{crashed:true});B.scratchy(300,GY,1.3,{t:gt,talk:true});B.pearl(210,GY,1.1,{t:gt});snow();bar('CRANKYTOWN')}
    cap('Go anywhere. Right from the start.')}),
  S(450,(s,gt)=>{street();
    if(s<3.2){const hit=Math.floor(gt*3)%2===0;
      B.molerat(170,GY,1.5,{t:gt,pup:false,squish:hit});B.barkLady(470,GY,.95,{t:gt,dino:false,bark:!hit});
      if(hit){B.burst(170,GY-150,42,'BONK!','#ff6b6b',22,1)}else B.burst(380,GY-190,42,'BONK!','#ff6b6b',22,2);
      cap('Two bosses to bonk.')}
    else{B.graydorn(260,GY,.9,{t:gt});B.dino(330,GY-2,1.9);B.sleepyZ(280,GY-140);B.sleepyZ(360,GY-80);
      cap('Out of hearts? You just take a nap.');
      if(s>4.2)big('NO GAME OVER. EVER.',320,128,42*pop(s,4.2),YEL)}
    snow()}),
  endCard({k:'OPEN WORLD',title:"GRAYDORN'S WORLD",sub:'A hand-drawn world the size of a whole kingdom.',stamp:'PLAY NOW'})
];

/* ══════════ COMING SOON: ISSUE #5 (teaser) ══════════ */
function nutPlan(x,y,done){
  B.seed(87);B.line(x,y,x,y+70,5,'#7a5a40');B.poly([[x-108,y-96],[x+108,y-96],[x+108,y+6],[x-108,y+6]],'#fffaf0',1,3);
  B.txt('NUT IMPROVEMENT PLAN',x,y-78,14,'#d33',null);
  ['Return the bread','Rake the yard','NO swirling'].forEach((l,i)=>{const ly=y-54+i*20;
    B.poly([[x-94,ly-7],[x-80,ly-7],[x-80,ly+7],[x-94,ly+7]],'#fff',.4,2);
    if(i<done){B.line(x-92,ly,x-88,ly+5,3,'#2f9a4a');B.line(x-88,ly+5,x-79,ly-8,3,'#2f9a4a')}
    B.txt(l,x-70,ly,16,INK,null,'left','Patrick Hand')});
}
TRAILER_SCRIPTS.gb5=[
  S(360,(s,gt)=>{cave();B.dogBed(290,GY-4);
    cap('In the warmest corner of the Dorn Den... one bed is still empty.')}),
  S(420,(s,gt)=>{street();C.fillStyle='rgba(24,18,60,.5)';C.fillRect(0,0,W,H);
    B.doodle(350,GY,1.15,{t:gt,mood:'angry',pearls:true,wag:s>2&&s<3.6});
    snow();cap('Out in the snow, the crankiest creature in the world...');
    if(s>2)big('...WAGGED HER TAIL.',320,120,38*pop(s,2),'#fff');
    if(s>3.8)big('ONCE.',320,170,40*pop(s,3.8),YEL)}),
  S(420,(s,gt)=>{yard();
    nutPlan(150,GY-130,s>2?2:1);
    B.squirrel(330,GY,.95,{k:0,dizzy:true});B.loaf(378,GY-30,4);
    B.squirrel(450,GY,.95,{k:1,dizzy:true});B.squirrel(555,GY,.7,{k:2,dizzy:true,dir:-1});
    cap('The squirrels are being good. Probably.');
    if(s>3)say(480,150,['Nuts.'],548,GY-70,28)}),
  S(450,(s,gt)=>{street();
    B.graydorn(80,GY,.8,{t:gt,mood:'determined'});B.batdorn(180,GY,.62,{t:gt});B.charlie(300,GY,.8,{t:gt,scope:true});B.jewels(420,GY,.78,{t:gt,gem:1});B.dino(520,GY-2,2);
    snow();
    if(s>.6&&s<3.6)say(420,84,["We don't fight her.","We RESCUE her."],320,GY-150,22);
    if(s>3.9){big("IT'S TIME TO",320,70,34*pop(s,3.9),'#fff');big('BRING HER HOME.',320,116,48*pop(s,4.3),YEL)}}),
  endCard({k:'ISSUE #5',title:'TITLE: TOP SECRET',fill:'#ffb3d1',sub:'The rescue begins. Got an idea for it? Tell the Idea Vault!',stamp:'COMING SOON',soon:true})
];

/* ══════════ COMING SOON: DINO'S NEW POWER (teaser) ══════════ */
TRAILER_SCRIPTS.gbd=[
  S(270,(s,gt)=>{street();B.dino(150+Math.sin(gt*40)*3,GY,4.2);B.burst(450,180,84,'MASSIVE ROAR!','#ffb84d',20,2);snow();cap('You know the MASSIVE ROAR.')}),
  S(300,(s,gt)=>{haunt();B.molerat(330,GY,1.5,{t:gt,pup:false,squish:true});B.dino(302,GY-48,3);scaled(500,GY,1,()=>B.poop(0,0,1.2));
    B.burst(170,170,84,'DINO BUTT SIT!','#6fd38b',19,3);B.falling(W,H,1/60,30);cap('You know the DINO BUTT SIT.')}),
  S(360,s=>titleCard([['BUT DINO HAS BEEN',.3,INK,38],['PRACTICING',1.2,'#5bb8f2',52],['SOMETHING NEW...',2.2,PINK,46]],s)),
  S(450,(s,gt)=>{haunt();const k=ease(s/2.2),hug=s>2.2,dx=90+k*250;
    B.dino(dx,GY-2,2.6);
    B.ghost(452,GY-58+(hug?0:Math.sin(gt*14)*5),3,hug?0:gt);
    if(!hug)say(520,180,['Uh oh.'],460,GY-100,22);
    else{for(let i=0;i<5;i++){const p=((s-2.2)*.5+i/5)%1;C.globalAlpha=1-p;B.heart(360+i*34,GY-130-p*120,11);C.globalAlpha=1}
      big('THE DINO HUG!',320,112,54*pop(s,2.2),PINK)}
    B.falling(W,H,1/60,30);
    if(s>4.4)cap('Works on ghosts. Works on molerats. Works on YOU.')}),
  endCard({k:'NEW POWER',title:'DINO HUGS',fill:'#ffb3d1',sub:'A brand-new move for Dino. Idea by the real Graydorn.',stamp:'COMING SOON',soon:true})
];

/* ══════════ COMING SOON: NAME THE STARTER (teaser) ══════════ */
const GUESS=['???','BUBBLES?','SIR RISES-A-LOT?','DOUGH-DOUGH?','BREADLEY?','???'];
TRAILER_SCRIPTS.gbs=[
  S(390,(s,gt)=>{room('#f6e3c5','#d9b98c');B.seed(89);B.poly([[330,GY-110],[650,GY-114],[650,GY-90],[330,GY-88]],'#b98a5e',1.2,3);
    B.loaf(420,GY-128,1);B.loaf(500,GY-130,2);B.loaf(580,GY-128,3);
    B.jewels(140,GY,.9,{t:gt,gem:2});
    scaled(270,GY-170+Math.sin(gt*3)*8,1.7,()=>B.starterJar(0,0));
    cap('Jewels has a sidekick. It floats. It bubbles. It makes bread.')}),
  S(450,(s,gt)=>{paper();scaled(190,270+Math.sin(gt*3)*6,3.6,()=>B.starterJar(0,0));
    B.seed(91);C.save();C.translate(450,240);C.rotate(.04);
    B.poly([[-130,-78],[130,-78],[130,78],[-130,78]],'#fff',1.2,3);B.poly([[-130,-78],[130,-78],[130,-22],[-130,-22]],'#d33',1.2,3);
    B.txt('HELLO',0,-58,26,'#fff',null);B.txt('my name is',0,-34,16,'#fff',null,'center','Patrick Hand');
    big(GUESS[Math.min(GUESS.length-1,Math.floor(s/1.15))],0,30,34,INK,230,null);C.restore();
    big('IT HAS NO NAME.',320,54,42*pop(s,.3),PINK)}),
  S(390,(s,gt)=>{room('#e8d9f2','#b99fd0');
    [[150,200],[320,160],[490,200]].forEach(([x,y],i)=>scaled(x,y+Math.sin(gt*2.5+i)*8,2,()=>B.openBook(0,0)));
    B.jewels(320,GY,.8,{t:gt,gem:0});
    cap('Also on the way: THE BOOK CLUB.');
    if(s>2.4)B.txt('A cameo? A summon power? Stay tuned.',320,H-54,22,INK,null,'center','Patrick Hand')}),
  endCard({k:'YOU DECIDE',title:'NAME THE STARTER',fill:'#ffb3d1',sub:'Got the perfect name? Tell the Idea Vault!',stamp:'COMING SOON',soon:true})
];
})();
