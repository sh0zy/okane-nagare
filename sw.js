// おかねの流れ帳 の Service Worker（ビルド時に vite.config.ts が版番号と事前保存の一覧を埋め込む）
// ・アプリ本体は事前に保存し、一度開いた後はオフラインでも起動できるようにする
// ・画面（HTML）は通信を優先し、つながらないときは保存したものを使う。公開を更新すると次に開いたときから新しい版になる
// ・フォントは使った文字の分だけ、使ったときに保存する
// ・sh0zy.github.io には別のアプリも同居しているので、自分の名前で始まるキャッシュだけを扱う
const VERSION = '0.1.0-mwr64842'
const PREFIX = 'okane-nagare-'
const CACHE = `${PREFIX}${VERSION}`
const FONT_CACHE = `${PREFIX}fonts`
const PRECACHE = ["./","./assets/index-ClAH5nWz.js","./assets/index-CPibkYwu.css","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./apple-touch-icon.png"]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put('./', copy))
          }
          return res
        })
        .catch(() => caches.match('./', { ignoreSearch: true }).then((hit) => hit || caches.match(req))),
    )
    return
  }

  if (/\.(woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone())
              return res
            }),
        ),
      ),
    )
    return
  }

  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)))
})
