// Cloud save API for Low Poly Drift (Vercel serverless function). Database: Redis over REST (Upstash, free tier).
// Env vars (set automatically when you connect Upstash Redis from the Vercel Storage tab): KV_REST_API_URL + KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// Keys: u:<name> account | t:<token> session | s:<name> save {ts,d} | rl:<ip>:<bucket> rate limit
const crypto=require('crypto');
// Vercel names the variables <PREFIX>_REST_API_URL / _TOKEN (default prefix KV) or UPSTASH_REDIS_REST_URL / _TOKEN: accept any prefix.
const E=Object.keys(process.env),fe=re=>{const k=E.find(x=>re.test(x)&&!/READ_ONLY/.test(x));return k?process.env[k]:''};
const DB=fe(/(REST_API_URL|REDIS_REST_URL)$/),TK=fe(/(REST_API_TOKEN|REDIS_REST_TOKEN)$/);
const R=async c=>{const r=await fetch(DB,{method:'POST',headers:{Authorization:'Bearer '+TK},body:JSON.stringify(c)});const j=await r.json();if(j.error)throw new Error(j.error);return j.result};
const jget=async k=>{const v=await R(['GET',k]);try{return v?JSON.parse(v):null}catch(e){return null}};
const scrypt=(p,s)=>new Promise((ok,no)=>crypto.scrypt(p,s,32,(e,k)=>e?no(e):ok(k.toString('hex'))));
const KEYS=['dn_coins','dn_owned2','dn_car2','dn_elo','dn_wraps','dn_wrapeq','dn_set','dn_name','dr'];
function clean(d){if(!d||typeof d!=='object')return null;const o={};let n=0;
 for(const k of KEYS)if(typeof d[k]==='string'){if(d[k].length>30000)return null;o[k]=d[k];n+=d[k].length}
 if(n>80000)return null;
 if(o.dn_coins!==undefined&&!(+o.dn_coins>=0&&+o.dn_coins<=1e9))return null;
 if(o.dn_elo!==undefined&&!(+o.dn_elo>=0&&+o.dn_elo<=9999))return null;
 for(const k of ['dn_owned2','dn_wraps','dn_wrapeq','dn_set','dr'])if(o[k]!==undefined)try{JSON.parse(o[k])}catch(e){return null}
 return o}
const token=async()=>{const t=crypto.randomBytes(24).toString('hex');return t};
async function limited(req){const ip=String(req.headers['x-forwarded-for']||'x').split(',')[0].trim(),k='rl:'+ip+':'+Math.floor(Date.now()/6e5);
 const n=await R(['INCR',k]);await R(['EXPIRE',k,700]);return n>20}
async function session(t){if(!t||typeof t!=='string'||t.length!==48)return null;return R(['GET','t:'+t])}
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS')return res.status(204).end();
 if(req.method!=='POST')return res.status(405).json({err:'POST only'});
 if(!DB||!TK)return res.status(500).json({err:'Database not configured'});
 let b=req.body;if(typeof b==='string')try{b=JSON.parse(b)}catch(e){b=null}
 if(!b||typeof b!=='object')return res.status(400).json({err:'Bad request'});
 try{
  const a=b.a;
  if(a==='register'||a==='login'){
   if(await limited(req))return res.status(429).json({err:'Too many attempts, try again in a few minutes'});
   const u=String(b.u||'').toLowerCase().trim(),p=String(b.p||'');
   if(!/^[a-z0-9_]{3,16}$/.test(u))return res.status(400).json({err:'Username: 3-16 letters, numbers or _'});
   if(p.length<6||p.length>64)return res.status(400).json({err:'Password: 6-64 characters'});
   if(a==='register'){const salt=crypto.randomBytes(16).toString('hex'),h=await scrypt(p,salt);
    const ok=await R(['SET','u:'+u,JSON.stringify({salt,h,c:Date.now()}),'NX']);
    if(!ok)return res.status(409).json({err:'That username is taken'})}
   else{const acc=await jget('u:'+u);const h=acc?await scrypt(p,acc.salt):'';
    if(!acc||!crypto.timingSafeEqual(Buffer.from(h),Buffer.from(acc.h)))return res.status(401).json({err:'Wrong username or password'})}
   const t=await token();await R(['SET','t:'+t,u,'EX',5184000]);
   return res.json({ok:1,tok:t,u})}
  const name=await session(b.t);
  if(!name)return res.status(401).json({err:'Session expired, sign in again'});
  if(a==='logout'){await R(['DEL','t:'+b.t]);return res.json({ok:1})}
  if(a==='load'){const s=await jget('s:'+name);return res.json({ok:1,u:name,ts:s?s.ts:0,d:s?s.d:null})}
  if(a==='save'){const d=clean(b.d);if(!d)return res.status(400).json({err:'Invalid save data'});
   const cur=await jget('s:'+name),cts=cur?cur.ts:0;
   if(+b.base!==-1&&+b.base!==cts)return res.status(409).json({err:'Cloud save changed on another device',ts:cts});
   const ts=Math.max(Date.now(),cts+1);await R(['SET','s:'+name,JSON.stringify({ts,d})]);
   return res.json({ok:1,ts})}
  return res.status(400).json({err:'Unknown action'});
 }catch(e){return res.status(500).json({err:'Server error'})}};
