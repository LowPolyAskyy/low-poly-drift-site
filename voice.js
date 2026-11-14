// Voice chat for online rooms. Peer-to-peer audio (WebRTC) through PeerJS: the free PeerJS cloud only does the signalling,
// so the game server needs no changes. Everybody in a room who joins voice calls the others; peer id = room code + player id.
// Settings (settings.html): SET.vcOn (feature on/off), SET.vcVol (voice volume), SET.vcPtt (push-to-talk with V), SET.mic (input device).
// game.html calls VC.update(myId, roomCode, otherPlayerIds, {id:name}) on every player-list change and VC.leave() when leaving.
// For tests / self-hosting set window.PEER_CFG = {host,port,path,secure} and window.PEERJS_SRC before this script runs.
(function(){
const SRC=window.PEERJS_SRC?[window.PEERJS_SRC]:['peerjs.min.js','https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js','https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js']  // own copy first, CDNs only as a fallback;
const S=()=>(typeof SET!=='undefined'?SET:{vcOn:true,vcVol:1,vcPtt:false,mic:''});
let me='',room='',others=[],names={},peer=null,stream=null,joined=false,joining=false,muted=false,pttDown=false,ui=null;
const calls={},audios={},meters={};let ac=null,tick=null,retry=null;
// The PeerJS cloud keeps an id "busy" for a while after a refresh / after pressing X, so rejoining could fail with "id unavailable".
// Fix: if my id is still held I take the next slot ('', -b, -c, -d); everybody else simply calls all slots of every player.
const SLOTS=['','-b','-c','-d'];
const pid=(r,i,k)=>('ldpv1-'+r+'-'+i+(SLOTS[k||0]||'')).replace(/[^A-Za-z0-9_-]/g,'_');
const idOf=p=>others.find(o=>SLOTS.some((_,k)=>pid(room,o,k)===p));
const closeCalls=e=>{if(e)(e.cs||[e.c]).forEach(c=>{try{c&&c.close()}catch(_){}})};
const killAudio=id=>{if(audios[id]){audios[id].srcObject=null;audios[id].remove();delete audios[id];delete meters[id];list()}};

function build(){
  if(ui)return;
  const d=document.createElement('div');d.id='vc';
  d.style.cssText='position:fixed;left:10px;top:46%;z-index:6;display:none;flex-direction:column;gap:6px;align-items:flex-start;font:600 13px "Century Gothic",Futura,"Trebuchet MS",sans-serif;color:#fbeed8;pointer-events:none';
  d.innerHTML='<div style="display:flex;gap:6px;pointer-events:auto"><button id="vcb" style="border:0;border-radius:99px;padding:10px 14px;font:inherit;font-size:14px;cursor:pointer;background:rgba(34,26,30,.85);color:#fbeed8"></button><button id="vcx" style="display:none;border:0;border-radius:99px;padding:10px 12px;font:inherit;font-size:14px;cursor:pointer;background:rgba(34,26,30,.85);color:#ffb0a0" title="Leave voice chat">&#10005;</button></div><div id="vcl" style="display:flex;flex-direction:column;gap:3px;text-shadow:0 1px 4px #000"></div>';
  document.body.appendChild(d);ui=d;
  d.querySelector('#vcb').onclick=()=>{if(!joined)join();else{muted=!muted;applyMute();paint()}};
  d.querySelector('#vcx').onclick=()=>stop(true);
}
function paint(msg){
  if(!ui)return;const b=ui.querySelector('#vcb'),x=ui.querySelector('#vcx');
  b.textContent=msg||(joining?'Connecting...':!joined?'\u{1F3A4} Join voice':muted?'\u{1F507} Muted':S().vcPtt?'\u{1F3A4} Hold V to talk':'\u{1F3A4} Mic on');
  b.style.background=joined&&!muted?'rgba(40,120,70,.9)':'rgba(34,26,30,.85)';x.style.display=joined?'':'none'}
function applyMute(){if(!stream)return;const on=!muted&&(!S().vcPtt||pttDown);stream.getAudioTracks().forEach(t=>t.enabled=on)}
addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&e.target.tagName!=='INPUT'&&S().vcPtt&&joined){pttDown=true;applyMute();paint()}});
addEventListener('keyup',e=>{if(e.code==='KeyV'&&S().vcPtt){pttDown=false;applyMute()}});

