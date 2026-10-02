/* ÖH Prague guide: works offline, always fetches the newest version when online */
const CACHE='oeh-prague-202610021845';
const FILES=['/','/index.html','/organiser.html','/manifest.webmanifest','/favicon.png','/icons/apple-touch-icon.png','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-512-maskable.png','/lib/jszip.min.js','/lib/xlsx.mini.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('/index.html'))));
});
