// 3D car models, shared by the Garage (shop.html) and the game (game.html).
// Needs three.js (r128) and cars.js (RANKS) loaded first.
// buildCar(type, parent, wrapId) builds the car for RANKS[type] and adds it to `parent` (if given).
// Models are picked by RANKS[type].k. flameTick() animates rocket flames and police lights (call it every frame).
(function(){
const mat=c=>new THREE.MeshPhongMaterial({color:c,flatShading:true,shininess:0,specular:0});
function shape(pts,w,m){
  const s=new THREE.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
  const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.translate(0,0,-w/2);g.rotateY(-Math.PI/2);
  const me=new THREE.Mesh(g,m);me.castShadow=true;return me;
}

// ---------- wraps: patterns are drawn in the fragment shader from per-vertex car-space positions ('cpos'), so they line up across every body part ----------
const WRAP_TIME={value:0};
const WV_HEAD='attribute vec3 cpos;varying vec3 vCp;',WV_MAIN='vCp=cpos;';
const WF_HEAD=`uniform float uPat,uS,uDark,uTime;uniform vec3 uC2,uC3;varying vec3 vCp;
float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1.,0.,0.)),f.x),mix(h3(i+vec3(0.,1.,0.)),h3(i+vec3(1.,1.,0.)),f.x),f.y),
            mix(mix(h3(i+vec3(0.,0.,1.)),h3(i+vec3(1.,0.,1.)),f.x),mix(h3(i+vec3(0.,1.,1.)),h3(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
vec3 hsv(float h,float s,float v){vec3 k=clamp(abs(fract(h+vec3(0.,.6667,.3333))*6.-3.)-1.,0.,1.);return v*mix(vec3(1.),k,s);}`;
const WF_MAIN=`{
vec3 P=vCp*uS;vec3 dk=vec3(.1,.085,.075);
vec3 k1=diffuseColor.rgb,k2=mix(uC2,dk,uDark),k3=mix(uC3,dk,uDark);
float a=0.,b=0.,gm=0.,st=0.,rb=0.;vec3 rc=vec3(0.),gc=vec3(1.);
if(abs(uPat-1.)<.5){float x=abs(P.x);a=step(x,.17);b=step(.27,x)*step(x,.35);}
else if(abs(uPat-2.)<.5){a=mod(floor(P.x/.45)+floor(P.y/.45)+floor(P.z/.45),2.);}
else if(abs(uPat-3.)<.5){a=step(.5,fract((P.y+P.z*.75+P.x*.25)*1.2));}
else if(abs(uPat-4.)<.5){a=step(.5,n3(P*2.));b=step(.57,n3(P*3.7+11.));}
else if(abs(uPat-5.)<.5){a=step(length(fract(P*2.2)-.5),.27);}
else if(abs(uPat-6.)<.5){a=step(.5,fract(P.z*1.5+abs(fract(P.y*1.6+P.x*.5)-.5)*1.4));}
else if(abs(uPat-7.)<.5){float f=.5+.5*sin(P.z*4.6+sin(P.z*1.7)*2.);f=f*f;a=step(P.y,.42+f*.85+.12*sin(P.z*9.+P.x*3.));b=step(P.y,.42+f*.45);}
else if(abs(uPat-8.)<.5){a=mod(floor(P.z*7.)+floor((P.y+P.x)*7.),2.);b=step(.88,fract(P.z*7.))*.6;}
else if(abs(uPat-9.)<.5){float t=clamp((P.y-.4)/1.25*.75+(P.z+2.3)/4.6*.25,0.,1.);a=smoothstep(.1,.95,t);b=exp(-pow((t-.5)*3.4,2.))*.85;}
else if(abs(uPat-10.)<.5){float n=n3(P*1.6)*.6+n3(P*3.3+4.)*.4;a=smoothstep(.42,.78,n);b=smoothstep(.55,.9,n3(P*2.7+9.))*.85;st=step(.987,h3(floor(P*15.)));gm=st;}
else if(abs(uPat-11.)<.5){rb=1.;rc=mix(hsv(fract(P.z*.22+P.y*.18+uTime*.12),.85,1.),dk,uDark);}
else if(abs(uPat-12.)<.5){a=step(.55,fract(P.z*2.4+n3(P*1.9+3.)*3.2+P.y*.6));}
else if(abs(uPat-13.)<.5){a=step(.78,fract(P.z*1.4));b=step(.8,fract(P.y*2.+P.x*.8));}
else if(abs(uPat-14.)<.5){a=step(.5,fract(P.z*2.2+sin(P.y*5.+P.x*3.)*.6+P.y));}
else if(abs(uPat-15.)<.5){vec2 q=vec2(P.z*1.1,P.y*2.1);float d=abs(fract(q.x)-.5)+abs(fract(q.y)-.5);a=step(d,.5);b=step(abs(d-.5),.05);}
else if(abs(uPat-16.)<.5){float l=max(step(fract(P.z*1.8),.07),max(step(fract(P.y*2.6),.07),step(fract(P.x*2.2),.07)));a=l;b=step(fract(P.z*.9+.45),.04)*(1.-l);gm=max(l,b);gc=mix(uC2,uC3,b);}
else if(abs(uPat-17.)<.5){vec2 q=vec2(P.z,P.y+P.x*.6)*2.2;vec2 r=vec2(1.,1.732),h=r*.5;vec2 a1=mod(q,r)-h,b1=mod(q-h,r)-h;vec2 g=dot(a1,a1)<dot(b1,b1)?a1:b1;vec2 pg=abs(g);float d=max(dot(pg,vec2(.5,.866)),pg.x);a=step(.43,d);b=step(.36,d)*(1.-a)*.35;}
else if(abs(uPat-18.)<.5){vec3 cI=floor(P*2.6),f=fract(P*2.6)-.5;a=step(.5,h3(cI))*step(length(f),.2);b=step(.85,h3(cI+7.))*step(length(f),.1);gm=b*.8;gc=uC3;}
else if(abs(uPat-19.)<.5){a=step(.5,fract(P.z*1.1-abs(fract(P.y*1.3)-.5)*1.5-abs(P.x)*.8));}
else if(abs(uPat-20.)<.5){float n=n3(P*2.4),n2=n3(P*4.1+5.);a=step(.56,n)*(1.-step(.68,n));b=step(.6,n2)*(1.-step(.7,n2))*(1.-a);}
else if(abs(uPat-21.)<.5){float r=h3(floor(P*3.5));a=step(.33,r);b=step(.66,r);}
else if(abs(uPat-22.)<.5){float w=sin(P.z*1.6+uTime*.6)*.5+sin(P.y*3.+P.x*2.+uTime*.9)*.5;a=smoothstep(-.6,.8,w);b=smoothstep(.3,1.,sin(P.z*2.7-uTime*.7+P.y*2.))*.7;gm=b*.35;gc=uC3;}
else if(abs(uPat-23.)<.5){float n=n3(P*2.2);float cr=1.-smoothstep(0.,.07,abs(n-.5));a=cr;b=cr*cr;gm=cr;gc=mix(uC2,uC3,b);}
else if(abs(uPat-24.)<.5){rb=1.;rc=mix(hsv(fract(P.z*.15+P.y*.25+P.x*.2+uTime*.07+n3(P*1.5)*.3),.45,1.),dk,uDark);}
vec3 col=mix(k1,k2,clamp(a,0.,1.));col=mix(col,k3,clamp(b,0.,1.));col=mix(col,vec3(1.),st);col=mix(col,rc,rb);
diffuseColor.rgb=col;totalEmissiveRadiance+=gc*gm*(1.-uDark);
}`;
function applyWrap(root,tilt,bodyM,wid){
  const w=wid&&typeof WRAP_BY!=='undefined'&&WRAP_BY[wid];if(!w)return;
  bodyM.userData.base=w.c[0];bodyM.color.setHex(w.c[0]);
  if(w.m){bodyM.shininess=w.m[0];bodyM.specular.setHex(w.m[1])}
  if(!w.p)return;
  root.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(tilt.matrixWorld).invert(),m=new THREE.Matrix4(),v=new THREE.Vector3();
  tilt.traverse(o=>{if(!o.isMesh||o.material!==bodyM)return;const g=o.geometry,p=g.attributes.position;if(!p)return;
    m.multiplyMatrices(inv,o.matrixWorld);const a=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);a[i*3]=v.x;a[i*3+1]=v.y;a[i*3+2]=v.z}
    g.setAttribute('cpos',new THREE.BufferAttribute(a,3))});
  const U={uPat:{value:w.p},uS:{value:w.s},uC2:{value:new THREE.Color(w.c[1])},uC3:{value:new THREE.Color(w.c[2])},uDark:{value:0},uTime:WRAP_TIME};
  bodyM.userData.wu=U;
  bodyM.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+WV_HEAD).replace('#include <begin_vertex>','#include <begin_vertex>\n'+WV_MAIN);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+WF_HEAD).replace('#include <color_fragment>','#include <color_fragment>\n'+WF_MAIN)};
  bodyM.needsUpdate=true;
}
const FLAMES=[],FLASH=[];
function flameTick(){
  WRAP_TIME.value=performance.now()/1000;
  for(let i=FLAMES.length-1;i>=0;i--){const f=FLAMES[i];if(!f.root.parent){FLAMES.splice(i,1);continue}f.m.scale.set(.85+.3*Math.random(),.7+.6*Math.random(),.85+.3*Math.random())}
  const ph=Math.floor(performance.now()/150)%2;
  for(let i=FLASH.length-1;i>=0;i--){const f=FLASH[i];if(!f.root.parent){FLASH.splice(i,1);continue}f.a.color.setHex(ph?0xff2020:0x3a0a0a);f.b.color.setHex(ph?0x0a0a3a:0x2f6bff)}
}
function buildCar(T=0,parent,wrapId){
const R=RANKS[T],root=new THREE.Group(),tilt=new THREE.Group(),piv=new THREE.Group();piv.position.y=.8;tilt.position.y=-.8;piv.add(tilt);root.add(piv);if(parent)parent.add(root);
const bodyM=mat(R.c),darkM=mat(0x22262c),black=mat(0x0c0d10),white=mat(0xfafafa);
const glassM=new THREE.MeshPhongMaterial({color:0x1b2733,shininess:90,specular:0x88aacc,flatShading:true});
const glow=c=>new THREE.MeshBasicMaterial({color:c});
let host=tilt; // parent of the parts added by box/cyl/sph/sh (the monster truck lifts its body)
const box=(w,h,d,m,x,y,z,rx,rz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);if(rx)b.rotation.x=rx;if(rz)b.rotation.z=rz;b.castShadow=true;host.add(b);return b};
const cyl=(rt,rb,h,m,x,y,z,ax)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,10),m);c.position.set(x,y,z);if(ax==='z')c.rotation.x=Math.PI/2;else if(ax==='x')c.rotation.z=Math.PI/2;c.castShadow=true;host.add(c);return c};
const sph=(r,m,x,y,z)=>{const s=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),m);s.position.set(x,y,z);s.castShadow=true;host.add(s);return s};
const sh=(pts,w,m)=>{const s=shape(pts,w,m);host.add(s);return s};
const lights=(c,y,z,w)=>[-1,1].forEach(s=>box(w||.34,.16,.06,glow(c||0xfff2b0),s*.68,y||.78,z||2.1));
const tail=(y,z)=>box(1.7,.12,.05,glow(0xff3a30),0,y||.88,z||-2.11);
const roundLights=(y,z,x,r,c)=>[-1,1].forEach(s=>cyl(r,r,.1,glow(c||0xfff2b0),s*x,y,z,'z'));
const chrome=new THREE.MeshPhongMaterial({color:0xdde2ea,shininess:80,flatShading:true});
const exhaust=z=>[-1,1].forEach(s=>{const ex=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.35,8),chrome);ex.rotation.x=Math.PI/2;ex.position.set(s*.55,.48,z);tilt.add(ex)});
// wheel layout: [side, z, optional size multiplier]; ws = base wheel size, wx = wheel x spread, tw = tyre width
let wp=[[-1,1.35],[1,1.35],[-1,-1.3],[1,-1.3]],ws=1,wx=1,tw=1;
const wedge=(accent,wingM)=>{
  tilt.add(shape([[-2.2,.4],[-2.2,.85],[-.9,1.05],[.3,1.0],[2.2,.6],[2.2,.4]],2.0,bodyM));
  tilt.add(shape([[-1.0,1.0],[-.55,1.38],[.35,1.36],[.95,.98]],1.6,glassM));
  box(1.4,.06,1.0,bodyM,0,1.4,-.1);
  box(2.5,.08,.65,wingM,0,1.6,-2.1);
  [-1,1].forEach(s=>{box(.08,.55,.5,darkM,s*.9,1.28,-2.05);box(.04,.3,1.0,black,s*1.02,.85,-.3);box(.04,.07,3.7,glow(accent),s*1.02,.55,0)});
  box(2.0,.08,.5,darkM,0,.38,2.15);box(2.0,.08,.5,darkM,0,.38,-2.1);
  lights(accent,.72,2.2,.5);tail(.8,-2.21);exhaust(-2.25);
};
// four-door city car, shared by the taxi and the police car
const sedan=()=>{
  sh([[-2.0,.4],[-2.0,1.0],[1.4,1.05],[2.0,.85],[2.0,.4]],1.85,bodyM);
  sh([[-1.5,1.0],[-1.2,1.55],[.7,1.55],[1.2,1.0]],1.65,glassM);
  box(1.5,.08,1.9,bodyM,0,1.57,-.25);
  box(1.9,.1,.35,darkM,0,.42,2.0);box(1.9,.1,.35,darkM,0,.42,-2.0);
  lights(null,.85,2.01,.3);tail(.9,-2.01);
  wp=[[-1,1.3],[1,1.3],[-1,-1.3],[1,-1.3]];ws=.95;
};
// tall van, shared by the camper and the ice cream van
const van=(bandM,roofM)=>{
  sh([[-2.0,.4],[-2.0,1.95],[1.5,1.95],[2.0,1.45],[2.0,.4]],1.9,bodyM);
  box(1.94,.26,3.96,bandM,0,.85,0);
  box(1.95,.42,3.0,glassM,0,1.5,-.35);
  box(1.7,.6,.04,glassM,0,1.72,1.77,-Math.PI/4);
  box(1.95,.1,3.5,roofM,0,1.97,-.25);
  roundLights(.95,2.02,.65,.2);box(.22,.22,.04,chrome,0,1.15,2.02);
  box(2.0,.15,.2,chrome,0,.5,2.05);box(2.0,.15,.2,chrome,0,.5,-2.05);
  [-1,1].forEach(s=>box(.15,.35,.05,glow(0xff3a30),s*.9,1.0,-2.01));
  wp=[[-1,1.35],[1,1.35],[-1,-1.3],[1,-1.3]];ws=.95;
};
// pickup truck, also used (lifted) by the monster truck
const pickup=()=>{
  box(2.0,.7,4.8,bodyM,0,.75,0);
  sh([[-1.1,1.1],[-.85,1.75],[.1,1.75],[.5,1.1]],1.8,glassM);
  box(1.85,.08,.95,bodyM,0,1.77,-.375);
  box(.7,.12,1.2,black,0,1.16,1.5);
  [-1,1].forEach(s=>{box(.12,.4,1.3,bodyM,s*.94,1.3,-1.75);box(.07,.5,.07,darkM,s*.8,1.5,-1.15)});
  box(2.0,.4,.12,bodyM,0,1.3,-2.34);box(2.0,.4,.12,bodyM,0,1.3,-1.14);box(1.7,.04,1.2,darkM,0,1.12,-1.75);box(1.7,.07,.07,darkM,0,1.77,-1.15);
  box(1.2,.1,.12,glow(0xffe9a0),0,1.84,0);
  box(1.1,.35,.06,black,0,.85,2.42);[-1,1].forEach(s=>{box(.45,.18,.06,glow(0xfff2b0),s*.72,.9,2.42);box(.3,.2,.05,glow(0xff3a30),s*.85,.95,-2.41)});
  box(2.05,.2,.25,chrome,0,.52,2.45);box(2.05,.18,.2,chrome,0,.5,-2.42);
  [-1,1].forEach(s=>[1.5,-1.5].forEach(z=>box(.14,.1,1.1,darkM,s*1.04,1.1,z)));
};
const K=R.k;
if(K=='fiat'){ // round retro city car
  sh([[-1.55,.4],[-1.7,.75],[-1.55,1.05],[1.2,1.05],[1.65,.85],[1.7,.55],[1.6,.4]],1.75,bodyM);
  sh([[-1.3,1.0],[-1.1,1.55],[.35,1.62],[.85,1.0]],1.62,glassM);
  box(1.5,.08,1.45,bodyM,0,1.64,-.37);
  box(1.8,.1,.12,chrome,0,.5,1.72);box(1.8,.1,.12,chrome,0,.5,-1.72);
  [-1,1].forEach(s=>{cyl(.21,.21,.12,chrome,s*.6,.85,1.68,'z');cyl(.15,.15,.14,glow(0xfff2b0),s*.6,.85,1.69,'z');cyl(.1,.1,.1,glow(0xff3a30),s*.6,.85,-1.7,'z');sph(.1,bodyM,s*.92,1.2,.55)});
  box(.9,.04,.05,chrome,0,.7,1.7);
  wp=[[-1,1.0],[1,1.0],[-1,-1.0],[1,-1.0]];ws=.85;
}else if(K=='golf'){ // squared hot hatch
  sh([[-1.9,.4],[-1.9,1.05],[1.2,1.05],[1.95,.85],[1.95,.4]],1.85,bodyM);
  sh([[-1.85,1.0],[-1.75,1.6],[.5,1.6],[1.05,1.0]],1.7,glassM);
  box(1.65,.08,2.25,bodyM,0,1.62,-.62);
  box(1.6,.07,.3,bodyM,0,1.66,-1.85);
  box(1.3,.2,.06,black,0,.78,1.96);box(1.3,.04,.07,glow(0xff2020),0,.88,1.97);box(1.1,.15,.07,black,0,.55,1.97);
  [-1,1].forEach(s=>{box(.45,.12,.06,glow(0xfff2b0),s*.7,.95,1.95);box(.15,.4,.06,glow(0xff3a30),s*.8,.95,-1.91)});
  box(1.9,.1,.3,darkM,0,.42,1.9);box(1.9,.1,.3,darkM,0,.42,-1.9);
  [-1,1].forEach(s=>cyl(.07,.07,.3,chrome,s*.55,.48,-2.0,'z'));
  wp=[[-1,1.2],[1,1.2],[-1,-1.2],[1,-1.2]];ws=.92;
}else if(K=='giulia'){ // sleek sport sedan
  sh([[-2.1,.4],[-2.1,.95],[-1.0,1.05],[1.0,1.0],[2.1,.7],[2.1,.4]],1.9,bodyM);
  sh([[-1.2,1.0],[-.75,1.5],[.55,1.5],[1.1,1.0]],1.65,glassM);
  box(1.55,.08,1.3,bodyM,0,1.52,-.1);
  box(.5,.34,.04,chrome,0,.68,2.08);box(.42,.26,.06,black,0,.68,2.1);
  [-1,1].forEach(s=>{box(.55,.18,.06,black,s*.7,.5,2.1);box(.5,.1,.05,glow(0xfff2b0),s*.75,.82,2.06);box(.5,.12,.05,glow(0xff3a30),s*.7,.88,-2.11);box(.04,.04,3.6,chrome,s*.96,.9,0)});
  box(1.5,.05,.2,bodyM,0,1.07,-2.0);box(1.6,.14,.3,darkM,0,.45,-2.05);
  [-.75,-.5,.5,.75].forEach(x=>cyl(.08,.1,.3,chrome,x,.5,-2.18,'z'));
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.0;
}else if(K=='m3'){ // wide, boxy, kidney grilles
  sh([[-2.1,.4],[-2.1,1.0],[-1.2,1.08],[1.0,1.02],[2.1,.75],[2.1,.4]],2.0,bodyM);
  sh([[-1.25,1.0],[-.85,1.5],[.5,1.5],[1.05,1.0]],1.7,glassM);
  box(1.6,.07,1.35,darkM,0,1.52,-.17);
  box(.5,.07,1.0,bodyM,0,1.08,.9);
  [-1,1].forEach(s=>{box(.4,.34,.04,chrome,s*.22,.82,2.08);box(.3,.26,.06,black,s*.22,.82,2.1);box(.6,.12,.05,glow(0xfff2b0),s*.78,.92,2.06);box(.6,.1,.05,glow(0xff3a30),s*.7,.9,-2.11);box(.16,.14,1.1,bodyM,s*1.03,.95,1.35);box(.16,.14,1.1,bodyM,s*1.03,.95,-1.35);box(.05,.05,.5,glow(s>0?0xd01818:0x4aa8ff),s*1.0,.7,1.3)});
  box(1.0,.2,.07,black,0,.52,2.1);box(1.6,.06,.25,darkM,0,1.13,-2.0);box(1.6,.14,.3,darkM,0,.45,-2.05);
  [-.75,-.55,.55,.75].forEach(x=>cyl(.09,.11,.3,chrome,x,.5,-2.18,'z'));
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35,1.08]];ws=1.05;wx=1.03;
}else if(K=='amg'){ // long-hood GT coupe
  sh([[-2.2,.4],[-2.2,.95],[-.9,1.0],[.8,1.05],[2.25,.78],[2.25,.4]],1.95,bodyM);
  sh([[-1.3,.98],[-.9,1.42],[-.1,1.45],[.45,1.0]],1.6,glassM);
  box(1.4,.07,.8,bodyM,0,1.46,-.5);
  box(.9,.3,.06,black,0,.55,2.25);for(let i=-3;i<=3;i++)box(.04,.3,.08,chrome,i*.12,.55,2.25);
  [-1,1].forEach(s=>{box(.6,.1,.05,glow(0xfff2b0),s*.7,.76,2.18);box(.35,.03,.7,black,s*.4,.96,1.4);box(.04,.15,.6,chrome,s*.98,.78,.9);box(.55,.1,.05,glow(0xff3a30),s*.65,.88,-2.21)});
  box(1.5,.05,.35,bodyM,0,1.06,-2.05);box(1.7,.12,.4,black,0,.45,-2.2);
  [-.7,-.45,.45,.7].forEach(x=>cyl(.1,.12,.3,chrome,x,.52,-2.3,'z'));
  wp=[[-1,1.6],[1,1.6],[-1,-1.4],[1,-1.4,1.06]];ws=1.05;
}else if(K=='challenger'){ // long muscle coupe
  sh([[-2.2,.4],[-2.2,1.05],[1.0,1.1],[2.2,1.0],[2.2,.4]],2.05,bodyM);
  sh([[-1.2,1.05],[-.9,1.5],[.4,1.5],[.9,1.05]],1.75,glassM);
  box(1.7,.08,1.3,bodyM,0,1.52,-.25);
  box(.7,.12,.8,black,0,1.14,1.2);
  [-1,1].forEach(s=>{box(.25,.03,1.4,black,s*.3,1.08,1.6);box(.25,.03,1.3,black,s*.3,1.07,-1.5);cyl(.16,.16,.08,glow(0xfff2b0),s*.9,.85,2.2,'z');cyl(.16,.16,.08,glow(0xfff2b0),s*.55,.85,2.2,'z');cyl(.12,.12,.3,chrome,s*.6,.5,-2.3,'z')});
  box(1.5,.2,.06,black,0,.6,2.2);box(1.9,.1,.05,glow(0xff3a30),0,.92,-2.21);box(1.9,.05,.3,bodyM,0,1.1,-2.15);
  box(2.0,.1,.3,darkM,0,.42,2.2);
  wp=[[-1,1.5],[1,1.5],[-1,-1.4,1.12],[1,-1.4,1.12]];ws=1.0;wx=1.03;
}else if(K=='p911'){ // round fenders, fastback
  sh([[-2.0,.4],[-2.0,.85],[-1.6,1.0],[-.5,1.05],[.9,.95],[2.0,.65],[2.0,.4]],1.9,bodyM);
  sh([[-1.75,.95],[-1.2,1.5],[-.3,1.52],[.6,1.0]],1.62,glassM);
  box(1.45,.07,.9,bodyM,0,1.54,-.75);
  [-1,1].forEach(s=>{box(.55,.28,.9,bodyM,s*.68,.9,1.55);sph(.2,glow(0xfff2b0),s*.68,1.02,1.9)});
  box(1.7,.07,.4,bodyM,0,1.02,-2.0);box(1.7,.07,.05,glow(0xff3a30),0,.88,-2.02);box(1.0,.04,.5,black,0,1.03,-1.4);
  box(1.4,.06,.3,darkM,0,.42,2.0);
  [-.4,.4].forEach(x=>cyl(.09,.11,.3,chrome,x,.5,-2.1,'z'));
  wp=[[-1,1.35],[1,1.35],[-1,-1.35,1.1],[1,-1.35,1.1]];ws=.98;
}else if(K=='r8'){ // mid-engine with side blades
  sh([[-2.1,.4],[-2.1,.9],[-.8,1.1],[.5,1.02],[2.1,.65],[2.1,.4]],2.0,bodyM);
  sh([[-1.0,1.05],[-.6,1.42],[.5,1.4],[1.0,1.0]],1.65,glassM);
  box(1.35,.06,1.1,bodyM,0,1.43,-.05);
  box(1.0,.38,.04,chrome,0,.52,2.08);box(.9,.3,.06,black,0,.52,2.1);
  box(1.1,.05,.8,glassM,0,1.04,-1.45,.1);
  [-1,1].forEach(s=>{box(.06,.42,1.5,darkM,s*1.02,.75,-.55);box(.55,.07,.06,glow(0xffffff),s*.7,.7,2.0);box(.5,.1,.05,glow(0xff3a30),s*.7,.85,-2.11)});
  box(1.6,.1,.3,black,0,.45,-2.15);box(1.4,.04,.25,darkM,0,.97,-2.05);box(2.0,.06,.4,darkM,0,.4,2.1);
  [-.5,.5].forEach(x=>cyl(.1,.12,.3,chrome,x,.5,-2.2,'z'));
  wp=[[-1,1.35],[1,1.35],[-1,-1.35],[1,-1.35]];ws=1.02;
}else if(K=='f8'){ // curvy, round tail lamps
  sh([[-2.2,.4],[-2.2,.85],[-.9,1.05],[.3,1.0],[2.2,.6],[2.2,.4]],2.0,bodyM);
  sh([[-1.0,1.0],[-.55,1.38],[.35,1.36],[.95,.98]],1.6,glassM);
  box(1.4,.06,.9,bodyM,0,1.4,-.1);
  [-1,1].forEach(s=>{box(.45,.2,1.2,bodyM,s*.78,.85,1.5);box(.3,.05,.6,black,s*.35,.82,1.45);box(.04,.3,.9,black,s*1.02,.75,-.3);box(.55,.07,.06,glow(0xffe36a),s*.72,.66,2.12);[.35,.75].forEach(x=>cyl(.17,.17,.06,glow(0xff3a30),s*x,.8,-2.2,'z'))});
  box(1.5,.15,.4,black,0,.45,-2.2);box(1.9,.06,.35,bodyM,0,.95,-2.1);box(2.0,.06,.5,darkM,0,.4,2.15);box(.7,.2,.06,black,0,.5,2.18);
  [-.2,.2].forEach(x=>cyl(.1,.12,.3,chrome,x,.55,-2.3,'z'));
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.02;
}else if(K=='huracan'){ // sharp, angular, Y lights
  sh([[-2.2,.4],[-2.2,.8],[-1.4,.98],[0,1.0],[.9,.95],[2.2,.55],[2.2,.4]],2.05,bodyM);
  sh([[-1.2,.98],[-.6,1.35],[.4,1.33],[1.0,.95]],1.6,glassM);
  box(1.3,.05,.9,black,0,1.37,-.1);box(.15,.05,2.4,black,0,1.02,-1.1);
  for(let i=0;i<4;i++)box(1.0,.04,.12,black,0,.96,-1.2-i*.22);
  [-1,1].forEach(s=>{box(.5,.06,.06,glow(R.ac),s*.75,.66,2.1,0,s*.4);box(.4,.06,.06,glow(R.ac),s*.45,.6,2.14,0,-s*.4);box(.05,.35,1.0,black,s*1.04,.72,-.6)});
  cyl(.28,.28,.2,black,0,.62,-2.2,'z');box(1.8,.05,.05,glow(0xff3a30),0,.8,-2.21);box(2.0,.05,.4,black,0,.42,2.15);box(1.8,.05,.3,darkM,0,.93,-2.1);
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.0;
}else if(K=='mc720'){ // bubble canopy, flying wing
  sh([[-2.2,.4],[-2.2,.8],[-1.2,1.0],[.4,.95],[2.2,.58],[2.2,.4]],2.0,bodyM);
  sh([[-1.4,.98],[-.9,1.38],[.35,1.35],[1.15,.9]],1.7,glassM);
  box(1.0,.05,1.2,bodyM,0,1.39,-.27);
  [-1,1].forEach(s=>{box(.05,.3,1.2,black,s*1.02,.78,-.2);box(.4,.18,.07,black,s*.75,.68,2.1);box(.3,.06,.06,glow(R.ac),s*.75,.66,2.14);box(.15,.1,1.4,bodyM,s*.8,1.0,-1.3);box(.08,.4,.1,darkM,s*.6,1.1,-2.05)});
  box(.5,.03,.9,black,0,.77,1.3);box(2.0,.06,.5,bodyM,0,1.3,-2.15);
  [-1,1].forEach(s=>box(.7,.08,.05,glow(0xff3a30),s*.6,.82,-2.21));
  box(2.0,.06,.5,darkM,0,.4,2.15);
  [-.25,.25].forEach(x=>cyl(.1,.12,.3,chrome,x,.5,-2.25,'z'));
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.0;
}else if(K=='chiron'){ // wide hypercar, C-line, horseshoe grille
  sh([[-2.2,.4],[-2.2,.9],[-1.0,1.1],[.5,1.05],[2.2,.65],[2.2,.4]],2.1,bodyM);
  sh([[-1.05,1.05],[-.6,1.42],[.5,1.4],[1.0,1.0]],1.7,glassM);
  box(1.3,.05,1.0,bodyM,0,1.43,-.05);
  [-1,1].forEach(s=>{box(.06,.1,1.4,black,s*1.07,.98,-.3);box(.06,.1,1.4,black,s*1.07,.58,-.3);box(.06,.5,.1,black,s*1.07,.78,.4);
   box(.14,.4,.08,chrome,s*.3,.58,2.2);box(.2,.12,.06,glow(0xfff2b0),s*.7,.74,2.12);box(.2,.12,.06,glow(0xfff2b0),s*.95,.72,2.1)});
  box(.74,.12,.08,chrome,0,.4,2.2);box(.5,.3,.06,black,0,.6,2.19);
  box(2.2,.07,.7,bodyM,0,1.5,-2.1);[-1,1].forEach(s=>box(.05,.3,.7,darkM,s*1.1,1.4,-2.1));box(.1,.4,.1,darkM,0,1.28,-2.05);
  box(1.8,.08,.05,glow(0xff3a30),0,.85,-2.21);box(2.0,.06,.5,darkM,0,.4,2.15);
  [-.4,-.15,.15,.4].forEach(x=>cyl(.08,.1,.3,chrome,x,.5,-2.3,'z'));
  box(2.3,.03,4.4,new THREE.MeshBasicMaterial({color:R.ac,transparent:true,opacity:.4}),0,.12,0);
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.04;wx=1.04;
}else if(K=='jesko'){ // huge wing, shark fin, long tail
  sh([[-2.2,.4],[-2.2,.85],[-.9,1.08],[.4,1.02],[2.2,.58],[2.2,.4]],2.0,bodyM);
  sh([[-1.0,1.03],[-.55,1.4],[.4,1.38],[.95,.98]],1.6,glassM);
  box(1.3,.05,.9,bodyM,0,1.41,-.1);box(.05,.5,1.4,bodyM,0,1.3,-1.3);
  box(2.4,.08,.8,darkM,0,1.75,-2.2);
  [-1,1].forEach(s=>{box(.06,.9,1.0,bodyM,s*1.2,1.4,-2.2);box(.1,.7,.15,darkM,s*.6,1.35,-2.1);box(.5,.07,.06,glow(R.ac),s*.75,.7,2.1)});
  box(2.2,.07,.6,darkM,0,.4,2.2);box(1.0,.2,.06,black,0,.6,2.18);
  box(1.6,.3,.5,darkM,0,.6,-2.4);box(1.4,.05,.05,glow(0xff3a30),0,.85,-2.21);cyl(.2,.2,.3,chrome,0,.55,-2.6,'z');
  box(2.3,.03,4.4,new THREE.MeshBasicMaterial({color:R.ac,transparent:true,opacity:.4}),0,.12,0);
  wp=[[-1,1.4],[1,1.4],[-1,-1.35],[1,-1.35]];ws=1.04;wx=1.04;
}else if(K=='rocket'){
  wedge(R.ac,bodyM);
  [-1,1].forEach(s=>{
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,1.7,10),mat(0x2a0a0a));pod.rotation.x=Math.PI/2;pod.position.set(s*1.3,.95,-2.0);tilt.add(pod);
    const nose=new THREE.Mesh(new THREE.ConeGeometry(.28,.6,10),mat(0xd01818));nose.rotation.x=Math.PI/2;nose.position.set(s*1.3,.95,-.85);tilt.add(nose);
    const f1=new THREE.Mesh(new THREE.ConeGeometry(.3,1.6,8),new THREE.MeshBasicMaterial({color:0xff8a1c,transparent:true,opacity:.85}));f1.rotation.x=-Math.PI/2;f1.position.set(s*1.3,.95,-3.65);tilt.add(f1);
    const f2=new THREE.Mesh(new THREE.ConeGeometry(.16,1.0,8),new THREE.MeshBasicMaterial({color:0xffe27a}));f2.rotation.x=-Math.PI/2;f2.position.set(s*1.3,.95,-3.35);tilt.add(f2);
    FLAMES.push({m:f1,root},{m:f2,root});
  });