function loadPeerJS(){
  if(window.Peer)return Promise.resolve();
  return new Promise((res,rej)=>{let i=0;const next=()=>{if(i>=SRC.length)return rej(new Error('PeerJS not reachable'));const s=document.createElement('script');s.src=SRC[i++];s.onload=res;s.onerror=()=>{s.remove();next()};document.head.appendChild(s)};next()})}
async function join(){
  if(joined||joining||!room)return;joining=true;paint();
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw Object.assign(new Error('no mediaDevices'),{name:'NotSupportedError'});
    const mic=S().mic;
    stream=await navigator.mediaDevices.getUserMedia({audio:Object.assign({echoCancellation:true,noiseSuppression:true,autoGainControl:true},mic?{deviceId:{exact:mic}}:{})});
  }catch(e){joining=false;const n=e&&e.name;console.warn('voice: microphone error',n,e&&e.message);
    paint(n==='NotAllowedError'||n==='SecurityError'?(window.IN_APP||window.top!==window?'Mic blocked: allow it in the app':'Mic blocked'):n==='NotSupportedError'?'Mic not supported here':n==='NotFoundError'||n==='OverconstrainedError'?'No microphone':'Mic error: '+(n||'?'));setTimeout(()=>paint(),4000);return}
  try{await loadPeerJS()}catch(e){stopStream();joining=false;paint('Voice unavailable');setTimeout(()=>paint(),2500);return}
  applyMute();
  startPeer(0)}
function startPeer(k){
  const p=new Peer(pid(room,me,k),window.PEER_CFG||{});peer=p;
  p.on('open',()=>{if(peer!==p)return;joined=true;joining=false;paint();meter('me',stream);connectAll();clearInterval(retry);retry=setInterval(()=>{connectAll();kick()},4000)});
  p.on('call',onCall);
  p.on('error',e=>{if(e.type==='peer-unavailable')return;if(peer!==p)return;console.warn('voice: peer error',e.type);
    if(!joined){
      if(e.type==='unavailable-id'&&k<SLOTS.length-1){peer=null;try{p.destroy()}catch(_){}startPeer(k+1);return}   // old id still held by the server: take the next slot
      joining=false;stopPeer();stopStream();paint(e.type==='unavailable-id'?'Voice busy, try again in a few seconds':'Voice error');setTimeout(()=>paint(),3000);return}
    if(['network','server-error','socket-error','socket-closed'].includes(e.type))setTimeout(()=>{try{if(peer===p&&!p.destroyed&&p.disconnected)p.reconnect()}catch(_){}},3000)});
  p.on('disconnected',()=>{try{if(peer===p&&!p.destroyed)p.reconnect()}catch(_){}});
  p.on('close',()=>{if(peer!==p)return;stopPeer();stopStream();joined=joining=false;paint('Voice lost, tap to rejoin');setTimeout(()=>paint(),3000)});
}
function connectAll(){
  if(!joined||!peer||peer.destroyed)return;
  const now=Date.now();
  others.forEach(id=>{const c=calls[id];
    if(c&&(c.got||now-c.t<6000))return;
    closeCalls(c);delete calls[id];
    const cs=SLOTS.map((_,k)=>peer.call(pid(room,id,k),stream)).filter(Boolean);   // the player may be on any slot: the one that answers wins
    calls[id]={c:null,cs,dir:'out',t:now,got:false};
    cs.forEach(call=>hook(call,id))})}
function hook(c,id){
  c.on('stream',s=>{const e=calls[id];if(!e||!(e.c===c||(e.cs&&e.cs.includes(c))))return;
    const others_=(e.cs||[]).filter(o=>o!==c);e.got=true;e.c=c;e.cs=[c];others_.forEach(o=>{try{o.close()}catch(_){}});play(id,s)});
  c.on('close',()=>drop(id,c));c.on('error',()=>drop(id,c))}
