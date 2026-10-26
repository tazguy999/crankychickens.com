/* Graydorn & Batdorn sprite library — shared by the home page trailer. Generated from games/graydorns-world.html */
(function(){

const INK='#1d1a1f', SKIN='#f6d0b5', DADSKIN='#f0c6a4';
let g, seed=1, boil=0, time=0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function setSeed(s){seed=(Math.abs(Math.floor(s))%2147483646)+1}
function rnd(){seed=seed*16807%2147483647;return (seed-1)/2147483646}
function j(n){return (rnd()-.5)*2*n}
function strokeIt(w){if(!w)return;g.lineWidth=w;g.strokeStyle=INK;g.lineJoin='round';g.lineCap='round';g.stroke()}

function blob(cx,cy,rx,ry,fill,jit=1.2,n=12,lw=3){
  const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*(rx+j(jit)),cy+Math.sin(a)*(ry+j(jit))])}
  g.beginPath();const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let s=m(p[n-1],p[0]);g.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){const q=m(p[i],p[(i+1)%n]);g.quadraticCurveTo(p[i][0],p[i][1],q[0],q[1])}
  g.closePath();if(fill){g.fillStyle=fill;g.fill()}strokeIt(lw);
}
function poly(pts,fill,jit=1.4,lw=3){
  g.beginPath();pts.forEach((p,i)=>{const x=p[0]+j(jit),y=p[1]+j(jit);i?g.lineTo(x,y):g.moveTo(x,y)});
  g.closePath();if(fill){g.fillStyle=fill;g.fill()}strokeIt(lw);
}
function line(x1,y1,x2,y2,w=3,col=INK){
  g.beginPath();g.moveTo(x1+j(.8),y1+j(.8));g.quadraticCurveTo((x1+x2)/2+j(1.5),(y1+y2)/2+j(1.5),x2+j(.8),y2+j(.8));
  g.lineWidth=w;g.strokeStyle=col;g.lineCap='round';g.stroke();
}
function limb(x1,y1,x2,y2,w,col){
  const a=[x1+j(.8),y1+j(.8)],b=[x2+j(.8),y2+j(.8)],m=[(x1+x2)/2+j(1.5),(y1+y2)/2+j(1.5)];
  g.lineCap='round';
  for(const [lw,c] of [[w+6,INK],[w,col]]){g.beginPath();g.moveTo(a[0],a[1]);g.quadraticCurveTo(m[0],m[1],b[0],b[1]);g.lineWidth=lw;g.strokeStyle=c;g.stroke()}
}
function txt(s,x,y,size,fill='#fff',stroke=INK,align='center',font='Permanent Marker'){
  g.font=`${size}px "${font}", "Comic Sans MS", cursive`;g.textAlign=align;g.textBaseline='middle';
  if(stroke){g.lineWidth=Math.max(3,size/6);g.strokeStyle=stroke;g.lineJoin='round';g.strokeText(s,x,y)}
  g.fillStyle=fill;g.fillText(s,x,y);
}
function burst(x,y,r,s,fill='#ffe14d',size=26,id=0){
  setSeed(boil*53+id);const n=14,pts=[];
  for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,rr=i%2?r*.68:r;pts.push([x+Math.cos(a)*rr*1.35,y+Math.sin(a)*rr])}
  poly(pts,fill,2,3);txt(s,x,y+1,size,INK,null);
}
function bubble(x,y,w,h,tx,ty,lines,size=20){
  setSeed(boil*59+x);
  poly([[x-14,y+h*.35],[x+14,y+h*.35],[tx,ty]],'#fff',1,3);
  blob(x,y,w,h,'#fff',1.4,16,3);
  g.fillStyle='#fff';g.beginPath();g.moveTo(x-11,y+h*.3);g.lineTo(x+11,y+h*.3);g.lineTo(x,y+h*.6);g.fill();
  lines.forEach((l,i)=>txt(l,x,y+(i-(lines.length-1)/2)*size*1.05,size,INK,null,'center','Patrick Hand'));
}

