/* ÖH Prague guide: works offline, always fetches the newest version when online */
const CACHE='oeh-prague-202610022007';
const FILES=['/','/organiser','/OeH-Prague-Trip-Guide','/manifest.webmanifest','/favicon.png','/icons/apple-touch-icon.png','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-512-maskable.png','/lib/jszip.min.js','/lib/xlsx.mini.min.js'];
const clean=res=>res&&res.redirected?res.blob().then(b=>new Response(b,{status:200,statusText:'OK',headers:res.headers})):Promise.resolve(res);
const alias=u=>{const p=new URL(u).pathname;return p==='/index.html'?'/':p==='/organiser.html'?'/organiser':p==='/OeH-Prague-Trip-Guide.html'?'/OeH-Prague-Trip-Guide':p;};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'no-cache'}).then(clean).then(r=>r&&r.ok?c.put(f,r):null).catch(()=>null)))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const key=alias(r.url);
  e.respondWith(fetch(r).then(clean).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(key,copy));}return res;})
    .catch(()=>caches.match(key).then(m=>m||(r.mode==='navigate'?caches.match('/'):undefined))));
});