function onCall(c){
  const id=idOf(c.peer);if(!id||!joined){try{c.close()}catch(_){}return}
  const ex=calls[id];
  if(ex&&ex.c!==c){
    if(ex.got&&ex.dir==='out'){try{c.close()}catch(_){}return}              // already talking through my own call
    if(ex.dir==='out'&&me<id){try{c.close()}catch(_){}return}                // both called at once: the lower id keeps its call
    closeCalls(ex);delete calls[id]}
  c.answer(stream);calls[id]={c:null,cs:[c],dir:'in',t:Date.now(),got:false};hook(c,id)}
function drop(id,c){const e=calls[id];
  if(e&&e.c===c){delete calls[id];killAudio(id)}
  else if(e&&e.cs){e.cs=e.cs.filter(x=>x!==c);if(!e.got&&!e.cs.length)delete calls[id]}
  else if(!e)killAudio(id)}
function play(id,s){
  let a=audios[id];if(!a){a=audios[id]=new Audio();a.autoplay=true;document.body.appendChild(a);a.style.display='none'}
  a.srcObject=s;a.muted=false;a.volume=Math.max(0,Math.min(1,+S().vcVol||0));a.setAttribute('playsinline','');
  const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{});meter(id,s)}
// Incoming audio can be blocked by the browser/WebView until the user touches the page: retry on every tap/key and on a timer
function kick(){try{if(ac&&ac.state==='suspended')ac.resume()}catch(_){}
  for(const id in audios){const a=audios[id];a.muted=false;a.volume=Math.max(0,Math.min(1,+S().vcVol||0));if(a.srcObject&&a.paused){const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{})}}}
['pointerdown','touchstart','keydown','click'].forEach(ev=>addEventListener(ev,kick,{passive:true,capture:true}));
// speaking indicator (analyser on each stream)
function meter(id,s){
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume().catch(()=>{});const an=ac.createAnalyser();an.fftSize=256;ac.createMediaStreamSource(s).connect(an);
    meters[id]={an,buf:new Uint8Array(an.frequencyBinCount),on:false};if(!tick)tick=setInterval(lvl,150)}catch(_){}}
function lvl(){let ch=false;
  for(const id in meters){const m=meters[id];m.an.getByteFrequencyData(m.buf);let v=0;for(let i=0;i<m.buf.length;i++)v+=m.buf[i];v/=m.buf.length;
    const on=v>14&&!(id==='me'&&(muted||(S().vcPtt&&!pttDown)));if(on!==m.on){m.on=on;ch=true}}
  if(ch)list()}
function list(){if(!ui)return;ui.querySelector('#vcl').innerHTML=Object.keys(meters).filter(k=>meters[k].on).map(k=>'<span>\u{1F50A} '+esc(k==='me'?'You':(names[k]||'Player'))+'</span>').join('')}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function stopStream(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null}
function stopPeer(){clearInterval(retry);retry=null;for(const id in calls){closeCalls(calls[id]);delete calls[id]}
  for(const id in audios){audios[id].srcObject=null;audios[id].remove();delete audios[id]}for(const k in meters)delete meters[k];
  if(peer){try{peer.destroy()}catch(_){}peer=null}}
function stop(keepUI){stopPeer();stopStream();joined=joining=false;muted=false;list();if(keepUI)paint()}

addEventListener('pagehide',()=>{try{if(peer)peer.destroy()}catch(_){}});
window.VC={
  update(myId,roomCode,otherIds,nameMap){
    if(!S().vcOn){this.leave();return}
    build();ui.style.display='flex';
    if(joined&&(myId!==me||roomCode!==room))stop(true);
    me=String(myId);room=String(roomCode||'room');others=(otherIds||[]).map(String);names=nameMap||{};
    for(const id in calls)if(!others.includes(id)){closeCalls(calls[id]);delete calls[id];killAudio(id);delete meters[id]}
    list();paint();if(joined)connectAll()},
  leave(){stop(false);if(ui)ui.style.display='none'},
  get joined(){return joined}
};
})();