/* ---------- characters ---------- */
function graydorn(x,y,s,o={}){
  const t=o.t||0,mood=o.mood||'happy';setSeed(boil*31+1+(o.id||0));
  g.save();g.translate(x,y);g.scale(s,s);
  let f1,f2;
  if(o.air){f1=[16,-14];f2=[-12,-10]}
  else if(o.run){const p=t*14;f1=[Math.sin(p)*18,-Math.max(0,Math.cos(p))*8];f2=[-Math.sin(p)*18,-Math.max(0,-Math.cos(p))*8]}
  else{f1=[9,0];f2=[-9,0]}
  limb(-5,-40,f2[0]-3,f2[1]-5,15,'#26272e');blob(f2[0]-1,f2[1]-4,11,6,'#16161a',.6,10,2);
  limb(5,-40,f1[0]+3,f1[1]-5,15,'#26272e');blob(f1[0]+5,f1[1]-4,11,6,'#16161a',.6,10,2);
  const sw=o.run?Math.sin(t*14)*10:0;
  limb(-14,-70,-28-sw,-48,11,'#7b8391');blob(-29-sw,-45,6,6,'#16161a',.5,8,2);
  poly([[-21,-82],[21,-82],[25,-34],[-25,-34]],'#7b8391');
  line(1,-79,1,-37,2);line(-18,-50,-8,-50,2);line(-22,-36,22,-36,4);
  if(mood==='shock'){limb(16,-72,30,-104,11,'#7b8391');blob(31,-108,7,7,'#16161a',.5,8,2)}
  else{limb(16,-72,36,-86,11,'#7b8391');blob(39,-89,7,7,'#16161a',.5,8,2)}
  blob(-20,-97,7,13,'#8d8396');blob(23,-97,7,13,'#8d8396');
  blob(2,-102,22,21,SKIN);
  blob(-11,-95,4,3,'#f4a6a6',.3,8,0);
  const big=mood==='shock'?1.25:1;
  blob(10,-104,6*big,7*big,'#fff',.4,10,2);blob(-3,-104,6*big,7*big,'#fff',.4,10,2);
  g.fillStyle=INK;
  const px=mood==='shock'?0:2;
  g.beginPath();g.arc(10+px,-103,2.7,0,7);g.arc(-3+px,-103,2.7,0,7);g.fill();
  if(mood==='happy'){g.beginPath();g.arc(5,-93,6,.25,Math.PI-.25);strokeIt(2.5)}
  else if(mood==='shock'){blob(5,-90,4,5,'#7a2630',.3,8,2)}
  else{line(0,-91,11,-92,2.5)}
  if(mood==='determined'){line(-9,-115,1,-111,3);line(6,-111,17,-115,3)}
  if(mood==='shock'){line(-9,-118,1,-119,2.5);line(6,-119,16,-118,2.5)}
  blob(2,-121,25,14,'#8d8396',1.5,14);
  blob(2,-112,28,7,'#b7aec0',1.2,14);
  for(let k=0;k<5;k++){line(-16+k*8,-124+j(2),-13+k*8,-127+j(2),1.5)}
  g.restore();
}
function batdorn(x,y,s,o={}){
  const t=o.t||0,wv=Math.sin(t*10)*6;setSeed(boil*37+2);
  g.save();g.translate(x,y);g.scale(s,s);
  if(o.fly){
    poly([[22,-142],[-26,-142],[-132,-130+wv],[-110,-114],[-128,-98-wv],[-104,-86],[-120,-70+wv],[-30,-76]],'#2a2533',2);
    limb(-10,-76,-62,-64,18,'#3a4c70');limb(10,-76,-50,-56,18,'#3a4c70');
    blob(-70,-64,8,11,'#26222b');blob(-58,-55,8,11,'#26222b');
  }else{
    poly([[24,-142],[-24,-142],[-46,-14],[-31,-26],[-16,-10],[0,-24],[16,-10],[31,-26],[46,-14]],'#2a2533',2);
    limb(-12,-76,-15,-6,18,'#3a4c70');limb(12,-76,15,-6,18,'#3a4c70');
    blob(-18,-5,14,7,'#26222b');blob(19,-5,14,7,'#26222b');
  }
  limb(-26,-136,-36,-96,13,'#2c5ea8');blob(-37,-91,7,7,DADSKIN,.5,8,2);
  poly([[-30,-147],[30,-147],[33,-72],[-33,-72]],'#2c5ea8');
  poly([[-33,-82],[33,-82],[33,-72],[-33,-72]],'#f2c230',.8);
  blob(0,-117,15,11,'#f2c230',.8,12,2.5);txt('B',0,-116,17,INK,null);
  if(o.fly){limb(26,-136,72,-140,13,'#2c5ea8');blob(78,-140,10,9,DADSKIN,.6,10,2.5)}
  else{limb(26,-136,48,-112,13,'#2c5ea8');blob(53,-114,9,9,DADSKIN,.5,10,2.5);line(55,-122,56,-131,4)}
  blob(2,-172,26,27,DADSKIN);
  blob(4,-155,25,16,'#b07a45',1.4,14);blob(-19,-166,7,12,'#b07a45',.8,10,2);
  blob(9,-156,9,4,'#fff',.3,10,2);
  blob(13,-168,5,4,DADSKIN,.3,8,2);
  blob(5,-179,25,7,'#1f1c26',.5,12,2);
  blob(-4,-179,5,3,'#fff',.2,8,0);blob(14,-179,5,3,'#fff',.2,8,0);
  g.fillStyle=INK;g.beginPath();g.arc(-3,-179,1.8,0,7);g.arc(15,-179,1.8,0,7);g.fill();
  blob(2,-197,25,12,'#99a0a9',1,12);
  poly([[14,-194],[47,-190],[45,-184],[12,-186]],'#7f868f',.8);
  blob(8,-206,15,6,'#2db6ec',.6,12,2.5);line(1,-208,8,-209,2,'#fff');
  g.restore();
}
function dino(x,y,s){
  setSeed(boil*43+4);g.save();g.translate(x,y);g.scale(s,s);
  const GR='#a2a6ab',DK='#5a5d63',BR='#8b6a45';
  poly([[-20,-16],[-36,-9],[-18,-8]],GR,1,2.5);
  blob(-14,-4,6,6,GR,.4,8,2);blob(8,-4,6,6,GR,.4,8,2);
  blob(-3,-17,23,14,GR,1,12,2.5);
  blob(-3,-7,17,5,'#767a80',.6,10,2);
  for(let k=-14;k<10;k+=5)line(k,-10,k+1,-4,1.2);
  [[-14,-24],[-6,-28],[2,-26],[-10,-18]].forEach(p=>blob(p[0],p[1],2.6,2.2,DK,.3,8,0));
  for(let k=0;k<7;k++){const a=Math.PI*(.75+k*.21);blob(19+Math.cos(a)*15,-33+Math.sin(a)*14,6,5,BR,.8,8,2)}
  blob(20,-31,15,13,GR,1,12,2.5);
  blob(13,-35,2.6,3.6,INK,.2,8,0);blob(27,-35,2.6,3.6,INK,.2,8,0);
  g.fillStyle='#fff';g.beginPath();g.arc(13.6,-36.5,.9,0,7);g.arc(27.6,-36.5,.9,0,7);g.fill();
  poly([[17,-26],[20,-35],[23,-26]],'#b08e5f',.4,2);
  g.fillStyle=INK;g.beginPath();g.arc(13,-27,1.3,0,7);g.arc(27,-27,1.3,0,7);g.fill();
  g.beginPath();g.arc(20,-25,7,.35,Math.PI-.35);strokeIt(2);
  g.restore();
}
function barkLady(x,y,s,o={}){
  const t=o.t||0,p=t*13;setSeed(boil*41+3);
  g.save();g.translate(x,y);g.scale(s,s);
  const a1=o.run?Math.sin(p)*16:6,a2=o.run?-Math.sin(p)*16:-6;
  limb(-6,-40,-6+a2,-4,13,'#d9a24c');blob(-8+a2,-4,9,5,'#c88e3d',.5,8,2);
  blob(32,-60+Math.sin(t*20)*4,11,7,'#e7b762',1,10,2.5);
  limb(8,-40,8+a1,-4,13,'#d9a24c');blob(6+a1,-4,9,5,'#c88e3d',.5,8,2);
  blob(4,-62,28,30,'#e3b05b',2.4,16);
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2;blob(4+Math.cos(a)*25,-62+Math.sin(a)*27,8,7,'#ebbf6c',1,8,2)}
  if(o.dino!==false)dino(-6,-42,.75);
  setSeed(boil*41+9);
  limb(-12,-78,0,-52,11,'#e3b05b');blob(2,-49,7,6,'#e3b05b',.5,8,2);
  blob(14,-100,9,19,'#c88e3d',1,10);
  blob(-6,-106,24,23,'#e3b05b',2,14);
  blob(-16,-128,7,6,'#ebbf6c',1,8,2);blob(-4,-131,7,6,'#ebbf6c',1,8,2);blob(8,-127,7,6,'#ebbf6c',1,8,2);
  poly([[0,-134],[15,-143],[15,-125]],'#ea4f8c',.6,2.5);poly([[0,-134],[-15,-143],[-15,-125]],'#ea4f8c',.6,2.5);blob(0,-134,4,4,'#ea4f8c',.3,8,2);
  blob(-29,-98,14,10,'#f0cf92',1,12);
  blob(-42,-101,5,4,INK,.4,8,1);
  if(o.bark){blob(-29,-88,8,6,'#7a2630',.6,10,2.5);poly([[-34,-92],[-31,-87],[-28,-92]],'#fff',.3,1)}
  else{line(-36,-90,-24,-91,2.5)}
  blob(-14,-111,5,6,'#fff',.4,10,2);blob(-1,-112,4,5,'#fff',.4,10,2);
  g.fillStyle=INK;g.beginPath();g.arc(-16,-110,2.3,0,7);g.arc(-3,-111,2,0,7);g.fill();
  line(-22,-122,-8,-115,4);line(-5,-116,6,-122,4);
  for(let k=0;k<6;k++){g.fillStyle='#fff';g.beginPath();g.arc(-20+k*6,-82+Math.abs(k-2.5)*1.4,3,0,7);g.fill();strokeIt(1.5)}
  blob(18,-82,6,5,'#e8508a',.5,8,0);
  g.restore();
}
function snowball(x,y,r=14){setSeed(boil*61+Math.floor(x));blob(x,y,r,r,'#fff',1,10,3);blob(x+r*.3,y+r*.35,r*.45,r*.3,'#dbe6f0',.5,8,0)}

