/* へや — ドット絵の素材
   すべて小さなキャンバスに 1px 単位で描き、外側に自動でふち取りを付ける。
   部屋全体は高さ 130px の低解像度で描いて、画面に合わせて拡大表示する。 */
(() => {
  'use strict';

  const OUTLINE = '#3a2433';
  const BACK = 86; // 奥の壁の高さ（room.js と同じ）

  /* ---------- 描画の道具 ---------- */
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function painter(g) {
    const P = {
      r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); return P; },
      p(x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); return P; },
      // 楕円をドットで塗る
      ell(cx, cy, rx, ry, col) {
        g.fillStyle = col;
        for (let y = -ry; y <= ry; y++) {
          const k = 1 - (y * y) / ((ry + 0.5) * (ry + 0.5));
          if (k < 0) continue;
          const hw = Math.round(rx * Math.sqrt(k));
          g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
        }
        return P;
      },
      // 1px の線（ブレゼンハム）
      line(x0, y0, x1, y1, col) {
        g.fillStyle = col;
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        if (![x0, y0, x1, y1].every(Number.isFinite)) return P; // 数でない値が来たら描かない（無限ループ防止）
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let e = dx + dy;
        for (;;) {
          g.fillRect(x0, y0, 1, 1);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * e;
          if (e2 >= dy) { e += dy; x0 += sx; }
          if (e2 <= dx) { e += dx; y0 += sy; }
        }
        return P;
      },
      // 文字で描いたドット絵を置く（"." は透明）
      map(x, y, rows, pal) {
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const col = pal[row[i]];
            if (col) { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); }
          }
        });
        return P;
      },
      // 3x5 の数字フォント（scale で拡大）
      text(x, y, str, col, scale = 1) {
        let cx = x;
        g.fillStyle = col;
        for (const ch of str) {
          const gl = FONT[ch];
          if (!gl) { cx += 2 * scale; continue; }
          gl.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') g.fillRect(cx + i * scale, y + j * scale, scale, scale); });
          cx += (gl[0].length + 1) * scale;
        }
        return P;
      },
    };
    return P;
  }
  const textWidth = (str, scale = 1) => ([...str].reduce((a, ch) => a + (FONT[ch] ? FONT[ch][0].length + 1 : 2), 0) - 1) * scale;

  // 透明なところのうち、色のある点に接するところをふち取り色にする
  function addOutline(c, col) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h).data;
    const solid = i => d[i * 4 + 3] > 0;
    g.fillStyle = col;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid(i)) continue;
      if ((x > 0 && solid(i - 1)) || (x < w - 1 && solid(i + 1)) || (y > 0 && solid(i - w)) || (y < h - 1 && solid(i + w))) g.fillRect(x, y, 1, 1);
    }
  }
  // スプライトを作る。外側に 1px の余白をとってふち取りする
  function sprite(w, h, draw, outline = OUTLINE) {
    const c = canvas(w + 2, h + 2);
    const g = c.getContext('2d');
    g.save(); g.translate(1, 1); draw(painter(g), g); g.restore();
    if (outline) addOutline(c, outline);
    c.alpha = g.getImageData(0, 0, c.width, c.height).data; // クリック判定用
    return c;
  }
  function flipped(src) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    c.alpha = g.getImageData(0, 0, c.width, c.height).data;
    return c;
  }

  /* ---------- 3x5 のフォント ---------- */
  const FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    ':': ['0', '1', '0', '1', '0'], '-': ['000', '000', '111', '000', '000'],
    'h': ['100', '100', '111', '101', '101'], 'Z': ['111', '001', '010', '100', '111'],
  };

  /* ---------- 色 ---------- */
  const C = {
    wood: '#b9774e', woodL: '#d39566', woodD: '#8e5638', woodDD: '#6d3f2a',
    white: '#fffaf3', cream: '#fff1d6', pink: '#ff9fb6', pinkL: '#ffc9d6', pinkD: '#e57a96',
    mint: '#9fdcc8', mintL: '#c6eedf', mintD: '#6fbfa6', sky: '#9fd8f5',
    leaf: '#62b86f', leafL: '#8fd68a', leafD: '#3f8c55', pot: '#e08a63', potL: '#f0a882',
    metal: '#5b5068', metalL: '#8b7f99', gold: '#ffd166', red: '#e2475e', steel: '#c9d3df', steelD: '#8fa4b8',
  };

  /* ---------- 女の子 ---------- */
  const HAIR_COLORS = {
    brown: { name: 'ちゃいろ', h: '#8a5040', H: '#b9735a', k: '#6a3a30' },
    black: { name: 'くろ', h: '#3b3040', H: '#62526e', k: '#251c2b' },
    blonde: { name: 'きんいろ', h: '#e3ad45', H: '#ffe08a', k: '#b8842a' },
    pink: { name: 'ピンク', h: '#f58fb0', H: '#ffc2d6', k: '#d0668a' },
    aqua: { name: 'みずいろ', h: '#5fbfd6', H: '#a8e6f0', k: '#3f98ad' },
    silver: { name: 'ぎんいろ', h: '#bdb7cc', H: '#f0eef7', k: '#938ca6' },
    milktea: { name: 'ミルクティー', h: '#c9a07a', H: '#ecd3b4', k: '#a37c58' },
  };
  const OUTFITS = {
    mizuiro: { name: 'みずいろワンピ', d: '#9ad8e2', D: '#6bb8c4', w: '#ffffff', r: '#ff6f91' },
    yellow: { name: 'きいろワンピ', d: '#ffe08a', D: '#f0bd4f', w: '#ffffff', r: '#ff8f6b' },
    pajama: { name: 'パジャマ', d: '#c9b8f0', D: '#a895d9', w: '#fff6c9', r: '#ffd166' },
    pink: { name: 'ピンクワンピ', d: '#ffb3c6', D: '#f08aa6', w: '#ffffff', r: '#e2557a' },
    sailor: { name: 'セーラー服', d: '#41508f', D: '#2e3a6e', w: '#ffffff', r: '#e2475e' },
    maid: { name: 'メイド服', d: '#3a3348', D: '#262030', w: '#ffffff', r: '#ff8fab' },
    frill: { name: 'フリルブラウス', style: 'frill', d: '#f7a8c0', D: '#e48aa8', w: '#ffffff', r: '#c9a24a' },
    jacket: { name: 'ライダース', style: 'jacket', d: '#3a3036', D: '#4f74a8', w: '#f4f4f4', r: '#c94a4a' },
    kimono: { name: '着物', style: 'kimono', d: '#e8708f', D: '#c25473', w: '#ffffff', r: '#ffd166' },
    chinaDress: { name: 'チャイナドレス', style: 'china', d: '#d7263d', D: '#a51c30', w: '#ffd166', r: '#ffd166' },
    witch: { name: '魔女っ子', style: 'witch', d: '#5b3a8c', D: '#2b2238', w: '#ff9f43', r: '#ff9f43' },
    santa: { name: 'サンタ服', style: 'santa', d: '#e2475e', D: '#ffffff', w: '#ffffff', r: '#ffd166' },
  };
  const HAIR_STYLES = { long: 'ロング', bob: 'ボブ', twin: 'ツインテール', bun: 'おだんご' };

  const HEAD = [
    '.......hhhhhhh........',
    '.....hhhhhhhhhhh..rr..',
    '....hhhHHhhhhhhhhrRRr.',
    '...hhhHHhhhhhhhhhhrRr.',
    '...hhHhhhhhhhhhhhhhr..',
    '..hhhhhhhhhhhhhhhhhh..',
    '..hhhhhhhhhhhhhhhhhhh.',
    '..hhhhhhkshhhhkshhhhh.',
    '..hhhhkssssskssssshhh.',
    '..hhhhssssssssssssshh.',
    '..hhhsssssssssssssshh.',
  ];
  const EYES_OPEN = [
    '..hhhseeesssssseeeshh.',
    '..hhhseWeesssseWeeshh.',
    '..hhhsEEEsssssEEEsshh.',
    '..hhhsEEEsssssEEEsshh.',
  ];
  const EYES_SHUT = [
    '..hhhssssssssssssssh..',
    '..hhhssssssssssssssh..',
    '..hhhseeesssssseeeshh.',
    '..hhhsssssssssssssshh.',
  ];
  const FACE_LOW = [
    '..hhhcccsssmssscccshh.',
    '..hhhhssssssssssssshh.',
    '..hhhh.Sssssssss.hhhh.',
  ];
  const BODY = [
    '..hhhh..ddwrwdd..hhh..',
    '..hhh..ddddwdddd..hh..',
    '..hh..ddddddddddd.hh..',
    '...h.sddddddddddds.h..',
    '.....sddddddddddds....',
    '......dddddddddd......',
    '.....dddddddddddd.....',
    '....DddddddddddddD....',
    '....DDDDDDDDDDDDDD....',
  ];
  const LEGS = {
    stand: ['.......ss....ss.......', '.......ll....ll.......', '......bbb....bbb......'],
    a: ['.......ss....ss.......', '.......ll....ll.......', '......bbb.....bb......'],
    b: ['.......ss....ss.......', '.......ll....ll.......', '.......bb....bbb......'],
    sit: ['......lll....lll......', '......bbb....bbb......'],
  };
  const CHAIR = [
    '....oooooooooooooo....',
    '....oOOOOOOOOOOOOo....',
    '....oOOOOOOOOOOOOo....',
    '....oooooooooooooo....',
    '...oooooooooooooooo...',
    '....o............o....',
    '....o............o....',
    '....o............o....',
    '....o............o....',
  ];
  const set = (row, i, ch) => row.slice(0, i) + ch + row.slice(i + 1);
  const GIRL_W = 22, GIRL_H = 30;

  // 髪型を行に反映する（front: 正面 / back: 後ろ姿）
  function applyHair(rows, style, back) {
    rows = rows.slice();
    if (style === 'bob' || style === 'twin' || style === 'bun') {
      for (let i = 17; i < rows.length; i++) rows[i] = rows[i].replace(/[hHk]/g, '.');
      if (back) rows[17] = '.........ss...........';
    }
    if (style === 'twin') {
      for (let i = 0; i < 5; i++) rows[i] = rows[i].replace(/[rR]/g, '.');
      for (let i = 8; i <= 23 && i < rows.length; i++) {
        const tie = i <= 9, tip = i === 23;
        const c = tie ? 'r' : 'h';
        if (!tip) { rows[i] = set(set(rows[i], 0, c), 1, c); rows[i] = set(set(rows[i], 20, c), 21, c); }
        else { rows[i] = set(rows[i], 1, 'h'); rows[i] = set(rows[i], 20, 'h'); }
      }
    }
    if (style === 'bun') {
      for (let i = 0; i < 5; i++) rows[i] = rows[i].replace(/[rR]/g, i < 2 ? '.' : 'h');
      const bun = ['.hh.', 'hHhh', 'hhhh', '.rr.'];
      bun.forEach((b, j) => { for (let x = 0; x < 4; x++) if (b[x] !== '.') { rows[j] = set(rows[j], 2 + x, b[x]); rows[j] = set(rows[j], 16 + x, b[x]); } });
    }
    if (back && style === 'long') {
      for (let i = 18; i <= 23; i++) {
        const [a, b] = i === 23 ? [7, 14] : [6, 15];
        for (let x = a; x <= b; x++) if (rows[i][x] !== '.') rows[i] = set(rows[i], x, 'h');
      }
    }
    return rows;
  }
  // 服の形（色だけでなく、えりや帯などの形を変える）。body は BODY の9行
  function applyOutfit(body, style, back) {
    const b = body.slice();
    const each = (rows, fn) => rows.forEach(i => { let r = b[i]; for (let x = 0; x < 22; x++) { const c = fn(r[x], x, i); if (c && c !== r[x]) r = set(r, x, c); } b[i] = r; });
    const cloth = c => 'dDwr'.includes(c);
    switch (style) {
      case 'frill': // 白いブラウスとピンクのスカート、すそにレース
        each([0, 1, 2, 3, 4], c => (c === 'd' ? 'w' : null));
        if (!back) each([0], (c, x) => (x === 10 || x === 11 ? 'r' : null));
        each([8], (c, x) => (c === 'D' && x % 2 ? 'w' : null));
        break;
      case 'jacket': // 黒の革ジャン、中に白T、デニムのスカート
        each([5, 6, 7, 8], c => (c === 'd' ? 'D' : null));
        each([0], c => (c === 'r' ? 'd' : null));
        if (!back) each([0, 1, 2, 3, 4], (c, x) => ((x === 10 || x === 11) && cloth(c) ? 'w' : null));
        break;
      case 'kimono': // えりの合わせ、帯、長いそで
        if (!back) { each([0], (c, x) => (x === 9 || x === 12 ? 'w' : cloth(c) ? 'd' : null)); each([1], (c, x) => (x === 10 || x === 11 ? 'w' : null)); }
        each([4], (c, x) => (x >= 6 && x <= 15 ? 'r' : null));
        each([3, 4], (c, x) => (c === 's' ? 'D' : null));
        each([5], (c, x) => (x === 5 || x === 16 ? 'D' : null));
        each([7, 8], (c, x) => (x === 4 || x === 17 ? '.' : null));
        each([2, 6], (c, x) => (c === 'd' && x % 4 === 1 ? 'R' : null));
        break;
      case 'china': // 金のふちどり、立てえり、スリット
        each([0], (c, x) => (cloth(c) ? (x >= 9 && x <= 12 ? 'w' : 'd') : null));
        if (!back) { each([1, 2], (c, x) => (x === 12 ? 'w' : null)); each([7, 8], (c, x) => (x === 12 ? 's' : null)); }
        each([8], c => (c === 'D' ? 'w' : null));
        break;
      case 'witch': // すそがギザギザ
        each([8], (c, x) => (c === 'D' && x % 2 ? '.' : null));
        each([0], c => (c === 'w' ? 'w' : null));
        break;
      case 'santa': // 白いファー
        each([0], c => (cloth(c) ? 'D' : null));
        if (!back) each([1, 2, 3], (c, x) => (x === 11 ? 'r' : null));
        break;
      default:
    }
    return b;
  }
  const outfitStyle = look => (OUTFITS[look.outfit] || {}).style;
  function frontRows(legs, shut, look) {
    const rows = [...HEAD, ...(shut ? EYES_SHUT : EYES_OPEN), ...FACE_LOW, ...applyOutfit(BODY, outfitStyle(look), false), ...(LEGS[legs] || LEGS.stand)];
    return applyHair(rows, look.hair, false);
  }
  function backRows(legs, look) {
    let rows = [...HEAD, ...EYES_SHUT, ...FACE_LOW].map(r => r.replace(/[sSceEWmk]/g, 'h'));
    rows = rows.concat(applyOutfit(BODY.map(r => r.replace(/r/g, 'd')), outfitStyle(look), true), LEGS[legs] || LEGS.stand);
    return applyHair(rows, look.hair, true);
  }
  function girlPal(look) {
    const hc = HAIR_COLORS[look.hairColor] || HAIR_COLORS.brown, of = OUTFITS[look.outfit] || OUTFITS.mizuiro;
    return {
      h: hc.h, H: hc.H, k: hc.k, r: of.r, R: '#ffd0dc', s: '#ffe6d6', S: '#f8c9b4',
      c: '#ffa3b5', e: '#3b2a5c', E: '#6b56a8', W: '#ffffff', m: '#d0607a', d: of.d, D: of.D,
      w: of.w, l: '#ffffff', b: '#7a4060', o: C.wood, O: C.woodL,
    };
  }
  // pose: stand / a / b（歩き） / back（後ろ姿） / sitBack（いすに座って机に向かう） / sitFront（ソファに座る）
  const girlCache = new Map();
  function girlSprite(look, pose, shut, left) {
    const key = [look.hair, look.hairColor, look.outfit, pose, shut ? 1 : 0, left ? 1 : 0].join('|');
    let c = girlCache.get(key);
    if (c) return c;
    if (left) {
      c = flipped(girlSprite(look, pose, shut, false));
    } else {
      const pal = girlPal(look);
      let rows;
      if (pose === 'back') rows = backRows('stand', look);
      else if (pose === 'sitBack') {
        // 後ろ姿の上半分に、いすの背もたれを重ねる
        const base = backRows('stand', look);
        rows = base.slice(0, 21).concat(CHAIR.map((chair, j) => {
          if (j >= 4) return chair;
          let out = base[21 + j];
          for (let x = 0; x < chair.length; x++) if (chair[x] !== '.') out = set(out, x, chair[x]);
          return out;
        }));
      } else if (pose === 'sitFront') rows = frontRows('sit', shut, look);
      else rows = frontRows(pose, shut, look);
      c = sprite(GIRL_W, rows.length, P => P.map(0, 0, rows, pal));
    }
    if (girlCache.size > 200) girlCache.clear();
    girlCache.set(key, c);
    return c;
  }
  // ベッドで寝ている顔
  const SLEEP_HEAD = [
    '..hhhhhhhh..',
    '.hhhhHHhhhh.',
    'hhhhhhhhhhhh',
    'hhhshhhhshhh',
    'hhssssssssh.',
    'hseessssseeh',
    'hsccsssscch.',
    '.hssssssssh.',
  ];

  /* ---------- 窓の外（季節と天気） ---------- */
  const SEASON_HILLS = {
    spring: ['#9bd88a', '#76c278'], summer: ['#6fc46a', '#3f9a55'],
    autumn: ['#f0a04b', '#d9733a'], winter: ['#f4f7fb', '#dfe7f2'],
  };
  function drawOutside(P, x0, y0, w, h, st) {
    const sky = st.sky, wx = st.weather || 'clear', season = st.season || 'summer', f = st.frame || 0;
    const cloudy = wx !== 'clear';
    let skyCol = sky.sky;
    if (cloudy && !sky.star) skyCol = wx === 'cloudy' ? '#c3d3e0' : '#9fb0c2';
    P.r(x0, y0, w, h, skyCol);
    if (sky.star && !cloudy) [[4, 4], [11, 9], [25, 3], [20, 12], [7, 15], [28, 16]].forEach(([x, y]) => x < w && y < h && P.p(x0 + x, y0 + y, '#fff8d0'));
    if (!cloudy) {
      P.ell(x0 + w - 8, y0 + 7, 3, 3, sky.orb);
      if (sky.star) P.ell(x0 + w - 7, y0 + 6, 2, 2, skyCol);
    }
    if (cloudy) {
      const cc = sky.star ? '#4a4f78' : (wx === 'cloudy' ? '#ffffff' : '#e3e9f0');
      P.ell(x0 + 8 + (f % 2), y0 + 5, 6, 2, cc).ell(x0 + w - 10, y0 + 8, 7, 2, cc);
    }
    // 丘
    const [h1, h2] = SEASON_HILLS[season];
    const dim = sky.star ? 0.55 : 1;
    const col = c => dim < 1 ? shade(c, dim) : c;
    for (let x = 0; x < w; x++) {
      const a = h - 6 + Math.round(Math.abs(x - 7) * 0.35), b = h - 4 + Math.round(Math.abs(x - w + 7) * 0.3);
      if (a < h) P.r(x0 + x, y0 + a, 1, h - a, col(h1));
      if (b < a && b < h) P.r(x0 + x, y0 + b, 1, Math.min(a, h) - b, col(h2));
    }
    if (season === 'spring') { // 桜の木
      P.r(x0 + 6, y0 + h - 9, 1, 4, '#8a5a3c').ell(x0 + 6, y0 + h - 11, 4, 3, col('#ffc1d6')).p(x0 + 4, y0 + h - 12, '#ffffff');
    }
    if (season === 'autumn') P.r(x0 + 6, y0 + h - 9, 1, 4, '#8a5a3c').ell(x0 + 6, y0 + h - 11, 4, 3, col('#e8623e'));
    if (wx === 'rain') for (let i = 0; i < 9; i++) {
      const x = (i * 7 + f * 3) % w, y = (i * 11 + f * 5) % (h - 3);
      P.p(x0 + x, y0 + y, '#e8f4ff').p(x0 + x, y0 + y + 1, '#e8f4ff');
    }
    if (wx === 'snow') for (let i = 0; i < 10; i++) {
      const x = (i * 9 + (f % 2)) % w, y = (i * 7 + f * 2) % (h - 2);
      P.p(x0 + x, y0 + y, '#ffffff');
    }
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k * 1.08);
    return `rgb(${r},${g},${Math.min(255, b)})`;
  }

  /* ---------- 家具 ----------
     name, tool(開く道具), wall(壁掛け), w/h(ドット), y(壁掛けの下端), toggle, flat, act(女の子の行動), draw(P, 状態) */
  const NOTE_COLS = ['#ffe58a', '#ffb3c6', '#a8dcf5', '#bde8a8', '#ffe58a', '#ffcf9e'];
  const TYPES = {
    clock: {
      // 本物の時刻どおりに、時針・分針・秒針が動く
      name: '時計', tool: 'alarm', wall: true, w: 21, h: 21, y: 34,
      key: st => `${st.h % 12}:${st.m}:${st.s}:${st.alarm ? 1 : 0}`,
      draw(P, st) {
        const c = 10, TAU = Math.PI * 2;
        P.ell(c, c, 10, 10, C.pinkD).ell(c, c, 9, 9, C.white);
        for (let i = 0; i < 12; i++) { // 目盛り（3・6・9・12時は2つ）
          const a = i / 12 * TAU, x = Math.round(c + Math.sin(a) * 7.6), y = Math.round(c - Math.cos(a) * 7.6);
          P.p(x, y, i % 3 ? '#e8b4c3' : C.pinkD);
          if (i % 3 === 0) P.p(Math.round(c + Math.sin(a) * 6.6), Math.round(c - Math.cos(a) * 6.6), C.pinkD);
        }
        const ha = ((st.h % 12) + st.m / 60) / 12 * TAU, ma = (st.m + st.s / 60) / 60 * TAU, sa = st.s / 60 * TAU;
        P.line(c, c, c + Math.sin(ha) * 4.4, c - Math.cos(ha) * 4.4, OUTLINE);
        P.line(c, c, c + Math.sin(ma) * 7, c - Math.cos(ma) * 7, '#5b4a66');
        P.line(c, c, c + Math.sin(sa) * 7.5, c - Math.cos(sa) * 7.5, '#ff5a6e');
        P.p(c, c, '#e0485e');
        if (st.alarm) P.r(17, -1, 4, 4, '#ff5a6e').r(18, 0, 2, 2, '#ffd0d6');
      },
    },
    board: {
      name: 'コルクボード', tool: 'todo', wall: true, w: 34, h: 23, y: 56,
      key: st => String(Math.min(st.todos, 6)),
      draw(P, st) {
        P.r(0, 0, 34, 23, C.wood).r(0, 0, 34, 1, C.woodL).r(2, 2, 30, 19, '#e2b07a');
        [[5, 17], [14, 5], [27, 16], [20, 18], [9, 11]].forEach(([x, y]) => P.p(x, y, '#c99560'));
        const pos = [[4, 4], [14, 3], [24, 4], [5, 12], [15, 12], [24, 11]];
        for (let i = 0; i < Math.min(st.todos, 6); i++) {
          const [x, y] = pos[i];
          P.r(x, y, 7, 7, NOTE_COLS[i]).r(x + 1, y + 3, 5, 1, 'rgba(0,0,0,.18)').r(x + 1, y + 5, 3, 1, 'rgba(0,0,0,.18)').p(x + 3, y, '#e0485e');
        }
      },
    },
    desk: {
      name: 'つくえ', tool: 'memo', w: 48, h: 25, act: 'desk',
      key: st => st.memo ? '1' : '0',
      draw(P, st) {
        P.r(8, 3, 6, 6, C.white).r(15, 3, 6, 6, C.white).r(14, 4, 1, 5, '#d9cfc4');
        if (st.memo) P.r(9, 5, 4, 1, '#8aa6d6').r(9, 7, 3, 1, '#8aa6d6').r(16, 5, 4, 1, '#8aa6d6').r(16, 7, 2, 1, '#8aa6d6');
        P.r(24, 7, 6, 1, C.gold).p(30, 7, '#4a3550');
        P.r(35, 3, 5, 6, C.pinkL).r(40, 4, 1, 3, C.pinkL).r(36, 4, 3, 1, C.white);
        P.r(0, 9, 48, 3, C.woodL).r(0, 12, 48, 3, C.wood).r(0, 14, 48, 1, C.woodD);
        P.r(2, 15, 3, 10, C.woodD).r(43, 15, 3, 10, C.woodD);
        P.r(27, 15, 15, 8, C.wood).r(27, 15, 15, 1, C.woodL).r(32, 18, 5, 1, C.woodDD);
      },
    },
    timer: {
      name: 'タイマー棚', tool: 'timer', w: 24, h: 25,
      // 使っていないときは今の時刻、使っているときは残り時間と進み具合のバー
      key: st => `${st.lcd}:${st.blinkOff ? 1 : 0}:${st.colonOff ? 1 : 0}:${st.mode}:${Math.round((st.prog || 0) * 20)}`,
      draw(P, st) {
        const bg = st.mode === 'break' ? '#bfe3f0' : st.mode === 'work' ? '#ffd6c4' : st.mode === 'clock' ? '#d6e8b8' : '#c4dba3';
        P.r(1, 0, 22, 10, '#fdfdff').r(1, 0, 22, 1, '#ffffff').r(3, -1, 3, 1, '#ff5a6e').r(18, -1, 3, 1, C.metal);
        P.r(2, 1, 20, 7, bg);
        if (!st.blinkOff) {
          const w = textWidth(st.lcd), x = Math.round(12 - w / 2);
          P.text(x, 2, st.lcd, '#2f3a2a');
          if (st.colonOff) P.r(x + textWidth(st.lcd.slice(0, 2)) + 1, 2, 1, 5, bg); // 時刻の「:」を点滅
        }
        if (st.prog != null) P.r(2, 7, Math.round(20 * st.prog), 1, st.mode === 'break' ? '#5b9bd5' : '#e2475e');
        P.r(0, 10, 24, 2, C.mintL).r(0, 12, 24, 13, C.mint).r(0, 18, 24, 1, C.mintD);
        P.r(10, 14, 4, 1, C.mintD).r(10, 21, 4, 1, C.mintD);
        if (st.mode === 'work' || st.mode === 'break') { // トマト
          P.ell(4, 15, 2, 2, '#e2475e').p(4, 12, '#3f8c55').p(5, 12, '#3f8c55');
        }
      },
    },
    window: {
      name: 'まど', wall: true, w: 42, h: 36, y: 62, act: 'window',
      key: st => [st.sky.k, st.season, st.weather, (st.weather === 'rain' || st.weather === 'snow' || st.weather === 'cloudy') ? st.frame % 4 : 0].join('|'),
      draw(P, st) {
        P.r(3, 0, 36, 33, C.white);
        drawOutside(P, 5, 2, 32, 29, st);
        P.r(20, 2, 2, 29, C.white).r(5, 15, 32, 2, C.white);
        P.r(0, 0, 7, 34, C.pink).r(2, 0, 1, 34, C.pinkD).r(5, 0, 1, 34, C.pinkL);
        P.r(35, 0, 7, 34, C.pink).r(37, 0, 1, 34, C.pinkL).r(39, 0, 1, 34, C.pinkD);
        P.r(0, 0, 42, 2, C.pinkD);
        P.r(1, 33, 40, 3, '#efe3d8').r(1, 33, 40, 1, C.white);
      },
    },
    poster: {
      name: 'ポスター', wall: true, w: 18, h: 24, y: 56,
      draw(P) {
        P.r(0, 0, 18, 24, '#fff6e8').r(1, 1, 16, 22, '#bfe3f5');
        P.ell(12, 6, 2, 2, '#ffd166');
        P.map(2, 9, ['......xx......', '.....xxxx.....', '....xxyxxx....', '...xxxxxxxx.x.', '..xxxxxxxxxxxx', '.xxxxxxxxxxxxx'], { x: '#7e8fd6', y: '#ffffff' });
        P.r(1, 15, 16, 8, '#8ecf8a').r(1, 15, 16, 1, '#b6e3a4');
        P.p(3, 0, '#e0485e').p(14, 0, '#e0485e');
      },
    },
    shelf: {
      name: '本だな', w: 30, h: 50,
      draw(P) {
        P.r(0, 0, 30, 50, C.wood).r(0, 0, 30, 2, C.woodL).r(2, 3, 26, 45, C.woodDD);
        const cols = ['#ff8fa8', '#7ec4e8', '#ffd166', '#8fd68a', '#b59ae8', '#ffb37a', '#fff1d6', '#6f8fd6'];
        [16, 32, 48].forEach((by, r) => {
          let x = 3, i = r * 3;
          while (x < 26) {
            const w = 2 + (i % 2), h = 8 + ((i * 5) % 5);
            if (x + w > 27) break;
            P.r(x, by - h, w, h, cols[i % cols.length]).r(x, by - h + 2, w, 1, 'rgba(255,255,255,.45)');
            x += w + (i % 4 === 3 ? 2 : 0); i++;
          }
          if (r < 2) P.r(2, by, 26, 2, C.wood);
        });
      },
    },
    plant: {
      name: '観葉植物', w: 16, h: 26,
      draw(P) {
        P.ell(4, 9, 3, 6, C.leafD).ell(11, 8, 3, 6, C.leafD);
        P.ell(8, 6, 3, 7, C.leaf).ell(3, 13, 3, 3, C.leaf).ell(13, 13, 3, 3, C.leaf);
        P.p(7, 3, C.leafL).p(7, 4, C.leafL).p(3, 12, C.leafL).p(12, 12, C.leafL);
        P.r(7, 12, 2, 6, C.leafD);
        P.r(2, 17, 12, 2, C.potL).r(3, 19, 10, 7, C.pot).r(4, 21, 8, 1, C.potL);
      },
    },
    lamp: {
      name: 'ランプ', toggle: true, w: 13, h: 44,
      key: st => st.on ? '1' : '0',
      draw(P, st) {
        P.r(2, 0, 9, 2, st.on ? '#fff3c4' : '#efe2c8').r(1, 2, 11, 3, st.on ? '#ffe99a' : '#e6d6b8').r(0, 5, 13, 4, st.on ? '#ffd970' : '#d9c6a3');
        P.r(0, 8, 13, 1, st.on ? '#f2b84f' : '#c4ae88');
        P.r(6, 9, 1, 32, C.metal).r(2, 41, 9, 3, C.metal).r(3, 41, 7, 1, C.metalL);
      },
    },
    rug: {
      name: 'ラグ', flat: true, w: 64, h: 9,
      draw(P) { P.ell(32, 4, 31, 4, C.pinkL).ell(32, 4, 25, 3, C.pink).ell(32, 4, 18, 2, C.pinkL).ell(32, 4, 10, 1, '#fff0f4'); },
    },
    cat: {
      name: 'ねこ', w: 16, h: 9, act: 'pet',
      key: st => st.blink ? '1' : '0',
      draw(P, st) {
        P.map(0, 0, ['.o.o............', '.ooo............', 'oeoeo...oooooo..', 'ooxoo.oooooooooo', '.ooooooooooooo.o', '..oooooooooooo.o', '..ooooooooooooo.', '...wwo....ow.ww.'],
          { o: '#f3b26b', e: st.blink ? '#f3b26b' : OUTLINE, x: '#ff8fa8', w: '#fff3e2' });
        P.r(9, 3, 5, 1, '#e39a52').r(10, 5, 4, 1, '#e39a52');
      },
    },
    bed: {
      name: 'ベッド', w: 52, h: 26, act: 'bed',
      key: st => st.sleep ? 'z' + st.hairColor : '-',
      draw(P, st) {
        P.r(1, 0, 4, 2, C.wood).r(0, 2, 6, 24, C.wood).r(1, 3, 4, 2, C.woodL);
        P.r(47, 9, 5, 17, C.wood).r(48, 10, 3, 2, C.woodL);
        P.r(5, 13, 43, 5, '#ffffff').r(5, 18, 43, 4, C.woodD).r(6, 22, 3, 4, C.woodDD).r(43, 22, 3, 4, C.woodDD);
        P.r(7, 8, 12, 6, '#ffffff').r(7, 12, 12, 2, '#e8e0ee');
        const by = st.sleep ? 8 : 11;
        P.r(17, by, 31, 19 - by, C.pink).r(17, by, 3, 19 - by, C.pinkL);
        for (let x = 23; x < 46; x += 6) P.p(x, by + 3, C.pinkL).p(x + 3, by + 6 > 17 ? 17 : by + 6, C.pinkL);
        if (st.sleep) {
          const hc = HAIR_COLORS[st.hairColor] || HAIR_COLORS.brown;
          P.map(6, 3, SLEEP_HEAD, { h: hc.h, H: hc.H, s: '#ffe6d6', e: '#3b2a5c', c: '#ffa3b5' });
          P.r(17, 7, 31, 1, C.pinkD);
        }
      },
    },
    sofa: {
      name: 'ソファ', w: 44, h: 22, act: 'sofa',
      draw(P) {
        P.r(4, 0, 36, 11, '#7fc8b0').r(4, 0, 36, 2, '#a8e0cc').r(21, 2, 1, 8, '#6ab39b');
        P.r(0, 6, 7, 12, '#6ab39b').r(0, 6, 7, 2, '#a8e0cc').r(37, 6, 7, 12, '#6ab39b').r(37, 6, 7, 2, '#a8e0cc');
        P.r(7, 10, 30, 5, '#a8e0cc').r(21, 10, 1, 5, '#7fc8b0');
        P.r(2, 15, 40, 4, '#5a9f88').r(4, 19, 2, 3, C.woodDD).r(38, 19, 2, 3, C.woodDD);
        P.r(9, 5, 7, 6, C.pinkL).r(10, 6, 5, 1, '#ffffff');
      },
    },
    tv: {
      name: 'テレビ', toggle: true, w: 32, h: 32,
      key: st => st.on ? 'on' + (st.frame % 4) : 'off',
      draw(P, st) {
        P.r(3, 1, 26, 18, '#4a4458').r(4, 2, 24, 16, '#5b5068');
        if (st.on) {
          const f = st.frame % 4;
          P.r(5, 3, 22, 14, '#9fd8f5').r(5, 13, 22, 4, '#8fd68a');
          P.ell(10 + f * 3, 11 - (f % 2) * 2, 2, 2, '#ff6f91');
          P.ell(22, 6, 2, 2, '#ffe07a');
          P.r(5, 3, 22, 1, 'rgba(255,255,255,.4)');
        } else {
          P.r(5, 3, 22, 14, '#2b2a3a').r(7, 5, 3, 1, '#4a4a64').r(7, 6, 1, 2, '#4a4a64');
        }
        P.r(14, 19, 4, 2, '#4a4458');
        P.r(0, 21, 32, 11, C.wood).r(0, 21, 32, 2, C.woodL).r(15, 23, 1, 9, C.woodD).r(6, 26, 4, 1, C.woodDD).r(22, 26, 4, 1, C.woodDD);
      },
    },
    radio: {
      name: 'ラジオ', tool: 'bgm', w: 22, h: 26,
      key: st => st.on ? 'on' : 'off',
      draw(P, st) {
        P.line(16, 0, 19, -2, C.metal);
        P.r(3, 1, 16, 10, '#ff9fb6').r(3, 1, 16, 1, '#ffc9d6');
        for (let y = 3; y < 10; y += 2) for (let x = 5; x < 12; x += 2) P.p(x, y, '#e57a96');
        P.r(13, 3, 4, 4, '#fff6e8').p(15, 4, st.on ? '#e2475e' : C.metal);
        P.r(13, 8, 4, 1, st.on ? '#8fd68a' : '#c9a0ad');
        P.r(0, 11, 22, 2, C.woodL).r(1, 13, 20, 1, C.wood);
        P.r(2, 14, 2, 12, C.woodD).r(18, 14, 2, 12, C.woodD).r(2, 20, 18, 2, C.wood);
      },
    },
    calendar: {
      name: 'カレンダー', tool: 'calendar', wall: true, w: 18, h: 22, y: 54,
      key: st => `${st.month}/${st.day}/${st.event ? 1 : 0}`,
      draw(P, st) {
        P.r(0, 0, 18, 22, '#ffffff').r(0, 0, 18, 6, '#ff6f91').p(4, -1, C.metal).p(13, -1, C.metal);
        const m = String(st.month), dd = String(st.day);
        P.text(Math.round(9 - textWidth(m) / 2), 1, m, '#ffffff');
        P.text(Math.round(9 - textWidth(dd, 2) / 2), 8, dd, OUTLINE, 2);
        if (st.event) P.r(14, 18, 2, 2, C.red);
        P.r(0, 21, 18, 1, '#e8e0ee');
      },
    },
    water: {
      name: 'ウォーターサーバー', tool: 'remind', w: 14, h: 36,
      draw(P) {
        P.r(3, 0, 8, 2, '#5b9bd5').r(2, 2, 10, 10, '#9fd8f5').r(3, 3, 2, 7, '#d4f0ff');
        P.r(1, 12, 12, 24, '#f4f7fb').r(1, 12, 12, 1, '#ffffff');
        P.r(3, 16, 3, 2, '#e2475e').r(8, 16, 3, 2, '#5b9bd5');
        P.r(3, 22, 8, 6, '#dfe7f2').r(4, 27, 6, 1, C.steelD);
        P.r(1, 34, 12, 2, C.steel);
      },
    },
    closet: {
      name: 'クローゼット', tool: 'dress', w: 32, h: 54,
      draw(P) {
        P.r(0, 2, 32, 52, '#fff0f4').r(0, 0, 32, 3, C.pinkD).r(1, 1, 30, 1, C.pink);
        P.r(2, 5, 13, 45, '#ffe3ea').r(17, 5, 13, 45, '#ffe3ea');
        P.r(4, 8, 9, 12, '#fff6f9').r(19, 8, 9, 12, '#fff6f9').r(4, 24, 9, 22, '#fff6f9').r(19, 24, 9, 22, '#fff6f9');
        P.r(13, 27, 1, 3, C.gold).r(18, 27, 1, 3, C.gold);
        P.r(1, 50, 30, 2, C.pinkD).r(2, 52, 3, 2, C.woodD).r(27, 52, 3, 2, C.woodD);
      },
    },
    trophy: {
      name: 'トロフィー棚', tool: 'stats', wall: true, w: 28, h: 19, y: 50,
      key: st => String(st.tier),
      draw(P, st) {
        P.r(0, 15, 28, 3, C.wood).r(0, 15, 28, 1, C.woodL).r(3, 18, 2, 1, C.woodD).r(23, 18, 2, 1, C.woodD);
        const cup = (x, col, colL, big) => {
          const h = big ? 1 : 0;
          P.r(x, 3 - h, 7, 5 + h, col).r(x + 1, 3 - h, 2, 3, colL).p(x - 1, 4, col).p(x + 7, 4, col).p(x - 1, 5, col).p(x + 7, 5, col);
          P.r(x + 3, 8, 1, 3, col).r(x + 1, 11, 5, 4, col).r(x + 2, 12, 3, 1, colL);
        };
        if (st.tier >= 1) cup(2, '#d08a4f', '#f0b07a');
        if (st.tier >= 3) cup(10, '#ffd166', '#fff0b0', true);
        if (st.tier >= 2) cup(19, '#c9d3df', '#ffffff');
        if (st.tier === 0) { P.r(11, 9, 6, 6, '#ffd166').p(13, 7, '#ffd166').p(14, 8, '#ffd166'); }
      },
    },
    door: {
      name: 'ドア', tool: 'door', w: 24, h: 54,
      key: st => st.to,
      draw(P, st) {
        P.r(0, 0, 24, 54, C.woodD).r(2, 2, 20, 52, C.wood);
        P.r(4, 18, 16, 14, C.woodL).r(4, 35, 16, 16, C.woodL);
        P.r(5, 5, 14, 10, '#ffffff').r(5, 5, 14, 1, '#f1d9e1');
        if (st.to === 'kitchen') { P.r(8, 9, 8, 4, '#e2475e').r(7, 8, 10, 1, '#e2475e').r(11, 7, 2, 1, OUTLINE); }
        else { P.map(8, 7, ['.xx.xx.', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'], { x: '#ff6f91' }); }
        P.r(17, 33, 2, 2, C.gold);
      },
    },
    fridge: {
      name: '冷蔵庫', w: 22, h: 46,
      draw(P) {
        P.r(0, 0, 22, 46, '#f4f7fb').r(0, 0, 22, 1, '#ffffff');
        P.r(0, 15, 22, 1, C.steel).r(18, 5, 2, 7, C.steelD).r(18, 19, 2, 12, C.steelD);
        P.map(4, 5, ['.x.x.', 'xxxxx', '.xxx.', '..x..'], { x: '#ff6f91' });
        P.r(5, 22, 6, 6, '#ffe58a').r(6, 24, 4, 1, 'rgba(0,0,0,.2)');
        P.r(0, 44, 22, 2, C.steel);
      },
    },
    counter: {
      name: 'キッチン台', w: 56, h: 30,
      draw(P) {
        P.r(12, 1, 2, 7, C.steelD).r(12, 1, 6, 2, C.steelD);
        P.r(34, 2, 9, 5, '#e2475e').r(33, 1, 11, 1, '#c9374e').r(37, 0, 3, 1, OUTLINE).r(35, 3, 2, 1, '#ff8f9f');
        P.r(0, 7, 56, 3, C.steel).r(4, 7, 16, 1, C.steelD).r(32, 7, 12, 1, '#4a4458').r(46, 7, 7, 1, '#4a4458');
        P.r(0, 10, 56, 20, '#fff6ea').r(0, 10, 56, 1, '#ffffff');
        P.r(2, 12, 24, 16, '#ffe9d1').r(28, 12, 26, 16, '#ffe9d1');
        P.r(23, 18, 2, 4, C.woodD).r(30, 18, 2, 4, C.woodD);
        P.r(34, 11, 2, 1, '#e2475e').r(40, 11, 2, 1, '#e2475e');
      },
    },
    table: {
      name: 'テーブル', w: 40, h: 24,
      draw(P) {
        P.r(17, 4, 5, 6, '#9fd8f5').r(18, 5, 1, 3, '#d4f0ff');
        P.p(17, 1, '#ff6f91').p(19, 0, '#ffd166').p(21, 1, '#ff6f91').r(19, 1, 1, 3, C.leafD).p(18, 2, C.leafD).p(20, 2, C.leafD);
        P.r(0, 10, 40, 3, C.woodL).r(0, 13, 40, 2, C.wood);
        P.r(3, 15, 3, 9, C.woodD).r(34, 15, 3, 9, C.woodD);
        P.r(5, 9, 6, 1, '#ffffff').r(28, 9, 6, 1, '#ffffff');
      },
    },
    fishbowl: {
      name: '金魚鉢', w: 18, h: 30,
      key: st => String(st.frame % 8),
      draw(P, st) {
        const f = st.frame % 8, fx = f < 4 ? 4 + f * 2 : 18 - (f - 4) * 2 - 6;
        P.ell(9, 8, 8, 7, '#bfe9fa').r(3, 1, 12, 1, '#e8f8ff').ell(9, 10, 7, 5, '#8fd3f0');
        P.r(fx, 9, 4, 2, '#ff7a45').p(f < 4 ? fx - 1 : fx + 4, 9, '#ffb07a').p(f < 4 ? fx - 1 : fx + 4, 10, '#ffb07a').p(f < 4 ? fx + 3 : fx, 9, OUTLINE);
        P.p(12, 5 - (f % 3), '#ffffff').p(6, 13, C.leafD).p(6, 12, C.leaf);
        P.r(2, 16, 14, 2, C.woodL).r(3, 18, 2, 12, C.woodD).r(13, 18, 2, 12, C.woodD).r(3, 24, 12, 2, C.wood);
      },
    },
  };

  /* ---------- 壁紙と床 ---------- */
  const WALLS = {
    pink: { name: 'ピンクのしましま', tw: 60, draw(P) {
      P.r(0, 0, 60, BACK, '#fbe4ea');
      for (let x = 0; x < 60; x += 12) P.r(x, 4, 6, 52, '#f6d6df');
      P.r(0, 0, 60, 4, '#eec3cf').r(0, 56, 60, 2, '#a7d8c2').r(0, 58, 60, BACK - 62, '#c9ead9');
      for (let x = 4; x < 60; x += 20) P.r(x, 61, 12, BACK - 68, '#dff4ea');
      P.r(0, BACK - 4, 60, 4, '#9a6a7a');
    } },
    mint: { name: 'ミントの水玉', tw: 20, draw(P) {
      P.r(0, 0, 20, BACK, '#e3f6ee');
      for (let y = 8; y < 52; y += 10) P.r(((y / 10) % 2 ? 4 : 14), y, 2, 2, '#bfe7d6');
      P.r(0, 0, 20, 4, '#c6eedf').r(0, 56, 20, 2, '#f3b6c6').r(0, 58, 20, BACK - 62, '#fbe4ea').r(4, 61, 12, BACK - 68, '#fff0f4');
      P.r(0, BACK - 4, 20, 4, '#6f9d8c');
    } },
    flower: { name: 'クリームの花がら', tw: 32, draw(P) {
      P.r(0, 0, 32, BACK, '#fff4e0');
      [[6, 12], [22, 28], [6, 44], [22, 8]].forEach(([x, y]) => { if (y < 54) P.p(x, y - 1, '#ffb3c6').p(x - 1, y, '#ffb3c6').p(x + 1, y, '#ffb3c6').p(x, y + 1, '#ffb3c6').p(x, y, '#ffd166'); });
      P.r(0, 0, 32, 4, '#f3dcc0').r(0, 56, 32, 2, '#c99560').r(0, 58, 32, BACK - 62, '#e8c9a0');
      for (let x = 0; x < 32; x += 8) P.r(x, 58, 1, BACK - 62, '#d9b386');
      P.r(0, BACK - 4, 32, 4, '#8e5638');
    } },
    wood: { name: '木の壁', tw: 16, draw(P) {
      P.r(0, 0, 16, BACK, '#d8a878').r(7, 0, 1, BACK, '#b98656').r(15, 0, 1, BACK, '#c4925f');
      P.p(3, 20, '#c4925f').p(11, 44, '#c4925f').r(0, 56, 16, 2, '#8e5638').r(0, 58, 16, BACK - 62, '#c4925f');
      P.r(0, BACK - 4, 16, 4, '#6d3f2a');
    } },
    wa: { name: '和室', tw: 24, draw(P) {
      P.r(0, 0, 24, BACK, '#efe2c6');
      [[3, 14], [15, 30], [9, 44], [20, 9]].forEach(([x, y]) => P.p(x, y, '#e2d1ad'));
      P.r(0, 8, 24, 3, '#8a5a3c').r(0, 56, 24, 2, '#8a5a3c');
      P.r(0, 58, 24, BACK - 62, '#fff8ec');
      for (let x = 0; x < 24; x += 6) P.r(x, 58, 1, BACK - 62, '#c99560');
      P.r(0, 66, 24, 1, '#c99560').r(0, 74, 24, 1, '#c99560');
      P.r(0, BACK - 4, 24, 4, '#5b3a26');
    } },
    stars: { name: '星空', tw: 48, draw(P) {
      P.r(0, 0, 48, BACK, '#2a2f5c');
      [[5, 10], [18, 22], [33, 8], [41, 30], [12, 40], [27, 46], [44, 50], [8, 28]].forEach(([x, y]) => P.p(x, y, '#fff3c4'));
      P.p(30, 33, '#ffd166').p(29, 33, '#ffd166').p(31, 33, '#ffd166').p(30, 32, '#ffd166').p(30, 34, '#ffd166');
      P.r(0, 0, 48, 4, '#1d1f40').r(0, 56, 48, 2, '#ffd166').r(0, 58, 48, BACK - 62, '#3b4470');
      P.r(0, BACK - 4, 48, 4, '#1d1f40');
    } },
  };
  const FLOORS = {
    wood: { name: '木の床', kind: 'boards', bw: 16, a: '#d59a6a', b: '#c98d5e', seam: '#a96f45' },
    dark: { name: 'こげ茶の床', kind: 'boards', bw: 16, a: '#8e5638', b: '#7d4a30', seam: '#5e3522' },
    tile: { name: 'タイル', kind: 'checker', bw: 16, a: '#f6f1ea', b: '#d9e6ee', seam: '#b9c8d4' },
    tatami: { name: 'たたみ', kind: 'boards', bw: 32, a: '#cfd49a', b: '#c3c98c', seam: '#6d7a3a' },
    carpet: { name: 'ピンクのじゅうたん', kind: 'plain', bw: 16, a: '#f3b6c6', b: '#f9cdd8', seam: '#e59aae' },
  };
  const wallCache = new Map();
  function wallTile(key) {
    let c = wallCache.get(key);
    if (!c) {
      const w = WALLS[key] || WALLS.pink;
      c = canvas(w.tw, BACK);
      w.draw(painter(c.getContext('2d')));
      wallCache.set(key, c);
    }
    return c;
  }

  /* ---------- キャッシュ付きでスプライトを返す ---------- */
  const cache = new Map();
  function thingSprite(type, st = {}) {
    const t = TYPES[type];
    const key = type + '|' + (t.key ? t.key(st) : '');
    let c = cache.get(key);
    if (!c) {
      c = sprite(t.w, t.h, P => t.draw(P, st));
      if (cache.size > 400) cache.clear();
      cache.set(key, c);
    }
    return c;
  }
  // ハート・Z・音符などの小さな絵
  const PARTICLES = {
    heart: sprite(5, 4, P => P.map(0, 0, ['xx.xx', 'xxxxx', '.xxx.', '..x..'], { x: '#ff6f91' }), null),
    z: sprite(3, 5, P => P.text(0, 0, 'Z', '#ffffff'), OUTLINE),
    note: sprite(4, 6, P => P.map(0, 0, ['.xxx', '.x.x', '.x..', '.x..', 'xx..', 'xx..'], { x: '#ffffff' }), OUTLINE),
    spark: sprite(5, 5, P => P.map(0, 0, ['..x..', '..x..', 'xxyxx', '..x..', '..x..'], { x: '#ffd166', y: '#ffffff' }), null),
    drop: sprite(3, 4, P => P.map(0, 0, ['.x.', 'xxx', 'xyx', '.x.'], { x: '#5bb4f0', y: '#d4f0ff' }), OUTLINE),
  };

  window.HeyaArt = {
    OUTLINE, drawOutside, shade, FONT,
    TYPES, WALLS, FLOORS, HAIR_COLORS, OUTFITS, HAIR_STYLES, PARTICLES, C, BACK,
    GIRL_W, GIRL_H, girlSprite, thingSprite, wallTile, painter, sprite, canvas, textWidth,
  };
})();
