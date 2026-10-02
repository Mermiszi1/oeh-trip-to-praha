/* ÖH Prague guide – login (student / admin), protected pages, room list + organiser sync (KV binding "ORG") */
const STUDENT_HASH='da1483c8300e231c05dc564bfddfa7fab74f5000dffb856901f09bcc371050d0', ADMIN_HASH='40c266e067d350c5ab4559d6f756f5883ce9e764fa03ee3df8143c19bf5352b1', SECRET='47eda39feca4bc7a33d183cdb29097d5ea80a9fc2f4695c6bb724bcb895f34a0';
const DAYS=30;
function aoMerge(a,b){
  a=a||{};b=b||{};var o={v:2,people:{},counts:{},checks:{},rooms:{list:[],t:0}};
  function newer(x,y){if(!x)return y;if(!y)return x;return (y.t||0)>(x.t||0)?y:x;}
  ['people','counts'].forEach(function(f){var A=a[f]||{},B=b[f]||{};Object.keys(A).concat(Object.keys(B)).forEach(function(k){o[f][k]=newer(A[k],B[k]);});});
  var CA=a.checks||{},CB=b.checks||{};Object.keys(CA).concat(Object.keys(CB)).forEach(function(p){var x=CA[p]||{},y=CB[p]||{},r={};
    Object.keys(x).concat(Object.keys(y)).forEach(function(c){r[c]=newer(x[c],y[c]);});o.checks[p]=r;});
  o.rooms=newer(a.rooms&&a.rooms.t!=null?a.rooms:null,b.rooms&&b.rooms.t!=null?b.rooms:null)||{list:[],t:0};
  return o;
}

const enc=new TextEncoder();
async function sha(s){const b=await crypto.subtle.digest('SHA-256',enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function hmac(s){const k=await crypto.subtle.importKey('raw',enc.encode(SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const b=await crypto.subtle.sign('HMAC',k,enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function makeToken(role){const exp=Date.now()+DAYS*864e5;const body=role+'.'+exp;return body+'.'+(await hmac(body));}
async function readRole(req){const m=(req.headers.get('cookie')||'').match(/(?:^|;\s*)oeh_s=([^;]+)/);if(!m)return null;const [role,exp,sig]=decodeURIComponent(m[1]).split('.');
  if(!role||!exp||!sig||Number(exp)<Date.now())return null;return (await hmac(role+'.'+exp))===sig&&(role==='admin'||role==='student')?role:null;}
function json(d,s,h){return new Response(JSON.stringify(d),{status:s||200,headers:Object.assign({'content-type':'application/json','cache-control':'no-store'},h||{})});}
function cookie(v,age){return 'oeh_s='+encodeURIComponent(v)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+age;}
const PUBLIC=/^\/(login(\.html)?|favicon\.png|manifest\.webmanifest|sw\.js|version\.json|robots\.txt)$|^\/(icons|img)\//;
export default {
  async fetch(req, env){
    const url=new URL(req.url), p=url.pathname;
    /* ---- API ---- */
    if(p==='/api/login'&&req.method==='POST'){
      let pw='';try{pw=String((await req.json()).password||'').trim();}catch(e){}
      const h=await sha('oeh|'+pw);const role=h===ADMIN_HASH?'admin':h===STUDENT_HASH?'student':null;
      if(!role){await new Promise(r=>setTimeout(r,600));return json({error:'wrong'},401);}
      return json({role},200,{'set-cookie':cookie(await makeToken(role),DAYS*86400)});
    }
    if(p==='/api/logout')return json({ok:true},200,{'set-cookie':cookie('',0)});
    const role=await readRole(req);
    if(p==='/api/me')return role?json({role}):json({error:'login'},401);
    if(p==='/api/rooms'){
      if(!role)return json({error:'login'},401);
      if(!env.ORG)return json({error:'kv-missing'},503);
      if(req.method==='GET')return json(JSON.parse((await env.ORG.get('rooms'))||'{"list":[],"t":0}'));
      if(req.method==='PUT'){if(role!=='admin')return json({error:'admin only'},403);
        let b;try{b=await req.json();}catch(e){return json({error:'bad-json'},400);}
        const list=Array.isArray(b&&b.list)?b.list.filter(r=>r&&r.room&&Array.isArray(r.people)).map(r=>({room:String(r.room).slice(0,80),people:r.people.map(x=>String(x).slice(0,80)).slice(0,20)})).slice(0,300):[];
        const d={list,t:Date.now()};await env.ORG.put('rooms',JSON.stringify(d));return json(d);}
      return json({error:'method'},405);
    }
    if(p==='/api/org'){
      if(role!=='admin')return json({error:'unauthorised'},401);
      if(!env.ORG)return json({error:'kv-missing'},503);
      const cur=JSON.parse((await env.ORG.get('org'))||'null');
      if(req.method==='GET')return json({data:cur});
      if(req.method==='PUT'){let inc;try{inc=await req.json();}catch(e){return json({error:'bad-json'},400);}
        const merged=aoMerge(cur,inc&&inc.data);await env.ORG.put('org',JSON.stringify(merged));return json({data:merged});}
      return json({error:'method'},405);
    }
    if(p.startsWith('/api/'))return json({error:'not found'},404);
    /* ---- pages ---- */
    const isAdminPage=/^\/organiser(\.html)?$/.test(p);
    if(!PUBLIC.test(p)){
      if(!role||(isAdminPage&&role!=='admin')){
        const dest='/login?next='+encodeURIComponent(p)+(isAdminPage?'&admin=1':'');
        return (req.headers.get('accept')||'').includes('text/html')||req.mode==='navigate'?Response.redirect(new URL(dest,url).toString(),302):json({error:'login'},401);
      }
    }
    if(p==='/login.html')return Response.redirect(new URL('/login'+url.search,url).toString(),302);
    const res=await env.ASSETS.fetch(req);
    const h=new Headers(res.headers);
    if(!/^\/(img|icons|lib)\//.test(p))h.set('cache-control','no-cache');
    if(/^\/(img)\//.test(p))h.set('cache-control','public, max-age=31536000, immutable');
    if(/^\/OeH-Prague-Trip-Guide/.test(p))h.set('content-disposition','attachment; filename="OeH-Prague-Trip-Guide.html"');
    if(isAdminPage||p.startsWith('/login'))h.set('x-robots-tag','noindex');
    if(!PUBLIC.test(p))h.set('vary','cookie');
    return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
  }
};