const RAINBOW=['#ff6b6b','#ffb84d','#ffe14d','#6fd38b','#5bb8f2','#a77de8'];
function wedges(x,y,r,spin=0,lw=2.5){
  for(let k=0;k<6;k++){g.beginPath();g.moveTo(x,y);g.arc(x,y,r,spin+k*Math.PI/3,spin+(k+1)*Math.PI/3);g.closePath();g.fillStyle=RAINBOW[k];g.fill()}
  g.beginPath();g.arc(x+j(.5),y+j(.5),r,0,7);strokeIt(lw);
}
function charlie(x,y,s,o={}){
  const t=o.t||0;setSeed(boil*47+5);
  g.save();g.translate(x,y);g.scale(s,s);
  const sway=Math.sin(t*4)*4;
  const HR='#e6c47c',HS=()=>{g.translate(2,-101);g.scale(1.5,1.5);g.translate(-2,122)};
  poly([[16,-122],[-16,-122],[-34,-30+sway],[-20,-38],[-8,-26],[4,-36],[12,-30]],'#2bb3a3',1.6,3);
  g.save();HS();
  poly([[-14,-167],[18,-167],[20,-152],[22,-130],[-18,-130],[-16,-152]],HR,.8,2);
  line(-13,-140,-14,-131,1.2,'#c9a352');line(17,-140,18,-131,1.2,'#c9a352');
  g.restore();
  limb(-7,-48,-10,-6,13,'#6b4bb3');limb(7,-48,10,-6,13,'#6b4bb3');
  blob(-12,-5,11,6,'#2bb3a3',.6,10,2.5);blob(13,-5,11,6,'#2bb3a3',.6,10,2.5);
  limb(-14,-110,-24,-78,10,'#ffd23d');blob(-25,-74,6,6,SKIN,.5,8,2);
  poly([[-18,-124],[18,-124],[22,-46],[-22,-46]],'#ffd23d');
  poly([[-22,-54],[22,-54],[22,-46],[-22,-46]],'#8a5bd6',.6,2.5);
  wedges(0,-92,12,t*2);
  g.save();HS();
  blob(2,-151,14,16,SKIN,.6,14,2);
  blob(2,-163,15,7,HR,.6,12,2);
  line(2,-170,2,-160,1.6,'#c9a352');
  blob(-7,-142,3,2,'#f4a6a6',.3,8,0);blob(11,-142,3,2,'#f4a6a6',.3,8,0);
  blob(2,-152,14,5,'#ea4f8c',.3,12,1.8);
  blob(-3,-152,3.2,2.8,'#fff',.15,8,1.1);blob(7,-152,3.2,2.8,'#fff',.15,8,1.1);
  g.fillStyle=INK;g.beginPath();g.arc(-2.5,-152,1.7,0,7);g.arc(7.5,-152,1.7,0,7);g.fill();
  line(-7,-155,-9,-158,1.1);line(11,-155,13,-158,1.1);
  g.beginPath();g.moveTo(-3,-143);g.quadraticCurveTo(2,-136,7,-143);g.closePath();g.fillStyle='#fff';g.fill();strokeIt(1.6);
  g.restore();
  if(o.scope){
    limb(14,-114,24,-128,10,'#ffd23d');
    g.save();HS();
    poly([[12,-155],[34,-160],[35,-149],[13,-146]],'#f2c230',.6,2);
    wedges(36,-154.5,6.5,t*5,2);
    g.restore();
  }else{
    limb(14,-112,34,-96,10,'#ffd23d');blob(37,-94,6,6,SKIN,.5,8,2);
  }
  g.restore();
}
function cheetah(x,y,s,t){
  setSeed(boil*67+6);g.save();g.translate(x,y);g.scale(s,s);
  const p=t*22,a=Math.sin(p)*18,b=-a;
  line(-48,-44,-80,-60+Math.sin(t*12)*8,6);line(-48,-44,-80,-60+Math.sin(t*12)*8,3,'#f2b33d');
  limb(-34,-40,-34+b,-4,10,'#e6a52f');limb(30,-40,30+a,-4,10,'#e6a52f');
  blob(0,-48,50,20,'#f2b33d',1.6,14);
  limb(-26,-40,-26+a,-4,10,'#f2b33d');limb(36,-40,36+b,-4,10,'#f2b33d');
  for(let k=0;k<9;k++){g.fillStyle=INK;g.beginPath();g.arc(-36+k*9+j(2),-54+(k%3)*7+j(1),2.4,0,7);g.fill()}
  blob(56,-64,18,15,'#f2b33d',1,12);
  blob(48,-80,5,6,'#f2b33d',.5,8,2);blob(62,-80,5,6,'#f2b33d',.5,8,2);
  blob(71,-60,7,6,'#fbe3b0',.6,8,2);blob(77,-62,3,2.5,INK,.3,8,0);
  g.fillStyle=INK;g.beginPath();g.arc(60,-68,2.4,0,7);g.fill();
  line(59,-64,64,-54,2);
  blob(56,-70,13,4,'#ea4f8c',.4,10,2);
  g.restore();
}
const STUFFIES={
  kitty:{name:'CINNAMON',move:'POUNCE!',body:'#f3c99c',belly:'#fbe6cc',spot:'#dc9b5c',stripes:true,head:'#f3c99c',snout:'#fbe6cc',nose:'#f28c96',ear:'cat',tail:'cat',s:.95,hop:true,col:'#ffb84d'},
  pink:{name:'STRAWBERRY',move:'PURR BLAST!',body:'#f4b4cf',belly:'#fbe1ec',spot:'#e27aab',spots:true,head:'#f4b4cf',snout:'#fbe1ec',nose:'#f59a7a',ear:'cat',tail:'cat',s:.95,col:'#ff9ecb'},
  pup:{name:'SAPPHIRE',move:'SNOW ZOOM!',body:'#9ea3ab',belly:'#ffffff',head:'#9ea3ab',snout:'#ffffff',nose:INK,ear:'dog',tail:'curl',s:.9,face:true,col:'#bfe3ff'},
  wolf:{name:'SUMMER',move:'AWOOOOO!',body:'#efe6d3',belly:'#f8f3e8',saddle:'#8e8a88',fleck:'#66615f',head:'#8e8a88',snout:'#f2ece0',nose:INK,ear:'dog',tail:'bush',s:1.3,face:true,howl:true,col:'#d9d9e8'}
};
let lastStuffy='';
function stuffy(k,x,y,t,plain){
  const c=STUFFIES[k];setSeed(boil*73+k.length*7);g.save();g.translate(x,y);g.scale(c.s,c.s);
  const a=Math.sin(t*20)*14;
  if(c.tail==='cat')limb(-36,-42,-56,-72+Math.sin(t*10)*5,7,c.body);
  else if(c.tail==='curl')blob(-40,-58,11,10,c.body,1,10,2.5);
  else blob(-50,-48,20,9,c.saddle||c.body,1.5,12,2.5);
  limb(-26,-30,-26-a,-3,9,c.body);limb(22,-30,22+a,-3,9,c.body);
  blob(0,-38,40,20,c.body,1.4,14);
  if(c.saddle){blob(-4,-47,37,12,c.saddle,1.4,14,0);for(let i=0;i<9;i++)blob(-30+i*7+j(2),-50+(i%3)*4,3,2,c.fleck,.4,6,0);blob(30,-38,13,15,c.body,1,12,0)}
  blob(4,-27,26,7,c.belly,.8,12,0);
  if(c.stripes)for(let i=0;i<4;i++)line(-24+i*12,-57,-21+i*12,-45,3.5,c.spot);
  if(c.spots)[[-20,-46],[-4,-50],[12,-44],[-14,-34]].forEach(p=>blob(p[0],p[1],5,4,c.spot,.6,8,0));
  limb(-18,-30,-18+a,-3,9,c.body);limb(30,-30,30-a,-3,9,c.body);
  g.save();g.translate(38,-48);g.scale(1.45,1.45);g.translate(-38,48);
  if(c.ear==='dog'){poly([[32,-68],[37,-92],[46,-72]],c.head,.8,2.5);poly([[48,-72],[57,-92],[60,-68]],c.head,.8,2.5);poly([[37,-72],[38,-84],[43,-73]],'#fff',.4,0);poly([[51,-72],[56,-84],[57,-71]],'#fff',.4,0)}
  else{poly([[33,-68],[37,-86],[46,-71]],c.head,.8,2.5);poly([[48,-71],[57,-86],[59,-66]],c.head,.8,2.5);poly([[37,-71],[38,-80],[43,-72]],'#f4a6b8',.3,0);poly([[51,-71],[55,-80],[56,-69]],'#f4a6b8',.3,0)}
  blob(46,-58,18,16,c.head,1,12);
  if(c.face)blob(52,-51,13,11,'#fff',.8,12,0);
  blob(62,-51,10,7,c.snout,.6,10,2.5);
  blob(70,-54,4,3.2,c.nose,.3,8,1.5);
  g.beginPath();g.arc(64,-47,4,.3,Math.PI-.3);strokeIt(1.8);
  if(!plain)blob(48,-63,14,4.5,'#ea4f8c',.4,10,2);
  blob(54,-63,3,2.6,'#fff',.2,8,1.2);g.fillStyle=INK;g.beginPath();g.arc(55,-63,1.6,0,7);g.fill();
  g.restore();
  g.restore();
}
function shard(x,y,id){
  setSeed(boil*71+id);g.save();g.translate(x,y);g.rotate(time*2+id);
  poly([[0,-18],[13,0],[0,18],[-13,0]],RAINBOW[id%6],1,3);
  line(-4,-7,0,-13,2,'#fff');
  g.restore();
}

