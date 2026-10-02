/* ÖH Prague guide: offline copy of what you have opened, newest version whenever online */
const CACHE='oeh-prague-20261002204448';
const FILES=["/manifest.webmanifest", "/favicon.png", "/icons/apple-touch-icon.png", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png", "/lib/jszip.min.js", "/lib/xlsx.mini.min.js", "/img/041139991d.jpg", "/img/1cb3dcc940.png", "/img/6a0bc5efda.jpg", "/img/bb60434b34.jpg", "/img/bd22f8a25c.jpg", "/img/be3bbac34c.png", "/img/e8f7cea1b5.png", "/img/hero-sm.jpg", "/img/logo.png"];
const alias=u=>{const p=new URL(u).pathname;return p==='/index.html'?'/':p==='/organiser.html'?'/organiser':p==='/OeH-Prague-Trip-Guide.html'?'/OeH-Prague-Trip-Guide':p;};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'no-cache',redirect:'manual'}).then(r=>r&&r.ok&&!r.redirected?c.put(f,r):null).catch(()=>null)))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url); if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname==='/version.json'||u.pathname.startsWith('/login'))return;
  const key=alias(r.url);
  if(/^\/(img|icons|lib)\//.test(u.pathname)){
    e.respondWith(caches.match(key).then(m=>m||fetch(r).then(res=>{if(res&&res.ok&&!res.redirected){const c2=res.clone();caches.open(CACHE).then(c=>c.put(key,c2));}return res;})));return;}
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok&&res.type==='basic'&&!res.redirected){const copy=res.clone();caches.open(CACHE).then(c=>c.put(key,copy));}return res;})
    .catch(()=>caches.match(key).then(m=>m||(r.mode==='navigate'?caches.match('/'):undefined))));
});
