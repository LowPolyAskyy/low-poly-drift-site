// Cloud save client. Account + progress live in our own database (api/cloud.js). Progress = the localStorage keys below.
// cars.js saveProg() calls CLOUD.dirty() -> the save is pushed ~4 s later. CLOUD.sync() (called by the menu) pulls newer cloud data.
const CLOUD=(()=>{
const KEYS=['dn_coins','dn_owned2','dn_car2','dn_elo','dn_wraps','dn_wrapeq','dn_set','dn_name','dr'];
const L=k=>{try{return localStorage.getItem(k)}catch(e){return null}},W=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},D=k=>{try{localStorage.removeItem(k)}catch(e){}};
const base=(window.CLOUD_URL||'')+'/api/cloud';
async function call(a,b){try{const r=await fetch(base,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({a,t:L('dn_tok')},b))});let j={};try{j=await r.json()}catch(e){}j.status=r.status;return j}catch(e){return{status:0,err:'Cannot reach the server'}}}
const snap=()=>{const o={};KEYS.forEach(k=>{const v=L(k);if(v!==null)o[k]=v});return o};
const user=()=>L('dn_user')||'';
const hasProg=()=>!!(L('dn_owned2')||+L('dn_coins')||L('dn_elo'));
let timer=null,busy=false;
const dirty=()=>{if(!user())return;clearTimeout(timer);timer=setTimeout(()=>push(),4000)};
async function push(force){if(!user()||busy)return{};busy=true;let r={};
 try{r=await call('save',{d:snap(),base:force?-1:+(L('dn_sync')||0)});
  if(r.ok){W('dn_sync',String(r.ts));D('dn_dirty')}else if(r.status===401)clear();else if(r.status===409){busy=false;return sync()}}catch(e){}
 busy=false;return r}
function take(r){KEYS.forEach(k=>{if(r.d&&typeof r.d[k]==='string')W(k,r.d[k])});W('dn_sync',String(r.ts));D('dn_dirty');location.reload()}
const parse=(v,f)=>{try{const x=JSON.parse(v);return x===null||x===undefined?f:x}catch(e){return f}};
async function merge(r){const c=r.d||{};
 const mx=k=>String(Math.max(+L(k)||0,+c[k]||0));
 const uni=k=>{const a=parse(L(k),[]),b=parse(c[k],[]);return JSON.stringify([...new Set([].concat(Array.isArray(a)?a:[],Array.isArray(b)?b:[]))])};
 W('dn_coins',mx('dn_coins'));W('dn_elo',mx('dn_elo'));W('dn_owned2',uni('dn_owned2'));W('dn_wraps',uni('dn_wraps'));
 W('dn_wrapeq',JSON.stringify(Object.assign({},parse(c.dn_wrapeq,{}),parse(L('dn_wrapeq'),{}))));   // equipped wraps: this device wins, the cloud fills the gaps
 ['dn_car2','dn_set','dn_name','dr'].forEach(k=>{if(L(k)===null&&typeof c[k]==='string')W(k,c[k])});   // everything else: keep this device
 const p=await push(true);if(p&&p.ok)location.reload()}
async function sync(){if(!user())return{};const r=await call('load');if(r.status===401){clear();return r}if(!r.ok)return r;
 if(!r.d){if(hasProg())await push(true);return r}
 const s=+L('dn_sync')||0;
 if(r.ts===s){if(L('dn_dirty'))await push();return r}
 if(!L('dn_dirty')&&s){take(r);return r}
 if(!hasProg()){take(r);return r}   // nothing on this device yet: just load the cloud save
 // both this device and the cloud have progress: no popup, the two saves are merged so nothing is lost
 await merge(r);
 return r}
function clear(){['dn_tok','dn_user','dn_sync','dn_dirty'].forEach(D)}
async function auth(a,u,p){const r=await call(a,{u,p});if(r.ok){W('dn_tok',r.tok);W('dn_user',r.u);W('dn_sync','0');D('dn_dirty')}return r}
async function logout(){await call('logout');clear()}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&L('dn_dirty')&&user())push()});
return{user,dirty,sync,push,auth,logout}})();
