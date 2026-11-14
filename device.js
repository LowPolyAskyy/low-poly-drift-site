// Device icons (iPhone / iPad / PC / Xbox controller), device detection and gamepad support.
// Shared by every page. Icons are 24x24 fill paths (fill-rule evenodd) so they work in HTML (inline SVG) and on a canvas (Path2D).
(function(){
'use strict';
const ICONS={
 phone:{n:'iPhone',d:'M8 1.5h8A2.8 2.8 0 0 1 18.8 4.3v15.4A2.8 2.8 0 0 1 16 22.5H8a2.8 2.8 0 0 1-2.8-2.8V4.3A2.8 2.8 0 0 1 8 1.5zM8.2 3.2A1.4 1.4 0 0 0 6.8 4.6v14.8a1.4 1.4 0 0 0 1.4 1.4h7.6a1.4 1.4 0 0 0 1.4-1.4V4.6a1.4 1.4 0 0 0-1.4-1.4h-.9a.5.5 0 0 0-.5.5 .8.8 0 0 1-.8.8h-2.8a.8.8 0 0 1-.8-.8.5.5 0 0 0-.5-.5zM10.6 4.1h2.8a.5.5 0 0 1 0 1h-2.8a.5.5 0 0 1 0-1zM10 19.2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z'},
 tablet:{n:'iPad',d:'M6.2 1h11.6A2.4 2.4 0 0 1 20.2 3.4v17.2A2.4 2.4 0 0 1 17.8 23H6.2A2.4 2.4 0 0 1 3.8 20.6V3.4A2.4 2.4 0 0 1 6.2 1zM6.4 3A1 1 0 0 0 5.4 4v16a1 1 0 0 0 1 1h11.2a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM11.2 1.9a.8.8 0 1 1 1.6 0 .8.8 0 0 1-1.6 0z'},
 pc:{n:'PC',d:'M4 3.5h16a1.8 1.8 0 0 1 1.8 1.8v9.9a1.8 1.8 0 0 1-1.8 1.8h-5.2l.6 2.3h2.1a.8.8 0 0 1 0 1.6H6.5a.8.8 0 0 1 0-1.6h2.1l.6-2.3H4a1.8 1.8 0 0 1-1.8-1.8V5.3A1.8 1.8 0 0 1 4 3.5zM4.2 5.2v9.6h15.6V5.2z'},
 pad:{n:'Xbox controller',d:'M7.3 4.6c-.7 0-1.3.2-1.9.6C4.3 6 3.3 8.3 2.6 11.6c-.6 2.9-1 5.3-.2 6.5.6 1 1.7 1.2 2.7.7 1-.5 1.9-1.6 2.7-2.6.4-.5.9-.8 1.5-.8h5.4c.6 0 1.1.3 1.5.8.8 1 1.7 2.1 2.7 2.6 1 .5 2.1.3 2.7-.7.8-1.2.4-3.6-.2-6.5-.7-3.3-1.7-5.6-2.8-6.4-.6-.4-1.2-.6-1.9-.6-.9 0-1.5.5-2.3.5H9.6c-.8 0-1.4-.5-2.3-.5zM12 5.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM6.9 8.3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM6.9 9.3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM15.9 11.9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM15.9 12.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM10 12.6h1.2v1.1h1.1v1.2h-1.1V16H10v-1.1H8.9v-1.2H10zM17.1 6.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM15.1 8.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM19.1 8.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM17.1 10.6a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z'}
};
const ua=navigator.userAgent;
function baseDevice(){
 const nav=navigator,uad=nav.userAgentData||{},touch=(nav.maxTouchPoints||0)>0,minSide=Math.min(screen.width,screen.height);
 let hoverNone=false,coarse=false,fine=false;
 try{hoverNone=matchMedia('(hover:none)').matches;coarse=matchMedia('(pointer:coarse)').matches;fine=matchMedia('(any-pointer:fine)').matches}catch(e){}
 const bySize=()=>minSide>=600?'tablet':'phone';
 if(/iPad/i.test(ua)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1))return 'tablet';   // iPad, also in "desktop site" mode
 if(/iPhone|iPod/i.test(ua))return 'phone';
 // Android, also when the browser asks for the "desktop site" (then the user agent says Linux/X11 with no "Android" in it)
 if(/Android/i.test(ua)||uad.platform==='Android'||/Linux (arm|aarch)/i.test(nav.platform||'')||(touch&&/X11|Linux/i.test(ua)&&!/CrOS/i.test(ua)))return bySize();
 if(/[?&]m=1/.test(location.search))return bySize();
 if(touch&&(hoverNone||(coarse&&!fine)))return bySize();   // touch-only screen
 return 'pc'}
let pad=false;const listeners=[];
function setPad(v){if(pad===v)return;pad=v;const k=DEV.cur();listeners.forEach(f=>{try{f(k)}catch(e){}})}
const DEV={
 icons:ICONS,base:baseDevice(),manual:false,
 cur(){return pad?'pad':this.base},
 label(k){return (ICONS[k]||{}).n||''},
 ok(k){return !!ICONS[k]},
 // inline SVG for HTML
 svg(k,size,style){const i=ICONS[k];if(!i)return '';size=size||18;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" fill-rule="evenodd" role="img" aria-label="${i.n}" style="vertical-align:middle;${style||''}"><title>${i.n}</title><path d="${i.d}"/></svg>`},
 // draw on a canvas 2D context, top-left at x,y
 draw(g,k,x,y,size){const i=ICONS[k];if(!i)return;g.save();g.translate(x,y);g.scale(size/24,size/24);g.fill(new Path2D(i.d),'evenodd');g.restore()},
 onchange(fn){listeners.push(fn)},
 // overlays the controller can navigate; null = the whole page. game.html overrides this.
 navRoots:null
};
window.DEV=DEV;

// the icon follows the last input used: a button on the controller = Controller, a key / touch / click = the real device again
addEventListener('keydown',()=>setPad(false),true);
addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='mouse'||e.pointerType==='pen')setPad(false)},true);