/* ---------- Issue #2 characters ---------- */
const GEMS=[
  {k:'sapphire',name:'SAPPHIRE',col:'#3d7fe0',light:'#a9d0ff',fx:'freeze',word:'FREEZE!'},
  {k:'ruby',name:'RUBY',col:'#e0384f',light:'#ffb3bd',fx:'burn',word:'TOASTY!'},
  {k:'topaz',name:'TOPAZ',col:'#f2b632',light:'#fff0b0',fx:'splash',word:'SPLOOSH!'}
];
const MOM_SKIN='#f3cdb0',MOM_HAIR='#6b4a33';
function jewels(x,y,s,o={}){
  const G=GEMS[o.gem||0],t=o.t||0;setSeed(boil*79+8);
  g.save();g.translate(x,y);g.scale(s,s);
  const HS=()=>{g.translate(2,-117);g.scale(1.45,1.45);g.translate(-2,122)};
  const sway=Math.sin(t*4)*4;
  poly([[18,-140],[-18,-140],[-38,-30+sway],[-22,-40],[-8,-26],[6,-38],[14,-32]],'#3d2a5c',1.6,3);
  g.save();HS();poly([[-15,-167],[19,-167],[22,-150],[23,-131],[-19,-131],[-17,-150]],MOM_HAIR,.8,2);g.restore();
  let f1,f2;
  if(o.air){f1=[16,-14];f2=[-12,-10]}
  else if(o.run){const p=t*13;f1=[Math.sin(p)*18,-Math.max(0,Math.cos(p))*8];f2=[-Math.sin(p)*18,-Math.max(0,-Math.cos(p))*8]}
  else{f1=[9,0];f2=[-9,0]}
  limb(-7,-58,f2[0]-3,f2[1]-6,13,'#2c2440');blob(f2[0]-2,f2[1]-5,11,6,G.col,.6,10,2.5);
  limb(7,-58,f1[0]+3,f1[1]-6,13,'#2c2440');blob(f1[0]+4,f1[1]-5,11,6,G.col,.6,10,2.5);
  const sw=o.run?Math.sin(t*13)*10:0;
  limb(-16,-130,-28-sw,-98,10,G.col);blob(-29-sw,-94,6,6,MOM_SKIN,.5,8,2);
  poly([[-20,-143],[20,-143],[24,-60],[-24,-60]],G.col);
  poly([[-24,-70],[24,-70],[24,-60],[-24,-60]],'#f2c230',.6,2.5);
  poly([[4,-120],[16,-105],[4,-90],[-8,-105]],'#fff',.6,2.5);
  poly([[4,-114],[11,-105],[4,-96],[-3,-105]],G.light,.4,0);
  line(-6,-141,-13,-90,1.5);line(4,-141,-11,-90,1.5);
  poly([[-21,-91],[-5,-91],[-5,-74],[-21,-74]],'#fff',.5,2);
  txt('HR',-13,-82,8,INK,null,'center','Permanent Marker');
  if(o.dash){limb(16,-130,50,-124,10,G.col);blob(54,-124,8,7,MOM_SKIN,.5,10,2.5)}
  else if(o.point){limb(16,-130,44,-146,10,G.col);blob(47,-149,6,6,MOM_SKIN,.5,8,2);line(49,-153,54,-162,4)}
  else{limb(16,-130,26+sw,-98,10,G.col);blob(27+sw,-94,6,6,MOM_SKIN,.5,8,2)}
  g.save();HS();
  blob(2,-151,14,16,MOM_SKIN,.6,14,2);
  blob(2,-163,15,7,MOM_HAIR,.6,12,2);
  poly([[-10,-168],[14,-168],[12,-163],[-8,-163]],'#f2c230',.4,1.6);
  poly([[2,-176],[6,-169],[2,-164],[-2,-169]],G.col,.3,1.4);
  blob(-7,-142,3,2,'#f4a6a6',.3,8,0);blob(11,-142,3,2,'#f4a6a6',.3,8,0);
  blob(2,-152,14,5,G.col,.3,12,1.8);
  blob(-3,-152,3.2,2.8,'#fff',.15,8,1.1);blob(7,-152,3.2,2.8,'#fff',.15,8,1.1);
  g.fillStyle=INK;g.beginPath();g.arc(-2.5,-152,1.7,0,7);g.arc(7.5,-152,1.7,0,7);g.fill();
  line(-7,-155,-9,-158,1.1);line(11,-155,13,-158,1.1);
  g.beginPath();g.moveTo(-3,-143);g.quadraticCurveTo(2,-136,7,-143);g.closePath();g.fillStyle='#fff';g.fill();strokeIt(1.6);
  g.restore();
  g.restore();
}
function molerat(x,y,s,o={}){
  const t=o.t||0,p=t*14;setSeed(boil*83+9);
  g.save();g.translate(x,y);g.scale(s,s*(o.squish?.6:1));
  const a=o.run?Math.sin(p)*10:3;
  line(22,-24,40,-30+Math.sin(t*12)*4,3,'#e7a3b3');
  limb(-4,-14,-4+a,-2,8,'#9d969a');blob(-6+a,-2,7,4,'#e7a3b3',.4,8,2);
  limb(10,-14,10-a,-2,8,'#9d969a');blob(8-a,-2,7,4,'#e7a3b3',.4,8,2);
  blob(6,-34,23,22,'#a7a0a4',1.6,14);
  blob(-6,-30,13,16,'#f4b3c2',.8,12,2.5);
  line(10,-48,22,-44,1.6);line(12,-40,24,-36,1.6);line(8,-24,20,-22,1.6);line(-10,-38,-2,-36,1.4,'#d98aa0');
  if(o.pup!==false){g.save();g.translate(6,-16);g.scale(.42,.42);stuffy('pup',0,0,t,true);g.restore();setSeed(boil*83+19)}
  limb(-14,-44,4,-24,7,'#a7a0a4');
  line(-24,-36,-30,-2,4,'#7a5232');g.beginPath();g.arc(-20,-37,5,Math.PI,Math.PI*1.9);g.lineWidth=4;g.strokeStyle='#7a5232';g.stroke();
  blob(-24,-38,5,5,'#a7a0a4',.4,8,2);
  blob(10,-60,5,4,'#c9c2c6',.4,8,2);
  blob(-8,-62,18,15,'#a7a0a4',1.2,12);
  line(-14,-71,-4,-70,1.4);line(-16,-67,-6,-66,1.2);line(-2,-56,6,-57,1.2);
  blob(-26,-57,8,6,'#b9b1b5',.6,10,2.5);
  blob(-33,-59,3,2.5,'#e7a3b3',.3,8,1.5);
  poly([[-31,-53],[-27,-53],[-27,-44],[-31,-44]],'#fff6d6',.3,1.8);poly([[-27,-53],[-23,-53],[-23,-45],[-27,-45]],'#fff6d6',.3,1.8);
  g.beginPath();g.arc(-20,-63,3.2,Math.PI*1.1,Math.PI*1.9);strokeIt(2);
  g.beginPath();g.arc(-10,-63,3.2,Math.PI*1.1,Math.PI*1.9);strokeIt(2);
  g.beginPath();g.arc(-20,-63,6,0,7);g.arc(-10,-63,6,0,7);strokeIt(1.4);
  blob(-21,-70,5,2.5,'#fff',.4,8,1.4);blob(-9,-70,5,2.5,'#fff',.4,8,1.4);
  blob(-8,-80,15,7,'#22305a',.8,12,2.5);
  poly([[-26,-77],[-6,-76],[-8,-72],[-28,-73]],'#16203d',.5,2);
  blob(-10,-82,3,3,'#f2c230',.3,8,1.2);
  g.restore();
}
function pumpkin(x,y,r,rot,id){
  setSeed(boil*89+id);g.save();g.translate(x,y);g.rotate(rot);
  blob(0,0,r*1.15,r,'#f28a2e',1.2,14,3);
  line(-r*.4,-r*.9,-r*.45,r*.9,2,'#c8641c');line(r*.4,-r*.9,r*.45,r*.9,2,'#c8641c');
  poly([[-2,-r],[4,-r],[5,-r-9],[-1,-r-9]],'#4f8a3a',.4,2);
  poly([[-r*.5,-r*.25],[-r*.2,-r*.25],[-r*.35,-r*.5]],'#3a1c08',.5,1.5);
  poly([[r*.2,-r*.25],[r*.5,-r*.25],[r*.35,-r*.5]],'#3a1c08',.5,1.5);
  poly([[-r*.55,r*.15],[-r*.3,r*.35],[-r*.1,r*.2],[r*.1,r*.4],[r*.3,r*.2],[r*.55,r*.15],[r*.3,r*.55],[-r*.3,r*.55]],'#3a1c08',.6,1.5);
  g.restore();
}
function ghost(x,y,id,t){
  setSeed(boil*97+id);
  const w=Math.sin(t*8+id)*4;
  poly([[x-26,y+24],[x-26,y-6],[x-22,y-24],[x,y-32],[x+22,y-24],[x+26,y-6],[x+26,y+24],[x+17,y+16+w],[x+8,y+26],[x-1,y+16-w],[x-9,y+26],[x-18,y+16+w]],'#f6f4ff',1.4,3);
  blob(x-9,y-10,4,6,INK,.4,8,0);blob(x+7,y-10,4,6,INK,.4,8,0);
  blob(x-1,y+4,5,6,INK,.4,8,0);
}
function candy(x,y,id){
  setSeed(boil*101+id);const c=['#ff6b6b','#a77de8','#6fd38b','#ffb84d'][id%4];
  g.save();g.translate(x,y);g.rotate(Math.sin(time*3+id)*.3);
  poly([[-12,0],[-24,-9],[-24,9]],c,.6,2.5);poly([[12,0],[24,-9],[24,9]],c,.6,2.5);
  blob(0,0,13,10,c,.6,10,3);line(-5,-7,-1,7,2,'#fff');line(3,-7,7,7,2,'#fff');
  g.restore();
}
function poop(x,y,s=1){
  setSeed(boil*103+Math.floor(x/10));g.save();g.translate(x,y);g.scale(s,s);
  for(let k=0;k<3;k++){const wv=Math.sin(time*6+k)*3;line(-14+k*14,-58,-12+k*14+wv,-78,3,'#6fd38b')}
  blob(0,-8,22,9,'#a8743f',1,12,3);blob(0,-21,16,8,'#a8743f',1,12,3);blob(0,-32,10,7,'#a8743f',1,12,3);
  poly([[-3,-38],[1,-48],[5,-38]],'#a8743f',.6,3);
  g.fillStyle=INK;g.beginPath();g.arc(-5,-22,2,0,7);g.arc(5,-22,2,0,7);g.fill();
  g.beginPath();g.arc(0,-18,5,.3,Math.PI-.3);strokeIt(2);
  g.restore();
}

