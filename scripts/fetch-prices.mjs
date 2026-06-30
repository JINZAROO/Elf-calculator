// scripts/fetch-prices.mjs
// GitHub Actions에서 1시간마다 실행되어 가격을 조회하고
// data/price-history.json 에 누적 저장하는 스크립트입니다.

import fs from 'fs';
import path from 'path';

const API_BASE = 'https://elf-market-api.vercel.app';
const HISTORY_PATH = path.join(process.cwd(), 'data', 'price-history.json');

// index.html 의 ITEMS 와 동일한 아이템 목록 (resources + costume + general + blueprint)
const ITEMS = [
  // ── Resources ──
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

  // ── Pi Elf Outfit (costume) ──
  { id: 305002, name: 'CiDi Echo' },
  { id: 305005, name: 'Tiger Head' },
  { id: 305012, name: 'Genesis Pioneer' },
  { id: 305042, name: 'Cosmic Sovereign' },
  { id: 305049, name: 'Take My Pi' },

  // ── General ──
  { id: 15, name: 'Gem Gift Card' },
  { id: 2000, name: 'Damaged Treasure Map' },
  { id: 2101, name: 'Leather Hydration Bag' },
  { id: 2102, name: 'Turpentine Torch' },
  { id: 2103, name: 'Skinning Knife' },
  { id: 2104, name: 'Animal Skin Quiver' },
  { id: 2105, name: 'Hunting Horn' },
  { id: 2106, name: 'Brass Lantern' },
  { id: 2107, name: 'Whetstone' },
  { id: 2108, name: 'Sealed Coarse Salt Shaker' },
  { id: 2109, name: 'Flint' },
  { id: 2110, name: 'Bundle Of Linen Rope' },
  { id: 2111, name: 'Hand Drawn Area Sketch' },
  { id: 2112, name: 'Paint Sealed Letter' },
  { id: 2113, name: 'Dark Camouflage Cloak' },
  { id: 2114, name: 'Shabby Metal Sign' },
  { id: 2115, name: 'Bronze Pocket Watch' },
  { id: 2116, name: 'Complete Antlers' },
  { id: 2117, name: 'Old Pipe' },
  { id: 2118, name: 'Portable Wine Bottle' },
  { id: 2119, name: 'Animal Tooth Necklace' },
  { id: 2120, name: 'Animal Bone Dice' },
  { id: 2201, name: 'Bronze Telescope' },
  { id: 2202, name: 'Forged Seal' },
  { id: 2203, name: 'Nautical Compass' },
  { id: 2204, name: 'Crytal Monocle' },
  { id: 2205, name: 'Portable Balance' },
  { id: 2206, name: 'Precision Hourglass' },
  { id: 2207, name: 'Brass Astrolabe' },
  { id: 2208, name: 'Exquisite Nautical Charts' },
  { id: 2209, name: 'Seiko Magnifying Glass' },
  { id: 2210, name: 'Music Box' },

  // ── Blueprint ──
  { id: 201001, name: 'Rootbud Pin' },
  { id: 201002, name: 'Earthbud Clasp' },
  { id: 201003, name: 'Vine Clip' },
  { id: 201004, name: 'Greenbud Pin' },
  { id: 201005, name: 'Rosy Chain' },
  { id: 201006, name: 'Sweetroot Clasp' },
  { id: 201007, name: 'Grain Pin' },
  { id: 201008, name: 'Sungrain Drop' },
  { id: 201101, name: 'Seedling Pin' },
  { id: 201102, name: 'Fieldbloom Pin' },
  { id: 201103, name: 'Rootbloom Pin' },
  { id: 201104, name: 'Soil Clasp' },
  { id: 201105, name: 'Vinebloom Clip' },
  { id: 201106, name: 'Venrdant Pin' },
  { id: 201107, name: 'Rosy Pin' },
  { id: 201108, name: 'Rootleaf Pin' },
  { id: 201801, name: 'Goldgrain Pin' },
  { id: 201802, name: 'Sungrain Charm' },
  { id: 202001, name: 'Budwood Charm' },
  { id: 202002, name: 'Whiteleaf Charm' },
  { id: 202101, name: 'Pebble Charm' },
  { id: 202401, name: 'Vigor Charm' },
  { id: 202501, name: 'Fortune Charm' },
  { id: 203001, name: 'Rootbud Book' },
  { id: 203002, name: 'Earthbud Book' },
  { id: 203003, name: 'Vine Book' },
  { id: 203004, name: 'Greenbud Book' },
  { id: 203005, name: 'Rosy Book' },
  { id: 203006, name: 'Sweetroot Book' },
  { id: 203007, name: 'Grain Book' },
  { id: 203008, name: 'Sungrain Book' },
  { id: 203101, name: 'Seedling Book' },
  { id: 203102, name: 'Field Book' },
  { id: 203801, name: 'Workshop Book' },
  { id: 203802, name: 'Kitchen Book' },
  { id: 203803, name: 'Bakery Book' },
  { id: 204001, name: 'Starbell' },
  { id: 204002, name: 'Field Lamp' },
  { id: 204003, name: 'Grove Lamp' },
  { id: 204004, name: 'Mine Lamp' },
  { id: 204005, name: 'Herd Bell' },
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