// ---------- gamepad ----------
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dz=v=>Math.abs(v)<.15?0:(v-Math.sign(v)*.15)/.85;
const pressed=(p,i)=>{const b=p.buttons[i];return !!b&&(b.pressed||b.value>.5)};
const val=(p,i)=>{const b=p.buttons[i];return b?(b.value||(b.pressed?1:0)):0};
let prev={},held=false,focusEl=null,lastMove=0,lastDir='';
const inFrame=(()=>{try{return window.top!==window}catch(e){return true}})();   // the page behind the menu is a hidden iframe: it must not read the controller
const st=document.createElement('style');
st.textContent='.padfocus{outline:4px solid #fff!important;outline-offset:3px!important;box-shadow:0 0 0 8px rgba(255,138,76,.85)!important;border-radius:14px}';
(document.head||document.documentElement).appendChild(st);

function getPad(){const l=navigator.getGamepads?navigator.getGamepads():[];for(let i=0;i<l.length;i++)if(l[i]&&l[i].connected)return l[i];return null}
function roots(){
 if(DEV.navRoots)return DEV.navRoots()||[];
 return document.body?[document.body]:[]}
function items(rs){
 const out=[];
 rs.forEach(r=>r.querySelectorAll('button,a[href],input:not([type=hidden]),select,[role=button]').forEach(e=>{
  if(e.disabled)return;const rc=e.getBoundingClientRect();if(rc.width<4||rc.height<4)return;
  const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.pointerEvents==='none')return;out.push(e)}));
 return out}
