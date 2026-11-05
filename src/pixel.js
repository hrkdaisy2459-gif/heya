/* へや — ドット絵の素材
   すべて小さなキャンバスに 1px 単位で描き、外側に自動でふち取りを付ける。
   部屋全体は高さ 130px の低解像度で描いて、画面に合わせて拡大表示する。 */
(() => {
  'use strict';

  const OUTLINE = '#6a5d50';       // 家具のふち（やわらかい茶色がかったグレー）
  const GIRL_OUTLINE = '#3a2433';  // 女の子のふち（いままでどおり）
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
      c = sprite(GIRL_W, rows.length, P => P.map(0, 0, rows, pal), GIRL_OUTLINE);
    }
    if (girlCache.size > 200) girlCache.clear();
    girlCache.set(key, c);
    return c;
  }
  // ベッドで寝ている顔
  // お店のマネキン（服を着せて飾る）
  function mannequinSprite(outfit) {
    const key = 'mq|' + outfit;
    if (girlCache.has(key)) return girlCache.get(key);
    const head = ['.........nnnn.........', '........nnnnnn........', '........nnnnnn........', '........nnnnnn........', '.........nnnn.........', '..........nn..........'];
    const body = applyOutfit(BODY, (OUTFITS[outfit] || {}).style, false).map(r => r.replace(/[hHk]/g, '.').replace(/s/g, 'n'));
    const legs = LEGS.stand.map(r => r.replace(/[slb]/g, 'n'));
    const rows = [...head, ...body, ...legs, '..........pp..........', '.......pppppppp.......'];
    const pal = { ...girlPal({ hair: 'long', hairColor: 'brown', outfit }), n: '#f0dcc8', p: '#5b5068' };
    const c = sprite(GIRL_W, rows.length, P => P.map(0, 0, rows, pal));
    girlCache.set(key, c);
    return c;
  }
  // お店のウィッグ（髪型を見せる）
  function wigSprite(style, color = 'brown') {
    const key = 'wig|' + style + color;
    if (girlCache.has(key)) return girlCache.get(key);
    let rows = applyHair([...HEAD, ...EYES_SHUT, ...FACE_LOW, ...BODY.slice(0, 3)], style, false);
    rows = rows.map(r => r.replace(/[sSceEWmk]/g, 'n').replace(/[dDw]/g, '.').replace(/r/g, style === 'long' ? '.' : 'r'));
    rows = rows.map((r, i) => (i >= 18 ? r.replace(/n/g, '.') : r));
    rows.push('.........pppp.........', '.......pppppppp.......');
    rows[18] = set(set(rows[18], 10, 'p'), 11, 'p'); rows[19] = set(set(rows[19], 10, 'p'), 11, 'p'); rows[20] = set(set(rows[20], 10, 'p'), 11, 'p');
    const pal = { ...girlPal({ hair: style, hairColor: color, outfit: 'mizuiro' }), n: '#f0dcc8', p: '#5b5068' };
    const c = sprite(GIRL_W, rows.length, P => P.map(0, 0, rows, pal));
    girlCache.set(key, c);
    return c;
  }
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
  // ナチュラルミニマル（標準の家具）の色
  const N = {
    oak: '#d4b28a', oakL: '#e6cba7', oakD: '#b89068', oakDD: '#9a7552', black: '#2f2c28', grey: '#9a9590',
    linen: '#e4ddd0', linenD: '#cfc6b6', linenL: '#f1ece3', white: '#fbfaf7', paper: '#f4f1ea',
    sage: '#9aab8c', sageD: '#7d9070', sageL: '#cfd8c4', leaf: '#6f8f6a', leafD: '#4f6e4d', leafL: '#9fb98e',
    ceramic: '#f4f1ea', ceramicD: '#dcd6cb', clay: '#c9a07a',
  };
  const NOTE_COLS = ['#ffffff', '#f4efe4', '#ffffff', '#eef0e8', '#f4efe4', '#ffffff'];
  const TYPES = {
    clock: {
      // 数字のないシンプルな時計。本物の時刻どおりに針が動く
      name: '時計', tool: 'alarm', wall: true, w: 19, h: 19, y: 34,
      key: st => `${st.h % 12}:${st.m}:${st.s}:${st.alarm ? 1 : 0}`,
      draw(P, st) {
        const c = 9, TAU = Math.PI * 2;
        P.ell(c, c, 9, 9, N.black).ell(c, c, 8, 8, N.white);
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; P.p(Math.round(c + Math.sin(a) * 7), Math.round(c - Math.cos(a) * 7), i % 3 ? '#d6d2cb' : N.grey); }
        const ha = ((st.h % 12) + st.m / 60) / 12 * TAU, ma = (st.m + (st.s || 0) / 60) / 60 * TAU, sa = (st.s || 0) / 60 * TAU;
        P.line(c, c, c + Math.sin(ha) * 4, c - Math.cos(ha) * 4, N.black);
        P.line(c, c, c + Math.sin(ma) * 6.4, c - Math.cos(ma) * 6.4, N.black);
        P.line(c, c, c + Math.sin(sa) * 6.8, c - Math.cos(sa) * 6.8, N.sageD);
        P.p(c, c, N.sageD);
        if (st.alarm) P.r(16, -1, 3, 3, N.sageD);
      },
    },
    board: {
      name: 'ピンボード', tool: 'todo', wall: true, w: 30, h: 22, y: 58,
      key: st => String(Math.min(st.todos, 6)),
      draw(P, st) {
        P.r(0, 0, 30, 22, N.oakL).r(2, 2, 26, 18, N.linenL).r(0, 0, 30, 1, '#f0dcc0');
        const pos = [[3, 4], [11, 3], [20, 4], [4, 12], [12, 12], [20, 11]];
        for (let i = 0; i < Math.min(st.todos, 6); i++) {
          const [x, y] = pos[i];
          P.r(x, y, 7, 6, NOTE_COLS[i]).r(x + 1, y + 2, 5, 1, '#c9c2b4').r(x + 1, y + 4, 3, 1, '#c9c2b4').p(x + 3, y, i % 2 ? N.sageD : N.black);
        }
      },
    },
    desk: {
      name: 'つくえ', tool: 'memo', w: 50, h: 26, act: 'desk',
      key: st => st.memo ? '1' : '0',
      draw(P, st) {
        P.r(8, 2, 14, 9, '#c9c9cc').r(9, 3, 12, 7, '#2a2d33').r(10, 4, 6, 1, '#4a5a6a').r(6, 11, 18, 1, '#b9b9bd');
        if (st.memo) P.r(25, 9, 6, 2, N.white).r(26, 9, 4, 1, '#c9c2b4');
        P.line(38, 11, 35, 5, N.black).line(35, 5, 39, 1, N.black).r(38, 0, 5, 3, N.black).r(37, 11, 3, 1, N.black);
        P.r(31, 7, 4, 5, N.sageL).r(35, 8, 1, 2, N.sageL);
        P.r(43, 6, 3, 6, N.white).p(44, 4, N.leaf).p(45, 3, N.leaf);
        P.r(0, 12, 50, 3, N.oakL).r(0, 14, 50, 1, N.oakD);
        P.line(4, 15, 2, 25, N.black).line(6, 15, 8, 25, N.black).line(44, 15, 42, 25, N.black).line(46, 15, 48, 25, N.black);
      },
    },
    timer: {
      // 使っていないときは今の時刻、使っているときは残り時間と進み具合
      name: 'タイマー', tool: 'timer', w: 28, h: 24,
      key: st => `${st.lcd}:${st.blinkOff ? 1 : 0}:${st.colonOff ? 1 : 0}:${st.mode}:${Math.round((st.prog || 0) * 18)}`,
      draw(P, st) {
        const ink = st.mode === 'work' ? '#b0644a' : st.mode === 'break' ? N.sageD : N.black;
        P.r(4, 3, 20, 9, N.white).r(5, 4, 18, 7, '#f1efe9');
        if (!st.blinkOff) {
          const w = textWidth(st.lcd), x = Math.round(14 - w / 2);
          P.text(x, 5, st.lcd, ink);
          if (st.colonOff) P.r(x + textWidth(st.lcd.slice(0, 2)) + 1, 5, 1, 5, '#f1efe9');
        }
        if (st.prog != null) P.r(5, 10, Math.round(18 * st.prog), 1, ink);
        P.r(0, 12, 28, 2, N.oakL).r(1, 14, 26, 8, N.oak).r(14, 14, 1, 8, N.oakD).r(6, 17, 3, 1, N.oakD).r(19, 17, 3, 1, N.oakD);
        P.r(2, 22, 2, 2, N.black).r(24, 22, 2, 2, N.black);
      },
    },
    window: {
      name: 'まど', wall: true, w: 44, h: 40, y: 64, act: 'window',
      key: st => [st.sky.k, st.season, st.weather, (st.weather === 'rain' || st.weather === 'snow' || st.weather === 'cloudy') ? st.frame % 4 : 0].join('|'),
      draw(P, st) {
        P.r(4, 0, 36, 36, '#ffffff');
        drawOutside(P, 6, 2, 32, 32, st);
        P.r(21, 2, 2, 32, '#ffffff');
        P.r(0, 0, 7, 38, '#f7f4ee').r(2, 0, 1, 38, '#e6e0d5').r(5, 0, 1, 38, '#e6e0d5');
        P.r(37, 0, 7, 38, '#f7f4ee').r(39, 0, 1, 38, '#e6e0d5').r(41, 0, 1, 38, '#e6e0d5');
        P.r(0, 0, 44, 1, N.black);
        P.r(2, 36, 40, 3, N.oakL).r(2, 38, 40, 1, N.oakD);
      },
    },
    poster: {
      name: 'アートフレーム', wall: true, w: 26, h: 30, y: 54,
      draw(P) {
        P.r(0, 0, 26, 30, N.black).r(2, 2, 22, 26, N.white);
        P.ell(13, 17, 6, 7, N.sageL).r(7, 17, 13, 9, N.sageL).ell(13, 17, 4, 5, N.white).r(9, 17, 9, 9, N.white);
        P.ell(16, 8, 2, 2, '#d9b48a').r(4, 25, 18, 1, N.black);
      },
    },
    slat: {
      name: '木のスラット壁', wall: true, w: 72, h: 80, y: 82,
      draw(P) {
        for (let x = 0; x < 72; x += 4) P.r(x, 0, 3, 80, x % 8 ? N.oakL : '#e9d0ae').r(x + 3, 0, 1, 80, N.oakD);
        P.r(0, 0, 72, 1, N.oakD);
      },
    },
    shelf: {
      name: '本だな', w: 30, h: 50,
      draw(P) {
        P.r(0, 0, 2, 50, N.oak).r(28, 0, 2, 50, N.oak);
        [0, 16, 32, 48].forEach(y => P.r(0, y, 30, 2, N.oakL));
        const books = ['#b9b0a2', '#8f9a86', '#d9cdb8', '#6f6a64', '#c9a07a'];
        [[3, 16, 3, 10], [6, 16, 2, 11], [8, 16, 3, 9], [11, 16, 2, 10], [3, 48, 2, 9], [5, 48, 3, 11], [8, 48, 2, 10]].forEach(([x, by, w, h], i) => P.r(x, by - h, w, h, books[i % books.length]));
        P.r(20, 9, 5, 7, N.ceramic).r(21, 6, 3, 3, N.ceramic).p(22, 4, N.leaf).p(23, 3, N.leaf).p(21, 3, N.leafD);
        P.r(4, 27, 9, 5, N.clay).r(4, 27, 9, 1, '#d9b48a');
        P.ell(21, 29, 3, 3, N.leaf).r(19, 29, 5, 3, N.ceramic);
        P.r(18, 40, 8, 8, N.linenD).r(18, 40, 8, 1, N.linen);
      },
    },
    plant: {
      name: '観葉植物', w: 20, h: 50,
      draw(P) {
        P.r(9, 14, 1, 24, N.leafD);
        [[5, 8], [14, 6], [4, 20], [15, 18], [9, 3], [7, 28], [13, 27]].forEach(([x, y]) => P.ell(x, y, 4, 4, (x + y) % 2 ? N.leaf : N.leafD));
        P.p(9, 2, N.leafL).p(4, 19, N.leafL).p(14, 5, N.leafL);
        P.r(3, 37, 14, 13, N.ceramic).r(3, 37, 14, 2, N.ceramicD).r(4, 47, 12, 2, N.ceramicD);
      },
    },
    lamp: {
      name: 'フロアランプ', toggle: true, w: 16, h: 52,
      key: st => st.on ? '1' : '0',
      draw(P, st) {
        P.r(2, 0, 12, 10, st.on ? '#fff6e0' : '#f4efe4').r(2, 9, 12, 1, st.on ? '#f0dcb0' : '#e2d9c6');
        P.line(8, 10, 3, 51, N.oakD).line(8, 10, 13, 51, N.oakD).line(8, 10, 8, 51, N.oakD);
      },
    },
    rug: {
      name: 'ラグ', flat: true, w: 74, h: 9,
      draw(P) { for (let y = 0; y < 9; y++) { const o = 8 - y; P.r(o, y, 64, 1, '#ebe6dc'); if (y === 2 || y === 6) P.r(o + 2, y, 60, 1, '#cfc7b8'); } },
    },
    cat: {
      name: 'ねこ', w: 16, h: 9, act: 'pet',
      key: st => st.blink ? '1' : '0',
      draw(P, st) {
        P.map(0, 0, ['.o.o............', '.ooo............', 'oeoeo...oooooo..', 'ooxoo.oooooooooo', '.ooooooooooooo.o', '..oooooooooooo.o', '..ooooooooooooo.', '...wwo....ow.ww.'],
          { o: '#e8c49a', e: st.blink ? '#e8c49a' : N.black, x: '#d9a08a', w: '#fbf6ee' });
        P.r(9, 3, 5, 1, '#d4a878').r(10, 5, 4, 1, '#d4a878');
      },
    },
    bed: {
      name: 'ベッド', w: 54, h: 24, act: 'bed',
      key: st => st.sleep ? 'z' + st.hairColor : '-',
      draw(P, st) {
        P.r(0, 2, 5, 22, N.oak).r(0, 2, 5, 1, N.oakL);
        P.r(4, 12, 48, 5, N.white).r(4, 17, 48, 3, N.oakL).r(4, 19, 48, 1, N.oakD).r(6, 20, 2, 4, N.black).r(48, 20, 2, 4, N.black);
        P.r(6, 7, 12, 6, N.white).r(6, 11, 12, 2, N.linenD).r(9, 8, 10, 5, N.linenL);
        const by = st.sleep ? 8 : 11;
        P.r(16, by, 36, 17 - by, N.linen).r(16, by, 36, 1, N.linenL).r(38, by, 14, 17 - by, N.sageL).r(38, by, 1, 17 - by, N.sage);
        if (st.sleep) {
          const hc = HAIR_COLORS[st.hairColor] || HAIR_COLORS.brown;
          P.map(5, 2, SLEEP_HEAD, { h: hc.h, H: hc.H, s: '#ffe6d6', e: '#3b2a5c', c: '#ffa3b5' });
          P.r(16, 7, 36, 1, N.linenD);
        }
      },
    },
    sofa: {
      name: 'ソファ', w: 52, h: 22, act: 'sofa',
      draw(P) {
        P.r(2, 3, 48, 9, N.linen).r(2, 3, 48, 1, N.linenL).r(0, 7, 4, 10, N.linenD).r(48, 7, 4, 10, N.linenD);
        P.r(4, 11, 44, 5, N.linenL).r(26, 11, 1, 5, N.linenD).r(2, 16, 48, 3, N.linenD).r(5, 19, 2, 3, N.oakD).r(45, 19, 2, 3, N.oakD);
        P.r(8, 6, 8, 6, N.sageL).r(9, 7, 6, 1, '#ffffff').r(36, 7, 7, 5, N.oakL);
      },
    },
    tv: {
      name: 'テレビ', toggle: true, w: 40, h: 30,
      key: st => st.on ? 'on' + (st.frame % 4) : 'off',
      draw(P, st) {
        P.r(4, 0, 32, 18, N.black);
        if (st.on) {
          const f = st.frame % 4;
          P.r(5, 1, 30, 16, '#bcd9e8').r(5, 11, 30, 6, '#a9c3a0').ell(12 + f * 4, 10, 2, 2, '#e8c9a0').r(5, 1, 30, 1, 'rgba(255,255,255,.4)');
        } else P.r(5, 1, 30, 16, '#3a3d42').r(7, 3, 4, 1, '#4c5056');
        P.r(18, 18, 4, 2, N.black);
        P.r(0, 20, 40, 2, N.oakL).r(1, 22, 38, 6, N.oak).r(20, 22, 1, 6, N.oakD).r(3, 28, 2, 2, N.black).r(35, 28, 2, 2, N.black);
      },
    },
    radio: {
      name: 'ラジオ', tool: 'bgm', w: 20, h: 26,
      key: st => st.on ? 'on' : 'off',
      draw(P, st) {
        P.r(2, 3, 16, 10, N.oak).r(2, 3, 16, 1, N.oakL).r(4, 5, 8, 6, N.linenD);
        for (let y = 6; y < 11; y += 2) P.r(4, y, 8, 1, N.linen);
        P.ell(15, 7, 1, 1, N.black).r(14, 10, 3, 1, st.on ? N.sageD : N.grey);
        P.r(1, 13, 18, 2, N.black).line(3, 15, 2, 25, N.black).line(17, 15, 18, 25, N.black).line(10, 15, 10, 25, N.black);
      },
    },
    calendar: {
      name: 'カレンダー', tool: 'calendar', wall: true, w: 16, h: 20, y: 56,
      key: st => `${st.month}/${st.day}/${st.event ? 1 : 0}`,
      draw(P, st) {
        P.r(0, 0, 16, 20, N.white).r(0, 0, 16, 4, N.black).p(4, -1, N.black).p(11, -1, N.black);
        const m = String(st.month), dd = String(st.day);
        P.text(Math.round(8 - textWidth(m) / 2), 5, m, N.grey);
        P.text(Math.round(8 - textWidth(dd, 2) / 2), 10, dd, N.black, 2);
        if (st.event) P.r(13, 17, 2, 2, N.sageD);
      },
    },
    water: {
      name: '水差し', tool: 'remind', w: 14, h: 30,
      draw(P) {
        P.r(3, 0, 6, 2, '#d8e8ee').r(2, 2, 8, 9, '#d8e8ee').r(3, 5, 6, 6, '#bcd9e8').r(3, 3, 1, 6, '#ffffff').r(10, 3, 2, 4, '#d8e8ee');
        P.r(10, 7, 3, 4, '#e9f3f6');
        P.r(0, 11, 14, 2, N.oakL).r(1, 13, 12, 1, N.oakD).line(2, 14, 1, 29, N.oak).line(11, 14, 12, 29, N.oak).r(2, 22, 10, 1, N.oak);
      },
    },
    closet: {
      name: 'クローゼット', tool: 'dress', w: 32, h: 54,
      draw(P) {
        P.r(0, 0, 32, 50, N.oak).r(0, 0, 32, 2, N.oakL);
        P.r(2, 3, 13, 45, N.oakL).r(17, 3, 13, 45, N.oakL).r(15, 3, 2, 45, N.oakD);
        P.r(12, 22, 1, 8, N.black).r(19, 22, 1, 8, N.black);
        P.r(2, 50, 2, 4, N.black).r(28, 50, 2, 4, N.black);
      },
    },
    trophy: {
      name: 'かざり棚', tool: 'stats', wall: true, w: 30, h: 19, y: 50,
      key: st => String(st.tier),
      draw(P, st) {
        P.r(0, 16, 30, 3, N.oakL).r(0, 18, 30, 1, N.oakD);
        P.r(3, 9, 5, 7, N.ceramic).r(4, 6, 3, 3, N.ceramic).p(5, 4, N.leaf).p(6, 3, N.leaf);
        if (st.tier >= 1) P.r(10, 8, 7, 8, N.sageL).r(10, 8, 7, 1, N.sage).r(11, 11, 5, 1, N.white);
        if (st.tier >= 2) P.r(19, 10, 3, 6, '#b9a27a').r(18, 9, 5, 1, '#b9a27a');
        if (st.tier >= 3) { P.r(24, 3, 5, 5, '#c9a95a').r(25, 8, 3, 3, '#c9a95a').r(23, 14, 7, 2, '#c9a95a').p(25, 4, '#f0dca0'); }
      },
    },
    door: {
      name: 'ドア', tool: 'door', deco: true, w: 24, h: 54,
      key: st => st.to,
      draw(P, st) {
        P.r(0, 0, 24, 54, N.oak).r(2, 2, 20, 52, N.white).r(2, 2, 20, 1, '#ece8e0');
        P.r(17, 30, 3, 1, N.black).r(17, 31, 1, 2, N.black);
        P.r(7, 10, 10, 7, N.black);
        if (st.to === 'kitchen') P.r(9, 12, 5, 4, N.white).r(14, 13, 1, 2, N.white);
        else P.map(9, 11, ['..x..', '.xxx.', 'xxxxx', '.x.x.'], { x: N.white });
      },
    },
    fridge: {
      name: '冷蔵庫', w: 22, h: 46,
      draw(P) {
        P.r(0, 0, 22, 46, '#f4f3f0').r(0, 0, 22, 1, '#ffffff');
        P.r(0, 15, 22, 1, '#d9d6cf').r(18, 5, 1, 7, N.black).r(18, 19, 1, 12, N.black);
        P.r(5, 22, 6, 7, N.white).r(6, 24, 4, 1, '#c9c2b4').p(8, 22, N.sageD);
        P.r(0, 44, 22, 2, '#d9d6cf');
      },
    },
    counter: {
      name: 'キッチン台', w: 56, h: 30,
      draw(P) {
        P.r(12, 1, 1, 7, N.black).r(12, 1, 5, 1, N.black);
        P.r(34, 2, 9, 5, N.white).r(33, 1, 11, 1, '#d9d6cf').r(37, 0, 3, 1, N.black).r(43, 3, 2, 1, N.black);
        P.r(0, 7, 56, 3, N.oakL).r(0, 9, 56, 1, N.oakD).r(4, 7, 16, 1, '#c9c5be').r(32, 7, 12, 1, N.black).r(46, 7, 7, 1, N.black);
        P.r(0, 10, 56, 20, N.white).r(1, 11, 26, 18, '#f4f1ea').r(29, 11, 26, 18, '#f4f1ea');
        P.r(24, 18, 1, 4, N.black).r(31, 18, 1, 4, N.black);
      },
    },
    table: {
      name: 'テーブル', w: 40, h: 24,
      draw(P) {
        P.r(17, 4, 5, 6, N.ceramic).r(18, 5, 1, 3, '#ffffff').line(19, 4, 16, 0, N.oakD).line(19, 4, 22, 1, N.oakD).p(16, 0, N.leaf).p(22, 1, N.leaf).p(18, 1, N.leaf);
        P.r(0, 10, 40, 2, N.oakL).r(0, 12, 40, 1, N.oakD);
        P.line(4, 13, 3, 23, N.oak).line(36, 13, 37, 23, N.oak);
        P.r(6, 9, 6, 1, N.white).r(28, 9, 6, 1, N.white);
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
    natural: { name: 'ナチュラルホワイト', tw: 12, draw(P) {
      P.r(0, 0, 12, BACK, '#f2eee7');
      for (let y = 3; y < BACK - 6; y += 6) P.p((y / 6) % 2 ? 3 : 9, y, '#ebe5db');
      P.r(0, BACK - 3, 12, 3, '#d8c3a5').r(0, BACK - 3, 12, 1, '#e6d4b8');
    } },
    mint: { name: 'ミントの水玉', tw: 20, draw(P) {
      P.r(0, 0, 20, BACK, '#e3f6ee');
      for (let y = 8; y < 52; y += 10) P.r(((y / 10) % 2 ? 4 : 14), y, 2, 2, '#bfe7d6');
      P.r(0, 0, 20, 4, '#c6eedf').r(0, 56, 20, 2, '#d8c3a5').r(0, 58, 20, BACK - 62, '#f6f3ee').r(4, 61, 12, BACK - 68, '#fbfaf7');
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
    oak: { name: 'オークの床', kind: 'planks', bw: 11, a: '#dcc3a0', b: '#d3b893', seam: '#c2a47d' },
    wood: { name: '木の床', kind: 'boards', bw: 16, a: '#d59a6a', b: '#c98d5e', seam: '#a96f45' },
    dark: { name: 'こげ茶の床', kind: 'boards', bw: 16, a: '#8e5638', b: '#7d4a30', seam: '#5e3522' },
    tile: { name: 'タイル', kind: 'checker', bw: 16, a: '#f6f1ea', b: '#d9e6ee', seam: '#b9c8d4' },
    tatami: { name: 'たたみ', kind: 'boards', bw: 32, a: '#cfd49a', b: '#c3c98c', seam: '#6d7a3a' },
  };
  const wallCache = new Map();
  function wallTile(key) {
    let c = wallCache.get(key);
    if (!c) {
      const w = WALLS[key] || WALLS.natural;
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
    if (!c && t.custom) return t.custom(st);
    if (!c) {
      c = sprite(t.w, t.h, (P, g) => t.draw(P, st, g));
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
    OUTLINE, drawOutside, shade, FONT, mannequinSprite, wigSprite,
    TYPES, WALLS, FLOORS, HAIR_COLORS, OUTFITS, HAIR_STYLES, PARTICLES, C, BACK,
    GIRL_W, GIRL_H, girlSprite, thingSprite, wallTile, painter, sprite, canvas, textWidth,
  };
})();
