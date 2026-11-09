/* أرشيفي — service worker: يُبقي التطبيق متاحاً دون اتصال ويوصل التحديثات تلقائياً.
   ارفع VERSION بعد كل نشر حتى تلتقط الأجهزة الملفات الجديدة (وحدّث APP_VERSION في index.html). */
const VERSION = 'arshifi-v5';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/favicon.ico', 'icons/arshifi-180.png', 'icons/arshifi-192.png', 'icons/arshifi-512.png',
  'vendor/pdf.min.js', 'vendor/pdf.worker.min.js', 'vendor/mammoth.browser.min.js', 'vendor/jszip.min.js', 'vendor/tesseract/tesseract.min.js', 'vendor/tesseract/worker.min.js'];
const FONTS = 'arshifi-fonts';
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // الخطوط: من النسخة المخزنة فوراً، مع تحديثها في الخلفية
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => { const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; })));
    return;
  }
  if (u.origin !== location.origin) return;
  // محرك التعرف الضوئي ونماذج اللغات (ملفات كبيرة لا تتغير): من المخزن أولاً
  if (u.pathname.includes('/vendor/tesseract/')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // الباقي: من الشبكة أولاً حتى تصل التحديثات فوراً، ومن المخزن عند انقطاع الاتصال
  e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })
    .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
