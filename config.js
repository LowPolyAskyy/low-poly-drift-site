// ---- game servers, one per region (Render free instances) ----
// To add the America server: put its address in "us" below, nothing else to change.
window.SERVERS={
 eu:{name:'Europe',url:'https://low-poly-drift-server-eu.onrender.com'},
 us:{name:'America',url:'https://low-poly-drift-server-usa.onrender.com'},
 asia:{name:'Asia',url:'https://low-poly-drift-server-asia.onrender.com'},
 test:{name:'test',url:'https://hexagon-bony-hippopotamus.abasthan.app'}
};
// Region choice: ?srv=xx in the address (used to join a friend's room) > saved choice (Settings / lobby) > Europe.
// "auto" = the server nearest to the player, guessed from the time zone. The lobby asks once before moving someone away from Europe.
// No ping is sent to the other servers here: on the free plan every request wakes a sleeping server and uses up the monthly hours.
(function(){
 const S=window.SERVERS,live=k=>S[k]&&S[k].url;
 function guess(){let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  if(/^America\//.test(tz)||/^Pacific\/(Honolulu|Pago_Pago|Johnston)$/.test(tz)||/^Atlantic\/Bermuda$/.test(tz))return 'us';
  if(/^Australia\//.test(tz)||/^Pacific\//.test(tz)||/^Indian\//.test(tz)||(/^Asia\//.test(tz)&&!/^Asia\/(Dubai|Muscat|Baghdad|Tehran|Riyadh|Kuwait|Qatar|Bahrain|Aden|Jerusalem|Tel_Aviv|Beirut|Amman|Damascus|Nicosia|Famagusta|Istanbul|Baku|Tbilisi|Yerevan|Gaza|Hebron)$/.test(tz)))return 'asia';
  return 'eu'}
 let pick='eu';try{pick=localStorage.dn_region||'eu'}catch(e){}
 const near=live(guess())?guess():'eu';
 const m=/[?&]srv=([a-z]+)/.exec(location.search);
 let key=m&&live(m[1])?m[1]:(pick==='auto'?near:(live(pick)?pick:'eu'));
 if(!live(key))key=live('eu')?'eu':Object.keys(S).find(live);   // chosen region has no server yet: use Europe
 window.NEAREST_KEY=near;window.SERVER_KEY=key;window.SERVER_URL=S[key].url;
 window.setRegion=v=>{try{localStorage.dn_region=v}catch(e){}};
})();
// true when the game runs inside one of our apps (Android/iPhone "median" app, the Windows Electron app, or an installed PWA).
// The Download page and its links are only for the website, so they are hidden when this is true.
window.IN_APP=/median|gonative|LowPolyDriftApp|Electron/i.test(navigator.userAgent)||!!window.median||!!window.gonative||navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
window.ARTIC_ID_URL="https://articid.vercel.app"; // Artic ID (accounts + cloud save). The game origin must be listed in ALLOWED_ORIGINS there.
