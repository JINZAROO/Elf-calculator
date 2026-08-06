// scripts/fetch-pi-transactions.mjs
// GitHub Actions에서 1시간마다 실행되어, 마지막 커서 이후의 새 입금 거래만 가져와
// data/pi-tracker.json에 누적 저장하는 스크립트입니다.

import fs from 'fs';
import path from 'path';

const WALLET = 'GBVKJKURNRBQ2M2KFOFZSDFM5D3NUMYHRTFXZXUS5AVRVYLTUWZNDCH5';
const API_BASE = 'https://apiv2.piscan.io/mainnet';
const DATA_PATH = path.join(process.cwd(), 'data', 'pi-tracker.json');

function loadState() {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      wallet: WALLET,
      lastCursor: null,
      totalDeposited: 0,
      dailyTotals: {},
      walletTotals: {},
      lastUpdated: null
    };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function saveState(state) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
}

async function fetchNewPayments(cursor) {
  let payments = [];
  let url = `${API_BASE}/accounts/${WALLET}/payments?limit=200&order=asc` +
            (cursor ? `&cursor=${cursor}` : '');
  let page = 0;
  const maxPages = 500; // 안전장치 (최대 10만 건)

  while (url && page < maxPages) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API 응답 오류: ${res.status}`);
    const data = await res.json();
    const records = data._embedded?.records || [];
    if (!records.length) break;

    payments = payments.concat(records);

    const nextUrl = data._links?.next?.href || null;
    if (!nextUrl || nextUrl === url || records.length < 200) break;
    url = nextUrl;
    page++;
    // API 부담을 줄이기 위한 약간의 딜레이
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`가져온 페이지 수: ${page + 1}, 신규 레코드 수: ${payments.length}`);
  return payments;
}

async function main() {
  console.log('Pi Tracker 데이터 갱신 시작...');
  const state = loadState();

  const newPayments = await fetchNewPayments(state.lastCursor);

  let addedCount = 0;
  for (const p of newPayments) {
    if (p.type !== 'payment' || p.asset_type !== 'native' || p.to !== WALLET) continue;
    const amount = parseFloat(p.amount);
    const day = p.created_at.slice(0, 10);

    state.totalDeposited = Math.round((state.totalDeposited + amount) * 1e7) / 1e7;
    state.dailyTotals[day] = Math.round(((state.dailyTotals[day] || 0) + amount) * 1e7) / 1e7;
    state.walletTotals[p.from] = Math.round(((state.walletTotals[p.from] || 0) + amount) * 1e7) / 1e7;
    addedCount++;
  }

  // 커서를 마지막 레코드로 갱신 (payment든 아니든, 조회된 마지막 지점으로)
  if (newPayments.length > 0) {
    state.lastCursor = newPayments[newPayments.length - 1].paging_token
      || newPayments[newPayments.length - 1].id;
  }

  state.lastUpdated = new Date().toISOString();
  saveState(state);

  console.log(`신규 입금 반영 건수: ${addedCount}`);
  console.log(`현재 총 입금액: ${state.totalDeposited} Pi`);
  console.log('저장 완료:', DATA_PATH);
}

main().catch(e => {
  console.error('스크립트 실패:', e);
  process.exit(1);
});
