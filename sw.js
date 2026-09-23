const C='gym-v4';
self.addEventListener('install',e=>{
  self.skipWaiting();
  // Pre-cache is best-effort: a failure here must not block install (fetch fills the cache anyway)
  e.waitUntil(caches.open(C).then(c=>c.add('/Gym/')).catch(()=>{}));
});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
// Network-first for the app itself and the Firebase SDK scripts; every successful
// response refreshes the cache so the latest version is available offline.
// Everything else (Firebase database/auth, YouTube) goes straight to the network.
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET') return;
  const isApp=url.origin===location.origin;
  const isSdk=url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/');
  if(!isApp&&!isSdk) return;
  e.respondWith(
    // no-cache: revalidate with the server so a new release shows up on the next open
    fetch(req,isApp?{cache:'no-cache'}:undefined).then(res=>{
      if(res.ok||res.type==='opaque'){ const copy=res.clone(); caches.open(C).then(c=>c.put(req,copy)); }
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'&&caches.match('/Gym/'))||Response.error()))
  );
});
