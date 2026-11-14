window.SERVER_URL="https://low-poly-drift.onrender.com";
// true when the game runs inside one of our apps (Android/iPhone "median" app, the Windows Electron app, or an installed PWA).
// The Download page and its links are only for the website, so they are hidden when this is true.
window.IN_APP=/median|gonative|LowPolyDriftApp|Electron/i.test(navigator.userAgent)||!!window.median||!!window.gonative||navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
window.CLOUD_URL="https://low-poly-drift.vercel.app"; // cloud save API (api/cloud.js on Vercel)
