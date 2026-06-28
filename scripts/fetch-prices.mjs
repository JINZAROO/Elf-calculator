// scripts/fetch-prices.mjs
// GitHub Actions에서 1시간마다 실행되어 가격을 조회하고
// data/price-history.json 에 누적 저장하는 스크립트입니다.

import fs from 'fs';
import path from 'path';

const API_BASE = 'https://elf-market-api.vercel.app';
const HISTORY_PATH = path.join(process.cwd(), 'data', 'price-history.json');

// index.html 의 ITEMS 와 동일한 아이템 목록
// (나중에 의상/일반 아이템이 추가되면 여기도 같이 추가해주세요)
const ITEMS = [
  { id: 21101, name: 'Carrot' },
  { id: 21102, name: 'Potato' },
  { id: 21103, name: 'Pumpkin' },
  { id: 21104, name: 'Broccoli' },
  { id: 21105, name: 'Tomato' },
  { id: 21106, name: 'Beet' },
  { id: 21107, name: 'Wheat' },
  { id: 21108, name: 'Corn' },
  { id: 21109, name: 'Chili' },
  { id: 21110, name: 'Strawberry' },
  { id: 21111, name: 'Watermelon' },
  { id: 21112, name: 'Ryegrass' },
  { id: 22101, name: 'Betel Nut' },
  { id: 22102, name: 'Banana' },
  { id: 22103, name: 'Dates' },
  { id: 22104, name: 'Mango' },
  { id: 22105, name: 'Sugar Apple' },
  { id: 22106, name: 'Cherry' },
  { id: 22107, name: 'Green Plum' },
  { id: 22108, name: 'Grape' },
  { id: 22109, name: 'Pomegranate' },
  { id: 22110, name: 'Coconut' },
  { id: 211, name: 'Poplar Wood' },
  { id: 212, name: 'Birch Wood' },
  { id: 213, name: 'Pine Wood' },
  { id: 214, name: 'Oak Wood' },
  { id: 221, name: 'Stone' },
  { id: 222, name: 'Copper Ore' },
  { id: 223, name: 'Iron Ore' },
  { id: 224, name: 'Mithril Ore' },
  { id: 311, name: 'Egg' },
  { id: 321, name: 'Milk' },
];

async function getAccessToken() {
  const res = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
  const data = await res.json();
  if (data.code !== 0) throw new Error('토큰 갱신 실패: ' + data.message);
  return 'Bearer ' + data.data.accessToken;
}

async function fetchPrice(itemId, accessToken) {
  const url = `${API_BASE}/api/price?itemId=${itemId}&accessToken=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  if (!data.data?.length) return null;
  const d = data.data[0];
  return d.totalAmount / 1e9 / d.itemNum;
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveHistory(history) {
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

// 같은 아이템 데이터를 너무 오래 들고 있지 않도록 오래된 항목 정리 (예: 90일)
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

async function main() {
  console.log('토큰 갱신 중...');
  const accessToken = await getAccessToken();

  const history = loadHistory();
  const now = new Date().toISOString();
  const cutoff = Date.now() - MAX_AGE_MS;

  for (const item of ITEMS) {
    try {
      const price = await fetchPrice(item.id, accessToken);
      if (price == null) {
        console.log(`#${item.id} ${item.name}: 거래 데이터 없음`);
        continue;
      }

      const key = String(item.id);
      if (!history[key]) history[key] = [];

      history[key].push({ t: now, p: price });

      // 오래된 데이터 정리
      history[key] = history[key].filter(
        (entry) => new Date(entry.t).getTime() >= cutoff
      );

      console.log(`#${item.id} ${item.name}: ${price}`);
    } catch (e) {
      console.error(`#${item.id} ${item.name} 조회 실패:`, e.message);
    }

    // API 부담을 줄이기 위해 약간의 딜레이
    await new Promise((r) => setTimeout(r, 150));
  }

  saveHistory(history);
  console.log('저장 완료:', HISTORY_PATH);
}

main().catch((e) => {
  console.error('스크립트 실패:', e);
  process.exit(1);
});
