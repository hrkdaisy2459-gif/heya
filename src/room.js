/* へや — 部屋の描画と道具（アラーム・タイマー・メモ・Todo）
   座標の考え方:
   - ワールドは横 W、高さ H(=260) の単位で描く。ステージの高さに合わせて拡大縮小する。
   - 奥の壁の床ラインが BACK。手前ほど少し大きく・下に・カメラ中心から外側へずれる（d=0 奥, d=1 画面最下端）。
     これで「ほぼ真横＋ちょっと奥行き」の見え方にしている。 */
(() => {
  'use strict';

  const H = 260, BACK = 170, VY = -190, FMAX = 1.25, W = 1000;
  const persp = d => 1 + d * (FMAX - 1);
  const floorY = d => VY + (BACK - VY) * persp(d);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 保存 ---------- */
  const KEY = 'heya:v1';
  const DEFAULT = {
    items: [
      { id: 1, type: 'shelf', x: 110, d: 0.04 },
      { id: 2, type: 'window', x: 245, y: 118 },
      { id: 3, type: 'lamp', x: 330, d: 0.06, on: true },
      { id: 4, type: 'rug', x: 470, d: 0.42 },
      { id: 5, type: 'desk', x: 430, d: 0.05 },
      { id: 6, type: 'clock', x: 430, y: 62 },
      { id: 7, type: 'board', x: 560, y: 104 },
      { id: 8, type: 'timer', x: 640, d: 0.05 },
      { id: 9, type: 'plant', x: 720, d: 0.55 },
      { id: 10, type: 'poster', x: 780, y: 108 },
    ],
    nextId: 11,
    memo: '',
    todos: [
      { id: 1, text: '例：メールを返す', done: false },
      { id: 2, text: '例：資料を見直す', done: false },
      { id: 3, text: '例：ストレッチ', done: true },
    ],
    alarm: { time: '15:00', on: false },
    timer: { dur: 25 * 60000, left: 25 * 60000, endAt: 0, running: false },
    cam: 220,
  };
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch { S = null; }
  S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), S || {});
  let saveT = 0;
  const save = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 保存できない環境でも動かす */ } }, 250);
  };

  /* ---------- 家具の絵 ---------- */
  const books = (y, seed) => {
    const cols = ['#c9584b', '#3f6fa8', '#e2b33f', '#5b9a6a', '#7d5aa6', '#d98a5b', '#eae3d6', '#2f4d5e'];
    let x = 9, out = '', i = seed;
    while (x < 60) {
      const w = 4 + (i * 7) % 4, h = 18 + (i * 5) % 9;
      if (x + w > 63) break;
      out += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${cols[i % cols.length]}"/>`;
      x += w + ((i % 5 === 0) ? 3 : 0.6); i++;
    }
    return out;
  };
  const NOTES = [[10, 10, '#ffe58a', -4], [31, 9, '#ffb3b8', 3], [52, 11, '#a8d8f0', -2], [13, 30, '#b9e4a8', 2], [34, 31, '#ffe58a', -3], [55, 29, '#ffcf9e', 4]];

  const TYPES = {
    clock: { name: '時計', tool: 'alarm', wall: true, w: 40, h: 40, y: 62, art: () => `
      <circle cx="20" cy="20" r="18" fill="#fbfaf7" stroke="#5a4535" stroke-width="3"/>
      <g stroke="#5a4535" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="5.5" x2="20" y2="8"/><line x1="34.5" y1="20" x2="32" y2="20"/><line x1="20" y1="34.5" x2="20" y2="32"/><line x1="5.5" y1="20" x2="8" y2="20"/></g>
      <line class="hh" x1="20" y1="20" x2="20" y2="12" stroke="#2a2b33" stroke-width="2.4" stroke-linecap="round" style="transform-origin:20px 20px"/>
      <line class="mh" x1="20" y1="20" x2="20" y2="7.5" stroke="#2a2b33" stroke-width="1.5" stroke-linecap="round" style="transform-origin:20px 20px"/>
      <circle cx="20" cy="20" r="1.6" fill="#2a2b33"/>
      <circle class="adot" cx="34" cy="6" r="4" fill="#e0574a" stroke="#fff" stroke-width="1.2"/>` },
    board: { name: 'コルクボード', tool: 'todo', wall: true, w: 84, h: 58, y: 104, art: () => `
      <rect x="1" y="1" width="82" height="56" rx="3" fill="#8a6542"/>
      <rect x="6" y="6" width="72" height="46" fill="#c9a06c"/>
      <g fill="#b78d59"><circle cx="20" cy="47" r="1"/><circle cx="44" cy="25" r="1"/><circle cx="68" cy="45" r="1"/><circle cx="9" cy="27" r="1"/></g>
      ${NOTES.map(([x, y, c, r], i) => `<g class="note" data-i="${i}" transform="rotate(${r} ${x + 8} ${y + 7})"><rect x="${x}" y="${y}" width="16" height="15" fill="${c}"/><line x1="${x + 3}" y1="${y + 7}" x2="${x + 13}" y2="${y + 7}" stroke="rgba(0,0,0,.25)"/><line x1="${x + 3}" y1="${y + 10}" x2="${x + 10}" y2="${y + 10}" stroke="rgba(0,0,0,.25)"/><circle cx="${x + 8}" cy="${y + 2}" r="1.6" fill="#d34a3f"/></g>`).join('')}` },
    desk: { name: 'つくえ', tool: 'memo', w: 116, h: 62, art: () => `
      <path d="M24 20 Q32 17.5 40 20 V7 Q32 4.5 24 7Z" fill="#fdfcf8" stroke="#8d8576" stroke-width=".8"/>
      <path d="M40 20 Q48 17.5 56 20 V7 Q48 4.5 40 7Z" fill="#fdfcf8" stroke="#8d8576" stroke-width=".8"/>
      <g class="memo-lines" stroke="#7a8db0" stroke-width=".7"><line x1="27" y1="10" x2="37" y2="10"/><line x1="27" y1="13" x2="36" y2="13"/><line x1="43" y1="10" x2="53" y2="10"/><line x1="43" y1="13" x2="50" y2="13"/></g>
      <rect x="77" y="11" width="10" height="9" rx="1.5" fill="#e6eaf0"/><path d="M87 13 h2.5 a2.5 2.5 0 0 1 0 5 H87" fill="none" stroke="#e6eaf0" stroke-width="1.6"/>
      <rect x="3" y="20" width="110" height="5" fill="#c49264"/>
      <rect x="3" y="25" width="110" height="7" fill="#8f603c"/>
      <rect x="8" y="32" width="6" height="30" fill="#7a5133"/><rect x="102" y="32" width="6" height="30" fill="#7a5133"/>
      <rect x="68" y="32" width="34" height="20" fill="#a06e47"/><rect x="80" y="40" width="10" height="2" rx="1" fill="#6b4529"/>` },
    timer: { name: 'タイマー棚', tool: 'timer', w: 58, h: 56, art: () => `
      <rect x="12" y="4" width="34" height="18" rx="4" fill="#f1f2f4" stroke="#4a5060" stroke-width="1"/>
      <rect x="18" y="1.5" width="6" height="2.5" rx="1" fill="#e0574a"/><rect x="34" y="1.5" width="6" height="2.5" rx="1" fill="#4a5060"/>
      <rect x="15.5" y="7" width="27" height="11" rx="1.5" fill="#c9d8b8"/>
      <text class="lcd" x="29" y="15.6" text-anchor="middle" font-size="8.6" fill="#2b3527" style="font-family:DotGothic16,ui-monospace,monospace">25:00</text>
      <rect x="2" y="22" width="54" height="4" fill="#86aaa6"/>
      <rect x="2" y="26" width="54" height="27" fill="#5f8683"/>
      <line x1="2" y1="39.5" x2="56" y2="39.5" stroke="#4a6b68" stroke-width="1"/>
      <rect x="25" y="31" width="8" height="2" rx="1" fill="#3e5856"/><rect x="25" y="45" width="8" height="2" rx="1" fill="#3e5856"/>
      <rect x="5" y="53" width="4" height="3" fill="#3e5856"/><rect x="49" y="53" width="4" height="3" fill="#3e5856"/>` },
    window: { name: 'まど', wall: true, w: 92, h: 78, y: 118, art: () => `
      <rect x="4" y="2" width="84" height="70" rx="2" fill="#f4f2ee"/>
      <rect class="sky" x="9" y="7" width="74" height="60" fill="#9fd0f0"/>
      <g class="stars" fill="#fff"><circle cx="20" cy="16" r=".9"/><circle cx="34" cy="25" r=".7"/><circle cx="56" cy="14" r="1"/><circle cx="74" cy="30" r=".7"/><circle cx="46" cy="33" r=".6"/></g>
      <circle class="orb" cx="66" cy="21" r="7" fill="#ffe08a"/>
      <path class="hill" d="M9 67 V55 Q28 45 48 54 T83 50 V67Z" fill="#6f9a74"/>
      <rect x="45" y="7" width="2.4" height="60" fill="#f4f2ee"/><rect x="9" y="36" width="74" height="2.4" fill="#f4f2ee"/>
      <path d="M2 2 H16 Q11 36 18 72 H2Z" fill="#7f95b8"/><path d="M90 2 H76 Q81 36 74 72 H90Z" fill="#7f95b8"/>
      <rect x="0" y="70" width="92" height="6" rx="1" fill="#e2ded6"/>` },
    poster: { name: 'ポスター', wall: true, w: 44, h: 60, y: 108, art: () => `
      <rect x="1" y="1" width="42" height="58" fill="#33363f"/><rect x="4" y="4" width="36" height="52" fill="#efe6d8"/>
      <circle cx="29" cy="17" r="6" fill="#e9875b"/>
      <path d="M4 44 L16 26 L24 36 L30 29 L40 42 V56 H4Z" fill="#4b6b8a"/><path d="M4 56 V48 Q22 40 40 49 V56Z" fill="#3a5470"/>` },
    shelf: { name: '本だな', w: 72, h: 118, art: () => `
      <rect x="2" y="0" width="68" height="5" fill="#a87a52"/>
      <rect x="2" y="5" width="68" height="113" fill="#8a5f3d"/>
      <rect x="7" y="9" width="58" height="105" fill="#5e3f28"/>
      ${books(40, 1)}${books(76, 4)}${books(110, 2)}
      <rect x="7" y="40" width="58" height="4" fill="#8a5f3d"/><rect x="7" y="76" width="58" height="4" fill="#8a5f3d"/>` },
    plant: { name: '観葉植物', w: 40, h: 64, art: () => `
      <g fill="#4f8a5b"><ellipse cx="13" cy="26" rx="5" ry="13" transform="rotate(-28 13 26)"/><ellipse cx="27" cy="24" rx="5" ry="13" transform="rotate(30 27 24)"/></g>
      <g fill="#64a370"><ellipse cx="20" cy="18" rx="5" ry="15"/><ellipse cx="9" cy="36" rx="4" ry="9" transform="rotate(-55 9 36)"/><ellipse cx="31" cy="35" rx="4" ry="9" transform="rotate(55 31 35)"/></g>
      <path d="M10 46 H30 L27 63 H13Z" fill="#b8795a"/><rect x="8" y="43" width="24" height="5" rx="1" fill="#cf9273"/>` },
    lamp: { name: 'ランプ', toggle: true, w: 34, h: 104, art: () => `
      <circle class="glow" cx="17" cy="20" r="17" fill="#ffd98a" opacity=".5"/>
      <path d="M6 30 L10 8 H24 L28 30Z" fill="#eadcc2" stroke="#b9a98d" stroke-width=".8"/>
      <rect x="15.8" y="30" width="2.4" height="67" fill="#3d3f48"/>
      <ellipse cx="17" cy="99" rx="12" ry="4" fill="#3d3f48"/>` },
    rug: { name: 'ラグ', flat: true, w: 150, h: 22, art: () => `
      <ellipse cx="75" cy="11" rx="74" ry="10" fill="#d6a54a"/>
      <ellipse cx="75" cy="11" rx="63" ry="7.2" fill="none" stroke="#b9832f" stroke-width="1.5" stroke-dasharray="4 3"/>
      <ellipse cx="75" cy="11" rx="38" ry="3.6" fill="#c9923c"/>` },
  };
  const CHAR = { w: 44, h: 78, art: `
    <ellipse cx="22" cy="76" rx="12" ry="2.5" fill="rgba(0,0,0,.18)"/>
    <g class="bob">
      <rect class="leg l" x="15" y="57" width="6" height="17" rx="2.5" fill="#3e4460"/>
      <rect class="leg r" x="23" y="57" width="6" height="17" rx="2.5" fill="#353a52"/>
      <rect x="12" y="36" width="21" height="25" rx="7" fill="#5b8f7c"/>
      <rect x="25" y="40" width="6" height="15" rx="3" fill="#4d7d6b"/>
      <circle cx="22" cy="22" r="16" fill="#f5d6bc"/>
      <path d="M6 23 Q5 4 22 4 Q39 4 38 21 Q33 12 25 12 Q15 13 10 23Z" fill="#3b2c29"/>
      <g class="eyes" fill="#2b2230"><ellipse cx="25" cy="24" rx="1.8" ry="2.4"/><ellipse cx="33" cy="24" rx="1.8" ry="2.4"/></g>
      <circle cx="34.5" cy="29" r="2.2" fill="#f2a7a0" opacity=".7"/>
    </g>` };
  const svgOf = (t, inner) => `<svg viewBox="0 0 ${t.w} ${t.h}" aria-hidden="true">${inner}</svg>`;

  /* ---------- 画面の骨組み ---------- */
  const I = {
    edit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 14h3l8-8-3-3-8 8z"/><path d="M9 4l3 3"/></svg>',
    pin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h4l-.5 4 2.5 2.5H4L6.5 6z"/><path d="M8 8.5V14"/></svg>',
    min: '<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3.5 8.5h9"/></svg>',
    pip: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><rect x="8" y="8" width="5" height="4" rx=".5" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  };
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="bar">
      <span class="title">へや</span>
      <span class="status" id="status"></span>
      <div class="btns">
        <button class="ibtn" id="btnPip" title="小窓にして、いつも手前に表示" aria-label="小窓にする" hidden>${I.pip}</button>
        <button class="ibtn" id="btnEdit" title="模様替え（家具を追加・移動）" aria-label="模様替え">${I.edit}</button>
        <button class="ibtn desktop-only" id="btnPin" title="いつも手前に表示" aria-label="いつも手前に表示">${I.pin}</button>
        <button class="ibtn desktop-only" id="btnMin" title="しまう" aria-label="しまう">${I.min}</button>
        <button class="ibtn desktop-only" id="btnClose" title="閉じる" aria-label="閉じる">${I.close}</button>
      </div>
    </div>
    <div class="stage" id="stage">
      <svg class="bg" id="bg" preserveAspectRatio="none"></svg>
      <div class="things" id="things"></div>
      <div class="shade" id="shade"></div>
      <button class="nav l" id="navL" aria-label="左へ">‹</button>
      <button class="nav r" id="navR" aria-label="右へ">›</button>
      <div class="ringbar" id="ringbar" hidden><span id="ringText"></span><button id="ringStop">止める</button></div>
      <section class="panel" id="panel" hidden></section>
      <div class="catalog" id="catalog" hidden></div>
    </div>`;
  const $ = id => app.querySelector('#' + id); // 小窓へ移しても見つかるように app から探す
  const stage = $('stage'), bg = $('bg'), thingsEl = $('things'), shade = $('shade'), panel = $('panel'), catalog = $('catalog');

  let s = 1, vw = 480;          // 拡大率とビュー幅（ワールド単位）
  let camGoal = null, dirty = true, editing = false, panelKind = null;
  const els = new Map();

  /* ---------- キャラクター ---------- */
  const ch = { x: 380, d: 0.34, tx: 380, face: 1, say: '', sayUntil: 0, nextWander: performance.now() + 9000 };
  const charEl = document.createElement('div');
  charEl.className = 'char';
  charEl.style.width = CHAR.w + 'px'; charEl.style.height = CHAR.h + 'px';
  charEl.innerHTML = svgOf(CHAR, CHAR.art);
  const bubble = document.createElement('div');
  bubble.className = 'bubble'; bubble.hidden = true;
  const LINES = ['がんばろう', 'ひと休みする？', 'お茶いれよっか', 'いい感じ！', 'のびー', 'あとちょっと'];
  function say(text, ms = 2600) { ch.say = text; ch.sayUntil = performance.now() + ms; dirty = true; }
  function walkTo(x) { ch.tx = clamp(x, 30, W - 30); ch.nextWander = performance.now() + 15000; }
  function walkNear(it) {
    const t = TYPES[it.type], gap = t.w / 2 + 16;
    walkTo(ch.x < it.x ? it.x - gap : it.x + gap);
  }

  /* ---------- 家具の生成 ---------- */
  function buildThings() {
    thingsEl.textContent = '';
    els.clear();
    for (const it of S.items) {
      const t = TYPES[it.type];
      if (!t) continue;
      const el = document.createElement('div');
      el.className = 'thing' + (t.flat ? ' flat' : '') + (it.on ? ' on' : '');
      el.dataset.id = it.id;
      el.dataset.type = it.type;
      el.style.width = t.w + 'px'; el.style.height = t.h + 'px';
      el.title = t.name;
      el.innerHTML = svgOf(t, t.art()) + `<button class="del" aria-label="${t.name}をしまう">×</button>`;
      thingsEl.appendChild(el);
      els.set(it.id, el);
    }
    thingsEl.appendChild(charEl);
    thingsEl.appendChild(bubble);
    refreshDynamic();
    dirty = true;
  }

  /* ---------- 描画 ---------- */
  function measure() {
    const r = stage.getBoundingClientRect();
    s = r.height / H; vw = r.width / s;
    dirty = true;
  }
  function clampCam(c) {
    const lo = -50, hi = W + 50 - vw;
    return hi < lo ? (W - vw) / 2 : clamp(c, lo, hi);
  }
  function render() {
    S.cam = clampCam(S.cam);
    const vp = S.cam + vw / 2;
    const sx = (x, d) => vw / 2 + (x - vp) * persp(d);
    const L0 = sx(0, 0), R0 = sx(W, 0), L1 = sx(0, 1), R1 = sx(W, 1);
    let g = `<rect x="0" y="0" width="${vw}" height="${H}" fill="#23212b"/>`;
    // 左右の壁
    g += `<path d="M${L0} 0 V${BACK} L${L1} ${H} V0Z" fill="#b4bbc7"/><path d="M${R0} 0 V${BACK} L${R1} ${H} V0Z" fill="#b4bbc7"/>`;
    g += `<path d="M${L0} ${BACK} L${L1} ${H}" stroke="#6e5a4a" stroke-width="4"/><path d="M${R0} ${BACK} L${R1} ${H}" stroke="#6e5a4a" stroke-width="4"/>`;
    // 奥の壁
    g += `<rect x="${L0}" y="0" width="${R0 - L0}" height="${BACK}" fill="#d3d8e0"/>`;
    g += `<g stroke="rgba(255,255,255,.35)" stroke-width="1">`;
    for (let x = 12; x < W; x += 24) { const X = sx(x, 0); if (X > -2 && X < vw + 2) g += `<line x1="${X}" y1="6" x2="${X}" y2="114"/>`; }
    g += `</g>`;
    g += `<rect x="${L0}" y="0" width="${R0 - L0}" height="6" fill="#bfc6d1"/>`;
    g += `<rect x="${L0}" y="114" width="${R0 - L0}" height="${BACK - 114}" fill="#a9b8a8"/><rect x="${L0}" y="112" width="${R0 - L0}" height="3" fill="#8d9c8c"/>`;
    g += `<rect x="${L0}" y="${BACK - 7}" width="${R0 - L0}" height="7" fill="#6e5a4a"/>`;
    // 床（板目がカメラに合わせて少し傾く）
    g += `<path d="M${L0} ${BACK} H${R0} L${R1} ${H} H${L1}Z" fill="#b48a63"/>`;
    g += `<g stroke="#9c7552" stroke-width=".9">`;
    for (let x = 0; x <= W; x += 30) {
      const a = sx(x, 0), b = sx(x, 1);
      if (Math.max(a, b) > -2 && Math.min(a, b) < vw + 2) g += `<line x1="${a}" y1="${BACK}" x2="${b}" y2="${H}"/>`;
    }
    for (const d of [0.22, 0.5, 0.8]) { const y = floorY(d); g += `<line x1="${sx(0, d)}" y1="${y}" x2="${sx(W, d)}" y2="${y}" stroke-opacity=".6"/>`; }
    g += `</g>`;
    bg.setAttribute('viewBox', `0 0 ${vw} ${H}`);
    bg.innerHTML = g;

    // 家具
    let lamp = null;
    for (const it of S.items) {
      const el = els.get(it.id), t = TYPES[it.type];
      if (!el) continue;
      const d = t.wall ? 0 : it.d, f = persp(d);
      const X = sx(it.x, d), Y = t.wall ? it.y : floorY(d);
      el.style.transform = `translate(${(X - t.w * f / 2) * s}px, ${(Y - t.h * f) * s}px) scale(${f * s})`;
      el.style.zIndex = t.wall ? 1 : t.flat ? 2 : 10 + Math.round(d * 100);
      if (it.type === 'lamp' && it.on && !lamp) lamp = { x: X * s, y: (Y - (t.h - 20) * f) * s };
    }
    // キャラクター
    const f = persp(ch.d), X = sx(ch.x, ch.d), Y = floorY(ch.d);
    charEl.style.transform = `translate(${(X - CHAR.w * f / 2) * s}px, ${(Y - CHAR.h * f) * s}px) scale(${f * s})`;
    charEl.style.zIndex = 10 + Math.round(ch.d * 100);
    charEl.classList.toggle('left', ch.face < 0);
    const talking = ch.say && performance.now() < ch.sayUntil;
    bubble.hidden = !talking;
    if (talking) {
      bubble.textContent = ch.say;
      bubble.style.left = X * s + 'px';
      bubble.style.top = (Y - CHAR.h * f - 4) * s + 'px';
    }
    applyShade(lamp);
  }

  /* 時間帯で部屋の明るさと窓の景色を変える */
  let skyKey = '';
  function skyNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 5 && h < 7) return { k: 'dawn', sky: '#f3c6a5', hill: '#7d8f72', orb: '#ffd27a', star: 0, dark: 0.12 };
    if (h >= 7 && h < 16) return { k: 'day', sky: '#9fd0f0', hill: '#6f9a74', orb: '#ffe08a', star: 0, dark: 0 };
    if (h >= 16 && h < 18) return { k: 'eve', sky: '#f0a56f', hill: '#7b7a5c', orb: '#ffcf70', star: 0, dark: 0.1 };
    if (h >= 18 && h < 19) return { k: 'dusk', sky: '#6c5a8e', hill: '#4a4d5c', orb: '#f3e9c6', star: 1, dark: 0.22 };
    return { k: 'night', sky: '#1c2747', hill: '#2a3340', orb: '#f3e9c6', star: 1, dark: 0.36 };
  }
  function applyShade(lamp) {
    const k = skyNow();
    if (k.k !== skyKey) {
      skyKey = k.k;
      thingsEl.querySelectorAll('[data-type="window"]').forEach(el => {
        el.querySelector('.sky').setAttribute('fill', k.sky);
        el.querySelector('.hill').setAttribute('fill', k.hill);
        el.querySelector('.orb').setAttribute('fill', k.orb);
        el.querySelector('.stars').style.display = k.star ? '' : 'none';
      });
    }
    const a = k.dark;
    if (a <= 0) { shade.style.background = 'none'; return; }
    const night = `rgba(16,20,46,${a})`;
    shade.style.background = lamp
      ? `radial-gradient(circle at ${lamp.x}px ${lamp.y}px, rgba(255,205,130,.16) 0, rgba(255,205,130,0) ${60 * s}px, rgba(16,20,46,${a * 0.35}) ${130 * s}px, ${night} ${260 * s}px)`
      : night;
  }

  /* 時計の針・タイマー表示・メモ・Todo枚数など、家具に出る状態 */
  function refreshDynamic() {
    const now = new Date();
    const mdeg = (now.getMinutes() + now.getSeconds() / 60) * 6;
    const hdeg = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
    const tleft = timerLeft();
    const open = S.todos.filter(t => !t.done).length;
    for (const it of S.items) {
      const el = els.get(it.id);
      if (!el) continue;
      if (it.type === 'clock') {
        el.querySelector('.hh').style.transform = `rotate(${hdeg}deg)`;
        el.querySelector('.mh').style.transform = `rotate(${mdeg}deg)`;
        el.querySelector('.adot').style.display = S.alarm.on ? '' : 'none';
        el.classList.toggle('ringing', ring?.kind === 'alarm');
      } else if (it.type === 'timer') {
        const lcd = el.querySelector('.lcd');
        lcd.textContent = fmt(tleft);
        lcd.classList.toggle('blink', ring?.kind === 'timer' || (!S.timer.running && tleft < S.timer.dur && tleft > 0));
        el.classList.toggle('ringing', ring?.kind === 'timer');
      } else if (it.type === 'desk') {
        el.querySelector('.memo-lines').style.display = S.memo.trim() ? '' : 'none';
      } else if (it.type === 'board') {
        el.querySelectorAll('.note').forEach((n, i) => { n.style.display = i < open ? '' : 'none'; });
      }
    }
    // バーの表示
    const parts = [];
    if (S.timer.running) parts.push('タイマー ' + fmt(tleft));
    else if (tleft > 0 && tleft < S.timer.dur) parts.push('タイマー ' + fmt(tleft) + '（一時停止）');
    if (S.alarm.on) parts.push('アラーム ' + S.alarm.time);
    if (!parts.length && open) parts.push(`やること ${open}件`);
    $('status').textContent = parts.join(' ・ ');
    const big = $('timerBig');
    if (big) big.textContent = fmt(tleft);
    const ts = $('timerStart');
    if (ts) ts.textContent = S.timer.running ? '一時停止' : (tleft < S.timer.dur && tleft > 0 ? '再開' : 'スタート');
  }

  /* ---------- 音と通知 ---------- */
  let actx = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch { /* 音が使えない環境 */ }
  }
  function beep() {
    if (!actx) unlockAudio();
    if (!actx) return;
    const t0 = actx.currentTime;
    [[0, 880], [0.18, 880], [0.36, 1175]].forEach(([o, hz]) => {
      const os = actx.createOscillator(), g = actx.createGain();
      os.type = 'sine'; os.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t0 + o);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + o + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o + 0.15);
      os.connect(g).connect(actx.destination);
      os.start(t0 + o); os.stop(t0 + o + 0.16);
    });
  }
  function askNotify() {
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); } catch { /* 通知なし */ }
  }
  function notify(text) {
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('へや', { body: text, silent: true }); } catch { /* 通知なし */ }
  }

  /* ---------- 鳴らす・止める ---------- */
  let ring = null, lastBeep = 0;
  function startRing(kind, text) {
    ring = { kind, until: Date.now() + 60000 };
    $('ringText').textContent = text;
    $('ringbar').hidden = false;
    charEl.classList.add('hop');
    say(kind === 'alarm' ? 'アラームだよ！' : '時間だよ！', 60000);
    lastBeep = 0;
    notify(text);
    if (window.heyaDesktop) window.heyaDesktop.attention();
    refreshDynamic();
  }
  function stopRing() {
    if (!ring) return;
    ring = null;
    $('ringbar').hidden = true;
    charEl.classList.remove('hop');
    say('おつかれさま', 1800);
    refreshDynamic();
    if (panelKind) renderPanel();
  }

  /* ---------- タイマー ---------- */
  function timerLeft() { const t = S.timer; return t.running ? Math.max(0, t.endAt - Date.now()) : t.left; }
  function fmt(ms) {
    const sec = Math.ceil(ms / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), ss = sec % 60;
    const p = n => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
  }
  function timerSet(min, start) {
    const t = S.timer;
    t.dur = Math.round(clamp(min, 0.1, 600) * 60000); t.left = t.dur; t.running = false;
    if ($('timerMin')) $('timerMin').value = Math.round(t.dur / 60000) || 1;
    if (start) timerToggle();
    save(); refreshDynamic();
  }
  function timerToggle() {
    const t = S.timer;
    if (t.running) { t.left = Math.max(0, t.endAt - Date.now()); t.running = false; }
    else { if (t.left <= 0) t.left = t.dur; t.endAt = Date.now() + t.left; t.running = true; askNotify(); }
    save(); refreshDynamic();
  }
  function timerReset() { const t = S.timer; t.running = false; t.left = t.dur; save(); refreshDynamic(); }

  /* ---------- 毎秒の処理 ---------- */
  let lastAlarmKey = '';
  function tick() {
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const key = now.toDateString() + hm;
    if (S.alarm.on && S.alarm.time === hm && lastAlarmKey !== key) {
      lastAlarmKey = key;
      S.alarm.on = false; save();
      startRing('alarm', `アラーム ${hm}`);
      if (panelKind === 'alarm') renderPanel();
    }
    if (S.timer.running && Date.now() >= S.timer.endAt) {
      S.timer.running = false; S.timer.left = 0; save();
      startRing('timer', `タイマー終了（${fmt(S.timer.dur)}）`);
    }
    if (ring) {
      if (Date.now() > ring.until) stopRing();
      else if (Date.now() - lastBeep > 1100) { lastBeep = Date.now(); beep(); }
    }
    refreshDynamic();
    dirty = true; // ランプの光も含めて描き直す
  }

  /* ---------- パネル（道具） ---------- */
  const TITLES = { alarm: 'アラーム', timer: 'タイマー', memo: 'メモ', todo: 'やること' };
  function openPanel(kind, onLeft) {
    panelKind = kind;
    panel.classList.toggle('left', !!onLeft);
    panel.hidden = false;
    renderPanel(true);
  }
  function closePanel() { panelKind = null; panel.hidden = true; panel.textContent = ''; }
  function renderPanel(focus) {
    const k = panelKind;
    if (!k) return;
    let body = '';
    if (k === 'alarm') {
      body = `
        <div class="row">
          <input type="time" id="alarmTime" value="${esc(S.alarm.time)}" aria-label="鳴らす時刻">
          <label class="toggle"><input type="checkbox" id="alarmOn" ${S.alarm.on ? 'checked' : ''}> <span>${S.alarm.on ? 'セット中' : 'オフ'}</span></label>
        </div>
        <p class="hint">指定した時刻に1回だけ鳴ります。鳴ったら自動でオフに戻ります。</p>
        ${ring?.kind === 'alarm' ? '<button class="btn primary" id="pStop">止める</button>' : ''}`;
    } else if (k === 'timer') {
      body = `
        <div class="bigtime" id="timerBig">${fmt(timerLeft())}</div>
        <div class="chips">${[1, 3, 5, 10, 25, 45].map(m => `<button class="btn" data-min="${m}">${m}分</button>`).join('')}</div>
        <div class="row">
          <input type="number" id="timerMin" min="1" max="600" value="${Math.round(S.timer.dur / 60000) || 1}" aria-label="分"> 分
          <button class="btn small" id="timerApply">セット</button>
        </div>
        <div class="row">
          <button class="btn primary" id="timerStart">スタート</button>
          <button class="btn" id="timerReset">リセット</button>
        </div>
        ${ring?.kind === 'timer' ? '<button class="btn primary" id="pStop">止める</button>' : ''}`;
    } else if (k === 'memo') {
      body = `<textarea id="memoText" placeholder="思いついたことをここに。自動で保存されます。" aria-label="メモ">${esc(S.memo)}</textarea>`;
    } else if (k === 'todo') {
      const open = S.todos.filter(t => !t.done).length, done = S.todos.length - open;
      body = `
        <form class="todo-form" id="todoForm"><input type="text" id="todoText" placeholder="やることを追加" aria-label="やること" autocomplete="off"><button class="btn primary small">追加</button></form>
        ${S.todos.length ? `<ul class="todos">${S.todos.map(t => `
          <li class="${t.done ? 'done' : ''}" data-id="${t.id}">
            <label><input type="checkbox" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span></label>
            <button class="x" aria-label="削除">×</button>
          </li>`).join('')}</ul>` : '<p class="empty">やることはありません</p>'}
        ${done ? `<div class="row"><button class="btn small" id="todoClear">完了した${done}件を消す</button></div>` : ''}`;
    }
    panel.innerHTML = `<header><h2>${TITLES[k]}</h2><button class="ibtn" id="pClose" aria-label="閉じる">${I.close}</button></header><div class="body">${body}</div>`;
    refreshDynamic();
    if (focus) {
      const f = $('todoText') || $('memoText');
      if (f) setTimeout(() => f.focus(), 0);
    }
  }
  panel.addEventListener('click', e => {
    const t = e.target.closest('button, input');
    if (!t) return;
    if (t.id === 'pClose') return closePanel();
    if (t.id === 'pStop') return stopRing();
    if (t.dataset.min) return timerSet(+t.dataset.min, true);
    if (t.id === 'timerApply') return timerSet(+$('timerMin').value || 1, false);
    if (t.id === 'timerStart') return timerToggle();
    if (t.id === 'timerReset') return timerReset();
    if (t.id === 'todoClear') { S.todos = S.todos.filter(x => !x.done); save(); renderPanel(); return refreshDynamic(); }
    const li = t.closest('li[data-id]');
    if (li) {
      const id = +li.dataset.id;
      if (t.classList.contains('x')) S.todos = S.todos.filter(x => x.id !== id);
      else if (t.type === 'checkbox') { const td = S.todos.find(x => x.id === id); td.done = t.checked; if (t.checked) say('えらい！', 1500); }
      save(); renderPanel(); refreshDynamic();
    }
  });
  panel.addEventListener('change', e => {
    if (e.target.id === 'alarmTime') { S.alarm.time = e.target.value || S.alarm.time; save(); refreshDynamic(); }
    if (e.target.id === 'alarmOn') { S.alarm.on = e.target.checked; if (S.alarm.on) { askNotify(); say(`${S.alarm.time}に鳴らすね`); } save(); renderPanel(); }
  });
  panel.addEventListener('input', e => {
    if (e.target.id === 'memoText') { S.memo = e.target.value; save(); refreshDynamic(); }
  });
  panel.addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('todoText'), text = inp.value.trim();
    if (!text) return;
    S.todos.push({ id: Math.max(0, ...S.todos.map(t => t.id)) + 1, text, done: false });
    save(); renderPanel(true); refreshDynamic();
  });
  panel.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'timerMin') timerSet(+e.target.value || 1, true);
  });

  /* ---------- 模様替え ---------- */
  function setEditing(on) {
    editing = on;
    app.classList.toggle('editing', on);
    $('btnEdit').classList.toggle('active', on);
    catalog.hidden = !on;
    if (on) { closePanel(); renderCatalog(); }
    save();
  }
  function renderCatalog() {
    const placed = new Set(S.items.map(i => i.type));
    catalog.innerHTML = Object.entries(TYPES).map(([k, t]) => {
      const used = t.tool && placed.has(k);
      return `<button class="item" data-type="${k}" ${used ? 'disabled' : ''} title="${t.name}">${svgOf(t, t.art())}<span>${t.name}</span>${t.tool ? `<small>${used ? '配置済み' : TITLES[t.tool]}</small>` : ''}</button>`;
    }).join('') + '<button class="btn primary small done" id="editDone">完了</button>';
  }
  catalog.addEventListener('click', e => {
    if (e.target.closest('#editDone')) return setEditing(false);
    const b = e.target.closest('.item');
    if (!b || b.disabled) return;
    const type = b.dataset.type, t = TYPES[type];
    const x = clamp(S.cam + vw / 2 + (Math.random() * 60 - 30), t.w / 2, W - t.w / 2);
    S.items.push(t.wall ? { id: S.nextId++, type, x, y: t.y } : { id: S.nextId++, type, x, d: t.flat ? 0.4 : 0.1 });
    save(); buildThings(); renderCatalog();
  });

  /* ---------- 操作 ---------- */
  let drag = null;
  thingsEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.thing');
    if (!el) return;
    e.stopPropagation();
    if (!editing) return;
    if (e.target.closest('.del')) return;
    const it = S.items.find(i => i.id === +el.dataset.id);
    drag = { it, el, px: e.clientX, py: e.clientY, x: it.x, y: it.y, d: it.d };
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
  });
  thingsEl.addEventListener('pointermove', e => {
    if (!drag) return;
    const t = TYPES[drag.it.type];
    const dx = (e.clientX - drag.px) / s, dy = (e.clientY - drag.py) / s;
    if (t.wall) {
      drag.it.x = clamp(drag.x + dx, t.w / 2, W - t.w / 2);
      drag.it.y = clamp(drag.y + dy, t.h + 4, BACK - 10);
    } else {
      drag.it.d = clamp(drag.d + dy / ((BACK - VY) * (FMAX - 1)), 0.02, 0.75);
      drag.it.x = clamp(drag.x + dx / persp(drag.it.d), t.w / 2, W - t.w / 2);
    }
    dirty = true;
  });
  const endDrag = () => { if (drag) { drag.el.classList.remove('dragging'); drag = null; save(); } };
  thingsEl.addEventListener('pointerup', endDrag);
  thingsEl.addEventListener('pointercancel', endDrag);

  thingsEl.addEventListener('click', e => {
    if (e.target.closest('.char')) {
      if (ring) return stopRing();
      return say(LINES[Math.floor(Math.random() * LINES.length)]);
    }
    const el = e.target.closest('.thing');
    if (!el) return;
    const it = S.items.find(i => i.id === +el.dataset.id);
    if (editing) {
      if (e.target.closest('.del')) {
        S.items = S.items.filter(i => i !== it);
        save(); buildThings(); renderCatalog();
      }
      return;
    }
    const t = TYPES[it.type];
    walkNear(it);
    if (t.tool) {
      if (ring && ((ring.kind === 'alarm' && t.tool === 'alarm') || (ring.kind === 'timer' && t.tool === 'timer'))) stopRing();
      const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      openPanel(t.tool, r.left + r.width / 2 > sr.left + sr.width / 2); // 家具と反対側に出す
    } else if (t.toggle) {
      it.on = !it.on; el.classList.toggle('on', it.on); save(); dirty = true;
    } else if (it.type === 'plant') say('水やりしなきゃ');
    else if (it.type === 'shelf') say('なに読もうかな');
    else if (it.type === 'window') say(skyKey === 'night' ? '星がきれい' : 'いい天気');
  });

  // 背景ドラッグでスクロール、クリックでそこへ歩く
  let pan = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.panel, .catalog, .nav, .ringbar, .thing, .char')) return;
    unlockAudio();
    pan = { px: e.clientX, cam: S.cam, moved: false, y: e.clientY };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('panning');
  });
  stage.addEventListener('pointermove', e => {
    if (!pan) return;
    const dx = e.clientX - pan.px;
    if (Math.abs(dx) > 3) pan.moved = true;
    if (pan.moved) { S.cam = clampCam(pan.cam - dx / s); camGoal = null; dirty = true; }
  });
  const endPan = e => {
    if (!pan) return;
    stage.classList.remove('panning');
    if (!pan.moved && !editing && e.type === 'pointerup') {
      const r = stage.getBoundingClientRect();
      const ux = (e.clientX - r.left) / s;
      walkTo(S.cam + vw / 2 + (ux - vw / 2) / persp(ch.d));
    }
    pan = null; save();
  };
  stage.addEventListener('pointerup', endPan);
  stage.addEventListener('pointercancel', endPan);

  stage.addEventListener('wheel', e => {
    if (e.target.closest('.panel, .catalog')) return;
    e.preventDefault();
    S.cam = clampCam(S.cam + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.7 / s);
    camGoal = null; dirty = true; save();
  }, { passive: false });
  $('navL').addEventListener('click', () => { camGoal = clampCam(S.cam - vw * 0.6); });
  $('navR').addEventListener('click', () => { camGoal = clampCam(S.cam + vw * 0.6); });
  $('ringStop').addEventListener('click', stopRing);
  $('btnEdit').addEventListener('click', () => setEditing(!editing));
  function onKey(e) {
    if (e.target.closest('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'ArrowLeft') camGoal = clampCam((camGoal ?? S.cam) - 80);
    else if (e.key === 'ArrowRight') camGoal = clampCam((camGoal ?? S.cam) + 80);
    else if (e.key === 'Escape') { if (ring) stopRing(); else if (panelKind) closePanel(); else if (editing) setEditing(false); }
  }
  function bindDoc(doc) {
    doc.addEventListener('pointerdown', unlockAudio, { capture: true });
    doc.addEventListener('keydown', onKey);
  }
  bindDoc(document);

  /* ---------- デスクトップ版（Electron）だけのボタン ---------- */
  const desk = window.heyaDesktop;
  if (desk) {
    document.documentElement.classList.add('fill');
    app.classList.add('is-desktop');
    const pinBtn = $('btnPin');
    desk.getPinned().then(v => pinBtn.classList.toggle('active', v));
    pinBtn.addEventListener('click', async () => pinBtn.classList.toggle('active', await desk.togglePin()));
    $('btnMin').addEventListener('click', () => desk.minimize());
    $('btnClose').addEventListener('click', () => desk.close());
  }

  /* ---------- 小窓（Chrome / Edge の Document Picture-in-Picture） ----------
     部屋ごと小窓に移す。小窓は常に手前に表示される。元のタブは裏にあってOK。 */
  let host = window, loopId = 0, tickId = 0, ro = null;
  function attachHost(w) {
    host = w;
    if (ro) ro.disconnect();
    ro = new w.ResizeObserver(measure); ro.observe(stage);
    // 見えている窓のタイマーで動かす（裏のタブは時間が遅れるため）
    clearInterval(tickId); tickId = w.setInterval(tick, 500);
    const id = ++loopId;
    const step = () => { if (id !== loopId) return; frame(performance.now()); w.requestAnimationFrame(step); };
    w.requestAnimationFrame(step);
    measure();
  }
  const pipOK = 'documentPictureInPicture' in window && window.top === window && !window.heyaDesktop;
  const home = app.parentNode, homeNext = app.nextSibling;
  const placeholder = document.createElement('div');
  placeholder.className = 'pip-placeholder';
  placeholder.innerHTML = '<p>へやは小窓で表示中です。</p><button class="btn primary" type="button">ここに戻す</button>';
  let pipWin = null;
  async function openPip() {
    if (pipWin) return pipWin.close();
    try {
      pipWin = await documentPictureInPicture.requestWindow({ width: 480, height: 280 });
    } catch { return; }
    for (const n of document.head.querySelectorAll('style, link[rel="stylesheet"]')) pipWin.document.head.appendChild(n.cloneNode(true));
    pipWin.document.title = 'へや';
    for (const [k, v] of Object.entries(document.documentElement.dataset)) pipWin.document.documentElement.dataset[k] = v;
    home.insertBefore(placeholder, app);
    pipWin.document.body.appendChild(app);
    app.classList.add('in-pip');
    bindDoc(pipWin.document);
    attachHost(pipWin);
    pipWin.addEventListener('pagehide', () => {
      pipWin = null;
      app.classList.remove('in-pip');
      home.insertBefore(app, placeholder);
      placeholder.remove();
      attachHost(window);
    }, { once: true });
  }
  placeholder.querySelector('button').addEventListener('click', () => pipWin && pipWin.close());
  if (pipOK) {
    $('btnPip').hidden = false;
    $('btnPip').addEventListener('click', openPip);
  }

  /* ---------- ループ ---------- */
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (camGoal != null) {
      S.cam += (camGoal - S.cam) * Math.min(1, dt * 9);
      if (Math.abs(camGoal - S.cam) < 0.5) { S.cam = camGoal; camGoal = null; save(); }
      dirty = true;
    }
    // キャラクター
    const diff = ch.tx - ch.x;
    const walking = Math.abs(diff) > 1;
    if (walking) { ch.x += Math.sign(diff) * Math.min(Math.abs(diff), 75 * dt); ch.face = Math.sign(diff); dirty = true; }
    charEl.classList.toggle('walking', walking);
    if (!walking && !editing && !panelKind && !ring && t > ch.nextWander) {
      ch.tx = clamp(ch.x + (Math.random() * 320 - 160), 40, W - 40);
      ch.nextWander = t + 8000 + Math.random() * 12000;
    }
    if (ch.say && t > ch.sayUntil) { ch.say = ''; dirty = true; }
    if (dirty) { dirty = false; render(); }
  }

  buildThings();
  attachHost(window);
  tick();
  setTimeout(() => say('今日もよろしくね'), 600);
})();