// ---------------- custom models ----------------
}else if(K=='mini'){ // little two-tone hatchback with racing stripes
  sh([[-1.7,.4],[-1.7,1.0],[1.0,1.0],[1.7,.85],[1.7,.4]],1.75,bodyM);
  sh([[-1.4,1.0],[-1.25,1.6],[.6,1.6],[1.0,1.0]],1.6,glassM);
  box(1.6,.08,1.6,white,0,1.62,-.3);
  [-1,1].forEach(s=>{box(.22,.03,1.4,white,s*.3,1.01,.75);box(.22,.03,1.1,white,s*.3,1.0,-1.1)});
  box(1.85,.1,.3,darkM,0,.42,1.7);box(1.85,.1,.3,darkM,0,.42,-1.7);
  roundLights(.8,1.72,.62,.17);box(.7,.12,.05,glow(0xff3a30),0,.88,-1.72);
  wp=[[-1,1.05],[1,1.05],[-1,-1.05],[1,-1.05]];ws=.88;
}else if(K=='taxi'){
  sedan();
  box(.7,.2,.36,white,0,1.72,-.1);box(.6,.12,.3,glow(0xfff2b0),0,1.74,-.1);
  for(let i=0;i<10;i++)[-1,1].forEach(s=>box(.04,.11,.3,i%2?black:white,s*.94,.7,-1.45+i*.31));
}else if(K=='police'){
  sedan();
  [-1,1].forEach(s=>box(.04,.34,1.5,black,s*.94,.8,-.25));
  box(1.2,.1,.4,darkM,0,1.65,-.1);
  const a=glow(0xff2020),b=glow(0x2f6bff);box(.55,.14,.32,a,-.3,1.72,-.1);box(.55,.14,.32,b,.3,1.72,-.1);
  FLASH.push({a,b,root});
  box(1.9,.04,.1,black,0,1.0,1.99);
}else if(K=='van'){
  van(white,white);
  [-1,1].forEach(s=>box(.05,.1,3.0,darkM,s*.97,1.1,-.35));
}else if(K=='icecream'){
  van(mat(0xff6fa8),white);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.3,.65,8),mat(0xd9a05b));cone.rotation.z=Math.PI;cone.position.set(0,2.4,-.5);cone.castShadow=true;tilt.add(cone);
  sph(.38,mat(0xffc2d9),0,2.85,-.5);sph(.3,mat(0xfff4d6),0,3.22,-.5);sph(.09,glow(0xff2a2a),0,3.5,-.5);
  box(.05,.5,1.1,glassM,.99,1.55,.3);box(.05,.5,1.1,glassM,-.99,1.55,.3);
  [-1,1].forEach(s=>[0,1,2,3].forEach(i=>box(.4,.05,.3,i%2?white:mat(0xff6fa8),s*1.15,1.88,-.1+i*.3,0,s*.35)));
}else if(K=='jeep'){
  box(1.9,.7,3.8,bodyM,0,.75,0);
  box(1.75,.12,1.4,bodyM,0,1.12,1.2);
  box(1.7,.55,.06,glassM,0,1.45,.55,-.12);
  box(1.75,.06,1.6,darkM,0,1.8,-.6);
  [[.82,.5],[-.82,.5],[.82,-1.35],[-.82,-1.35]].forEach(([x,z])=>box(.07,.7,.07,black,x,1.45,z));
  box(1.8,.4,.1,bodyM,0,1.3,-1.4);
  [-1,1].forEach(s=>{box(.1,.3,1.6,bodyM,s*.92,1.3,-.6);box(.5,.1,.5,darkM,s*.95,1.1,1.3);box(.5,.1,.5,darkM,s*.95,1.1,-1.3)});
  box(1.0,.3,.06,black,0,.85,1.92);[-1,1].forEach(s=>{cyl(.19,.19,.12,glow(0xfff2b0),s*.68,.95,1.93,'z');box(.3,.12,.05,glow(0xff3a30),s*.8,.9,-1.91)});
  [-.3,-.1,.1,.3].forEach(x=>box(.07,.24,.08,white,x,.85,1.93));
  cyl(.42,.42,.28,mat(0x17171b),0,1.0,-2.05,'z');cyl(.2,.2,.3,chrome,0,1.0,-2.06,'z');
  box(1.6,.06,1.3,darkM,0,1.86,-.6);[-.6,0,.6].forEach(x=>box(.05,.06,1.3,black,x,1.9,-.6));
  box(1.95,.14,.2,darkM,0,.5,1.95);box(1.95,.14,.2,darkM,0,.5,-1.95);
  wp=[[-1,1.35],[1,1.35],[-1,-1.3],[1,-1.3]];ws=1.12;
}else if(K=='pickup'){
  pickup();
  wp=[[-1,1.5],[1,1.5],[-1,-1.5],[1,-1.5]];ws=1.2;wx=1.04;
}else if(K=='buggy'){
  box(1.5,.25,3.2,bodyM,0,.62,0);
  box(1.2,.3,.9,bodyM,0,.78,1.5);box(.9,.55,.8,darkM,0,.95,-1.55);box(.7,.12,.5,chrome,0,1.3,-1.55);
  [-1,1].forEach(s=>{box(.5,.2,.5,darkM,s*.38,.9,-.2);box(.5,.5,.12,darkM,s*.38,1.15,-.5);cyl(.07,.07,.9,chrome,s*.3,.55,-2.2,'z')});
  [-1,1].forEach(s=>{box(.07,1.1,.07,black,s*.7,1.3,.35);box(.07,1.1,.07,black,s*.7,1.3,-.85);box(.07,.07,1.3,black,s*.7,1.85,-.25);box(.07,.07,1.3,black,s*.7,1.05,-.25,0)});
  box(1.45,.07,.07,black,0,1.85,.35);box(1.45,.07,.07,black,0,1.85,-.85);
  box(.9,.07,.07,black,0,1.5,-.2,0);
  roundLights(1.0,1.93,.45,.17);
  [-1,1].forEach(s=>{box(.7,.05,.05,darkM,s*.95,.62,1.45);box(.7,.05,.05,darkM,s*.95,.62,-1.4)});
  box(1.1,.06,.06,glow(0xff3a30),0,.85,-2.0);
  wp=[[-1,1.45,.9],[1,1.45,.9],[-1,-1.4,1.3],[1,-1.4,1.3]];ws=1;wx=1.2;tw=1.5;
}else if(K=='hotrod'){
  sh([[-2.0,.5],[-2.0,1.1],[.3,1.1],[.3,.5]],1.5,bodyM);
  sh([[-1.4,1.1],[-1.15,1.6],[-.2,1.6],[.05,1.1]],1.3,glassM);
  box(1.35,.08,1.3,bodyM,0,1.62,-.68);
  box(.9,.5,1.8,bodyM,0,.8,1.2);
  [-1,1].forEach(s=>{box(.42,.1,1.2,bodyM,s*.78,.98,1.5);cyl(.08,.08,1.9,chrome,s*.98,.5,.1,'z');sph(.16,glow(0xfff2b0),s*.78,1.15,1.95)});
  box(.7,.4,1.0,chrome,0,1.25,1.0);box(.35,.3,.45,darkM,0,1.6,1.0);cyl(.14,.14,.2,black,0,1.8,1.0);
  box(.8,.5,.06,chrome,0,.8,2.12);box(.9,.1,.1,chrome,0,.5,2.1);
  box(1.4,.1,.06,glow(0xff3a30),0,.85,-2.01);
  [-1,1].forEach(s=>[[1.1,.62],[.8,.78],[.55,.94]].forEach(([l,y])=>{
    const f=new THREE.Mesh(new THREE.ConeGeometry(.12,l,4),new THREE.MeshBasicMaterial({color:y>.9?0xffc01a:0xff5a00}));
    f.rotation.x=-Math.PI/2;f.position.set(s*.46,y,2.0-l/2);tilt.add(f)}));
  wp=[[-1,1.5,.85],[1,1.5,.85],[-1,-1.3,1.25],[1,-1.3,1.25]];ws=1;
}else if(K=='retro'){
  sh([[-2.0,.45],[-2.0,.95],[-1.0,1.15],[.7,1.05],[2.0,.75],[2.0,.45]],1.9,bodyM);
  sh([[-1.1,1.1],[-.7,1.6],[.5,1.5],[1.0,1.05]],1.7,glassM);
  box(1.5,.07,1.0,bodyM,0,1.62,-.1);
  [-1,1].forEach(s=>{box(.04,.06,3.7,glow(0x6fd6ff),s*.96,.62,0);box(.04,.35,.06,chrome,s*.96,.95,-.15);box(.04,.35,.06,chrome,s*.96,.95,.7)});
  for(let i=0;i<4;i++)box(1.5,.04,.1,black,0,1.4-i*.08,-1.05-i*.1,.5);
  box(1.3,.12,.08,glow(0x6fd6ff),0,.95,-2.01);box(1.5,.1,.05,glow(0xff3a30),0,.72,-2.01);
  box(1.9,.08,.4,darkM,0,.42,2.0);box(1.9,.08,.4,darkM,0,.42,-2.0);
  roundLights(.8,2.0,.65,.18);box(1.1,.1,.06,black,0,.62,2.01);
  cyl(.1,.1,.35,chrome,-.55,.5,-2.15,'z');cyl(.1,.1,.35,chrome,.55,.5,-2.15,'z');
  wp=[[-1,1.3],[1,1.3],[-1,-1.3],[1,-1.3]];ws=.98;
}else if(K=='cyber'){
  sh([[-2.4,.5],[-2.4,1.4],[-.2,1.8],[2.4,.85],[2.4,.5]],2.1,bodyM);
  sh([[1.5,1.21],[.2,1.69],[.2,1.45],[1.5,1.0]],1.7,glassM);
  box(2.14,.28,1.5,glassM,0,1.38,-.55);
  box(1.95,.06,.05,glow(0xffffff),0,.78,2.41);box(2.0,.07,.05,glow(0xff3a30),0,1.1,-2.41);
  box(2.15,.04,3.5,darkM,0,.62,-.2);
  box(2.12,.05,.4,darkM,0,.5,2.3);
  wp=[[-1,1.55],[1,1.55],[-1,-1.55],[1,-1.55]];ws=1.15;wx=1.06;
}else if(K=='monster'){
  const lift=new THREE.Group();lift.position.y=.9;tilt.add(lift);host=lift;
  pickup();
  host=tilt;
  [-1,1].forEach(s=>{box(.14,.14,2.0,darkM,s*.5,.85,0);cyl(.08,.08,1.2,chrome,s*.85,1.6+.9,-.95)});
  [1.4,-1.4].forEach(z=>{box(2.8,.18,.18,darkM,0,.85,z);[-1,1].forEach(s=>cyl(.1,.1,.9,chrome,s*.8,1.2,z))});
  box(1.0,.6,.04,mat(0xffc400),0,.9+1.32,2.43);
  wp=[[-1,1.4],[1,1.4],[-1,-1.4],[1,-1.4]];ws=1.8;wx=1.5;tw=1.6;
}else if(K=='formula'){
  sh([[-1.8,.45],[-1.8,.95],[-.5,1.05],[.7,.85],[2.3,.55],[2.3,.45]],.9,bodyM);
  [-1,1].forEach(s=>{box(.55,.38,1.7,bodyM,s*.62,.68,-.15);box(.05,.2,.7,darkM,s*1.0,.5,2.1);box(.05,.55,.6,darkM,s*.88,1.25,-1.9);box(.65,.05,.05,darkM,s*.9,.62,1.6);box(.65,.05,.05,darkM,s*.9,.62,-1.45)});
  box(.5,.2,.7,darkM,0,1.05,-.3);sph(.22,mat(R.ac),0,1.22,-.3);
  box(.04,.04,.9,black,0,1.4,-.1);[-1,1].forEach(s=>box(.04,.3,.04,black,s*.2,1.25,-.5));
  box(.4,.55,.5,bodyM,0,1.2,-.95);box(.3,.25,.05,black,0,1.3,-.68);
  box(2.2,.06,.55,bodyM,0,.4,2.1);box(.5,.1,.4,darkM,0,.5,2.15);
  box(1.7,.07,.5,bodyM,0,1.52,-1.9);box(.1,.6,.1,darkM,0,1.2,-1.9);
  box(.5,.06,.05,glow(0xff3a30),0,.9,-1.82);
  wp=[[-1,1.6,1],[1,1.6,1],[-1,-1.45,1.15],[1,-1.45,1.15]];ws=1;wx=1.22;tw=1.45;
}else if(K=='neon'){
  const ac=R.ac;
  sh([[-2.2,.5],[-2.2,.85],[-.8,1.0],[.5,.95],[2.2,.65],[2.2,.5]],2.0,bodyM);
  sh([[-.9,.95],[-.4,1.4],[.5,1.35],[1.0,.92]],1.5,glassM);
  [-1,1].forEach(s=>{
    box(.05,.07,3.9,glow(ac),s*1.02,.72,0);box(.1,.55,.9,bodyM,s*.85,1.3,-2.0);box(.05,.3,.6,glow(ac),s*.95,1.45,-2.0);
    [1.4,-1.4].forEach(z=>{cyl(.52,.52,.14,darkM,s*1.1,.34,z);cyl(.4,.4,.16,glow(ac),s*1.1,.3,z)});
  });
  box(2.3,.03,4.6,new THREE.MeshBasicMaterial({color:ac,transparent:true,opacity:.45}),0,.14,0);
  box(2.3,.07,.55,bodyM,0,1.5,-2.15);box(1.8,.1,.05,glow(ac),0,.85,-2.21);lights(ac,.72,2.2,.5);
  wp=[[-1,1.4],[1,1.4],[-1,-1.3],[1,-1.3]];
}
const tireM=mat(0x17171b),rimM=mat(0x3a3d44),spkM=new THREE.MeshPhongMaterial({color:0xe6e9ef,shininess:70,flatShading:true}),wheels=[];
wp.forEach(([sx,z,sc=1],i)=>{
  const w=ws*sc,pivot=new THREE.Group(),spin=new THREE.Group();
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.46*w,.46*w,.42*tw,9),tireM);t.rotation.z=Math.PI/2;t.castShadow=true;
  const r=new THREE.Mesh(new THREE.CylinderGeometry(.28*w,.28*w,.44*tw,6),rimM);r.rotation.z=Math.PI/2;
  spin.add(t,r);for(let k=0;k<5;k++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.47*tw,.52*w,.07*w),spkM);sp.rotation.x=k*Math.PI/5;spin.add(sp)}
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.5*tw,6),spkM);cap.rotation.z=Math.PI/2;spin.add(cap);pivot.add(spin);pivot.position.set(sx*wx,.46*w,z);tilt.add(pivot);wheels.push({pivot,spin,front:i<2});
});
if(K=='neon')wheels.forEach(w=>{w.pivot.visible=false});
tilt.scale.set(R.sx,R.sy,R.sz);
applyWrap(root,tilt,bodyM,wrapId);
return{root,tilt,piv,wheels,bodyM}}
window.buildCar=buildCar;window.flameTick=flameTick;
})();
