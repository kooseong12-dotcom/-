import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';

export default defineConfig({
  base: '/-/',
  build: { rollupOptions: { input: { main: 'index.html', legacy: 'legacy.html' } } },
  plugins: [{
    name: 'flo-offline-cache',
    generateBundle(_options, bundle) {
      const files=Object.keys(bundle).filter(file=>!file.endsWith('.map'));
      const revision=createHash('sha256').update('offline-v2|'+files.join('|')).digest('hex').slice(0,12);
      const urls=['/-/','/-/index.html','/-/images/assembly.webp',...files.map(file=>'/-/'+file)];
      this.emitFile({type:'asset',fileName:'sw.js',source:`
const CACHE='flo-app-${revision}';
const URLS=${JSON.stringify([...new Set(urls)])};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('flo-app-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/-/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/-/index.html'))));return;
 }
 event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request)));
});`});
    },
  }],
});
