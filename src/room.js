/* へや — 部屋の描画と道具（アラーム・タイマー・メモ・Todo）
   描画: 高さ 130px の小さなキャンバスにドット絵で描き、ステージの高さに合わせて拡大する。
   奥行き: 奥の壁と床の境目(BACK)を基準に、手前(d が大きい)ほど下に、カメラ中心から外側へずらして置く。
   スクロールすると床板の傾きと左右の壁の見え方が変わり、横スクロールでも少し立体的に見える。 */
(() => {
  'use strict';

  const A = window.HeyaArt;
  const TYPES = A.TYPES;
  const H = 130, BACK = 86, VY = -90, FMAX = 1.25, W = 500;
  const persp = d => 1 + d * (FMAX - 1);
  const floorY = d => Math.round(VY + (BACK - VY) * persp(d));
  const DEPTH_PX = (BACK - VY) * (FMAX - 1); // d=1 で床が何px下がるか (=44)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 保存 ---------- */
  const KEY = 'heya:v2';
  const DEFAULT = {
    items: [
      { id: 1, type: 'shelf', x: 52, d: 0.04 },
      { id: 2, type: 'window', x: 118, y: 62 },
      { id: 3, type: 'lamp', x: 160, d: 0.06, on: true },
      { id: 4, type: 'rug', x: 232, d: 0.45 },
      { id: 5, type: 'desk', x: 214, d: 0.05 },
      { id: 6, type: 'clock', x: 214, y: 32 },
      { id: 7, type: 'board', x: 280, y: 56 },
      { id: 8, type: 'timer', x: 318, d: 0.05 },
      { id: 9, type: 'plant', x: 356, d: 0.6 },
      { id: 10, type: 'poster', x: 388, y: 56 },
      { id: 11, type: 'cat', x: 262, d: 0.5 },
    ],
    nextId: 12,
    memo: '',
    todos: [
      { id: 1, text: '例：メールを返す', done: false },
      { id: 2, text: '例：資料を見直す', done: false },
      { id: 3, text: '例：ストレッチ', done: true },
    ],
    alarm: { time: '15:00', on: false },
    timer: { dur: 25 * 60000, left: 25 * 60000, endAt: 0, running: false },
    cam: 110,
  };
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  let S = read(KEY);
  if (!S) {
    // 前の版のメモ・やること・アラーム・タイマーは引き継ぐ（家具の配置は新しい絵に合わせて初期化）
    const old = read('heya:v1');
    S = old ? { memo: old.memo, todos: old.todos, alarm: old.alarm, timer: old.timer } : {};
  }
  S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), S);
  S.items = S.items.filter(i => TYPES[i.type]);
  let saveT = 0;
  const save = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 保存できない環境でも動かす */ } }, 250);
  };

  /* ---------- 画面の骨組み ---------- */
  const I = {
    pip: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor" fill-rule="evenodd"><path d="M1 2h14v12H1zM3 4v8h10V4z"/><path d="M8 8h5v4H8z"/></svg>',
    edit: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M11 1h3v3h-3zM9 3h3v3H9zM7 5h3v3H7zM5 7h3v3H5zM3 9h3v3H3zM1 12h3v3H1z"/></svg>',
    pin: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M5 1h6v1h-1v4h1v1h1v1h1v1H9v6H7V9H3V8h1V7h1V6h1V2H5z"/></svg>',
    min: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M3 8h10v2H3z"/></svg>',
    close: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M2 2h3v3H2zM5 5h3v3H5zM8 8h3v3H8zM11 11h3v3h-3zM11 2h3v3h-3zM8 5h3v3H8zM5 8h3v3H5zM2 11h3v3H2z"/></svg>',
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
      <canvas class="room" id="room"></canvas>
      <div class="bubble" id="bubble" hidden></div>
      <button class="nav l" id="navL" aria-label="左へ">◀</button>
      <button class="nav r" id="navR" aria-label="右へ">▶</button>
      <div class="ringbar" id="ringbar" hidden><span id="ringText"></span><button id="ringStop">止める</button></div>
      <section class="panel" id="panel" hidden></section>
      <div class="catalog" id="catalog" hidden></div>
    </div>`;
  const $ = id => app.querySelector('#' + id); // 小窓へ移しても見つかるように app から探す
  const stage = $('stage'), cv = $('room'), ctx = cv.getContext('2d'), bubble = $('bubble'), panel = $('panel'), catalog = $('catalog');
  const shadeCv = A.canvas(1, 1), sctx = shadeCv.getContext('2d');

  let sc = 2, vw = 240;         // 拡大率と、見えている横幅(px)
  let camGoal = null, dirty = true, editing = false, panelKind = null, hover = null;
  let drawn = [];               // 直前に描いたもの（クリック判定用）

  /* ---------- キャラクター ---------- */
  const ch = { x: 190, d: 0.36, tx: 190, face: 1, say: '', sayUntil: 0, nextWander: performance.now() + 9000, step: 0, blinkAt: 0, hop: false };
  const LINES = ['がんばろう', 'ひと休みする？', 'お茶いれよっか', 'いい感じ！', 'のびー', 'あとちょっと', 'ふぁいと！'];
  function say(text, ms = 2600) { ch.say = text; ch.sayUntil = performance.now() + ms; dirty = true; }
  function walkTo(x) { ch.tx = clamp(x, 14, W - 14); ch.nextWander = performance.now() + 15000; }
  function walkNear(it) {
    const t = TYPES[it.type], gap = t.w / 2 + 9;
    walkTo(ch.x < it.x ? it.x - gap : it.x + gap);
  }

  /* ---------- 時間帯 ---------- */
  function skyNow() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 5 && h < 7) return { k: 'dawn', sky: '#ffc9b0', hill: '#a6c98a', hill2: '#86b57a', orb: '#ffe07a', star: 0, dark: 0.1 };
    if (h >= 7 && h < 16) return { k: 'day', sky: '#9fd8f5', hill: '#8fd68a', hill2: '#62b86f', orb: '#ffe07a', star: 0, dark: 0 };
    if (h >= 16 && h < 18) return { k: 'eve', sky: '#ffb38a', hill: '#b0a46a', hill2: '#8f8a5a', orb: '#ffd27a', star: 0, dark: 0.08 };
    if (h >= 18 && h < 19) return { k: 'dusk', sky: '#8a6fb8', hill: '#5a5a86', hill2: '#4a4a76', orb: '#fff3c4', star: 1, dark: 0.2 };
    return { k: 'night', sky: '#2a2f5c', hill: '#3b4470', hill2: '#2e3660', orb: '#fff3c4', star: 1, dark: 0.34 };
  }

  /* ---------- 家具ごとの状態（絵に反映するもの） ---------- */
  let blinkOn = true;
  function stateFor(it) {
    const now = new Date();
    switch (it.type) {
      case 'clock': return { h: now.getHours(), m: now.getMinutes(), alarm: S.alarm.on, ring: ring?.kind === 'alarm' };
      case 'timer': {
        const left = timerLeft(), paused = !S.timer.running && left > 0 && left < S.timer.dur;
        return { lcd: lcdText(left), blinkOff: (ring?.kind === 'timer' || paused) && !blinkOn, ring: ring?.kind === 'timer' };
      }
      case 'board': return { todos: S.todos.filter(t => !t.done).length };
      case 'desk': return { memo: !!S.memo.trim() };
      case 'window': return { sky: skyNow() };
      case 'lamp': return { on: !!it.on };
      case 'cat': return { blink: (Date.now() / 1000 % 7) < 5 };
      default: return {};
    }
  }

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
    const lo = -24, hi = W + 24 - vw;
    return hi < lo ? (W - vw) / 2 : clamp(c, lo, hi);
  }
  const ROOM = {
    void: '#2b1d2e', wall: '#fbe4ea', wallStripe: '#f6d6df', side: '#efcdd7', sideD: '#e2b9c6', ceil: '#eec3cf',
    wains: '#c9ead9', wainsL: '#dff4ea', rail: '#a7d8c2', base: '#9a6a7a',
    floorA: '#d59a6a', floorB: '#c98d5e', seam: '#a96f45', floorEdge: '#b97e52',
  };
  function render() {
    S.cam = clampCam(S.cam);
    const cam = Math.round(S.cam);
    const vp = cam + vw / 2;
    const sx = (x, d) => Math.round(vw / 2 + (x - vp) * persp(d));
    const g = ctx;
    g.imageSmoothingEnabled = false;
    g.fillStyle = ROOM.void; g.fillRect(0, 0, vw, H);

    const L0 = sx(0, 0), R0 = sx(W, 0), L1 = sx(0, 1), R1 = sx(W, 1);
    // 左右の壁
    g.fillStyle = ROOM.side;
    if (L0 > 0) g.fillRect(L1, 0, L0 - L1, H);
    if (R0 < vw) g.fillRect(R0, 0, R1 - R0, H);
    // 奥の壁（ストライプ・腰壁・幅木）
    g.fillStyle = ROOM.wall; g.fillRect(L0, 0, R0 - L0, BACK);
    g.fillStyle = ROOM.wallStripe;
    for (let x = 0; x < W; x += 12) { const X = x - cam; if (X > -6 && X < vw) g.fillRect(X, 4, 6, 52); }
    g.fillStyle = ROOM.ceil; g.fillRect(L0, 0, R0 - L0, 4);
    g.fillStyle = ROOM.rail; g.fillRect(L0, 56, R0 - L0, 2);
    g.fillStyle = ROOM.wains; g.fillRect(L0, 58, R0 - L0, BACK - 62);
    g.fillStyle = ROOM.wainsL;
    for (let x = 4; x < W; x += 20) { const X = x - cam; if (X > -12 && X < vw) g.fillRect(X, 61, 12, BACK - 68); }
    g.fillStyle = ROOM.base; g.fillRect(L0, BACK - 4, R0 - L0, 4);
    // 床：1行ずつ板目を描く
    for (let y = BACK; y < H; y++) {
      const d = (y - BACK) / DEPTH_PX, f = persp(d);
      const xl = sx(0, d), xr = sx(W, d);
      const i0 = Math.max(0, Math.floor((vp + (0 - vw / 2) / f) / 16)), i1 = Math.min(Math.ceil(W / 16), Math.ceil((vp + (vw / 2) / f) / 16) + 1);
      for (let i = i0; i < i1; i++) {
        const a = Math.max(xl, sx(i * 16, d)), b = Math.min(xr, sx((i + 1) * 16, d));
        if (b <= a) continue;
        g.fillStyle = i % 2 ? ROOM.floorA : ROOM.floorB; g.fillRect(a, y, b - a, 1);
        g.fillStyle = ROOM.seam; g.fillRect(a, y, 1, 1);
      }
      // 左右の壁と床の境目
      g.fillStyle = ROOM.base;
      if (L0 > 0) g.fillRect(xl - 2, y, 2, 1);
      if (R0 < vw) g.fillRect(xr, y, 2, 1);
    }
    for (const d of [0.25, 0.55, 0.85]) { const y = floorY(d); g.fillStyle = ROOM.seam; g.fillRect(sx(0, d), y, sx(W, d) - sx(0, d), 1); }

    // 家具とキャラクターを奥から順に
    const list = S.items.map(it => {
      const t = TYPES[it.type];
      return { it, z: t.wall ? 0 : t.flat ? 1 : 10 + it.d * 100 };
    });
    list.push({ char: true, z: 10 + ch.d * 100 + 0.5 });
    list.sort((a, b) => a.z - b.z);
    drawn = [];
    let lamp = null;
    for (const e of list) {
      let spr, X, Y;
      if (e.char) {
        const legs = Math.abs(ch.tx - ch.x) > 0.5 ? (Math.floor(ch.step) % 2 ? 'a' : 'b') : 'stand';
        const shut = performance.now() < ch.blinkAt + 140 ? 1 : 0;
        spr = A.GIRL[legs + shut + (ch.face < 0 ? 'L' : '')];
        X = sx(ch.x, ch.d); Y = floorY(ch.d);
        if (ch.hop) Y -= Math.round(Math.abs(Math.sin(performance.now() / 140)) * 5);
        else if (legs !== 'stand' && Math.floor(ch.step * 2) % 2) Y -= 1;
      } else {
        const it = e.it, t = TYPES[it.type];
        spr = A.thingSprite(it.type, stateFor(it));
        const d = t.wall ? 0 : it.d;
        X = sx(it.x, d); Y = t.wall ? it.y : floorY(d);
        if (it.type === 'lamp' && it.on && !lamp) lamp = { x: X, y: Y - 40 };
      }
      let x0 = Math.round(X - spr.width / 2), y0 = Math.round(Y - spr.height + 1);
      if (!e.char && ring && TYPES[e.it.type].tool === ring.kind) x0 += Math.floor(performance.now() / 70) % 2 ? 1 : -1; // 鳴っているとき揺れる
      g.drawImage(spr, x0, y0);
      drawn.push({ e, spr, x0, y0 });
    }

    // 時間帯の暗さと、ランプのあかり
    const sky = skyNow();
    if (lamp) {
      g.fillStyle = 'rgba(255,214,140,.10)';
      dotCircle(g, lamp.x, lamp.y + 20, 40);
    }
    if (sky.dark > 0) {
      sctx.clearRect(0, 0, vw, H);
      sctx.globalCompositeOperation = 'source-over';
      sctx.fillStyle = `rgba(28,18,64,${sky.dark})`; sctx.fillRect(0, 0, vw, H);
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
        const bx = x0 + spr.width - 4, by = y0 - 4;
        dw.del = { x: bx, y: by, w: 7, h: 7 };
        g.fillStyle = '#3a2433'; g.fillRect(bx, by, 7, 7);
        g.fillStyle = '#ff5a6e'; g.fillRect(bx + 1, by + 1, 5, 5);
        g.fillStyle = '#ffffff';
        for (let k = 0; k < 3; k++) { g.fillRect(bx + 2 + k, by + 2 + k, 1, 1); g.fillRect(bx + 4 - k, by + 2 + k, 1, 1); }
      }
    } else if (hover && !hover.e.char) {
      // 指している家具を白く縁どり
      outlineSprite(g, hover);
    }

    // ふきだし
    const talking = ch.say && performance.now() < ch.sayUntil;
    bubble.hidden = !talking;
    if (talking) {
      const cd = drawn.find(dw => dw.e.char);
      bubble.textContent = ch.say;
      bubble.style.left = (cd.x0 + cd.spr.width / 2) * sc + 'px';
      bubble.style.top = (cd.y0 - 2) * sc + 'px';
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
      if (spr.alpha[(y * spr.width + x) * 4 + 3] > 0) return { dw };
    }
    return null;
  }
  function toCanvas(e) {
    const r = cv.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / sc), y: Math.floor((e.clientY - r.top) / sc) };
  }

  /* ---------- バーの表示など ---------- */
  function refreshDynamic() {
    const tleft = timerLeft();
    const open = S.todos.filter(t => !t.done).length;
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
    dirty = true;
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
    // ピコピコした音（矩形波）
    [[0, 988], [0.12, 1319], [0.3, 988], [0.42, 1319]].forEach(([o, hz]) => {
      const os = actx.createOscillator(), g = actx.createGain();
      os.type = 'square'; os.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t0 + o);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + o + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o + 0.1);
      os.connect(g).connect(actx.destination);
      os.start(t0 + o); os.stop(t0 + o + 0.11);
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
    const p = n => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
  }
  function lcdText(ms) {
    const sec = Math.ceil(ms / 1000), h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), ss = sec % 60;
    const p = n => String(n).padStart(2, '0');
    return h ? `${h}h${p(m)}` : `${p(m)}:${p(ss)}`;
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

  /* ---------- 0.5秒ごとの処理 ---------- */
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
    blinkOn = !blinkOn;
    refreshDynamic();
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
    if (t.id === 'todoClear') { S.todos = S.todos.filter(x => !x.done); save(); renderPanel(); return; }
    const li = t.closest('li[data-id]');
    if (li) {
      const id = +li.dataset.id;
      if (t.classList.contains('x')) S.todos = S.todos.filter(x => x.id !== id);
      else if (t.type === 'checkbox') { const td = S.todos.find(x => x.id === id); td.done = t.checked; if (t.checked) say('えらい！', 1500); }
      save(); renderPanel();
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
    save(); renderPanel(true);
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
      const st = { h: 10, m: 10, todos: 3, memo: true, lcd: '25:00', sky: skyNow(), on: true };
      previewURL[type] = A.thingSprite(type, st).toDataURL();
    }
    return previewURL[type];
  }
  function renderCatalog() {
    const placed = new Set(S.items.map(i => i.type));
    catalog.innerHTML = Object.entries(TYPES).map(([k, t]) => {
      const used = t.tool && placed.has(k);
      return `<button class="item" data-type="${k}" ${used ? 'disabled' : ''} title="${t.name}"><span class="pic"><img src="${preview(k)}" alt=""></span><span>${t.name}</span>${t.tool ? `<small>${used ? '配置済み' : TITLES[t.tool]}</small>` : ''}</button>`;
    }).join('') + '<button class="btn primary small done" id="editDone">完了</button>';
  }
  catalog.addEventListener('click', e => {
    if (e.target.closest('#editDone')) return setEditing(false);
    const b = e.target.closest('.item');
    if (!b || b.disabled) return;
    const type = b.dataset.type, t = TYPES[type];
    const x = clamp(Math.round(S.cam + vw / 2 + (Math.random() * 30 - 15)), t.w / 2, W - t.w / 2);
    S.items.push(t.wall ? { id: S.nextId++, type, x, y: t.y } : { id: S.nextId++, type, x, d: t.flat ? 0.45 : 0.1 });
    save(); renderCatalog(); dirty = true;
  });

  /* ---------- 操作（クリック・ドラッグ・ホイール） ---------- */
  let ptr = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target !== cv) return;
    unlockAudio();
    const p = toCanvas(e), hit = hitTest(p.x, p.y);
    ptr = { sx: e.clientX, sy: e.clientY, cam: S.cam, moved: false, hit, p };
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
        it.x = Math.round(clamp(ptr.drag.x + dx, t.w / 2, W - t.w / 2));
        it.y = Math.round(clamp(ptr.drag.y + dy, t.h + 4, BACK - 6));
      } else {
        it.d = clamp(ptr.drag.d + dy / DEPTH_PX, 0.02, 0.8);
        it.x = Math.round(clamp(ptr.drag.x + dx / persp(it.d), t.w / 2, W - t.w / 2));
      }
      cv.style.cursor = 'grabbing';
    } else {
      S.cam = clampCam(ptr.cam - dx); camGoal = null;
      cv.style.cursor = 'grabbing';
    }
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
        hover = null; save(); renderCatalog(); dirty = true;
      }
      return;
    }
    if (!hit) {
      // 床をクリック → そこへ歩く
      walkTo(S.cam + vw / 2 + (p.x - vw / 2) / persp(ch.d));
      return;
    }
    if (hit.dw.e.char) {
      if (ring) return stopRing();
      return say(LINES[Math.floor(Math.random() * LINES.length)]);
    }
    const it = hit.dw.e.it, t = TYPES[it.type];
    walkNear(it);
    if (t.tool) {
      if (ring && ring.kind === t.tool) stopRing();
      openPanel(t.tool, hit.dw.x0 + hit.dw.spr.width / 2 > vw / 2); // 家具と反対側に出す
    } else if (t.toggle) {
      it.on = !it.on; save(); dirty = true;
    } else if (it.type === 'plant') say('水やりしなきゃ');
    else if (it.type === 'shelf') say('なに読もうかな');
    else if (it.type === 'cat') say('ねこ、かわいい…');
    else if (it.type === 'window') say(skyNow().star ? '星がきれい' : 'いい天気');
  }

  stage.addEventListener('wheel', e => {
    if (e.target.closest('.panel, .catalog')) return;
    e.preventDefault();
    S.cam = clampCam(S.cam + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.35 / sc * 2);
    camGoal = null; dirty = true; save();
  }, { passive: false });
  stage.addEventListener('pointerleave', () => { if (hover) { hover = null; dirty = true; } });
  $('navL').addEventListener('click', () => { camGoal = clampCam(S.cam - vw * 0.6); });
  $('navR').addEventListener('click', () => { camGoal = clampCam(S.cam + vw * 0.6); });
  $('ringStop').addEventListener('click', stopRing);
  $('btnEdit').addEventListener('click', () => setEditing(!editing));
  function onKey(e) {
    if (e.target.closest('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'ArrowLeft') camGoal = clampCam((camGoal ?? S.cam) - 40);
    else if (e.key === 'ArrowRight') camGoal = clampCam((camGoal ?? S.cam) + 40);
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
    if (camGoal != null) {
      S.cam += (camGoal - S.cam) * Math.min(1, dt * 9);
      if (Math.abs(camGoal - S.cam) < 0.5) { S.cam = camGoal; camGoal = null; save(); }
      dirty = true;
    }
    // キャラクター
    const diff = ch.tx - ch.x;
    if (Math.abs(diff) > 0.5) {
      ch.x += Math.sign(diff) * Math.min(Math.abs(diff), 36 * dt);
      ch.face = Math.sign(diff);
      ch.step += dt * 6;
      dirty = true;
    } else if (!editing && !panelKind && !ring && t > ch.nextWander) {
      ch.tx = clamp(ch.x + (Math.random() * 160 - 80), 20, W - 20);
      ch.nextWander = t + 8000 + Math.random() * 12000;
    }
    if (t > ch.blinkAt + 3000 + Math.random() * 3000) { ch.blinkAt = t; dirty = true; }
    if (t < ch.blinkAt + 200) dirty = true;
    if (ch.hop || ring) dirty = true;
    if (ch.say && t > ch.sayUntil) { ch.say = ''; dirty = true; }
    if (dirty) { dirty = false; render(); }
  }

  attachHost(window);
  tick();
  setTimeout(() => say('今日もよろしくね'), 600);
})();
