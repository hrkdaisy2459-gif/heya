/* へや — お店の商品リスト（値段・説明・シリーズ・期間限定・ガチャ） */
(() => {
  'use strict';

  const SERIES = {
    luxe: { name: 'パステルリュクス', desc: 'ピンクとゴールドの、大人かわいい部屋', color: '#f2a7bd' },
    street: { name: 'アーバンヴィンテージ', desc: 'れんがとネオンの、ちょっとワルでかっこいい部屋', color: '#9a6240' },
    wa: { name: '和モダン', desc: '畳と行灯の、落ちつく和の部屋', color: '#5b8a6a' },
    china: { name: 'チャイナ', desc: '朱色と金の、あでやかな部屋', color: '#c0392b' },
    classic: { name: '定番', desc: 'いつでも買える人気の品', color: '#7ec4e8' },
    season: { name: '季節限定', desc: 'その季節だけお店に並ぶ', color: '#ff9f43' },
    capsule: { name: 'カプセルトイ', desc: 'ガチャでしか手に入らない小物', color: '#c9b8f0' },
  };
  // 揃えるとコインが増えるシリーズ
  const BONUS_SERIES = ['luxe', 'street', 'wa', 'china', 'classic', 'capsule'];

  const HALLOWEEN = { from: '10-01', to: '10-31', label: 'ハロウィン' };
  const XMAS = { from: '12-01', to: '12-25', label: 'クリスマス' };

  // [id, 値段, シリーズ, 説明, おまけ]
  const LIST = [
    ['fur:shellSofa', 680, 'luxe', 'ホタテ貝みたいな背もたれの、ベルベットのソファ。座るとちょっとお姫さま気分。'],
    ['fur:fringeLamp', 320, 'luxe', 'ゴールドのフリンジがゆれるフロアランプ。夜はやさしいピンクの光。'],
    ['fur:goldMirror', 260, 'luxe', '太陽みたいな形をした、ゴールドの壁掛けミラー。'],
    ['fur:tulipTable', 220, 'luxe', '大理石の天板に、ピンクのチューリップを三輪。'],
    ['fur:dresser', 540, 'luxe', '楕円の鏡がついたドレッサー。女の子がときどきおめかしする。'],
    ['wall:luxe', 380, 'luxe', '白い壁に、細いゴールドのモールディング。'],
    ['floor:herring', 360, 'luxe', 'ジグザグに組んだ、明るい木の床。'],
    ['outfit:frill', 420, 'luxe', '白いフリルブラウスに、ピンクのスカート。'],
    ['hairColor:milktea', 300, 'luxe', 'やわらかいミルクティー色の髪。'],

    ['fur:leatherSofa', 720, 'street', '使いこむほど味が出る、ブラウンのレザーソファ。'],
    ['fur:neon', 480, 'street', 'ピンクに光る「CHILL」のネオン。ときどきチカッとする。'],
    ['fur:record', 560, 'street', '木箱の上のレコードプレーヤー。', { bgm: 'lofi' }],
    ['fur:metalRack', 300, 'street', 'なんでも置けるメタルラック。木箱とラジカセつき。'],
    ['fur:drum', 240, 'street', 'ドラム缶を再利用したテーブル。'],
    ['fur:lights', 280, 'street', '電球がつらなるガーランドライト。夜に映える。'],
    ['fur:skate', 160, 'street', '壁に飾るスケートボード。'],
    ['wall:brick', 400, 'street', 'むき出しのれんがの壁。'],
    ['floor:concrete', 300, 'street', 'グレーのコンクリートの床。'],
    ['outfit:jacket', 640, 'street', '黒いライダースに、デニムのスカート。'],

    ['fur:chabudai', 240, 'wa', 'まるいちゃぶ台。お茶と湯のみつき。'],
    ['fur:zabuton', 80, 'wa', 'むらさきの座布団。いくつあってもいい。'],
    ['fur:andon', 300, 'wa', '和紙ごしにぼんやり光る行灯。'],
    ['fur:kakejiku', 220, 'wa', '赤い日の出と山の掛け軸。'],
    ['fur:bonsai', 260, 'wa', '小さくても立派な松の盆栽。'],
    ['fur:manekineko', 600, 'wa', '左手をあげた招き猫。', { passive: 1 }],
    ['outfit:kimono', 720, 'wa', '桜色の着物と、金の帯。'],

    ['fur:roundWindow', 520, 'china', '格子の入った丸い窓。空の色が変わる。'],
    ['fur:lantern', 280, 'china', 'ふたつ並んだ赤い提灯。夜に光る。'],
    ['fur:screen', 460, 'china', '梅の枝が描かれた屏風。'],
    ['fur:chinaTable', 380, 'china', '赤い円卓と、ジャスミンティー。'],
    ['fur:birdcage', 500, 'china', '金の鳥かごと、黄色い小鳥。', { bgm: 'birds' }],
    ['fur:vase', 200, 'china', '青磁の壺に、梅のひと枝。'],
    ['wall:china', 420, 'china', '朱色の壁に、金の雷文。'],
    ['outfit:chinaDress', 680, 'china', '赤いチャイナドレス。金のふちどり。'],
    ['hair:bun', 400, 'china', 'ふたつのおだんごヘア。'],

    ['fur:coffee', 450, 'classic', '香りで集中力アップ。', { focus: 0.1 }],
    ['fur:fishbowl', 400, 'classic', '金魚のきんちゃんが泳ぐ金魚鉢。'],
    ['outfit:pink', 200, 'classic', 'ふんわりピンクのワンピース。'],
    ['outfit:sailor', 450, 'classic', '紺のセーラー服。'],
    ['outfit:maid', 600, 'classic', '黒いワンピースに白いエプロンのメイド服。'],
    ['hair:twin', 350, 'classic', '元気なツインテール。'],
    ['hairColor:pink', 250, 'classic', 'ピンクの髪。'],
    ['hairColor:aqua', 300, 'classic', 'みずいろの髪。'],
    ['hairColor:silver', 350, 'classic', 'ぎんいろの髪。'],
    ['wall:stars', 500, 'classic', '夜空と星の壁紙。'],

    ['fur:pumpkin', 300, 'season', 'にやっと笑うかぼちゃランタン。夜に光る。', { limited: HALLOWEEN }],
    ['fur:ghost', 180, 'season', 'ちっともこわくない、おばけのぬいぐるみ。', { limited: HALLOWEEN }],
    ['outfit:witch', 600, 'season', 'むらさきの魔女っ子ワンピース。', { limited: HALLOWEEN }],
    ['fur:xmasTree', 800, 'season', '電球がまたたくクリスマスツリー。', { limited: XMAS }],
    ['outfit:santa', 600, 'season', '白いファーの、赤いサンタ服。', { limited: XMAS }],

    // ガチャ専用（値段 0 = お店では買えない）
    ['fur:bear', 0, 'capsule', 'ふわふわのくまのぬいぐるみ。', { rarity: 'N' }],
    ['fur:rabbit', 0, 'capsule', '耳の長いうさぎのぬいぐるみ。', { rarity: 'N' }],
    ['fur:duck', 0, 'capsule', 'おふろのアヒル。', { rarity: 'N' }],
    ['fur:cactus', 0, 'capsule', '花が咲いた小さなサボテン。', { rarity: 'N' }],
    ['fur:candle', 0, 'capsule', '小さなキャンドル。夜に灯る。', { rarity: 'N' }],
    ['fur:books', 0, 'capsule', '読みかけの本の山。', { rarity: 'N' }],
    ['fur:globe', 0, 'capsule', 'くるくる回る地球儀。', { rarity: 'N' }],
    ['fur:penguin', 0, 'capsule', 'よちよち歩くペンギン。', { rarity: 'R' }],
    ['fur:lavaLamp', 0, 'capsule', 'とろとろ動くラバランプ。', { rarity: 'R' }],
    ['fur:boombox', 0, 'capsule', 'レトロなラジカセ。', { rarity: 'R' }],
    ['fur:discoBall', 0, 'capsule', 'きらきら回るミラーボール。', { rarity: 'SR' }],
    ['fur:goldCat', 0, 'capsule', 'ぴかぴかの金の招き猫。', { rarity: 'SR', passive: 3 }],
  ];
  const ITEMS = LIST.map(([id, price, series, desc, extra = {}]) => {
    const [kind, ref] = id.split(':');
    return { id, kind, ref, price, series, desc, ...extra };
  });
  const BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

  const GACHA_PRICE = 50;
  const RARITY = { N: { name: 'ノーマル', w: 70, back: 20, col: '#8fd3f0' }, R: { name: 'レア', w: 25, back: 40, col: '#ff9fb6' }, SR: { name: 'スーパーレア', w: 5, back: 120, col: '#ffd166' } };

  // その日ごとに同じ結果になる乱数
  function seeded(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  }

  window.HeyaShop = { SERIES, BONUS_SERIES, ITEMS, BY_ID, GACHA_PRICE, RARITY, seeded };
})();