function blanket(x,y,w,h,rot,id){
  setSeed(boil*107+id);g.save();g.translate(x,y);g.rotate(rot);
  const pts=[];const n=8;
  for(let i=0;i<=n;i++)pts.push([-w+2*w*i/n,-h+Math.sin(i*1.7+time*3)*3]);
  for(let i=0;i<=n;i++)pts.push([w-2*w*i/n,h+(i%2?6:0)]);
  poly(pts,'#8fb8ff',1.2,3);
  for(let i=1;i<4;i++)line(-w+2*w*i/4,-h+3,-w+2*w*i/4+j(3),h-2,4,'#ffb3d1');
  line(-w+4,0,w-4,0,3,'#fff6d6');
  for(let i=0;i<5;i++){g.fillStyle='#fff';g.beginPath();g.arc(-w+10+i*(2*w-20)/4,h-8,2.5,0,7);g.fill()}
  g.restore();
}
function loaf(x,y,id){
  setSeed(boil*109+id);g.save();g.translate(x,y);g.rotate(Math.sin(time*3+id)*.2);
  blob(0,0,22,14,'#d9a25e',1,14,3);
  blob(-2,-3,16,8,'#e8bd7f',.6,10,0);
  line(-12,-8,-4,4,3,'#a8743f');line(-2,-10,6,2,3,'#a8743f');line(8,-8,14,0,3,'#a8743f');
  g.restore();
}
function starterJar(x,y){
  setSeed(boil*113+3);g.save();g.translate(x,y);
  poly([[-15,-30],[15,-30],[17,14],[-17,14]],'#e9f4f8',1,3);
  blob(0,2,15,11,'#efe2c4',1,12,0);
  const lvl=-6+Math.sin(time*2)*3;
  poly([[-15,lvl],[-8,lvl-4],[0,lvl-1],[8,lvl-5],[15,lvl],[16,13],[-16,13]],'#efe2c4',.8,0);
  for(let k=0;k<4;k++){const ph=(time*1.2+k/4)%1;g.globalAlpha=1-ph;blob(-9+k*6,lvl-ph*30,2+ph*3,2+ph*3,'#fffaf0',.3,8,1.2);g.globalAlpha=1}
  line(-10,lvl+8,-6,lvl+14,1.5,'#cfbf98');line(6,lvl+6,10,lvl+12,1.5,'#cfbf98');
  poly([[-17,-36],[17,-36],[17,-29],[-17,-29]],'#b8835a',.6,2.5);
  g.fillStyle=INK;g.beginPath();g.arc(-5,4,1.8,0,7);g.arc(5,4,1.8,0,7);g.fill();
  g.beginPath();g.arc(0,7,4,.3,Math.PI-.3);strokeIt(1.8);
  g.restore();
}
function openBook(x,y){
  setSeed(boil*127+1);g.save();g.translate(x,y);g.rotate(-.15);
  poly([[-26,-4],[0,0],[26,-4],[26,16],[0,20],[-26,16]],'#6b4bb3',.8,3);
  poly([[-23,-8],[0,-3],[0,16],[-23,12]],'#fffaf0',.6,2);poly([[23,-8],[0,-3],[0,16],[23,12]],'#fffaf0',.6,2);
  for(let k=0;k<3;k++){line(-19,-2+k*5,-5,1+k*5,1.2,'#9a93a8');line(5,1+k*5,19,-2+k*5,1.2,'#9a93a8')}
  g.restore();
}
function sleepyZ(x,y){for(let k=0;k<3;k++){const ph=(time*.8+k/3)%1;g.save();g.globalAlpha=1-ph;txt('z',x+ph*30+k*4,y-ph*50,16+k*6,'#c9e4ff');g.restore()}}
/* ---------- haunted scenery ---------- */
function hscenery(w,h,ground,scroll,scale=1){
  g.fillStyle='#2b2348';g.fillRect(0,0,w,h);
  g.fillStyle='#ffffff';setSeed(7);for(let i=0;i<40;i++){const sx=rnd()*w,sy=rnd()*h*.5;g.globalAlpha=.4+.6*Math.abs(Math.sin(time*2+i));g.fillRect(sx,sy,2,2)}g.globalAlpha=1;
  setSeed(boil*2+5);blob(w*.82,80*scale,46*scale,46*scale,'#fff2b3',1.5,16,3);
  blob(w*.82-14*scale,72*scale,8*scale,6*scale,'#efe0a0',.6,8,0);blob(w*.82+12*scale,92*scale,6*scale,5*scale,'#efe0a0',.6,8,0);
  const span=300*scale,off=(scroll*.3)%span,base=Math.floor(scroll*.3/span);
  for(let i=-1;i<w/span+2;i++){
    const idx=base+i,hx=i*span-off,hy=ground-40*scale;setSeed(boil*7+idx*17+900);
    const hw=150*scale,hh=110*scale+((idx*37)%3)*14*scale;
    poly([[hx,hy],[hx+hw,hy],[hx+hw+4,hy-hh],[hx-4,hy-hh]],'#3f3463',1.6,2.5);
    poly([[hx-16*scale,hy-hh],[hx+hw+16*scale,hy-hh],[hx+hw*.55,hy-hh-70*scale]],'#2a2140',1.6,2.5);
    poly([[hx+hw*.5,hy-hh-40*scale],[hx+hw*.62,hy-hh-40*scale],[hx+hw*.62,hy-hh-95*scale],[hx+hw*.5,hy-hh-95*scale]],'#3f3463',1,2.5);
    for(const [wx,wy] of [[.18,.3],[.62,.3],[.18,.65]]){
      const lit=((idx+Math.floor(wx*10)+Math.floor(time*.5))%3)!==0;
      poly([[hx+hw*wx,hy-hh*(1-wy)],[hx+hw*wx+28*scale,hy-hh*(1-wy)],[hx+hw*wx+28*scale,hy-hh*(1-wy)+24*scale],[hx+hw*wx,hy-hh*(1-wy)+24*scale]],lit?'#ffcf5a':'#211a36',.8,2);
    }
    poly([[hx+hw*.62,hy],[hx+hw*.86,hy],[hx+hw*.86,hy-46*scale],[hx+hw*.62,hy-46*scale]],'#1f1830',.8,2);
    if(idx%2===0){line(hx+hw+50*scale,hy+10*scale,hx+hw+56*scale,hy-120*scale,7,'#1d1a1f');line(hx+hw+54*scale,hy-80*scale,hx+hw+86*scale,hy-110*scale,4,'#1d1a1f');line(hx+hw+55*scale,hy-100*scale,hx+hw+30*scale,hy-130*scale,4,'#1d1a1f')}
  }
  setSeed(boil*7+4);
  poly([[-10,ground-40*scale],[w+10,ground-44*scale],[w+10,h+10],[-10,h+10]],'#4a3f5e',2,3);
  const d=(scroll%90);
  for(let x=-d;x<w+90;x+=90){line(x,ground-36*scale,x,ground-80*scale,5,'#1d1a1f');poly([[x-4,ground-80*scale],[x+4,ground-80*scale],[x,ground-90*scale]],'#1d1a1f',.5,0)}
  line(-10,ground-62*scale,w+10,ground-64*scale,4,'#1d1a1f');
  const pd=(scroll%420);
  for(let x=200-pd;x<w+100;x+=420)pumpkin(x,ground-8*scale,14*scale,0,Math.floor((x+pd)/7));
}
const leaves=Array.from({length:30},()=>({x:Math.random()*960,y:Math.random()*540,v:30+Math.random()*40,c:['#f28a2e','#c8641c','#e0b13a'][Math.random()*3|0],r:Math.random()*6}));
function falling(w,h,dt,drift){
  for(const f of leaves){
    if(!reduce){f.y+=f.v*dt;f.x-=drift*dt+Math.sin(time+f.r)*14*dt}
    if(f.y>h){f.y=-5;f.x=Math.random()*w}if(f.x<-5)f.x=w+5;
    g.save();g.translate(f.x,f.y);g.rotate(time*2+f.r);g.fillStyle=f.c;g.beginPath();g.ellipse(0,0,6,3,0,0,7);g.fill();g.restore();
  }
}

