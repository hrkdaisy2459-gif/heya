/* へや — お店で買える家具・壁紙・床・ガチャの小物、お店の絵（店員のねこ、ガチャマシン、ダンボール） */
(() => {
  'use strict';
  const A = window.HeyaArt, C = A.C, OUT = A.OUTLINE;
  const GOLD = '#d4af37', GOLDL = '#f0d27a', TAU = Math.PI * 2;

  // 3x5 の英字（ネオンサイン用）
  const LETTERS = {
    C: ['111', '100', '100', '100', '111'], H: ['101', '101', '111', '101', '101'],
    I: ['111', '010', '010', '010', '111'], L: ['100', '100', '100', '100', '111'],
    N: ['101', '111', '111', '111', '101'], E: ['111', '100', '111', '100', '111'], W: ['101', '101', '111', '111', '101'],
    G: ['111', '100', '101', '101', '111'], A: ['010', '101', '111', '101', '101'], S: ['111', '100', '111', '001', '111'],
  };
  function letters(P, x, y, str, col, scale) {
    for (const ch of str) {
      LETTERS[ch].forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '1') P.r(x + i * scale, y + j * scale, scale, scale, col); });
      x += 4 * scale;
    }
  }

  const NEW_TYPES = {
    /* ---- パステルリュクス ---- */
    shellSofa: {
      name: 'シェルソファ', w: 46, h: 24, act: 'sofa',
      draw(P) {
        P.r(2, 6, 42, 8, '#f2a7bd');
        for (let i = 0; i < 5; i++) { const cx = 6 + Math.round(i * 8.5); P.ell(cx, 6, 4, 5, '#f2a7bd').r(cx, 2, 1, 9, '#f8c6d4'); }
        P.r(4, 12, 38, 5, '#f8c6d4').r(3, 16, 40, 4, '#e88aa6');
        P.r(6, 20, 2, 4, GOLD).r(38, 20, 2, 4, GOLD);
      },
    },
    fringeLamp: {
      name: 'フリンジランプ', w: 14, h: 46, toggle: true, light: st => st.on,
      key: st => (st.on ? '1' : '0'),
      draw(P, st) {
        P.ell(7, 5, 6, 4, st.on ? '#ffe3ec' : '#f7c6d3').r(1, 5, 13, 4, st.on ? '#ffe3ec' : '#f7c6d3');
        for (let x = 1; x < 14; x++) P.r(x, 9, 1, 3 + (x % 2), x % 2 ? GOLD : GOLDL);
        P.r(6, 12, 2, 30, GOLD).r(2, 42, 10, 3, GOLDL).r(3, 42, 8, 1, '#fff3c4');
      },
    },
    goldMirror: {
      name: 'ゴールドミラー', wall: true, w: 24, h: 24, y: 52,
      draw(P) {
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; P.line(12 + Math.sin(a) * 8, 12 - Math.cos(a) * 8, 12 + Math.sin(a) * 11, 12 - Math.cos(a) * 11, i % 2 ? GOLDL : GOLD); }
        P.ell(12, 12, 8, 8, GOLD).ell(12, 12, 6, 6, '#cfe6f2');
        P.line(9, 10, 12, 7, '#ffffff').line(10, 13, 14, 9, '#ffffff');
      },
    },
    tulipTable: {
      name: 'チューリップのサイドテーブル', w: 16, h: 28,
      draw(P) {
        P.line(5, 6, 4, 2, C.leafD).line(8, 6, 8, 1, C.leafD).line(10, 6, 12, 3, C.leafD);
        P.r(3, 0, 3, 3, '#ff6f91').r(7, -1, 3, 3, '#ffb3c6').r(11, 1, 3, 3, '#ff6f91');
        P.r(5, 6, 6, 6, '#f8c6d4').r(6, 7, 1, 4, '#ffffff');
        P.r(0, 12, 16, 3, '#f4f1f4').p(3, 13, '#d9d0dc').p(4, 12, '#d9d0dc').p(11, 13, '#d9d0dc');
        P.r(7, 15, 2, 11, GOLD).r(3, 26, 10, 2, GOLD);
      },
    },
    dresser: {
      name: 'ドレッサー', w: 30, h: 46, act: 'mirror',
      draw(P) {
        P.ell(15, 9, 8, 9, GOLD).ell(15, 9, 6, 7, '#cfe6f2').line(12, 7, 15, 4, '#ffffff');
        P.r(4, 15, 3, 5, '#ffb3c6').r(5, 14, 1, 1, GOLD).r(23, 16, 3, 4, '#c9b8f0');
        P.r(0, 20, 30, 3, '#fff6f9').r(1, 23, 28, 15, '#ffe9f0');
        P.r(2, 25, 12, 5, '#fff6f9').r(16, 25, 11, 5, '#fff6f9').r(2, 31, 25, 5, '#fff6f9');
        P.p(8, 27, GOLD).p(21, 27, GOLD).p(14, 33, GOLD);
        P.r(2, 38, 2, 8, GOLDL).r(26, 38, 2, 8, GOLDL);
      },
    },

    /* ---- アーバンヴィンテージ ---- */
    leatherSofa: {
      name: 'レザーソファ', w: 46, h: 24, act: 'sofa',
      draw(P) {
        P.r(4, 1, 38, 11, '#7a4a2e').r(4, 1, 38, 1, '#9a6240');
        for (let y = 3; y < 11; y += 3) for (let x = 7 + (y % 2) * 2; x < 41; x += 5) P.p(x, y, '#5e3820');
        P.r(0, 5, 7, 13, '#8a5634').r(0, 5, 7, 2, '#a8704a').r(39, 5, 7, 13, '#8a5634').r(39, 5, 7, 2, '#a8704a');
        P.r(7, 11, 32, 6, '#9a6240').r(22, 11, 1, 6, '#7a4a2e');
        P.r(2, 16, 42, 4, '#6a3e26').r(4, 20, 2, 4, '#2b1d1a').r(40, 20, 2, 4, '#2b1d1a');
      },
    },
    neon: {
      name: 'ネオンサイン', wall: true, w: 40, h: 12, y: 46, light: () => true,
      key: st => String(st.frame % 8 === 0 ? 1 : 0),
      draw(P, st) {
        const flick = st.frame % 8 === 0;
        letters(P, 1, 1, 'CHILL', flick ? '#c24a86' : '#ff5fa2', 2);
      },
    },
    record: {
      name: 'レコードプレーヤー', w: 22, h: 26,
      draw(P) {
        P.r(0, 5, 22, 5, '#3a3036').r(0, 5, 22, 1, '#5b5068');
        P.ell(9, 6, 6, 1, '#1d1a1f').p(9, 6, '#ff6f91');
        P.line(19, 3, 14, 6, C.steel).p(19, 3, C.steelD);
        P.r(1, 10, 20, 16, '#b98a5a');
        P.r(1, 15, 20, 1, '#8e6440').r(1, 20, 20, 1, '#8e6440');
        P.r(3, 11, 2, 14, '#2b2238').r(6, 12, 2, 13, '#e2475e').r(9, 11, 2, 14, '#2b2238');
      },
    },
    metalRack: {
      name: 'メタルラック', w: 28, h: 48,
      draw(P) {
        P.r(3, 7, 10, 8, '#c48a4a').r(3, 10, 10, 1, '#a8703a');
        P.ell(20, 9, 4, 4, C.leaf).r(18, 11, 5, 4, C.pot);
        [[3, 22, '#7ec4e8'], [6, 23, '#ffd166'], [9, 21, '#ff8fa8'], [12, 24, '#8fd68a']].forEach(([x, y, c]) => P.r(x, y, 3, 30 - y, c));
        P.r(17, 25, 8, 5, '#e2475e');
        P.r(4, 38, 14, 7, '#3a3036').ell(7, 41, 2, 2, '#8a8f99').ell(15, 41, 2, 2, '#8a8f99').r(9, 39, 4, 1, '#ffd166');
        P.r(0, 0, 2, 48, '#8a8f99').r(26, 0, 2, 48, '#8a8f99');
        [0, 15, 30, 45].forEach(y => P.r(0, y, 28, 2, '#a9aeb8'));
      },
    },
    drum: {
      name: 'ドラム缶テーブル', w: 18, h: 24,
      draw(P) {
        P.r(1, 4, 16, 20, '#3f6f8f').r(1, 10, 16, 1, '#2e5670').r(1, 17, 16, 1, '#2e5670');
        P.ell(9, 4, 8, 2, '#4f86a8').p(4, 13, '#a8643a').p(5, 14, '#a8643a').p(13, 20, '#a8643a').r(3, 5, 1, 18, '#5b9bc0');
        P.r(11, 0, 3, 3, '#fff1d6').p(12, -1, '#ffd166');
      },
    },
    lights: {
      name: 'ガーランドライト', wall: true, w: 50, h: 10, y: 22, light: () => true,
      key: st => String(st.frame % 4),
      draw(P, st) {
        let py = 2;
        for (let x = 0; x < 50; x++) { const y = 2 + Math.round(3 * Math.sin(x / 49 * Math.PI)); P.r(x, Math.min(py, y), 1, Math.abs(py - y) + 1, '#3a3036'); py = y; }
        for (let x = 3, i = 0; x < 50; x += 6, i++) {
          const y = 3 + Math.round(3 * Math.sin(x / 49 * Math.PI));
          P.r(x, y + 1, 2, 3, (i + st.frame) % 4 === 0 ? '#fff6c9' : '#ffd166');
        }
      },
    },
    skate: {
      name: 'スケートボード', wall: true, w: 28, h: 9, y: 68,
      draw(P) {
        P.r(2, 2, 24, 3, '#e2475e').p(1, 3, '#e2475e').p(26, 3, '#e2475e').r(3, 2, 22, 1, '#2b2238');
        P.r(8, 3, 12, 1, '#ffd166');
        P.r(5, 5, 3, 3, '#fff1d6').r(20, 5, 3, 3, '#fff1d6');
      },
    },

    /* ---- 和モダン ---- */
    chabudai: {
      name: 'ちゃぶ台', w: 34, h: 12,
      draw(P) {
        P.r(9, 0, 3, 2, '#e8e0d0').r(14, 0, 3, 2, '#e8e0d0').r(20, -1, 6, 3, '#5b8a6a').p(26, 0, '#5b8a6a');
        P.ell(17, 3, 16, 1, '#a8703f').r(1, 3, 32, 3, '#6d3f2a').r(1, 3, 32, 1, '#8e5638');
        P.r(5, 6, 2, 6, '#5b3220').r(27, 6, 2, 6, '#5b3220');
      },
    },
    zabuton: {
      name: '座布団', w: 18, h: 5,
      draw(P) { P.r(1, 1, 16, 4, '#7a4a8c').r(1, 1, 16, 1, '#9a6aac').p(0, 1, '#ffd166').p(17, 1, '#ffd166').p(8, 2, '#5b3a6c'); },
    },
    andon: {
      name: '行灯', w: 14, h: 30, light: () => true,
      draw(P) {
        P.r(0, 2, 14, 2, '#6d3f2a').r(2, 4, 10, 22, '#fff3d6').r(2, 11, 10, 1, '#c99560').r(2, 18, 10, 1, '#c99560').r(6, 4, 1, 22, '#e8d6b0');
        P.r(0, 4, 2, 24, '#6d3f2a').r(12, 4, 2, 24, '#6d3f2a').r(0, 26, 14, 2, '#6d3f2a').r(0, 28, 3, 2, '#5b3220').r(11, 28, 3, 2, '#5b3220');
      },
    },
    kakejiku: {
      name: '掛け軸', wall: true, w: 14, h: 34, y: 66,
      draw(P) {
        P.r(0, 0, 14, 2, '#6d3f2a').r(1, 2, 12, 28, '#f4ecd8').r(1, 2, 1, 28, '#5b8a6a').r(12, 2, 1, 28, '#5b8a6a');
        P.ell(7, 9, 2, 2, '#e2475e');
        P.line(3, 22, 6, 16, '#3a3036').line(6, 16, 9, 21, '#3a3036').line(8, 19, 11, 15, '#3a3036');
        P.r(0, 30, 14, 2, '#6d3f2a').p(0, 32, '#6d3f2a').p(13, 32, '#6d3f2a');
      },
    },
    bonsai: {
      name: '盆栽', w: 20, h: 22,
      draw(P) {
        P.line(10, 15, 7, 9, '#6d3f2a').line(7, 9, 12, 5, '#6d3f2a').line(9, 12, 14, 9, '#6d3f2a');
        P.ell(6, 7, 4, 2, '#3f8c55').ell(13, 4, 5, 2, '#62b86f').ell(15, 9, 3, 2, '#3f8c55').p(12, 3, C.leafL);
        P.r(2, 15, 16, 2, '#4f74a8').r(3, 17, 14, 4, '#3f5f8f');
      },
    },
    manekineko: {
      name: '招き猫', w: 14, h: 18,
      draw(P) {
        P.r(1, 16, 12, 2, '#e2475e');
        P.ell(7, 12, 5, 4, '#ffffff').ell(7, 6, 5, 4, '#ffffff');
        P.p(3, 2, '#ffffff').p(4, 1, '#ffffff').p(10, 2, '#ffffff').p(9, 1, '#ffffff').p(4, 2, '#ffb3c6').p(9, 2, '#ffb3c6');
        P.r(11, 0, 2, 7, '#ffffff').p(11, 0, '#ffb3c6');
        P.p(5, 6, OUT).p(9, 6, OUT).p(7, 7, '#ff8fa8').p(4, 4, '#ffb07a').p(5, 4, '#ffb07a');
        P.r(3, 9, 9, 1, '#e2475e').p(7, 10, '#ffd166');
        P.r(5, 12, 4, 3, '#ffd166').p(6, 13, '#e0a020');
      },
    },

    /* ---- チャイナ ---- */
    roundWindow: {
      name: '丸窓', wall: true, w: 34, h: 34, y: 66,
      key: st => st.sky.k,
      draw(P, st) {
        P.ell(17, 17, 16, 16, '#a51c30').ell(17, 17, 13, 13, st.sky.sky);
        if (st.sky.star) P.p(10, 10, '#fff8d0').p(22, 8, '#fff8d0').ell(23, 12, 2, 2, '#fff3c4');
        else P.ell(23, 12, 2, 2, '#ffe07a');
        P.ell(12, 30, 9, 4, '#7fa86a');
        for (let k = -12; k <= 12; k += 6) for (let t = -13; t <= 13; t++) {
          if (k * k + t * t <= 169) { P.p(17 + k, 17 + t, '#a51c30'); P.p(17 + t, 17 + k, '#a51c30'); }
        }
      },
    },
    lantern: {
      name: '提灯', wall: true, w: 24, h: 24, y: 30, light: () => true,
      draw(P) {
        const one = (x, y) => {
          P.r(x + 2, 0, 1, y, '#3a3036');
          P.r(x, y, 5, 1, '#ffd166').ell(x + 2, y + 7, 5, 6, '#e2475e').r(x + 2, y + 2, 1, 11, '#b5263d').r(x - 2, y + 7, 9, 1, '#ff6b7f');
          P.r(x, y + 13, 5, 1, '#ffd166').r(x + 2, y + 14, 1, 4, '#ffd166');
        };
        one(4, 1); one(17, 3);
      },
    },
    screen: {
      name: '屏風', w: 40, h: 36,
      draw(P) {
        for (let i = 0; i < 4; i++) {
          const x = i * 10;
          P.r(x, 0, 10, 34, '#a51c30').r(x + 1, 1, 8, 32, i % 2 ? '#e8d2a8' : '#f4e3c0');
        }
        P.line(3, 30, 12, 18, '#3a3036').line(12, 18, 24, 12, '#3a3036').line(16, 15, 18, 7, '#3a3036').line(24, 12, 35, 9, '#3a3036');
        [[12, 17], [18, 7], [24, 11], [30, 9], [35, 8], [8, 23]].forEach(([x, y]) => P.p(x, y - 1, '#ff9fb6').p(x + 1, y, '#ff9fb6').p(x, y, '#ffffff'));
        P.r(2, 34, 4, 2, '#3a3036').r(34, 34, 4, 2, '#3a3036');
      },
    },
    chinaTable: {
      name: '中華テーブル', w: 30, h: 20,
      draw(P) {
        P.r(9, 0, 6, 3, '#4f9a8a').p(8, 1, '#4f9a8a').p(15, 0, '#4f9a8a').p(11, -1, '#3a7a6a');
        P.r(19, 1, 2, 2, '#ffffff').r(23, 1, 2, 2, '#ffffff');
        P.ell(15, 4, 14, 1, '#c0392b').r(1, 4, 28, 3, '#7f1424').r(1, 5, 28, 1, '#ffd166');
        P.r(13, 7, 4, 11, '#7f1424').r(8, 18, 14, 2, '#7f1424');
      },
    },
    birdcage: {
      name: '鳥かご', w: 16, h: 30,
      key: st => String(st.frame % 4),
      draw(P, st) {
        const by = 11 - (st.frame % 4 === 1 ? 1 : 0);
        P.r(1, 16, 14, 2, GOLD).r(7, 18, 2, 10, GOLD).r(3, 28, 10, 2, GOLD);
        P.r(4, 13, 8, 1, '#8e5638');
        P.ell(8, by, 2, 2, '#ffd166').p(10, by, '#ff9f43').p(8, by - 1, OUT).r(5, by + 1, 2, 1, '#f0bd4f');
        for (let x = 1; x <= 15; x += 3) { const top = 4 + Math.round(Math.abs(x - 8) * 0.6); P.r(x, top, 1, 16 - top, GOLD); }
        P.ell(8, 4, 7, 2, GOLD).ell(8, 4, 5, 1, '#fff8e0').r(7, 0, 2, 2, GOLD);
      },
    },
    vase: {
      name: '青磁の壺', w: 12, h: 18,
      draw(P) {
        P.line(6, 2, 2, -1, '#6d3f2a').line(6, 2, 10, 0, '#6d3f2a').p(2, -1, '#ff9fb6').p(10, 0, '#ff9fb6').p(4, 0, '#ffffff');
        P.r(4, 2, 4, 4, '#8fc9b9').r(3, 1, 6, 1, '#a8dccd').ell(6, 11, 5, 6, '#8fc9b9');
        P.r(3, 9, 1, 4, '#c6eedf').r(1, 12, 10, 1, '#5f9f8f');
      },
    },

    /* ---- 定番 ---- */
    coffee: {
      name: 'コーヒーメーカー', w: 14, h: 26,
      draw(P) {
        P.r(2, 0, 10, 10, '#3a3036').r(3, 1, 8, 2, '#5b5068').p(10, 2, '#8fd68a');
        P.r(4, 5, 6, 5, '#d4f0ff').r(4, 7, 6, 3, '#5e3522');
        P.r(0, 10, 14, 2, C.steel).r(1, 12, 2, 14, C.steelD).r(11, 12, 2, 14, C.steelD).r(1, 19, 12, 1, C.steel);
        P.r(4, 15, 4, 4, '#ffffff').r(8, 16, 1, 2, '#ffffff');
      },
    },

    /* ---- 季節限定 ---- */
    pumpkin: {
      name: 'かぼちゃランタン', w: 16, h: 14, light: () => true,
      draw(P) {
        P.r(7, 0, 2, 3, '#3f8c55').p(9, 1, '#62b86f');
        P.ell(8, 8, 7, 5, '#ff9f43').r(4, 4, 1, 9, '#e07b1a').r(11, 4, 1, 9, '#e07b1a');
        P.map(3, 6, ['.x....x..', 'xxx..xxx.', '.........', '.x.x.x.x.', '..x.x.x..'], { x: '#ffe08a' });
      },
    },
    ghost: {
      name: 'おばけのぬいぐるみ', w: 14, h: 16,
      draw(P) {
        P.ell(7, 6, 6, 6, '#ffffff').r(1, 6, 12, 7, '#ffffff');
        for (let x = 1; x < 13; x += 4) P.r(x, 13, 2, 2, '#ffffff');
        P.r(4, 5, 2, 3, OUT).r(8, 5, 2, 3, OUT).p(3, 9, '#ffb3c6').p(10, 9, '#ffb3c6').r(6, 9, 2, 1, '#ff8fa8');
      },
    },
    xmasTree: {
      name: 'クリスマスツリー', w: 30, h: 50, light: () => true,
      key: st => String(st.frame % 2),
      draw(P, st) {
        for (let y = 5; y < 41; y++) {
          const tier = (y - 5) % 12, w = Math.round(3 + tier * 0.9 + (y - 5) / 3);
          P.r(15 - w, y, w * 2 + 1, 1, tier < 2 ? '#3fa86a' : '#2f8f5b');
        }
        const cols = ['#ff5a6e', '#ffd166', '#7ec4e8', '#ffffff'];
        [[12, 12], [18, 16], [9, 22], [20, 26], [14, 30], [7, 35], [22, 36], [15, 20]].forEach(([x, y], i) => P.r(x, y, 2, 2, cols[(i + st.frame) % 4]));
        P.map(12, 0, ['..x..', '.xxx.', 'xxxxx', '.x.x.'], { x: '#ffd166' });
        P.r(13, 41, 4, 3, '#6d3f2a').r(10, 44, 10, 6, '#a51c30').r(10, 44, 10, 1, '#e2475e');
      },
    },

    /* ---- ガチャの小物 ---- */
    bear: { name: 'くまのぬいぐるみ', w: 12, h: 12, draw(P) { P.ell(2, 2, 2, 2, '#b98656').ell(9, 2, 2, 2, '#b98656').ell(6, 5, 5, 4, '#c9965f').ell(6, 10, 5, 2, '#c9965f').p(4, 4, OUT).p(8, 4, OUT).r(5, 6, 3, 2, '#f0d2a8').p(6, 6, OUT).r(4, 9, 4, 1, '#ff6f91'); } },
    rabbit: { name: 'うさぎのぬいぐるみ', w: 10, h: 14, draw(P) { P.r(2, 0, 2, 6, '#ffffff').r(6, 0, 2, 6, '#ffffff').p(3, 2, '#ffb3c6').p(7, 2, '#ffb3c6').ell(5, 8, 4, 3, '#ffffff').ell(5, 12, 3, 2, '#ffffff').p(3, 8, OUT).p(7, 8, OUT).p(5, 9, '#ff8fa8'); } },
    duck: { name: 'アヒル', w: 10, h: 8, draw(P) { P.ell(3, 3, 2, 2, '#ffd166').ell(5, 6, 4, 2, '#ffd166').r(0, 3, 2, 1, '#ff9f43').p(3, 2, OUT).p(8, 4, '#ffd166'); } },
    cactus: { name: 'サボテン', w: 8, h: 12, draw(P) { P.r(3, 0, 3, 8, '#62b86f').r(1, 3, 2, 3, '#62b86f').r(6, 2, 2, 2, '#62b86f').p(4, 0, '#ff6f91').r(1, 8, 7, 4, '#e08a63').r(1, 8, 7, 1, '#f0a882'); } },
    candle: { name: 'キャンドル', w: 6, h: 10, light: () => true, draw(P) { P.p(2, 0, '#ffe08a').r(2, 1, 2, 2, '#ff9f43').r(1, 3, 4, 7, '#fff1d6').r(1, 3, 4, 1, '#ffffff'); } },
    books: { name: '本の山', w: 14, h: 10, draw(P) { P.r(1, 7, 12, 3, '#7ec4e8').r(2, 4, 10, 3, '#ff8fa8').r(0, 1, 11, 3, '#ffd166').r(1, 2, 9, 1, '#fff6e0'); } },
    globe: { name: '地球儀', w: 10, h: 14, draw(P) { P.ell(5, 5, 4, 4, '#5bb4f0').r(3, 3, 3, 2, '#62b86f').r(5, 6, 2, 2, '#62b86f').line(1, 1, 8, 9, GOLD).r(4, 10, 2, 2, GOLD).r(2, 12, 6, 2, '#6d3f2a'); } },
    penguin: {
      name: 'ペンギン', w: 10, h: 14, key: st => String(st.frame % 2),
      draw(P, st) { const o = st.frame % 2; P.ell(5, 4, 3, 3, '#2b2238').ell(5, 9, 4, 4, '#2b2238').ell(5, 9, 2, 3, '#ffffff').p(4, 3, '#ffffff').p(6, 3, '#ffffff').p(4, 4, OUT).r(5, 5, 2, 1, '#ff9f43').r(2 + o, 13, 2, 1, '#ff9f43').r(6 - o, 13, 2, 1, '#ff9f43'); },
    },
    lavaLamp: {
      name: 'ラバランプ', w: 6, h: 18, light: () => true, key: st => String(st.frame % 4),
      draw(P, st) { const f = st.frame % 4; P.r(2, 0, 2, 2, C.metal).r(1, 2, 4, 11, '#c9b8f0').ell(3, 4 + f * 2, 1, 1, '#ff5fa2').ell(3, 11 - f, 1, 1, '#ff5fa2').r(0, 13, 6, 5, C.metal); },
    },
    boombox: { name: 'ラジカセ', w: 18, h: 10, draw(P) { P.r(4, 0, 10, 1, C.metal).r(0, 2, 18, 8, '#c9d3df').ell(4, 6, 2, 2, '#3a3036').ell(13, 6, 2, 2, '#3a3036').r(7, 4, 4, 3, '#2b2238').r(7, 3, 4, 1, '#ff6f91'); } },
    goldCat: {
      name: '金の招き猫', w: 14, h: 18, light: () => true,
      draw(P) {
        P.r(1, 16, 12, 2, '#a51c30');
        P.ell(7, 12, 5, 4, '#f0c23a').ell(7, 6, 5, 4, '#f0c23a').p(3, 2, '#f0c23a').p(4, 1, '#f0c23a').p(10, 2, '#f0c23a').p(9, 1, '#f0c23a');
        P.r(11, 0, 2, 7, '#f0c23a').p(5, 6, OUT).p(9, 6, OUT).p(4, 5, '#fff3c4').p(5, 11, '#fff3c4').r(3, 9, 9, 1, '#e2475e').r(5, 12, 4, 3, '#fff3c4');
      },
    },
    discoBall: {
      name: 'ミラーボール', wall: true, w: 12, h: 18, y: 26, light: () => true, key: st => String(st.frame % 3),
      draw(P, st) {
        P.r(6, 0, 1, 5, '#3a3036');
        P.ell(6, 11, 5, 5, '#c9d3df');
        for (let y = 7; y < 16; y += 2) for (let x = 2; x < 11; x += 2) P.p(x + ((y + st.frame) % 4 ? 0 : 1), y, (x + y + st.frame) % 3 ? '#ffffff' : '#9fd8f5');
      },
    },
  };
  Object.assign(A.TYPES, NEW_TYPES);

  /* ---------- 壁紙と床 ---------- */
  Object.assign(A.WALLS, {
    luxe: { name: 'ホワイト＆ゴールド', tw: 32, draw(P) {
      P.r(0, 0, 32, A.BACK, '#fff8f5').r(0, 0, 32, 4, '#f7e8ec');
      P.r(4, 9, 24, 1, '#e8c86a').r(4, 50, 24, 1, '#e8c86a').r(4, 9, 1, 42, '#e8c86a').r(27, 9, 1, 42, '#e8c86a');
      P.r(0, 56, 32, 2, '#e8c86a').r(0, 58, 32, A.BACK - 62, '#f7e8ec').r(4, 61, 24, 1, '#f0d7a0').r(4, 78, 24, 1, '#f0d7a0');
      P.r(0, A.BACK - 4, 32, 4, '#d9b8a8');
    } },
    brick: { name: 'れんが', tw: 16, draw(P) {
      P.r(0, 0, 16, A.BACK, '#b5654a');
      for (let y = 0; y < A.BACK - 4; y += 6) {
        P.r(0, y, 16, 1, '#d9a38a');
        const off = (y / 6) % 2 ? 8 : 0;
        P.r(off, y, 1, 6, '#d9a38a');
        if ((y / 6) % 3 === 1) P.r(off + 2, y + 2, 4, 3, '#9e5340');
      }
      P.r(0, A.BACK - 4, 16, 4, '#3a3036');
    } },
    china: { name: '朱色の壁', tw: 24, draw(P) {
      P.r(0, 0, 24, A.BACK, '#c0392b').r(0, 0, 24, 4, '#7f1424');
      P.map(8, 22, ['xxxxxxx', 'x.....x', 'x.xxx.x', 'x.x.x.x', 'x.x...x', 'x.xxxxx'], { x: '#e8b04a' });
      P.r(0, 56, 24, 2, '#e8b04a').r(0, 58, 24, A.BACK - 62, '#5b2a1a').r(0, 68, 24, 1, '#7a3a24');
      P.r(0, A.BACK - 4, 24, 4, '#3a1a12');
    } },
  });
  Object.assign(A.FLOORS, {
    herring: { name: 'ヘリンボーン', kind: 'herring', bw: 8, a: '#e8c9a0', b: '#d6b385', seam: '#c49a6a' },
    concrete: { name: 'コンクリート', kind: 'plain', bw: 16, a: '#9aa0a8', b: '#868c95', seam: '#7a808a' },
  });

  /* ---------- お店の内装 ---------- */
  const SHOP_TYPES = {
    shopWindow: {
      name: 'ショーウィンドウ', wall: true, w: 64, h: 46, y: 72, key: st => st.sky.k,
      draw(P, st) {
        P.r(0, 0, 64, 44, '#3f6f5a').r(3, 3, 58, 37, st.sky.sky);
        if (st.sky.star) [[8, 7], [20, 11], [44, 6], [55, 12]].forEach(([x, y]) => P.p(x, y, '#fff8d0'));
        [[3, 18, 14, '#c9b8d8'], [17, 12, 12, '#b8c8e0'], [29, 20, 10, '#e0c4b8'], [39, 10, 13, '#c4d8c8'], [52, 16, 9, '#d8c0d0']].forEach(([x, top, w, c]) => {
          P.r(x, top, w, 40 - top, st.sky.star ? A.shade(c, 0.55) : c);
          for (let yy = top + 3; yy < 36; yy += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) P.r(xx, yy, 2, 2, st.sky.star ? '#ffd166' : '#ffffff');
        });
        P.r(3, 36, 58, 4, '#9aa0a8').r(47, 22, 1, 14, '#3a3036').ell(47, 21, 2, 1, st.sky.star ? '#ffe08a' : '#c9d3df');
        for (let x = 3; x < 61; x += 6) P.r(x, 3, 3, 4, '#ff9fb6').r(x + 3, 3, 3, 4, '#ffffff');
        P.r(31, 3, 2, 37, '#3f6f5a').r(3, 21, 58, 1, '#3f6f5a');
        P.r(-1, 42, 66, 4, '#d39566').r(-1, 42, 66, 1, '#f0b07a');
        P.ell(10, 40, 3, 2, C.leaf).r(8, 41, 4, 1, C.pot).ell(54, 40, 3, 2, '#ff9fb6').r(52, 41, 4, 1, C.pot);
      },
    },
    counter: {
      name: 'レジカウンター', w: 54, h: 30,
      draw(P) {
        P.r(4, 2, 16, 8, '#e8e0d0').r(6, 3, 8, 3, '#8fd68a').r(15, 3, 3, 2, '#e2475e').r(5, 7, 14, 1, '#c9c0b0').r(2, 9, 20, 2, '#d0c4b0');
        P.ell(30, 8, 2, 1, GOLD).p(30, 6, GOLD).r(40, 3, 4, 6, '#9fd8f5').p(41, 1, '#ff6f91').p(43, 2, '#ffd166');
        P.r(0, 10, 54, 3, '#d39566').r(0, 10, 54, 1, '#f0b07a').r(1, 13, 52, 17, '#8e5638');
        P.r(4, 16, 21, 11, '#a8703f').r(29, 16, 21, 11, '#a8703f').r(4, 16, 21, 1, '#c48a52').r(29, 16, 21, 1, '#c48a52');
        P.map(23, 19, ['x.x', 'xxx', '.x.'], { x: '#ff9fb6' });
      },
    },
    lectern: {
      name: '図鑑のスタンド', w: 18, h: 28,
      draw(P) {
        P.r(1, 4, 16, 2, '#e2475e').r(2, 1, 6, 4, '#ffffff').r(10, 1, 6, 4, '#ffffff').r(8, 2, 2, 3, '#d9cfc4').r(3, 2, 4, 1, '#c9c0d0').r(11, 2, 4, 1, '#c9c0d0');
        P.r(2, 6, 14, 3, '#8e5638').r(7, 9, 4, 16, '#8e5638').r(3, 25, 12, 3, '#6d3f2a');
      },
    },
    pedestal: {
      name: '展示台', w: 26, h: 9,
      draw(P) { P.r(1, 2, 24, 7, '#f4f1f4').ell(13, 2, 12, 2, '#ffffff').r(1, 8, 24, 1, '#d9d0dc').r(2, 4, 22, 1, '#e8c86a'); },
    },
    pendant: {
      name: 'ペンダントライト', wall: true, w: 12, h: 24, y: 24, light: () => true,
      draw(P) { P.r(5, 0, 1, 14, '#3a3036').r(3, 13, 6, 2, GOLD).r(1, 15, 10, 4, GOLD).r(1, 15, 10, 1, GOLDL).r(4, 19, 4, 2, '#fff6c9'); },
    },
    fitting: {
      name: '試着室', w: 34, h: 58,
      draw(P) {
        P.r(0, 0, 34, 4, '#8e5638').r(0, 4, 2, 54, '#8e5638').r(32, 4, 2, 54, '#8e5638');
        P.r(2, 4, 30, 52, '#fff6f9').ell(22, 26, 6, 12, GOLD).ell(22, 26, 4, 10, '#cfe6f2').line(20, 20, 23, 16, '#ffffff');
        for (let x = 2; x < 17; x++) P.r(x, 4, 1, 52, x % 3 === 0 ? '#e88aa6' : '#f2a7bd');
        P.r(2, 4, 15, 2, '#e88aa6').r(14, 30, 4, 2, GOLD);
        P.map(24, 46, ['x.x', 'xxx', '.x.'], { x: '#ff6f91' });
        P.r(0, 56, 34, 2, '#6d3f2a');
      },
    },
    hangSign: {
      name: '看板', wall: true, w: 36, h: 18, y: 20, key: st => st.ref,
      draw(P, st) {
        const col = { pick: '#ff6f91', luxe: '#f2a7bd', street: '#3a3036', wa: '#5b8a6a', china: '#c0392b', classic: '#7ec4e8', gacha: '#c9b8f0', season: '#ff9f43', entrance: '#3f6f5a' }[st.ref] || '#ff6f91';
        P.line(5, 0, 7, 5, '#5b5068').line(30, 0, 28, 5, '#5b5068');
        P.r(1, 5, 34, 13, col).r(2, 6, 32, 1, 'rgba(255,255,255,.35)').r(1, 17, 34, 1, 'rgba(0,0,0,.2)');
        const ink = st.ref === 'luxe' || st.ref === 'classic' || st.ref === 'gacha' ? '#3a2433' : '#ffffff';
        if (st.ref === 'pick') letters(P, 12, 9, 'NEW', '#ffffff', 1);
        else if (st.ref === 'gacha') letters(P, 9, 9, 'GACHA', '#3a2433', 1);
        else if (st.ref === 'season') letters(P, 11, 9, 'SALE', '#ffffff', 1);
        else if (st.ref === 'luxe') P.map(14, 8, ['.xx.xx.', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'], { x: GOLD });
        else if (st.ref === 'street') P.map(15, 8, ['..xx', '.xx.', 'xxxx', '.xx.', 'xx..'], { x: '#ff5fa2' });
        else if (st.ref === 'wa') P.ell(18, 11, 3, 3, '#e2475e');
        else if (st.ref === 'china') P.map(14, 8, ['xxxxxxx', 'x.....x', 'x.xxx.x', 'x.....x', 'xxxxxxx'], { x: '#ffd166' });
        else if (st.ref === 'classic') P.map(15, 8, ['..x..', '.xxx.', 'xxxxx', '.x.x.'], { x: '#ffd166' });
        else P.map(13, 8, ['x..x.xxx', 'x..x.x..', 'xxxx.xx.', 'x..x.x..', 'x..x.xxx'], { x: ink });
      },
    },
    dye: {
      name: 'ヘアカラー', w: 8, h: 14, key: st => st.ref,
      draw(P, st) {
        const c = A.HAIR_COLORS[st.ref] || A.HAIR_COLORS.brown;
        P.r(2, 0, 4, 3, '#3a3036').r(1, 3, 6, 11, c.h).r(2, 4, 1, 8, c.H).r(2, 7, 4, 4, '#ffffff').r(3, 8, 2, 2, c.h);
      },
    },
    sampleWall: {
      name: '壁紙サンプル', wall: true, w: 24, h: 28, y: 58, key: st => st.ref,
      draw(P, st, g) {
        P.r(0, 0, 24, 28, '#d39566');
        g.imageSmoothingEnabled = false;
        g.drawImage(A.wallTile(st.ref), 0, 20, 20, 24, 2, 2, 20, 24);
        P.r(0, 0, 24, 1, '#f0b07a');
      },
    },
    // 床のサンプル（壁に貼る見本）
    sampleFloorWall: {
      name: '床サンプル', wall: true, w: 24, h: 28, y: 58, key: st => st.ref,
      draw(P, st) {
        const F = A.FLOORS[st.ref] || A.FLOORS.wood;
        P.r(0, 0, 24, 28, '#8e5638');
        for (let y = 0; y < 24; y++) for (let x = 0; x < 20; x++) {
          const col = F.kind === 'herring' ? ((Math.floor(x / 4) + Math.floor(y / 2)) % 2 ? F.a : F.b) : F.kind === 'checker' ? ((Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? F.a : F.b) : F.kind === 'plain' ? ((x * 7 + y * 3) % 11 ? F.a : F.b) : (Math.floor(x / 5) % 2 ? F.a : F.b);
          P.p(2 + x, 2 + y, col);
        }
        P.r(0, 0, 24, 1, '#b9774e');
      },
    },
    sampleFloor: {
      name: '床サンプル', w: 30, h: 8, key: st => st.ref,
      draw(P, st) {
        const F = A.FLOORS[st.ref] || A.FLOORS.wood;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 30 - (7 - y); x++) {
          const xx = x + (7 - y);
          const col = F.kind === 'herring' ? ((Math.floor(xx / 4) + Math.floor(y / 2)) % 2 ? F.a : F.b) : F.kind === 'checker' ? ((Math.floor(xx / 6) + Math.floor(y / 4)) % 2 ? F.a : F.b) : F.kind === 'plain' ? ((xx * 7 + y * 3) % 11 ? F.a : F.b) : (Math.floor(xx / 6) % 2 ? F.a : F.b);
          P.p(xx, y, col);
        }
      },
    },
    mannequin: { name: 'マネキン', w: 22, h: 20, custom: st => A.mannequinSprite(st.ref) },
    wig: { name: 'ウィッグ', w: 22, h: 23, custom: st => A.wigSprite(st.ref) },
    gachaM: { name: 'ガチャマシン', w: 26, h: 40, light: () => true, custom: () => A.GACHA[0] },
    shopcat: { name: '店員さん', w: 24, h: 26, custom: st => A.SHOP_CAT[st.blink ? 1 : 0] },
  };
  for (const t of Object.values(SHOP_TYPES)) t.deco = true; // お店専用（模様替えには出さない）
  Object.assign(A.TYPES, SHOP_TYPES);
  Object.assign(A.WALLS, {
    shop: { name: 'おみせの壁', tw: 20, draw(P) {
      P.r(0, 0, 20, A.BACK, '#fff4e6').r(0, 0, 20, 4, '#3f6f5a').r(0, 4, 20, 1, GOLD);
      P.r(9, 10, 2, 2, '#f0dcc0').r(0, 46, 20, 2, GOLD).r(0, 48, 20, A.BACK - 52, '#3f6f5a');
      P.r(3, 52, 14, A.BACK - 60, '#4f8a72').r(3, 52, 14, 1, '#5f9f86');
      P.r(0, A.BACK - 4, 20, 4, '#2f5444');
    } },
  });

  /* ---------- お店の絵 ---------- */
  // 店員のねこ（エプロンと蝶ネクタイ）
  function shopCat(blink) {
    return A.sprite(24, 26, P => {
      P.ell(19, 22, 4, 2, '#a8a3b8').p(22, 19, '#a8a3b8').p(22, 18, '#a8a3b8');
      P.ell(12, 19, 8, 7, '#a8a3b8');
      P.ell(12, 9, 9, 7, '#a8a3b8').r(4, 1, 3, 4, '#a8a3b8').r(17, 1, 3, 4, '#a8a3b8').p(5, 2, '#ffb3c6').p(18, 2, '#ffb3c6');
      P.r(10, 3, 1, 3, '#7f7a90').r(13, 3, 1, 3, '#7f7a90');
      if (blink) P.r(7, 9, 3, 1, OUT).r(14, 9, 3, 1, OUT);
      else P.r(8, 8, 2, 3, OUT).r(15, 8, 2, 3, OUT).p(8, 8, '#ffffff').p(15, 8, '#ffffff');
      P.p(12, 11, '#ff8fa8').p(11, 12, OUT).p(13, 12, OUT).p(6, 11, '#ffb3c6').p(18, 11, '#ffb3c6');
      P.r(9, 15, 7, 1, '#e2475e').r(11, 14, 3, 3, '#e2475e');
      P.r(7, 17, 11, 9, '#ffffff').r(10, 21, 5, 3, '#f1d9e1');
      P.r(4, 18, 3, 4, '#a8a3b8').r(18, 18, 3, 4, '#a8a3b8');
    });
  }
  const SHOP_CAT = [shopCat(false), shopCat(true)];
  // ガチャマシン（ハンドルが回る4コマ）
  function gachaMachine(f) {
    return A.sprite(26, 40, P => {
      P.ell(13, 11, 11, 10, '#d4f0ff');
      [[7, 13, '#ff6f91'], [12, 15, '#ffd166'], [18, 13, '#7ec4e8'], [9, 8, '#8fd68a'], [16, 7, '#c9b8f0'], [13, 10, '#ff9f43'], [6, 17, '#ffd166'], [19, 17, '#ff6f91']]
        .forEach(([x, y, c]) => P.ell(x, y, 2, 2, c).p(x - 1, y - 1, '#ffffff'));
      P.r(5, 4, 3, 1, '#ffffff').r(4, 5, 1, 3, '#ffffff');
      P.r(1, 20, 24, 18, '#e2475e').r(1, 20, 24, 2, '#ff8fa0').r(0, 38, 26, 2, '#a51c30');
      P.r(4, 24, 8, 3, '#fff6f9').r(5, 25, 6, 1, '#3a2433');
      const a = f * TAU / 4;
      P.ell(19, 26, 3, 3, '#fff6f9').line(19, 26, 19 + Math.round(Math.cos(a) * 3), 26 + Math.round(Math.sin(a) * 3), '#a51c30');
      P.r(9, 31, 9, 6, '#3a2433').r(10, 32, 7, 4, '#5b3a4c');
    });
  }
  const GACHA = [0, 1, 2, 3].map(gachaMachine);
  function capsule(col, open) {
    return A.sprite(10, 10, P => {
      if (open) { P.ell(5, 7, 4, 2, col).ell(5, 2, 4, 2, '#ffffff'); return; }
      P.ell(5, 5, 4, 4, '#ffffff').r(1, 5, 9, 4, col).ell(5, 6, 4, 3, col).r(1, 5, 9, 1, col).p(3, 2, '#ffffff');
    });
  }
  // ダンボール（届いた荷物）
  const BOX = A.sprite(16, 13, P => {
    P.r(0, 3, 16, 10, '#d9a066').r(0, 3, 16, 2, '#e8b47a').r(7, 3, 2, 10, '#f4e3c0');
    P.r(1, 1, 6, 2, '#e8b47a').r(9, 1, 6, 2, '#e8b47a');
    P.map(11, 7, ['x.x', 'xxx', '.x.'], { x: '#ff6f91' });
  });
  const BOX_OPEN = A.sprite(18, 14, P => {
    P.r(1, 4, 16, 10, '#d9a066').r(1, 4, 16, 2, '#c48a52');
    P.line(1, 4, 0, 0, '#e8b47a').line(2, 4, 1, 0, '#e8b47a').line(16, 4, 17, 0, '#e8b47a').line(15, 4, 16, 0, '#e8b47a');
  });
  const COIN = A.sprite(7, 7, P => { P.ell(3, 3, 3, 3, '#ffd166').r(2, 1, 1, 4, '#fff3c4').r(3, 2, 1, 3, '#e0a020'); });

  Object.assign(A, { SHOP_CAT, GACHA, capsule, BOX, BOX_OPEN, COIN });
})();