const ctr=e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
function setFocus(e){if(focusEl)focusEl.classList.remove('padfocus');focusEl=e;if(!e)return;e.classList.add('padfocus');try{e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'})}catch(_){}}
function move(dx,dy,list){
 let cur=list.includes(focusEl)?focusEl:null;
 if(!cur){setFocus(list[0]);return}
 if(dx&&cur.tagName==='INPUT'&&cur.type==='range'){   // sliders: left / right changes the value
  const step=+cur.step||1,mn=+cur.min||0,mx=cur.max===''?100:+cur.max;cur.value=clamp(+cur.value+dx*step*Math.max(1,Math.round((mx-mn)/20/step)),mn,mx);
  cur.dispatchEvent(new Event('input',{bubbles:true}));cur.dispatchEvent(new Event('change',{bubbles:true}));return}
 const c=ctr(cur);let best=null,bs=1e9;
 for(const e of list){if(e===cur)continue;const q=ctr(e),vx=q.x-c.x,vy=q.y-c.y,along=vx*dx+vy*dy;if(along<=2)continue;
  const perp=Math.abs(vx*dy)+Math.abs(vy*dx),s=along+perp*2.2;if(s<bs){bs=s;best=e}}
 if(best)setFocus(best)}
function activate(e){
 if(!e)return;
 if(e.tagName==='SELECT'||(e.tagName==='INPUT'&&/^(text|search|number|email|password|)$/.test(e.type))){e.focus();return}
 e.click()}

DEV.poll=function(touch){
 const out={reset:false,menu:false};
 if(inFrame)return out;
 const p=getPad();
 if(!p){if(held&&touch){touch.sx=0;touch.up=touch.down=touch.brake=0}held=false;prev={};return out}
 const ax=dz(p.axes[0]||0),ay=dz(p.axes[1]||0);
 const dl=pressed(p,14),dr=pressed(p,15),du=pressed(p,12),dd=pressed(p,13);
 const now={a:pressed(p,0),b:pressed(p,1),y:pressed(p,3),start:pressed(p,9)};
 const edge=k=>now[k]&&!prev[k];
 const any=p.buttons.some(b=>b&&b.pressed)||Math.abs(p.axes[0]||0)>.5||Math.abs(p.axes[1]||0)>.5;
 if(any)setPad(true);
 const rs=roots();
 const list=rs.length?items(rs):[];
 if(list.length){
  // ---- menus: d-pad / left stick moves, A = select, B = back ----
  if(held&&touch){touch.sx=0;touch.up=touch.down=touch.brake=0;held=false}
  const dx=dr||ax>.6?1:(dl||ax<-.6?-1:0),dy=dd||ay>.6?1:(du||ay<-.6?-1:0),dir=dx||dy?(dx+','+dy):'',t=performance.now();
  const go=()=>{if(Math.abs(dx)>=Math.abs(dy)&&dx)move(dx,0,list);else if(dy)move(0,dy,list)};
  if(dir){if(dir!==lastDir){lastDir=dir;lastMove=t+260;go()}else if(t>=lastMove){lastMove=t+130;go()}}else lastDir='';
  if(edge('a')){if(!list.includes(focusEl))setFocus(list[0]);else activate(focusEl)}
  if(edge('b')){const b=document.getElementById('back')||document.getElementById('nleave')||document.getElementById('park');if(b&&list.includes(b))b.click()}
  prev=now;return out}
 if(focusEl){focusEl.classList.remove('padfocus');focusEl=null}
 // ---- driving ----
 const sx=clamp(ax+(dr?1:0)-(dl?1:0),-1,1);
 const up=now.a||val(p,7)>.15||ay<-.5||du,down=now.b||val(p,6)>.15||ay>.5||dd,brake=pressed(p,2)||pressed(p,5);
 if(touch){
  if(sx||up||down||brake){touch.sx=sx;touch.up=up;touch.down=down;touch.brake=brake;held=true}
  else if(held){touch.sx=0;touch.up=touch.down=touch.brake=0;held=false}}
 out.reset=edge('y');out.menu=edge('start');
 prev=now;return out};

// pages other than the game have no loop of their own: poll here so the menus work with a controller
(function tick(){if(!DEV.manual)DEV.poll();requestAnimationFrame(tick)})();
})();
