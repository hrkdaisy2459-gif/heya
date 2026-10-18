/* へや — ドット絵の素材
   すべて小さなキャンバスに 1px 単位で描き、外側に自動でふち取りを付ける。
   部屋全体は高さ 130px の低解像度で描いて、画面に合わせて拡大表示する。 */
(() => {
  'use strict';

  const OUTLINE = '#3a2433';

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
      text(x, y, str, col) {
        let cx = x;
        for (const ch of str) {
          const gl = FONT[ch];
          if (!gl) { cx += 2; continue; }
          gl.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') P.p(cx + i, y + j, col); });
          cx += gl[0].length + 1;
        }
        return P;
      },
    };
    return P;
  }
  const textWidth = str => [...str].reduce((a, ch) => a + (FONT[ch] ? FONT[ch][0].length + 1 : 2), 0) - 1;

  // 透明なところのうち、色のある点に接するところをふち取り色にする
  function addOutline(c, col) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const im = g.getImageData(0, 0, w, h), d = im.data;
    const solid = i => d[i * 4 + 3] > 0;
    const out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid(i)) continue;
      if ((x > 0 && solid(i - 1)) || (x < w - 1 && solid(i + 1)) || (y > 0 && solid(i - w)) || (y < h - 1 && solid(i + w))) out.push(i);
    }
    g.fillStyle = col;
    for (const i of out) g.fillRect(i % w, (i / w) | 0, 1, 1);
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

  /* ---------- 3x5 の数字フォント ---------- */
  const FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    ':': ['0', '1', '0', '1', '0'], '-': ['000', '000', '111', '000', '000'],
    'h': ['100', '100', '111', '101', '101'],
  };

  /* ---------- 色 ---------- */
  const C = {
    wood: '#b9774e', woodL: '#d39566', woodD: '#8e5638', woodDD: '#6d3f2a',
    white: '#fffaf3', cream: '#fff1d6', pink: '#ff9fb6', pinkL: '#ffc9d6', pinkD: '#e57a96',
    mint: '#9fdcc8', mintL: '#c6eedf', mintD: '#6fbfa6', sky: '#9fd8f5',
    leaf: '#62b86f', leafL: '#8fd68a', leafD: '#3f8c55', pot: '#e08a63', potL: '#f0a882',
    metal: '#5b5068', gold: '#ffd166',
  };

  /* ---------- 家具 ---------- */
  // 各家具: name, tool, wall, w, h, y(壁の家具の下端), draw(P, state)
  const NOTE_COLS = ['#ffe58a', '#ffb3c6', '#a8dcf5', '#bde8a8', '#ffe58a', '#ffcf9e'];
  const TYPES = {
    clock: {
      name: '時計', tool: 'alarm', wall: true, w: 15, h: 15, y: 32,
      key: st => `${st.h % 12}:${Math.floor(st.m / 5)}:${st.alarm ? 1 : 0}:${st.ring ? 1 : 0}`,
      draw(P, st) {
        P.ell(7, 7, 7, 7, C.pinkD).ell(7, 7, 6, 6, C.white);
        P.p(7, 2, C.pinkD).p(12, 7, C.pinkD).p(7, 12, C.pinkD).p(2, 7, C.pinkD);
        const ma = (st.m / 60) * Math.PI * 2, ha = ((st.h % 12) / 12 + st.m / 720) * Math.PI * 2;
        P.line(7, 7, 7 + Math.sin(ma) * 5, 7 - Math.cos(ma) * 5, '#3a2433');
        P.line(7, 7, 7 + Math.sin(ha) * 3.4, 7 - Math.cos(ha) * 3.4, '#3a2433');
        P.p(7, 7, '#e0485e');
        if (st.alarm) P.r(12, -1, 3, 3, '#ff5a6e').p(13, 0, '#ffd0d6');
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
      name: 'つくえ', tool: 'memo', w: 48, h: 25,
      key: st => st.memo ? '1' : '0',
      draw(P, st) {
        // ノート（開いた本）
        P.r(8, 3, 6, 6, C.white).r(15, 3, 6, 6, C.white).r(14, 4, 1, 5, '#d9cfc4');
        if (st.memo) { P.r(9, 5, 4, 1, '#8aa6d6').r(9, 7, 3, 1, '#8aa6d6').r(16, 5, 4, 1, '#8aa6d6').r(16, 7, 2, 1, '#8aa6d6'); }
        // えんぴつとマグカップ
        P.r(24, 7, 6, 1, C.gold).p(30, 7, '#4a3550');
        P.r(35, 3, 5, 6, C.pinkL).r(40, 4, 1, 3, C.pinkL).r(36, 4, 3, 1, C.white);
        // 天板と脚
        P.r(0, 9, 48, 3, C.woodL).r(0, 12, 48, 3, C.wood).r(0, 14, 48, 1, C.woodD);
        P.r(2, 15, 3, 10, C.woodD).r(43, 15, 3, 10, C.woodD);
        P.r(27, 15, 15, 8, C.wood).r(27, 15, 15, 1, C.woodL).r(32, 18, 5, 1, C.woodDD);
      },
    },
    timer: {
      name: 'タイマー棚', tool: 'timer', w: 24, h: 25,
      key: st => `${st.lcd}:${st.blinkOff ? 1 : 0}:${st.ring ? 1 : 0}`,
      draw(P, st) {
        P.r(1, 0, 22, 10, '#fdfdff').r(1, 0, 22, 1, '#ffffff').r(3, -1, 3, 1, '#ff5a6e').r(18, -1, 3, 1, C.metal);
        P.r(2, 1, 20, 7, '#c4dba3');
        if (!st.blinkOff) { const w = textWidth(st.lcd); P.text(Math.round(12 - w / 2), 2, st.lcd, '#2f4a2a'); }
        P.r(0, 10, 24, 2, C.mintL).r(0, 12, 24, 13, C.mint).r(0, 18, 24, 1, C.mintD);
        P.r(10, 14, 4, 1, C.mintD).r(10, 21, 4, 1, C.mintD);
      },
    },
    window: {
      name: 'まど', wall: true, w: 42, h: 36, y: 62,
      key: st => st.sky.k,
      draw(P, st) {
        const k = st.sky;
        P.r(3, 0, 36, 33, C.white);
        P.r(5, 2, 32, 29, k.sky);
        if (k.star) [[9, 6], [16, 11], [30, 5], [25, 14], [12, 17], [33, 18]].forEach(([x, y]) => P.p(x, y, '#fff8d0'));
        P.ell(29, 9, 3, 3, k.orb);
        if (k.star) P.ell(30, 8, 2, 2, k.sky); // 三日月
        for (let x = 5; x < 37; x++) {
          const a = 25 + Math.round(Math.abs(x - 12) * 0.35), b = 27 + Math.round(Math.abs(x - 30) * 0.3);
          if (a < 31) P.r(x, a, 1, 31 - a, k.hill);
          if (b < a && b < 31) P.r(x, b, 1, Math.min(a, 31) - b, k.hill2);
        }
        P.r(20, 2, 2, 29, C.white).r(5, 15, 32, 2, C.white);
        // カーテン
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
        P.map(2, 9, [
          '......xx......',
          '.....xxxx.....',
          '....xxyxxx....',
          '...xxxxxxxx.x.',
          '..xxxxxxxxxxxx',
          '.xxxxxxxxxxxxx',
        ], { x: '#7e8fd6', y: '#ffffff' });
        P.r(1, 15, 16, 8, '#8ecf8a').r(1, 15, 16, 1, '#b6e3a4');
        P.p(3, 0, '#e0485e').p(14, 0, '#e0485e');
      },
    },
    shelf: {
      name: '本だな', w: 30, h: 50,
      draw(P) {
        P.r(0, 0, 30, 50, C.wood).r(0, 0, 30, 2, C.woodL).r(2, 3, 26, 45, C.woodDD);
        const cols = ['#ff8fa8', '#7ec4e8', '#ffd166', '#8fd68a', '#b59ae8', '#ffb37a', '#fff1d6', '#6f8fd6'];
        const rows = [16, 32, 48];
        rows.forEach((by, r) => {
          let x = 3, i = r * 3;
          while (x < 26) {
            const w = 2 + (i % 2), h = 8 + ((i * 5) % 5);
            if (x + w > 27) break;
            P.r(x, by - h, w, h, cols[i % cols.length]).r(x, by - h + 2, w, 1, 'rgba(255,255,255,.45)');
            x += w + (i % 4 === 3 ? 2 : 0); i++;
          }
          if (r < 2) P.r(2, by, 26, 2, C.wood);
        });
        P.r(18, 3, 1, 0, C.wood);
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
        P.r(6, 9, 1, 32, C.metal).r(2, 41, 9, 3, C.metal).r(3, 41, 7, 1, '#8b7f99');
      },
    },
    rug: {
      name: 'ラグ', flat: true, w: 64, h: 9,
      draw(P) {
        P.ell(32, 4, 31, 4, C.pinkL).ell(32, 4, 25, 3, C.pink).ell(32, 4, 18, 2, C.pinkL).ell(32, 4, 10, 1, '#fff0f4');
      },
    },
    cat: {
      name: 'ねこ', w: 16, h: 9,
      key: st => st.blink ? '1' : '0',
      draw(P, st) {
        P.map(0, 0, [
          '.o.o............',
          '.ooo............',
          'oeoeo...oooooo..',
          'ooxoo.oooooooooo',
          '.ooooooooooooo.o',
          '..oooooooooooo.o',
          '..ooooooooooooo.',
          '...wwo....ow.ww.',
        ], { o: '#f3b26b', e: st.blink ? '#f3b26b' : '#3a2433', x: '#ff8fa8', w: '#fff3e2' });
        P.r(9, 3, 5, 1, '#e39a52').r(10, 5, 4, 1, '#e39a52');
      },
    },
  };

  /* ---------- 女の子 ---------- */
  const GPAL = {
    h: '#8a5040', H: '#b9735a', k: '#6a3a30', r: '#ff6f91', R: '#ffb3c6', s: '#ffe6d6', S: '#f8c9b4',
    c: '#ffa3b5', e: '#3b2a5c', E: '#6b56a8', W: '#ffffff', m: '#d0607a', d: '#9ad8e2', D: '#6bb8c4',
    w: '#ffffff', l: '#ffffff', b: '#7a4060',
  };
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
  };
  const GIRL_W = 22, GIRL_H = HEAD.length + EYES_OPEN.length + FACE_LOW.length + BODY.length + 3;
  function girl(legs, shut) {
    return sprite(GIRL_W, GIRL_H, P => P.map(0, 0, [...HEAD, ...(shut ? EYES_SHUT : EYES_OPEN), ...FACE_LOW, ...BODY, ...LEGS[legs]], GPAL));
  }
  const GIRL = {};
  for (const legs of ['stand', 'a', 'b']) for (const shut of [0, 1]) {
    const k = legs + shut;
    GIRL[k] = girl(legs, shut);
    GIRL[k + 'L'] = flipped(GIRL[k]);
  }

  /* ---------- キャッシュ付きでスプライトを返す ---------- */
  const cache = new Map();
  function thingSprite(type, st = {}) {
    const t = TYPES[type];
    const key = type + '|' + (t.key ? t.key(st) : '');
    let c = cache.get(key);
    if (!c) {
      c = sprite(t.w, t.h, P => t.draw(P, st));
      if (cache.size > 300) cache.clear();
      cache.set(key, c);
    }
    return c;
  }

  window.HeyaArt = { TYPES, GIRL, GIRL_W, GIRL_H, thingSprite, painter, sprite, canvas, C };
})();
