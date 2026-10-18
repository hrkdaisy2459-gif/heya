/* へや — 部屋の描画・女の子・道具
   描画: 高さ 130px の小さなキャンバスにドット絵で描き、ステージの高さに合わせて拡大する。
   奥行き: 奥の壁と床の境目(BACK)を基準に、手前(d が大きい)ほど下に、カメラ中心から外側へずらして置く。
   スクロールすると床板の傾きと左右の壁の見え方が変わり、横スクロールでも少し立体的に見える。 */
(() => {
  'use strict';

  const A = window.HeyaArt, SND = window.HeyaSound;
  const TYPES = A.TYPES;
  const H = 130, BACK = A.BACK, VY = -90, FMAX = 1.25;
  const persp = d => 1 + d * (FMAX - 1);
  const floorY = d => Math.round(VY + (BACK - VY) * persp(d));
  const DEPTH_PX = (BACK - VY) * (FMAX - 1); // d=1 で床が何px下がるか (=44)
  const REST_D = 0.36;                       // 女の子がふだん歩く奥行き
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const ROOMS = { main: { name: 'へや', w: 720 }, kitchen: { name: 'キッチン', w: 420 } };
  const SIDE = { pink: '#efcdd7', mint: '#cdeadf', flower: '#f0e2c8', wood: '#c4925f', wa: '#e2d1ad', stars: '#1f2448' };

  /* ---------- 保存 ---------- */
  const KEY = 'heya:v3';
  const defaultItems = () => [
    // へや
    { id: 1, room: 'main', type: 'door', x: 22, d: 0.02 },
    { id: 2, room: 'main', type: 'shelf', x: 60, d: 0.03 },
    { id: 3, room: 'main', type: 'window', x: 112, y: 62 },
    { id: 4, room: 'main', type: 'lamp', x: 150, d: 0.05, on: true },
    { id: 5, room: 'main', type: 'desk', x: 205, d: 0.05 },
    { id: 6, room: 'main', type: 'clock', x: 205, y: 32 },
    { id: 7, room: 'main', type: 'board', x: 266, y: 56 },
    { id: 8, room: 'main', type: 'calendar', x: 300, y: 54 },
    { id: 9, room: 'main', type: 'timer', x: 276, d: 0.05 },
    { id: 10, room: 'main', type: 'water', x: 310, d: 0.04 },
    { id: 11, room: 'main', type: 'rug', x: 400, d: 0.45 },
    { id: 12, room: 'main', type: 'sofa', x: 385, d: 0.06 },
    { id: 13, room: 'main', type: 'poster', x: 385, y: 48 },
    { id: 14, room: 'main', type: 'tv', x: 446, d: 0.1 },
    { id: 15, room: 'main', type: 'cat', x: 425, d: 0.56 },
    { id: 16, room: 'main', type: 'radio', x: 500, d: 0.05 },
    { id: 17, room: 'main', type: 'trophy', x: 500, y: 52 },
    { id: 18, room: 'main', type: 'closet', x: 552, d: 0.03 },
    { id: 19, room: 'main', type: 'bed', x: 632, d: 0.06 },
    { id: 20, room: 'main', type: 'window', x: 642, y: 56 },
    { id: 21, room: 'main', type: 'plant', x: 692, d: 0.55 },
    // キッチン
    { id: 30, room: 'kitchen', type: 'door', x: 24, d: 0.02 },
    { id: 31, room: 'kitchen', type: 'fridge', x: 64, d: 0.03 },
    { id: 32, room: 'kitchen', type: 'counter', x: 126, d: 0.04 },
    { id: 33, room: 'kitchen', type: 'window', x: 126, y: 50 },
    { id: 34, room: 'kitchen', type: 'table', x: 236, d: 0.3 },
    { id: 35, room: 'kitchen', type: 'plant', x: 300, d: 0.05 },
    { id: 36, room: 'kitchen', type: 'shelf', x: 360, d: 0.03 },
  ];
  const DEFAULT = {
    ver: 3,
    room: 'main',
    rooms: { main: { wall: 'pink', floor: 'wood', cam: 140 }, kitchen: { wall: 'mint', floor: 'tile', cam: 30 } },
    items: defaultItems(),
    nextId: 100,
    memos: [{ id: 1, text: '' }], memoSel: 0,
    todos: [
      { id: 1, text: '例：メールを返す', done: false },
      { id: 2, text: '例：資料を見直す', done: false },
      { id: 3, text: '例：ストレッチ', done: true, got: true },
    ],
    alarms: [{ id: 1, time: '15:00', days: [], on: false }],
    timer: { dur: 25 * 60000, left: 25 * 60000, endAt: 0, running: false },
    pomo: { work: 25, brk: 5, long: 15, every: 4, phase: 'idle', cur: 25, endAt: 0, left: 0, running: false, count: 0 },
    remind: { water: { on: false, every: 60, next: 0 }, posture: { on: false, every: 30, next: 0 }, eyes: { on: false, every: 45, next: 0 } },
    events: {},
    bgm: { kind: null, vol: 0.5 },
    look: { hair: 'long', hairColor: 'brown', outfit: 'mizuiro' },
    name: '',
    city: null,
    wx: null,
    stats: { stars: 0, todos: 0, pomos: 0, focusMin: 0, days: {} },
    ui: { timerTab: 'timer', catTab: 'items' },
  };
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  let S = read(KEY);
  if (!S) {
    // 前の版から、メモ・やること・アラーム・タイマーを引き継ぐ
    const old = read('heya:v2') || read('heya:v1');
    S = {};
    if (old) {
      if (old.memo) S.memos = [{ id: 1, text: old.memo }];
      if (old.todos) S.todos = old.todos;
      if (old.alarm) S.alarms = [{ id: 1, time: old.alarm.time, days: [], on: old.alarm.on }];
      if (old.timer) S.timer = old.timer;
    }
  }
  S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), S);
  for (const k of ['rooms', 'pomo', 'remind', 'bgm', 'look', 'stats', 'ui']) S[k] = Object.assign(JSON.parse(JSON.stringify(DEFAULT[k])), S[k] || {});
  S.items = S.items.filter(i => TYPES[i.type] && ROOMS[i.room]);
  if (!ROOMS[S.room]) S.room = 'main';
  if (!S.memos.length) S.memos = [{ id: 1, text: '' }];
  let saveT = 0;
  const save = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 保存できない環境でも動かす */ } }, 250);
  };

  /* ---------- ごほうび ---------- */
  const REWARDS = [
    { at: 3, type: 'outfit', id: 'pink', label: 'ピンクワンピ' },
    { at: 6, type: 'item', id: 'fishbowl', label: '金魚鉢' },
    { at: 10, type: 'hair', id: 'twin', label: 'ツインテール' },
    { at: 15, type: 'outfit', id: 'sailor', label: 'セーラー服' },
    { at: 20, type: 'hairColor', id: 'pink', label: 'ピンクの髪' },
    { at: 28, type: 'wall', id: 'stars', label: '星空の壁紙' },
    { at: 36, type: 'outfit', id: 'maid', label: 'メイド服' },
    { at: 45, type: 'hairColor', id: 'aqua', label: 'みずいろの髪' },
    { at: 60, type: 'hairColor', id: 'silver', label: 'ぎんいろの髪' },
  ];
  const lockOf = (type, id) => REWARDS.find(r => r.type === type && r.id === id && S.stats.stars < r.at);
  const today = () => (S.stats.days[dateKey()] ||= { focus: 0, todos: 0, pomos: 0 });
  function earn(n) {
    const before = S.stats.stars;
    S.stats.stars += n;
    const got = REWARDS.filter(r => before < r.at && S.stats.stars >= r.at);
    if (got.length) {
      const r = got[got.length - 1];
      SND.chime('reward');
      say(`${r.label}が届いたよ！`, 4500);
      toast(`ごほうび：${r.label}が使えるようになりました`);
      for (let i = 0; i < 6; i++) particle('spark', ch.x + rand(-12, 12), ch.d, floorY(ch.d) - rand(10, 34), 1.2);
    }
    save();
  }
  function addFocus(min) { S.stats.focusMin += min; today().focus += min; }

  /* ---------- 画面の骨組み ---------- */
  const I = {
    pip: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor" fill-rule="evenodd"><path d="M1 2h14v12H1zM3 4v8h10V4z"/><path d="M8 8h5v4H8z"/></svg>',
    edit: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M11 1h3v3h-3zM9 3h3v3H9zM7 5h3v3H7zM5 7h3v3H5zM3 9h3v3H3zM1 12h3v3H1z"/></svg>',
    gear: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor" fill-rule="evenodd"><path d="M7 1h2v2h2V2h2v2h-1v2h2v2h-2v2h1v2h-2v-1h-2v2H9v1H7v-2H5v1H3v-2h1V8H2V6h2V4H3V2h2v1h2zM7 6v4h2V6z"/></svg>',
    pin: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M5 1h6v1h-1v4h1v1h1v1h1v1H9v6H7V9H3V8h1V7h1V6h1V2H5z"/></svg>',
    min: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M3 8h10v2H3z"/></svg>',
    close: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M2 2h3v3H2zM5 5h3v3H5zM8 8h3v3H8zM11 11h3v3h-3zM11 2h3v3h-3zM8 5h3v3H8zM5 8h3v3H5zM2 11h3v3H2z"/></svg>',
  };
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="bar">
      <span class="title" id="title">へや</span>
      <span class="status" id="status"></span>
      <div class="btns">
        <button class="ibtn" id="btnPip" title="小窓にして、いつも手前に表示" aria-label="小窓にする" hidden>${I.pip}</button>
        <button class="ibtn" id="btnEdit" title="模様替え（家具・壁紙・床）" aria-label="模様替え">${I.edit}</button>
        <button class="ibtn" id="btnSet" title="せってい" aria-label="せってい">${I.gear}</button>
        <button class="ibtn desktop-only" id="btnPin" title="いつも手前に表示" aria-label="いつも手前に表示">${I.pin}</button>
        <button class="ibtn desktop-only" id="btnMin" title="しまう" aria-label="しまう">${I.min}</button>
        <button class="ibtn desktop-only" id="btnClose" title="閉じる" aria-label="閉じる">${I.close}</button>
      </div>
    </div>
    <div class="stage" id="stage">
      <canvas class="room" id="room"></canvas>
      <div class="bubble" id="bubble" hidden></div>
      <button class="nav l" id="navL" aria-label="左へ">◀</button>
      <button class="nav r" id="navR" aria-label="右へ">▶</button>
      <div class="ringbar" id="ringbar" hidden><span id="ringText"></span><button id="ringStop">止める</button></div>
      <div class="toast" id="toast" hidden></div>
      <section class="panel" id="panel" hidden></section>
      <div class="catalog" id="catalog" hidden></div>
      <div class="fade" id="fade"></div>
    </div>`;
  const $ = id => app.querySelector('#' + id); // 小窓へ移しても見つかるように app から探す
  const stage = $('stage'), cv = $('room'), ctx = cv.getContext('2d'), bubble = $('bubble'), panel = $('panel'), catalog = $('catalog');
  const shadeCv = A.canvas(1, 1), sctx = shadeCv.getContext('2d');

  let sc = 2, vw = 240;         // 拡大率と、見えている横幅(px)
  let camGoal = null, dirty = true, editing = false, panelKind = null, hover = null, lastRender = 0;
  let drawn = [];               // 直前に描いたもの（クリック判定用）
  const RW = () => ROOMS[S.room].w;
  const R = () => S.rooms[S.room];
  const roomItems = (room = S.room) => S.items.filter(i => i.room === room);
  const findType = (type, room) => S.items.find(i => i.type === type && (!room || i.room === room));

  /* ---------- 女の子 ---------- */
  const ch = {
    x: 190, d: REST_D, tx: 190, td: REST_D, face: 1, say: '', sayUntil: 0, nextWander: performance.now() + 7000,
    step: 0, blinkAt: 0, hop: false, act: null, actId: null, actUntil: 0, goal: null, lastFx: 0,
  };
  function say(text, ms = 2800) { ch.say = text; ch.sayUntil = performance.now() + ms; dirty = true; }
  function endAct() {
    if (!ch.act && !ch.goal) return;
    ch.act = null; ch.actId = null; ch.goal = null; ch.td = REST_D; ch.tx = ch.x;
    ch.nextWander = performance.now() + rand(5000, 10000);
    dirty = true;
  }
  function walkTo(x, d = REST_D) {
    endAct();
    ch.tx = clamp(x, 14, RW() - 14); ch.td = clamp(d, 0.12, 0.8);
    ch.nextWander = performance.now() + 15000;
  }
  function walkNear(it) {
    const t = TYPES[it.type], gap = t.w / 2 + 9;
    walkTo(ch.x < it.x ? it.x - gap : it.x + gap);
  }
  // 家具を使う行動。spot は立つ（座る）場所
  function spotOf(act, it) {
    switch (act) {
      case 'desk': return { x: it.x - 8, d: it.d + 0.1 };
      case 'sofa': return { x: it.x, d: it.d + 0.03 };
      case 'bed': return { x: it.x, d: it.d + 0.03 };
      case 'window': return { x: it.x, d: 0.12 };
      case 'pet': return { x: it.x + (ch.x < it.x ? -14 : 14), d: it.d };
      default: return { x: it.x, d: REST_D };
    }
  }
  function startAct(act, it, ms) {
    if (!it || it.room !== S.room) return;
    const sp = spotOf(act, it);
    ch.act = null; ch.actId = null;
    ch.goal = { act, id: it.id, ms };
    ch.tx = clamp(sp.x, 14, RW() - 14); ch.td = sp.d;
    dirty = true;
  }
  function arrive() {
    const g = ch.goal; ch.goal = null;
    const it = S.items.find(i => i.id === g.id);
    if (!it) return;
    ch.act = g.act; ch.actId = it.id;
    ch.actUntil = performance.now() + (g.ms ?? {
      desk: rand(25000, 45000), sofa: rand(20000, 40000), bed: rand(20000, 30000), window: rand(6000, 9000), pet: 3500,
    }[g.act]);
    if (g.act === 'pet') { ch.face = it.x > ch.x ? 1 : -1; say(pick(['よしよし', 'ふわふわ〜', 'かわいいね'])); }
    if (g.act === 'window') say(windowLine());
    if (g.act === 'bed') say(isNight() ? 'おやすみ…' : 'ちょっとお昼寝…');
    if (g.act === 'sofa' && tvOn()) say('なに見よっかな');
    dirty = true;
  }
  const isNight = () => { const h = new Date().getHours(); return h < 5; };
  const tvOn = () => roomItems().some(i => i.type === 'tv' && i.on);
  function decide(now) {
    const items = roomItems();
    const get = t => items.find(i => i.type === t);
    const desk = get('desk'), sofa = get('sofa'), bed = get('bed'), cat = get('cat'), win = get('window');
    if (S.pomo.phase === 'work' && S.pomo.running && desk) return startAct('desk', desk, Infinity);
    if (isNight() && bed) return startAct('bed', bed, Infinity);
    if (tvOn() && sofa && Math.random() < 0.6) return startAct('sofa', sofa);
    const brk = S.pomo.phase === 'break';
    const opts = [['walk', 4], ['window', win ? 2 : 0], ['pet', cat ? (brk ? 3 : 2) : 0], ['sofa', sofa ? (brk ? 3 : 2) : 0], ['desk', desk && !brk ? 1 : 0], ['bed', bed && brk ? 1 : 0]];
    let total = opts.reduce((a, o) => a + o[1], 0), r = Math.random() * total;
    for (const [k, w] of opts) {
      if ((r -= w) > 0) continue;
      if (k === 'walk') { ch.tx = clamp(ch.x + rand(-90, 90), 20, RW() - 20); ch.td = REST_D; ch.nextWander = now + rand(7000, 14000); return; }
      return startAct(k, { window: win, pet: cat, sofa, desk, bed }[k]);
    }
  }

  /* ---------- 季節と天気 ---------- */
  function skyNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 5 && h < 7) return { k: 'dawn', sky: '#ffc9b0', orb: '#ffe07a', star: 0, dark: 0.1 };
    if (h >= 7 && h < 16) return { k: 'day', sky: '#9fd8f5', orb: '#ffe07a', star: 0, dark: 0 };
    if (h >= 16 && h < 18) return { k: 'eve', sky: '#ffb38a', orb: '#ffd27a', star: 0, dark: 0.08 };
    if (h >= 18 && h < 19) return { k: 'dusk', sky: '#8a6fb8', orb: '#fff3c4', star: 1, dark: 0.2 };
    return { k: 'night', sky: '#2a2f5c', orb: '#fff3c4', star: 1, dark: 0.34 };
  }
  function seasonNow() {
    const m = new Date().getMonth() + 1;
    return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  }
  const weatherNow = () => (S.city && S.wx && Date.now() - S.wx.at < 3 * 3600e3) ? S.wx.kind : 'clear';
  function codeToKind(c) {
    if (c <= 1) return 'clear';
    if (c <= 48) return 'cloudy';
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
    return 'rain';
  }
  async function fetchWeather() {
    if (!S.city) return;
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.city.lat}&longitude=${S.city.lon}&current=weather_code,temperature_2m&timezone=auto`);
      const j = await r.json();
      const kind = codeToKind(j.current.weather_code);
      const prev = S.wx && S.wx.kind;
      S.wx = { kind, temp: Math.round(j.current.temperature_2m), at: Date.now() };
      save(); dirty = true;
      if (prev && prev !== kind) say({ clear: '晴れてきたね', cloudy: 'くもってきた…', rain: '雨ふってきたね', snow: '雪だ！' }[kind], 3500);
      if (panelKind === 'settings') renderPanel();
    } catch { /* 天気が取れなくても動かす */ }
  }
  function windowLine() {
    const w = weatherNow(), s = skyNow();
    if (w === 'rain') return '雨の音、落ちつくね';
    if (w === 'snow') return '雪つもるかな';
    if (s.star) return '星がきれい';
    return { spring: '桜がきれい', summer: 'いい天気！', autumn: '紅葉してるね', winter: '寒そう…' }[seasonNow()];
  }

  /* ---------- 小さな絵（ハート・Z・音符など） ---------- */
  let parts = [];
  function particle(kind, x, d, y, life = 1.6) { parts.push({ kind, x, d, y, t0: performance.now(), life: life * 1000, dx: rand(-3, 3) }); }

  /* ---------- 家具ごとの状態（絵に反映するもの） ---------- */
  let blinkOn = true;
  function stateFor(it, frame) {
    const now = new Date();
    switch (it.type) {
      case 'clock': return { h: now.getHours(), m: now.getMinutes(), alarm: S.alarms.some(a => a.on) };
      case 'timer': {
        const p = S.pomo;
        if (p.phase !== 'idle') {
          const left = pomoLeft();
          return { lcd: lcdText(left), mode: p.phase, blinkOff: !p.running && !blinkOn };
        }
        const left = timerLeft(), paused = !S.timer.running && left > 0 && left < S.timer.dur;
        return { lcd: lcdText(left), mode: 'timer', blinkOff: (ring?.kind === 'timer' || paused) && !blinkOn };
      }
      case 'board': return { todos: S.todos.filter(t => !t.done).length };
      case 'desk': return { memo: S.memos.some(m => m.text.trim()) };
      case 'window': return { sky: skyNow(), season: seasonNow(), weather: weatherNow(), frame };
      case 'lamp': return { on: !!it.on };
      case 'tv': return { on: !!it.on, frame };
      case 'cat': return { blink: (Date.now() / 1000 % 7) < 5 };
      case 'bed': return { sleep: ch.act === 'bed' && ch.actId === it.id, hairColor: S.look.hairColor };
      case 'radio': return { on: !!S.bgm.kind };
      case 'calendar': return { month: now.getMonth() + 1, day: now.getDate(), event: !!(S.events[dateKey()] || '').trim() };
      case 'trophy': return { tier: S.stats.stars >= 60 ? 3 : S.stats.stars >= 30 ? 2 : S.stats.stars >= 10 ? 1 : 0 };
      case 'door': return { to: it.room === 'main' ? 'kitchen' : 'main' };
      case 'fishbowl': return { frame };
      default: return {};
    }
  }
  const animated = () => roomItems().some(i => i.type === 'fishbowl' || (i.type === 'tv' && i.on) || (i.type === 'window' && weatherNow() !== 'clear'));

  /* ---------- 描画 ---------- */
  function measure() {
    const r = stage.getBoundingClientRect();
    if (!r.height) return;
    sc = r.height / H;
    vw = Math.ceil(r.width / sc);
    cv.width = vw; cv.height = H;
    cv.style.width = vw * sc + 'px'; cv.style.height = r.height + 'px';
    shadeCv.width = vw; shadeCv.height = H;
    dirty = true;
  }
  function clampCam(c) {
    const lo = -24, hi = RW() + 24 - vw;
    return hi < lo ? (RW() - vw) / 2 : clamp(c, lo, hi);
  }
  const patCache = new Map();
  function render(now) {
    lastRender = now;
    const room = R(), W = RW();
    room.cam = clampCam(room.cam);
    const cam = Math.round(room.cam);
    const vp = cam + vw / 2;
    const sx = (x, d) => Math.round(vw / 2 + (x - vp) * persp(d));
    const g = ctx;
    const frame = Math.floor(now / 250);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#2b1d2e'; g.fillRect(0, 0, vw, H);

    const L0 = sx(0, 0), R0 = sx(W, 0), L1 = sx(0, 1), R1 = sx(W, 1);
    // 左右の壁
    g.fillStyle = SIDE[room.wall] || SIDE.pink;
    if (L0 > 0) g.fillRect(L1, 0, L0 - L1, H);
    if (R0 < vw) g.fillRect(R0, 0, R1 - R0, H);
    // 奥の壁（壁紙の模様をくり返す）
    let pat = patCache.get(room.wall);
    if (!pat) { pat = g.createPattern(A.wallTile(room.wall), 'repeat'); patCache.set(room.wall, pat); }
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, -cam, 0]));
    g.fillStyle = pat; g.fillRect(L0, 0, R0 - L0, BACK);
    // 床：1行ずつ描く
    const F = A.FLOORS[room.floor] || A.FLOORS.wood;
    for (let y = BACK; y < H; y++) {
      const d = (y - BACK) / DEPTH_PX, f = persp(d);
      const xl = sx(0, d), xr = sx(W, d);
      const bw = F.bw;
      const i0 = Math.max(0, Math.floor((vp - vw / 2 / f) / bw)), i1 = Math.min(Math.ceil(W / bw), Math.ceil((vp + vw / 2 / f) / bw) + 1);
      const band = Math.floor(d * 5);
      for (let i = i0; i < i1; i++) {
        const a = Math.max(xl, sx(i * bw, d)), b = Math.min(xr, sx((i + 1) * bw, d));
        if (b <= a) continue;
        let col = F.a;
        if (F.kind === 'boards') col = i % 2 ? F.a : F.b;
        else if (F.kind === 'checker') col = (i + band) % 2 ? F.a : F.b;
        g.fillStyle = col; g.fillRect(a, y, b - a, 1);
        if (F.kind !== 'plain') { g.fillStyle = F.seam; g.fillRect(a, y, 1, 1); }
        else if ((i * 7 + y * 3) % 13 === 0) { g.fillStyle = F.b; g.fillRect(Math.round((a + b) / 2), y, 1, 1); }
      }
      g.fillStyle = '#9a6a7a';
      if (L0 > 0) g.fillRect(xl - 2, y, 2, 1);
      if (R0 < vw) g.fillRect(xr, y, 2, 1);
    }
    if (F.kind !== 'plain') for (const d of [0.25, 0.55, 0.85]) { const y = floorY(d); g.fillStyle = F.seam; g.fillRect(sx(0, d), y, sx(W, d) - sx(0, d), 1); }

    // 家具とキャラクターを奥から順に
    const list = roomItems().map(it => {
      const t = TYPES[it.type];
      return { it, z: t.wall ? 0 : t.flat ? 1 : 10 + it.d * 100 };
    });
    if (ch.act !== 'bed') list.push({ char: true, z: 10 + ch.d * 100 + 0.5 });
    list.sort((a, b) => a.z - b.z);
    drawn = [];
    let lamp = null, headPos = null;
    for (const e of list) {
      let spr, X, Y;
      if (e.char) {
        const moving = Math.abs(ch.tx - ch.x) > 0.5 || Math.abs(ch.td - ch.d) > 0.01;
        let pose = moving ? (Math.floor(ch.step) % 2 ? 'a' : 'b') : 'stand';
        if (!moving && ch.act === 'desk') pose = 'sitBack';
        else if (!moving && ch.act === 'sofa') pose = 'sitFront';
        else if (!moving && ch.act === 'window') pose = 'back';
        const shut = now < ch.blinkAt + 140 && pose !== 'back' && pose !== 'sitBack';
        spr = A.girlSprite(S.look, pose, shut, ch.face < 0 && pose !== 'sitBack' && pose !== 'back' && pose !== 'sitFront');
        X = sx(ch.x, ch.d); Y = floorY(ch.d);
        if (pose === 'sitFront') Y -= 6;
        if (pose === 'sitBack' && Math.floor(now / 380) % 2) Y -= 0; // 机に向かってカリカリ
        if (ch.hop) Y -= Math.round(Math.abs(Math.sin(now / 140)) * 5);
        else if (moving && Math.floor(ch.step * 2) % 2) Y -= 1;
        headPos = { x: X, y: Y - spr.height };
      } else {
        const it = e.it, t = TYPES[it.type];
        spr = A.thingSprite(it.type, stateFor(it, frame));
        const d = t.wall ? 0 : it.d;
        X = sx(it.x, d); Y = t.wall ? it.y : floorY(d);
        if (it.type === 'lamp' && it.on && !lamp) lamp = { x: X, y: Y - 40 };
        if (it.type === 'bed' && ch.act === 'bed' && ch.actId === it.id) headPos = { x: X - 14, y: Y - 26 };
      }
      let x0 = Math.round(X - spr.width / 2), y0 = Math.round(Y - spr.height + 1);
      if (!e.char && ring && TYPES[e.it.type].tool === ring.kind) x0 += Math.floor(now / 70) % 2 ? 1 : -1; // 鳴っているとき揺れる
      g.drawImage(spr, x0, y0);
      drawn.push({ e, spr, x0, y0 });
    }
    // ハートや音符
    parts = parts.filter(p => now - p.t0 < p.life);
    for (const p of parts) {
      const k = (now - p.t0) / 1000, spr = A.PARTICLES[p.kind];
      if (p.kind === 'spark' && Math.floor(now / 120) % 2) continue;
      g.drawImage(spr, Math.round(sx(p.x, p.d) + p.dx * k - spr.width / 2), Math.round(p.y - k * 9));
    }

    // 時間帯の暗さと、ランプのあかり
    const sky = skyNow();
    if (lamp) { g.fillStyle = 'rgba(255,214,140,.10)'; dotCircle(g, lamp.x, lamp.y + 20, 40); }
    const dark = Math.max(sky.dark, weatherNow() === 'rain' && !sky.star ? 0.08 : 0);
    if (dark > 0) {
      sctx.clearRect(0, 0, vw, H);
      sctx.globalCompositeOperation = 'source-over';
      sctx.fillStyle = `rgba(28,18,64,${dark})`; sctx.fillRect(0, 0, vw, H);
      if (lamp) {
        sctx.globalCompositeOperation = 'destination-out';
        [[60, 0.35], [46, 0.35], [32, 0.4]].forEach(([r, a]) => { sctx.fillStyle = `rgba(0,0,0,${a})`; dotCircle(sctx, lamp.x, lamp.y + 18, r); });
        sctx.globalCompositeOperation = 'source-over';
      }
      g.drawImage(shadeCv, 0, 0);
    }

    // 模様替え中の印（点線の枠と×）
    if (editing) {
      for (const dw of drawn) {
        if (dw.e.char) continue;
        const { x0, y0, spr } = dw;
        g.fillStyle = (dw === hover) ? '#ffffff' : 'rgba(255,255,255,.75)';
        for (let x = x0; x < x0 + spr.width; x += 2) { g.fillRect(x, y0 - 1, 1, 1); g.fillRect(x, y0 + spr.height, 1, 1); }
        for (let y = y0; y < y0 + spr.height; y += 2) { g.fillRect(x0 - 1, y, 1, 1); g.fillRect(x0 + spr.width, y, 1, 1); }
        const bx = x0 + spr.width - 4, by = Math.max(0, y0 - 4);
        dw.del = { x: bx, y: by, w: 7, h: 7 };
        g.fillStyle = '#3a2433'; g.fillRect(bx, by, 7, 7);
        g.fillStyle = '#ff5a6e'; g.fillRect(bx + 1, by + 1, 5, 5);
        g.fillStyle = '#ffffff';
        for (let k = 0; k < 3; k++) { g.fillRect(bx + 2 + k, by + 2 + k, 1, 1); g.fillRect(bx + 4 - k, by + 2 + k, 1, 1); }
      }
    } else if (hover && !hover.e.char) outlineSprite(g, hover);

    // ふきだし
    const talking = ch.say && now < ch.sayUntil && headPos;
    bubble.hidden = !talking;
    if (talking) {
      bubble.textContent = ch.say;
      const bx = clamp(headPos.x * sc, 50, vw * sc - 50);
      bubble.style.left = bx + 'px';
      bubble.style.top = Math.max(26, (headPos.y - 1) * sc) + 'px';
    }
  }
  function dotCircle(g, cx, cy, r) {
    for (let y = -r; y <= r; y += 1) {
      const hw = Math.round(Math.sqrt(r * r - y * y) * 1.4);
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
    }
  }
  function outlineSprite(g, dw) {
    const { spr, x0, y0 } = dw, w = spr.width, h = spr.height, a = spr.alpha;
    g.fillStyle = '#ffffff';
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
  // 画面上の点にあるもの（手前から探す）
  function hitTest(px, py) {
    for (let i = drawn.length - 1; i >= 0; i--) {
      const dw = drawn[i], { spr, x0, y0 } = dw;
      if (editing && dw.del && px >= dw.del.x && px < dw.del.x + dw.del.w && py >= dw.del.y && py < dw.del.y + dw.del.h) return { dw, del: true };
      const x = px - x0, y = py - y0;
      if (x < 0 || y < 0 || x >= spr.width || y >= spr.height) continue;
      if (!editing && !dw.e.char && TYPES[dw.e.it.type].flat) continue; // ラグは床と同じ扱い
      if (editing && dw.e.char) continue;
      if (spr.alpha[(y * spr.width + x) * 4 + 3] > 0) return { dw };
    }
    return null;
  }
  function toCanvas(e) {
    const r = cv.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / sc), y: Math.floor((e.clientY - r.top) / sc) };
  }

  /* ---------- バーの表示 ---------- */
  function nextAlarm() {
    const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
    let best = null;
    for (const a of S.alarms) {
      if (!a.on) continue;
      const [h, m] = a.time.split(':').map(Number), t = h * 60 + m;
      for (let k = 0; k < 8; k++) {
        const day = (now.getDay() + k) % 7;
        if (a.days.length && !a.days.includes(day)) continue;
        if (k === 0 && t <= cur) continue;
        const score = k * 1440 + t - cur;
        if (!best || score < best.score) best = { score, a, k };
        break;
      }
    }
    return best;
  }
  function refreshDynamic() {
    const parts2 = [];
    const p = S.pomo;
    if (p.phase !== 'idle') parts2.push(`${p.phase === 'work' ? '集中' : '休憩'} ${fmt(pomoLeft())}${p.running ? '' : '（一時停止）'}`);
    const tleft = timerLeft();
    if (S.timer.running) parts2.push('タイマー ' + fmt(tleft));
    else if (tleft > 0 && tleft < S.timer.dur) parts2.push('タイマー ' + fmt(tleft) + '（一時停止）');
    const na = nextAlarm();
    if (na) parts2.push('アラーム ' + (na.k ? '・' : '') + na.a.time);
    const open = S.todos.filter(t => !t.done).length;
    if (!parts2.length && open) parts2.push(`やること ${open}件`);
    if (S.city && S.wx && !parts2.length) parts2.push(`${S.city.name} ${S.wx.temp}℃`);
    $('status').textContent = parts2.join(' ・ ');
    $('title').textContent = (S.name ? `${S.name}の` : '') + (S.room === 'kitchen' ? 'キッチン' : 'へや');
    const big = $('timerBig'); if (big) big.textContent = fmt(tleft);
    const ts = $('timerStart'); if (ts) ts.textContent = S.timer.running ? '一時停止' : (tleft < S.timer.dur && tleft > 0 ? '再開' : 'スタート');
    const pb = $('pomoBig'); if (pb) { pb.textContent = fmt(p.phase === 'idle' ? p.work * 60000 : pomoLeft()); pb.dataset.mode = p.phase; }
    const ps = $('pomoStart'); if (ps) ps.textContent = p.phase === 'idle' ? 'スタート' : p.running ? '一時停止' : '再開';
    dirty = true;
  }

  /* ---------- お知らせ ---------- */
  function askNotify() {
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); } catch { /* 通知なし */ }
  }
  function notify(text) {
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(S.name || 'へや', { body: text, silent: true }); } catch { /* 通知なし */ }
  }
  let toastT = 0;
  function toast(text) {
    const t = $('toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4500);
  }

  /* ---------- 鳴らす・止める ---------- */
  let ring = null, lastBeep = 0;
  function startRing(kind, text) {
    ring = { kind, until: Date.now() + 60000 };
    $('ringText').textContent = text;
    $('ringbar').hidden = false;
    endAct();
    ch.hop = true;
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
    ch.hop = false;
    say('おつかれさま', 1800);
    refreshDynamic();
    if (panelKind) renderPanel();
  }

  /* ---------- タイマー ---------- */
  function timerLeft() { const t = S.timer; return t.running ? Math.max(0, t.endAt - Date.now()) : t.left; }
  function fmt(ms) {
    const sec = Math.ceil(ms / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), ss = sec % 60;
    return h ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
  }
  function lcdText(ms) {
    const sec = Math.ceil(ms / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), ss = sec % 60;
    return h ? `${h}h${pad(m)}` : `${pad(m)}:${pad(ss)}`;
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

  /* ---------- ポモドーロ ---------- */
  function pomoLeft() { const p = S.pomo; return p.running ? Math.max(0, p.endAt - Date.now()) : p.left; }
  function pomoBegin(phase) {
    const p = S.pomo;
    p.phase = phase;
    p.cur = phase === 'work' ? p.work : (p.count % p.every === 0 ? p.long : p.brk);
    p.endAt = Date.now() + p.cur * 60000; p.left = p.cur * 60000; p.running = true;
    const desk = findType('desk', S.room);
    if (phase === 'work') { if (desk) startAct('desk', desk, Infinity); }
    else if (ch.act === 'desk') endAct();
    save(); refreshDynamic();
  }
  function pomoToggle() {
    const p = S.pomo;
    askNotify();
    if (p.phase === 'idle') { p.count = 0; SND.chime('work'); say('集中タイム！がんばろ'); return pomoBegin('work'); }
    if (p.running) { p.left = pomoLeft(); p.running = false; }
    else { p.endAt = Date.now() + p.left; p.running = true; }
    save(); refreshDynamic();
  }
  function pomoStop() { const p = S.pomo; p.phase = 'idle'; p.running = false; if (ch.act === 'desk') endAct(); save(); refreshDynamic(); }
  function pomoEnd(credit) {
    const p = S.pomo;
    if (p.phase === 'work') {
      if (credit) { p.count++; addFocus(p.work); S.stats.pomos++; today().pomos++; earn(2); }
      else p.count++;
      const long = p.count % p.every === 0;
      SND.chime('break');
      say(long ? '長めの休憩！ゆっくりしてね' : '休憩しよ！', 4000);
      notify(long ? `${p.long}分の長い休憩です` : `${p.brk}分休憩しましょう`);
      pomoBegin('break');
    } else {
      SND.chime('work');
      say('集中タイム！がんばろ', 3000);
      notify(`${p.work}分集中しましょう`);
      pomoBegin('work');
    }
    if (panelKind === 'timer') renderPanel();
  }

  /* ---------- アラーム・リマインダー ---------- */
  let lastAlarmKey = '';
  function checkAlarms(now) {
    const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`, key = now.toDateString() + hm;
    if (lastAlarmKey === key) return;
    for (const a of S.alarms) {
      if (!a.on || a.time !== hm) continue;
      if (a.days.length && !a.days.includes(now.getDay())) continue;
      lastAlarmKey = key;
      if (!a.days.length) a.on = false;
      save();
      startRing('alarm', `アラーム ${hm}`);
      if (panelKind === 'alarm') renderPanel();
      break;
    }
  }
  const REMINDS = {
    water: { name: 'お水を飲む', line: 'お水のもう！', fx: 'drop' },
    posture: { name: '姿勢をなおす', line: '姿勢、まっすぐ！', fx: 'spark' },
    eyes: { name: '目を休める', line: '目を休めよ、遠くを見て〜', fx: 'heart' },
  };
  function checkReminders(now) {
    for (const [k, r] of Object.entries(S.remind)) {
      if (!r.on) continue;
      if (!r.next) r.next = now + r.every * 60000;
      if (now < r.next) continue;
      r.next = now + r.every * 60000;
      save();
      SND.chime('remind');
      say(REMINDS[k].line, 6000);
      notify(REMINDS[k].line);
      for (let i = 0; i < 3; i++) particle(REMINDS[k].fx, ch.x + rand(-8, 8), ch.d, floorY(ch.d) - 34 - i * 4, 1.4);
      if (panelKind === 'remind') renderPanel();
    }
  }

  /* ---------- 時間帯のセリフ ---------- */
  const HOUR_LINES = {
    7: 'おはよう！今日もがんばろ', 10: 'ちょっと休憩する？', 12: 'お昼ごはん食べた？', 15: 'おやつの時間だよ',
    18: 'おつかれさま〜', 21: '今日もよくがんばったね', 23: 'そろそろ寝る準備しよ', 0: 'もう日付かわったよ…', 2: '夜ふかしはだめだよ…',
  };
  function greetLine() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'おはよう！';
    if (h >= 11 && h < 18) return 'こんにちは！';
    if (h >= 18 && h < 23) return 'こんばんは〜';
    return 'こんな時間まで、おつかれさま';
  }
  function talkLine() {
    const pool = ['がんばろう', 'ひと休みする？', 'お茶いれよっか', 'いい感じ！', 'のびー', 'あとちょっと', 'ふぁいと！', windowLine()];
    if (S.name) pool.push(`わたし、${S.name}！`, `${S.name}だよ〜`);
    if (S.stats.stars) pool.push(`★${S.stats.stars}こ、すごいね！`);
    const ev = (S.events[dateKey()] || '').trim();
    if (ev) pool.push(`今日は「${ev.slice(0, 12)}」だね`);
    if (S.wx && S.city) pool.push(`${S.city.name}は${S.wx.temp}℃だって`);
    if (S.pomo.phase === 'work') pool.push('集中、集中…', 'いっしょにがんばろ');
    return pick(pool);
  }

  /* ---------- 0.5秒ごとの処理 ---------- */
  let lastHour = new Date().getHours(), lastDay = dateKey(), lastWxFetch = 0;
  function tick() {
    const now = new Date(), ms = now.getTime();
    checkAlarms(now);
    if (S.timer.running && ms >= S.timer.endAt) {
      S.timer.running = false; S.timer.left = 0;
      const min = Math.round(S.timer.dur / 60000);
      if (min >= 5) { addFocus(min); earn(1); }
      save();
      startRing('timer', `タイマー終了（${fmt(S.timer.dur)}）`);
    }
    if (S.pomo.phase !== 'idle' && S.pomo.running && ms >= S.pomo.endAt) pomoEnd(true);
    checkReminders(ms);
    if (ring) {
      if (ms > ring.until) stopRing();
      else if (ms - lastBeep > 1100) { lastBeep = ms; SND.alarm(); }
    }
    const h = now.getHours();
    if (h !== lastHour) { lastHour = h; if (HOUR_LINES[h]) say(HOUR_LINES[h], 5000); }
    if (dateKey(now) !== lastDay) { lastDay = dateKey(now); const ev = (S.events[lastDay] || '').trim(); if (ev) say(`今日は「${ev.slice(0, 12)}」だね`, 5000); }
    if (S.city && ms - lastWxFetch > 30 * 60000) { lastWxFetch = ms; fetchWeather(); }
    if (S.bgm.kind && Math.random() < 0.35) {
      const radio = roomItems().find(i => i.type === 'radio');
      if (radio) particle('note', radio.x + rand(-4, 6), radio.d, floorY(radio.d) - 28, 2);
    }
    if (ch.act === 'bed' && Math.random() < 0.5) {
      const bed = S.items.find(i => i.id === ch.actId);
      if (bed) particle('z', bed.x - 14, bed.d, floorY(bed.d) - 28, 1.8);
    }
    blinkOn = !blinkOn;
    refreshDynamic();
  }

  /* ---------- パネル（道具） ---------- */
  const TITLES = { alarm: 'アラーム', timer: 'タイマー', memo: 'メモ', todo: 'やること', bgm: 'ラジオ', calendar: 'カレンダー', remind: 'リマインダー', dress: 'きせかえ', stats: 'がんばり記録', settings: 'せってい' };
  const WEEK = '日月火水木金土';
  let cal = null, memoConfirm = false, exportCode = '', importMsg = '', cityResults = null;
  function openPanel(kind, onLeft) {
    panelKind = kind;
    panel.classList.toggle('left', !!onLeft);
    panel.hidden = false;
    memoConfirm = false; importMsg = ''; exportCode = ''; cityResults = null;
    if (kind === 'calendar') { const d = new Date(); cal = { y: d.getFullYear(), m: d.getMonth(), sel: dateKey(d) }; }
    renderPanel(true);
  }
  function closePanel() { panelKind = null; panel.hidden = true; panel.textContent = ''; }
  const btn = (act, label, cls = '', v = '') => `<button class="btn ${cls}" data-act="${act}" ${v !== '' ? `data-v="${esc(v)}"` : ''}>${label}</button>`;
  const tog = (f, on, v = '') => `<label class="toggle"><input type="checkbox" data-f="${f}" ${v !== '' ? `data-v="${esc(v)}"` : ''} ${on ? 'checked' : ''}></label>`;

  const PANELS = {
    alarm() {
      return `
        <div class="alarms">${S.alarms.map(a => `
          <div class="alarm" data-id="${a.id}">
            <div class="row"><input type="time" data-f="alarmTime" value="${esc(a.time)}" aria-label="時刻">${tog('alarmOn', a.on)}<span class="sp"></span><button class="x" data-act="alarmDel" aria-label="削除">×</button></div>
            <div class="days">${[...WEEK].map((w, i) => `<button class="day ${a.days.includes(i) ? 'on' : ''}" data-act="alarmDay" data-v="${i}">${w}</button>`).join('')}</div>
          </div>`).join('') || '<p class="empty">アラームはありません</p>'}
        </div>
        ${btn('alarmAdd', '＋ アラームを追加', 'small')}
        <p class="hint">曜日を選ぶと毎週その曜日に鳴ります。選ばないと1回だけ鳴ります。</p>
        ${ring?.kind === 'alarm' ? btn('stop', '止める', 'primary') : ''}`;
    },
    timer() {
      const tab = S.ui.timerTab, p = S.pomo;
      const tabs = `<div class="tabs">${btn('tab', 'タイマー', tab === 'timer' ? 'on' : '', 'timer')}${btn('tab', 'ポモドーロ', tab === 'pomo' ? 'on' : '', 'pomo')}</div>`;
      if (tab === 'pomo') {
        const dots = Array.from({ length: p.every }, (_, i) => `<i class="tomato ${i < (p.count % p.every || (p.count && p.phase === 'break' && p.count % p.every === 0 ? p.every : 0)) ? 'on' : ''}"></i>`).join('');
        return `${tabs}
          <div class="bigtime" id="pomoBig" data-mode="${p.phase}">${fmt(p.phase === 'idle' ? p.work * 60000 : pomoLeft())}</div>
          <div class="row pomo-state"><span>${{ idle: 'まだ始めていません', work: '集中タイム', break: '休憩タイム' }[p.phase]}</span><span class="sp"></span>${dots}</div>
          <div class="row">${btn('pomoToggle', 'スタート', 'primary').replace('<button', '<button id="pomoStart"')}${p.phase !== 'idle' ? btn('pomoSkip', '次へ') + btn('pomoStop', 'やめる') : ''}</div>
          <div class="row small">集中<input type="number" min="1" max="120" data-f="pomoWork" value="${p.work}">休憩<input type="number" min="1" max="60" data-f="pomoBrk" value="${p.brk}">長い休憩<input type="number" min="1" max="60" data-f="pomoLong" value="${p.long}">分</div>
          <p class="hint">${p.every}回集中するごとに長い休憩になります。集中を1回終えるごとに★2つ。</p>`;
      }
      return `${tabs}
        <div class="bigtime" id="timerBig">${fmt(timerLeft())}</div>
        <div class="chips">${[1, 3, 5, 10, 25, 45].map(m => btn('timerQuick', `${m}分`, '', m)).join('')}</div>
        <div class="row"><input type="number" id="timerMin" min="1" max="600" value="${Math.round(S.timer.dur / 60000) || 1}" aria-label="分"> 分 ${btn('timerApply', 'セット', 'small')}</div>
        <div class="row">${btn('timerToggle', 'スタート', 'primary').replace('<button', '<button id="timerStart"')}${btn('timerReset', 'リセット')}</div>
        ${ring?.kind === 'timer' ? btn('stop', '止める', 'primary') : ''}`;
    },
    memo() {
      const i = clamp(S.memoSel, 0, S.memos.length - 1), m = S.memos[i];
      return `
        <div class="row pager">${btn('memoPrev', '◀', 'small')}<span>${i + 1} / ${S.memos.length}</span>${btn('memoNext', '▶', 'small')}<span class="sp"></span>${btn('memoAdd', '＋', 'small')}${btn('memoDel', memoConfirm ? '本当に消す？' : '消す', 'small' + (memoConfirm ? ' danger' : ''))}</div>
        <textarea data-f="memo" placeholder="思いついたことをここに。自動で保存されます。" aria-label="メモ">${esc(m.text)}</textarea>`;
    },
    todo() {
      const open = S.todos.filter(t => !t.done).length, done = S.todos.length - open;
      return `
        <form class="todo-form" data-form="todo"><input type="text" id="todoText" placeholder="やることを追加" aria-label="やること" autocomplete="off"><button class="btn primary small">追加</button></form>
        ${S.todos.length ? `<ul class="todos">${S.todos.map(t => `
          <li class="${t.done ? 'done' : ''}" data-id="${t.id}">
            <label><input type="checkbox" data-f="todoDone" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span></label>
            <button class="x" data-act="todoDel" aria-label="削除">×</button>
          </li>`).join('')}</ul>` : '<p class="empty">やることはありません</p>'}
        ${done ? `<div class="row">${btn('todoClear', `完了した${done}件を消す`, 'small')}</div>` : ''}
        <p class="hint">はじめて完了にするごとに★1つ。</p>`;
    },
    bgm() {
      return `
        <div class="choices">${Object.entries(SND.BGM_LIST).map(([k, n]) => btn('bgm', n, S.bgm.kind === k ? 'on' : '', k)).join('')}</div>
        <div class="row">${btn('bgm', 'とめる', S.bgm.kind ? '' : 'on', '')}</div>
        <div class="row">音量 <input type="range" min="0" max="1" step="0.05" data-f="bgmVol" value="${S.bgm.vol}" aria-label="音量"></div>
        <p class="hint">作業用の環境音です。最初は画面のどこかを押すと鳴りはじめます。</p>`;
    },
    calendar() {
      const { y, m, sel } = cal;
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), tk = dateKey();
      let cells = '';
      for (let i = 0; i < first; i++) cells += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const k = `${y}-${pad(m + 1)}-${pad(d)}`, wd = (first + d - 1) % 7;
        cells += `<button class="cd ${k === tk ? 'today' : ''} ${k === sel ? 'sel' : ''} ${(S.events[k] || '').trim() ? 'ev' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}" data-act="calSel" data-v="${k}">${d}</button>`;
      }
      const [, sm, sd] = sel.split('-').map(Number);
      return `
        <div class="row cal-head">${btn('calPrev', '◀', 'small')}<b>${y}年${m + 1}月</b>${btn('calNext', '▶', 'small')}</div>
        <div class="cal">${[...WEEK].map((w, i) => `<span class="wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</span>`).join('')}${cells}</div>
        <label class="hint">${sm}月${sd}日の予定</label>
        <textarea class="short" data-f="event" placeholder="予定やメモを書く" aria-label="予定">${esc(S.events[sel] || '')}</textarea>`;
    },
    remind() {
      return `${Object.entries(REMINDS).map(([k, r]) => {
        const st = S.remind[k];
        const next = st.on && st.next ? new Date(st.next) : null;
        return `<div class="remind">
          <div class="row"><b>${r.name}</b><span class="sp"></span>${tog('remindOn', st.on, k)}</div>
          <div class="row small"><select data-f="remindEvery" data-v="${k}" aria-label="間隔">${[15, 20, 30, 45, 60, 90, 120].map(n => `<option value="${n}" ${st.every === n ? 'selected' : ''}>${n}分ごと</option>`).join('')}</select><span class="sp"></span>${next ? `つぎ ${pad(next.getHours())}:${pad(next.getMinutes())}` : ''}</div>
        </div>`;
      }).join('')}
      <p class="hint">時間になると、ちいさな音と一緒に声をかけてくれます。</p>`;
    },
    dress() {
      const L = S.look;
      const lockTag = (type, id) => { const r = lockOf(type, id); return r ? `<small>★${r.at}</small>` : ''; };
      return `
        <div class="dress-top"><canvas id="dressPrev" width="24" height="32"></canvas>
          <div class="dress-col">
            <div class="lbl">髪型</div>
            <div class="choices">${Object.entries(A.HAIR_STYLES).map(([k, n]) => `<button class="btn ${L.hair === k ? 'on' : ''}" data-act="look" data-k="hair" data-v="${k}" ${lockOf('hair', k) ? 'disabled' : ''}>${n}${lockTag('hair', k)}</button>`).join('')}</div>
          </div>
        </div>
        <div class="lbl">髪の色</div>
        <div class="swatches">${Object.entries(A.HAIR_COLORS).map(([k, c]) => `<button class="sw ${L.hairColor === k ? 'on' : ''}" style="--c:${c.h}" title="${c.name}" data-act="look" data-k="hairColor" data-v="${k}" ${lockOf('hairColor', k) ? 'disabled' : ''}>${lockTag('hairColor', k)}</button>`).join('')}</div>
        <div class="lbl">服</div>
        <div class="choices">${Object.entries(A.OUTFITS).map(([k, o]) => `<button class="btn ${L.outfit === k ? 'on' : ''}" data-act="look" data-k="outfit" data-v="${k}" ${lockOf('outfit', k) ? 'disabled' : ''}><i class="dot" style="--c:${o.d}"></i>${o.name}${lockTag('outfit', k)}</button>`).join('')}</div>
        <p class="hint">★がたまると、新しい髪型や服が届きます。</p>`;
    },
    stats() {
      const st = S.stats, t = today();
      const next = REWARDS.find(r => st.stars < r.at);
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const k = dateKey(d); return { label: WEEK[d.getDay()], v: (st.days[k] || {}).focus || 0 }; });
      const max = Math.max(25, ...days.map(d => d.v));
      return `
        <div class="stars">★ ${st.stars}</div>
        ${next ? `<p class="hint center">あと★${next.at - st.stars}で「${next.label}」</p>` : '<p class="hint center">ごほうびを全部集めました！</p>'}
        <div class="lbl">今日</div>
        <div class="kv"><span>集中した時間</span><b>${t.focus}分</b><span>完了したやること</span><b>${t.todos}件</b><span>ポモドーロ</span><b>${t.pomos}回</b></div>
        <div class="lbl">この7日の集中（分）</div>
        <div class="bars">${days.map(d => `<div class="bar-col"><i style="height:${Math.round(d.v / max * 100)}%"></i><span>${d.label}</span><small>${d.v}</small></div>`).join('')}</div>
        <div class="lbl">これまで</div>
        <div class="kv"><span>集中した時間</span><b>${Math.floor(st.focusMin / 60)}時間${st.focusMin % 60}分</b><span>完了したやること</span><b>${st.todos}件</b><span>ポモドーロ</span><b>${st.pomos}回</b></div>
        <div class="lbl">ごほうび</div>
        <ul class="rewards">${REWARDS.map(r => `<li class="${st.stars >= r.at ? 'got' : ''}"><span>★${r.at}</span>${r.label}</li>`).join('')}</ul>`;
    },
    settings() {
      return `
        <div class="lbl">女の子の名前</div>
        <div class="row"><input type="text" data-f="name" value="${esc(S.name)}" placeholder="名前をつける" maxlength="10" aria-label="名前"></div>
        <div class="lbl">お天気（窓の外に反映）</div>
        ${S.city ? `<div class="row"><span>${esc(S.city.name)}${S.wx ? `：${{ clear: '晴れ', cloudy: 'くもり', rain: '雨', snow: '雪' }[S.wx.kind]} ${S.wx.temp}℃` : ''}</span><span class="sp"></span>${btn('cityOff', 'やめる', 'small')}</div>` : ''}
        <form class="todo-form" data-form="city"><input type="text" id="cityQ" placeholder="市区町村の名前（例：横浜）" aria-label="地名"><button class="btn small">さがす</button></form>
        ${cityResults ? (cityResults.length ? `<div class="choices col">${cityResults.map((c, i) => btn('city', esc(c.label), 'small', i)).join('')}</div>` : '<p class="hint">見つかりませんでした</p>') : ''}
        <div class="lbl">引っ越し（別のパソコン・ブラウザへ）</div>
        <div class="row">${btn('export', '引っ越しコードを作る', 'small')}${exportCode ? btn('copy', 'コピー', 'small primary') : ''}</div>
        ${exportCode ? `<textarea class="short" readonly id="exportBox">${esc(exportCode)}</textarea>` : ''}
        <textarea class="short" id="importBox" placeholder="引っ越し先では、ここにコードを貼りつけて「読み込む」" aria-label="引っ越しコード"></textarea>
        <div class="row">${btn('import', '読み込む', 'small')}<span class="hint">${esc(importMsg)}</span></div>
        <p class="hint">データはこのブラウザの中だけに保存されています。読み込むと、いまの部屋は上書きされます。</p>`;
    },
  };
  function renderPanel(focus) {
    const k = panelKind;
    if (!k) return;
    const scroll = panel.querySelector('.body')?.scrollTop || 0;
    panel.innerHTML = `<header><h2>${TITLES[k]}</h2><button class="ibtn" data-act="close" aria-label="閉じる">${I.close}</button></header><div class="body">${PANELS[k]()}</div>`;
    panel.querySelector('.body').scrollTop = scroll;
    if (k === 'dress') drawDressPreview();
    refreshDynamic();
    if (focus) {
      const f = $('todoText') || panel.querySelector('textarea[data-f="memo"]');
      if (f) setTimeout(() => f.focus(), 0);
    }
  }
  function drawDressPreview() {
    const c = $('dressPrev'); if (!c) return;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    g.drawImage(A.girlSprite(S.look, 'stand', false, false), 0, 0);
  }
  const itemOfLi = el => S.todos.find(t => t.id === +el.closest('li').dataset.id);
  const alarmOf = el => S.alarms.find(a => a.id === +el.closest('.alarm').dataset.id);
  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const v = b.dataset.v;
    switch (b.dataset.act) {
      case 'close': return closePanel();
      case 'stop': return stopRing();
      case 'tab': S.ui.timerTab = v; save(); return renderPanel();
      case 'timerQuick': return timerSet(+v, true);
      case 'timerApply': return timerSet(+$('timerMin').value || 1, false);
      case 'timerToggle': return timerToggle();
      case 'timerReset': return timerReset();
      case 'pomoToggle': pomoToggle(); return renderPanel();
      case 'pomoSkip': pomoEnd(false); return renderPanel();
      case 'pomoStop': pomoStop(); return renderPanel();
      case 'alarmAdd': S.alarms.push({ id: Math.max(0, ...S.alarms.map(a => a.id)) + 1, time: '09:00', days: [1, 2, 3, 4, 5], on: true }); askNotify(); break;
      case 'alarmDel': S.alarms = S.alarms.filter(a => a !== alarmOf(b)); break;
      case 'alarmDay': { const a = alarmOf(b), d = +v; a.days = a.days.includes(d) ? a.days.filter(x => x !== d) : [...a.days, d].sort(); break; }
      case 'memoPrev': S.memoSel = (S.memoSel - 1 + S.memos.length) % S.memos.length; memoConfirm = false; break;
      case 'memoNext': S.memoSel = (S.memoSel + 1) % S.memos.length; memoConfirm = false; break;
      case 'memoAdd': S.memos.push({ id: Math.max(0, ...S.memos.map(m => m.id)) + 1, text: '' }); S.memoSel = S.memos.length - 1; memoConfirm = false; save(); return renderPanel(true);
      case 'memoDel': {
        const m = S.memos[S.memoSel];
        if (m.text.trim() && !memoConfirm) { memoConfirm = true; break; }
        S.memos.splice(S.memoSel, 1);
        if (!S.memos.length) S.memos.push({ id: 1, text: '' });
        S.memoSel = clamp(S.memoSel, 0, S.memos.length - 1); memoConfirm = false; break;
      }
      case 'todoDel': S.todos = S.todos.filter(t => t !== itemOfLi(b)); break;
      case 'todoClear': S.todos = S.todos.filter(t => !t.done); break;
      case 'bgm': S.bgm.kind = v || null; SND.unlock(); v ? SND.play(v) : SND.stop(); if (v) say(pick(['いい音〜', '落ちつくね'])); break;
      case 'calPrev': cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } break;
      case 'calNext': cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } break;
      case 'calSel': cal.sel = v; break;
      case 'look': S.look[b.dataset.k] = v; say(pick(['にあう？', 'かわいい？', 'えへへ'])); break;
      case 'cityOff': S.city = null; S.wx = null; break;
      case 'city': { const c = cityResults[+v]; S.city = { name: c.name, lat: c.lat, lon: c.lon }; cityResults = null; lastWxFetch = 0; fetchWeather(); break; }
      case 'export': exportCode = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); break;
      case 'copy': {
        const box = $('exportBox');
        const done = () => { importMsg = 'コピーしました'; renderPanel(); };
        try { navigator.clipboard.writeText(exportCode).then(done, () => { box.select(); }); } catch { box.select(); }
        return;
      }
      case 'import': {
        try {
          const data = JSON.parse(decodeURIComponent(escape(atob($('importBox').value.trim()))));
          if (!data || !Array.isArray(data.items) || !Array.isArray(data.todos)) throw new Error('bad');
          localStorage.setItem(KEY, JSON.stringify(data));
          location.reload();
        } catch { importMsg = 'コードが正しくないようです。全部コピーできているか確かめてください。'; }
        break;
      }
      default: return;
    }
    save(); renderPanel(); refreshDynamic();
  });
  panel.addEventListener('change', e => {
    const f = e.target.dataset.f, v = e.target.dataset.v;
    if (!f) return;
    if (f === 'alarmTime') alarmOf(e.target).time = e.target.value || '09:00';
    else if (f === 'alarmOn') { alarmOf(e.target).on = e.target.checked; if (e.target.checked) askNotify(); }
    else if (f === 'todoDone') {
      const t = itemOfLi(e.target); t.done = e.target.checked;
      if (t.done && !t.got) { t.got = true; S.stats.todos++; today().todos++; earn(1); say(pick(['えらい！', 'すごい！', 'やったね！']), 1600); }
    }
    else if (f === 'pomoWork' || f === 'pomoBrk' || f === 'pomoLong') S.pomo[{ pomoWork: 'work', pomoBrk: 'brk', pomoLong: 'long' }[f]] = clamp(+e.target.value || 1, 1, 120);
    else if (f === 'remindOn') { const r = S.remind[v]; r.on = e.target.checked; r.next = Date.now() + r.every * 60000; if (r.on) askNotify(); }
    else if (f === 'remindEvery') { const r = S.remind[v]; r.every = +e.target.value; r.next = Date.now() + r.every * 60000; }
    else if (f === 'name') { S.name = e.target.value.trim().slice(0, 10); if (S.name) say(`${S.name}、いい名前！`); }
    else return;
    save(); renderPanel(); refreshDynamic();
  });
  panel.addEventListener('input', e => {
    const f = e.target.dataset.f;
    if (f === 'memo') { S.memos[S.memoSel].text = e.target.value; save(); refreshDynamic(); }
    else if (f === 'event') { const k = cal.sel; if (e.target.value.trim()) S.events[k] = e.target.value; else delete S.events[k]; save(); refreshDynamic(); }
    else if (f === 'bgmVol') { S.bgm.vol = +e.target.value; SND.setVolume(S.bgm.vol); save(); }
  });
  panel.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target.dataset.form;
    if (form === 'todo') {
      const inp = $('todoText'), text = inp.value.trim();
      if (!text) return;
      S.todos.push({ id: Math.max(0, ...S.todos.map(t => t.id)) + 1, text, done: false });
      save(); renderPanel(true);
    } else if (form === 'city') {
      const q = $('cityQ').value.trim();
      if (!q) return;
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=ja`);
        const j = await r.json();
        cityResults = (j.results || []).map(c => ({ name: c.name, label: [c.name, c.admin1, c.country].filter(Boolean).join('・'), lat: c.latitude, lon: c.longitude }));
      } catch { cityResults = []; }
      renderPanel();
    }
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
    dirty = true;
    save();
  }
  const previewURL = {};
  function preview(type) {
    if (!previewURL[type]) {
      const st = { h: 10, m: 10, todos: 3, memo: true, lcd: '25:00', mode: 'timer', sky: skyNow(), season: seasonNow(), weather: 'clear', on: true, frame: 1, month: 10, day: 1, tier: 1, to: 'kitchen' };
      previewURL[type] = A.thingSprite(type, st).toDataURL();
    }
    return previewURL[type];
  }
  const TOOL_LABEL = { alarm: 'アラーム', timer: 'タイマー', memo: 'メモ', todo: 'やること', bgm: 'BGM', calendar: '予定', remind: 'お知らせ', dress: 'きせかえ', stats: '記録', door: '部屋の行き来' };
  function renderCatalog() {
    const tab = S.ui.catTab;
    const tabs = `<div class="cat-tabs">${[['items', '家具'], ['wall', '壁紙'], ['floor', '床']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    let list = '';
    if (tab === 'items') {
      list = Object.entries(TYPES).map(([k, t]) => {
        const lock = lockOf('item', k);
        const used = (t.tool && t.tool !== 'door' && S.items.some(i => i.type === k)) || (k === 'door' && roomItems().some(i => i.type === 'door'));
        const sub = lock ? `★${lock.at}` : used ? '配置済み' : t.tool ? TOOL_LABEL[t.tool] : '';
        return `<button class="item" data-type="${k}" ${used || lock ? 'disabled' : ''} title="${t.name}"><span class="pic"><img src="${preview(k)}" alt=""></span><span>${t.name}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
      }).join('');
    } else if (tab === 'wall') {
      list = Object.entries(A.WALLS).map(([k, w]) => {
        const lock = lockOf('wall', k);
        return `<button class="item ${R().wall === k ? 'cur' : ''}" data-wall="${k}" ${lock ? 'disabled' : ''}><span class="pic"><img class="tile" src="${A.wallTile(k).toDataURL()}" alt=""></span><span>${w.name}</span>${lock ? `<small>★${lock.at}</small>` : ''}</button>`;
      }).join('');
    } else {
      list = Object.entries(A.FLOORS).map(([k, f]) => `<button class="item ${R().floor === k ? 'cur' : ''}" data-floor="${k}"><span class="pic"><i class="floor" style="--a:${f.a};--b:${f.b};--s:${f.seam}"></i></span><span>${f.name}</span></button>`).join('');
    }
    catalog.innerHTML = tabs + `<div class="cat-list">${list}</div>` + '<button class="btn primary small done" id="editDone">完了</button>';
  }
  catalog.addEventListener('click', e => {
    if (e.target.closest('#editDone')) return setEditing(false);
    const tb = e.target.closest('[data-tab]');
    if (tb) { S.ui.catTab = tb.dataset.tab; save(); return renderCatalog(); }
    const b = e.target.closest('.item');
    if (!b || b.disabled) return;
    if (b.dataset.wall) { R().wall = b.dataset.wall; save(); renderCatalog(); dirty = true; return; }
    if (b.dataset.floor) { R().floor = b.dataset.floor; save(); renderCatalog(); dirty = true; return; }
    const type = b.dataset.type, t = TYPES[type];
    const x = clamp(Math.round(R().cam + vw / 2 + rand(-15, 15)), t.w / 2, RW() - t.w / 2);
    S.items.push(t.wall ? { id: S.nextId++, room: S.room, type, x, y: t.y } : { id: S.nextId++, room: S.room, type, x, d: t.flat ? 0.45 : 0.1 });
    save(); renderCatalog(); dirty = true;
  });

  /* ---------- 部屋の行き来 ---------- */
  function goRoom(to) {
    const fade = $('fade');
    fade.classList.remove('on'); void fade.offsetWidth; fade.classList.add('on');
    setTimeout(() => {
      S.room = to;
      const door = roomItems().find(i => i.type === 'door');
      const x = door ? door.x + 20 : 40;
      endAct();
      ch.x = ch.tx = x; ch.d = ch.td = REST_D; ch.face = 1;
      R().cam = clampCam(x - vw / 3);
      hover = null; closePanel();
      save(); refreshDynamic();
      say(to === 'kitchen' ? pick(['なに食べよっか', 'キッチンだよ']) : 'ただいま〜');
      if (editing) renderCatalog();
    }, 180);
  }

  /* ---------- 操作（クリック・ドラッグ・ホイール） ---------- */
  let ptr = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target !== cv) return;
    unlock();
    const p = toCanvas(e), hit = hitTest(p.x, p.y);
    ptr = { sx: e.clientX, sy: e.clientY, cam: R().cam, moved: false, hit, p };
    if (editing && hit && !hit.del && !hit.dw.e.char) {
      const it = hit.dw.e.it;
      ptr.drag = { it, x: it.x, y: it.y, d: it.d };
    }
    cv.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!ptr) {
      if (e.target !== cv) return;
      const p = toCanvas(e), h = hitTest(p.x, p.y);
      const nh = h ? h.dw : null;
      if (nh !== hover) { hover = nh; dirty = true; }
      cv.style.cursor = h ? 'pointer' : '';
      return;
    }
    const dx = (e.clientX - ptr.sx) / sc, dy = (e.clientY - ptr.sy) / sc;
    if (Math.abs(e.clientX - ptr.sx) + Math.abs(e.clientY - ptr.sy) > 4) ptr.moved = true;
    if (!ptr.moved) return;
    if (ptr.drag) {
      const { it } = ptr.drag, t = TYPES[it.type];
      if (t.wall) {
        it.x = Math.round(clamp(ptr.drag.x + dx, t.w / 2, RW() - t.w / 2));
        it.y = Math.round(clamp(ptr.drag.y + dy, t.h + 4, BACK - 6));
      } else {
        it.d = clamp(ptr.drag.d + dy / DEPTH_PX, 0.02, 0.8);
        it.x = Math.round(clamp(ptr.drag.x + dx / persp(it.d), t.w / 2, RW() - t.w / 2));
      }
    } else {
      R().cam = clampCam(ptr.cam - dx); camGoal = null;
    }
    cv.style.cursor = 'grabbing';
    dirty = true;
  });
  const endPtr = e => {
    if (!ptr) return;
    const p = ptr; ptr = null;
    cv.style.cursor = '';
    save();
    if (p.moved || e.type !== 'pointerup') return;
    onClick(p.hit, p.p);
  };
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);

  function onClick(hit, p) {
    if (editing) {
      if (hit && hit.del) {
        S.items = S.items.filter(i => i !== hit.dw.e.it);
        if (ch.actId === hit.dw.e.it.id) endAct();
        hover = null; save(); renderCatalog(); dirty = true;
      }
      return;
    }
    if (!hit) {
      // 床をクリック → そこへ歩く
      if (p.y < BACK) return walkTo(R().cam + vw / 2 + (p.x - vw / 2) / persp(REST_D));
      const d = clamp((p.y - BACK) / DEPTH_PX, 0.12, 0.8);
      return walkTo(R().cam + vw / 2 + (p.x - vw / 2) / persp(d), d);
    }
    if (hit.dw.e.char) {
      if (ring) return stopRing();
      ch.hop = false;
      return say(talkLine());
    }
    const it = hit.dw.e.it, t = TYPES[it.type];
    const onLeft = hit.dw.x0 + hit.dw.spr.width / 2 > vw / 2;
    if (t.tool === 'door') return goRoom(it.room === 'main' ? 'kitchen' : 'main');
    if (t.tool) {
      if (ring && ring.kind === t.tool) stopRing();
      if (t.tool === 'memo') startAct('desk', it, 40000); else walkNear(it);
      return openPanel(t.tool, onLeft);
    }
    if (t.toggle) {
      it.on = !it.on; save(); dirty = true;
      if (it.type === 'tv' && it.on) { const sofa = roomItems().find(i => i.type === 'sofa'); if (sofa) startAct('sofa', sofa, 40000); }
      return;
    }
    if (t.act === 'bed' && ch.act === 'bed') { endAct(); return say('ふぁ…おはよ'); }
    if (t.act) return startAct(t.act, it);
    walkNear(it);
    const L = { shelf: 'なに読もうかな', plant: '水やりしなきゃ', poster: 'この山、行ってみたいな', fridge: pick(['プリンあった！', 'アイス食べたいな']), counter: pick(['なに作ろっか', 'お湯わかそっと']), table: 'ごはんにしよ', fishbowl: 'きんちゃん、元気？', rug: 'ふかふか' }[it.type];
    if (L) say(L);
  }

  stage.addEventListener('wheel', e => {
    if (e.target.closest('.panel, .catalog')) return;
    e.preventDefault();
    R().cam = clampCam(R().cam + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.7 / sc);
    camGoal = null; dirty = true; save();
  }, { passive: false });
  stage.addEventListener('pointerleave', () => { if (hover) { hover = null; dirty = true; } });
  $('navL').addEventListener('click', () => { camGoal = clampCam(R().cam - vw * 0.6); });
  $('navR').addEventListener('click', () => { camGoal = clampCam(R().cam + vw * 0.6); });
  $('ringStop').addEventListener('click', stopRing);
  $('btnEdit').addEventListener('click', () => setEditing(!editing));
  $('btnSet').addEventListener('click', () => { if (panelKind === 'settings') closePanel(); else { setEditing(false); openPanel('settings', false); } });
  function onKey(e) {
    if (e.target.closest('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'ArrowLeft') camGoal = clampCam((camGoal ?? R().cam) - 40);
    else if (e.key === 'ArrowRight') camGoal = clampCam((camGoal ?? R().cam) + 40);
    else if (e.key === 'Escape') { if (ring) stopRing(); else if (panelKind) closePanel(); else if (editing) setEditing(false); }
  }
  function unlock() {
    if (SND.unlock() && S.bgm.kind && !SND.playing()) { SND.setVolume(S.bgm.vol); SND.play(S.bgm.kind); }
  }
  function bindDoc(doc) {
    doc.addEventListener('pointerdown', unlock, { capture: true });
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
  let loopId = 0, tickId = 0, ro = null;
  function attachHost(w) {
    if (ro) ro.disconnect();
    ro = new w.ResizeObserver(measure); ro.observe(stage);
    // 見えている窓のタイマーで動かす（裏のタブは時間が遅れるため）
    clearInterval(tickId); tickId = w.setInterval(tick, 500);
    SND.setHost(w);
    const id = ++loopId;
    const step = () => { if (id !== loopId) return; frame(performance.now()); w.requestAnimationFrame(step); };
    w.requestAnimationFrame(step);
    measure();
  }
  const pipOK = 'documentPictureInPicture' in window && window.top === window && !window.heyaDesktop;
  const home = app.parentNode;
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
    const room = R();
    if (camGoal != null) {
      room.cam += (camGoal - room.cam) * Math.min(1, dt * 9);
      if (Math.abs(camGoal - room.cam) < 0.5) { room.cam = camGoal; camGoal = null; save(); }
      dirty = true;
    }
    // 女の子の移動
    const dxv = ch.tx - ch.x, ddv = ch.td - ch.d;
    if (Math.abs(dxv) > 0.5 || Math.abs(ddv) > 0.01) {
      ch.x += Math.sign(dxv) * Math.min(Math.abs(dxv), 36 * dt);
      ch.d += Math.sign(ddv) * Math.min(Math.abs(ddv), 0.6 * dt);
      if (Math.abs(dxv) > 0.5) ch.face = Math.sign(dxv);
      ch.step += dt * 6;
      dirty = true;
    } else if (ch.goal) {
      arrive();
    } else if (ch.act) {
      if (ch.act === 'pet' && t - ch.lastFx > 450) {
        ch.lastFx = t;
        const cat = S.items.find(i => i.id === ch.actId);
        if (cat) particle('heart', cat.x + rand(-4, 4), cat.d, floorY(cat.d) - 12, 1.2);
      }
      const stillWork = ch.act === 'desk' && S.pomo.phase === 'work' && S.pomo.running;
      const nightSleep = ch.act === 'bed' && isNight();
      if (t > ch.actUntil && !stillWork && !nightSleep) endAct();
      if (ch.act === 'bed' && !isNight() && ch.actUntil === Infinity) endAct();
    } else if (!editing && !panelKind && !ring && t > ch.nextWander) {
      decide(t);
    }
    if (t > ch.blinkAt + 3000 + Math.random() * 3000) { ch.blinkAt = t; dirty = true; }
    if (t < ch.blinkAt + 200) dirty = true;
    if (ch.hop || ring) dirty = true;
    if (ch.say && t > ch.sayUntil) { ch.say = ''; dirty = true; }
    if (dirty || ((parts.length || animated()) && t - lastRender > 120)) { dirty = false; render(t); }
  }

  if (location.hash === '#debug') window.__heya = { S, openPanel, goRoom, startAct, earn, setEditing, ch, roomItems, pomoToggle };

  attachHost(window);
  tick();
  if (S.city) fetchWeather();
  setTimeout(() => {
    const ev = (S.events[dateKey()] || '').trim();
    say(ev ? `${greetLine()} 今日は「${ev.slice(0, 12)}」だね` : `${greetLine()}${S.name ? `${S.name}だよ` : '今日もよろしくね'}`, 3500);
  }, 600);
})();