/* ---------- scenery ---------- */
const HOUSE=['#c9b79a','#a9b3a1','#b8a6a0','#9fb0bf','#d0c3a8'];
function scenery(w,h,ground,scroll,scale=1){
  g.fillStyle='#cfdde9';g.fillRect(0,0,w,h);
  const span=250*scale,off=(scroll*.35)%span,base=Math.floor(scroll*.35/span);
  for(let i=-1;i<w/span+2;i++){
    const idx=base+i,hx=i*span-off,hy=ground-38*scale;setSeed(boil*7+idx*13+500);
    const col=HOUSE[((idx%5)+5)%5],hw=170*scale,hh=95*scale;
    poly([[hx,hy],[hx+hw,hy],[hx+hw,hy-hh],[hx,hy-hh]],col,1.2,2.5);
    poly([[hx-14*scale,hy-hh],[hx+hw+14*scale,hy-hh],[hx+hw/2,hy-hh-55*scale]],'#6d6a70',1.2,2.5);
    poly([[hx-10*scale,hy-hh-3],[hx+hw+10*scale,hy-hh-3],[hx+hw/2+8,hy-hh-38*scale],[hx+hw/2-8,hy-hh-40*scale]],'#fbfdff',1.5,2);
    poly([[hx+20*scale,hy],[hx+50*scale,hy],[hx+50*scale,hy-55*scale],[hx+20*scale,hy-55*scale]],'#8a7f93',.8,2);
    poly([[hx+85*scale,hy-40*scale],[hx+140*scale,hy-40*scale],[hx+140*scale,hy-75*scale],[hx+85*scale,hy-75*scale]],'#fff6c9',.8,2);
    line(hx+112*scale,hy-75*scale,hx+112*scale,hy-40*scale,2);
    if(idx%3===0){line(hx+210*scale,hy+8*scale,hx+210*scale,hy-30*scale,3);poly([[hx+198*scale,hy-30*scale],[hx+222*scale,hy-30*scale],[hx+222*scale,hy-46*scale],[hx+198*scale,hy-46*scale]],'#f4f4f4',.6,2.5)}
  }
  setSeed(boil*7+3);
  poly([[-10,ground-40*scale],[w+10,ground-44*scale],[w+10,h+10],[-10,h+10]],'#f7f9fb',2,3);
  const d=(scroll%120);
  for(let x=-d;x<w;x+=120){line(x,ground+28*scale,x+50*scale,ground+29*scale,2,'#b9c4cf')}
}
const flakes=Array.from({length:70},()=>({x:Math.random()*960,y:Math.random()*540,r:1.5+Math.random()*2.5,v:30+Math.random()*50}));
function snow(w,h,dt,drift){
  g.fillStyle='#fff';
  for(const f of flakes){
    if(!reduce){f.y+=f.v*dt;f.x-=drift*dt+Math.sin(time+f.r)*8*dt}
    if(f.y>h){f.y=-5;f.x=Math.random()*w} if(f.x<-5)f.x=w+5;
    g.beginPath();g.arc(f.x%w,f.y,f.r,0,7);g.fill();
  }
}


window.GBS={graydorn,batdorn,charlie,dino,barkLady,molerat,stuffy,jewels,burst,bubble,pumpkin,ghost,snowball,scenery,snow,hscenery,falling,txt,
  setG:function(ctx){g=ctx},tick:function(dt){time+=dt;boil=reduce?0:Math.floor(time*8)},get time(){return time}};
})();
