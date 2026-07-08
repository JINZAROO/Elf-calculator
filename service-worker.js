// 최소한의 서비스워커 — "홈 화면에 추가" 조건 충족용 (캐싱 없음, 항상 최신 데이터 유지)
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => {
  // 그대로 통과 — 오프라인 캐싱 없이 매번 최신 데이터를 가져옵니다
});
