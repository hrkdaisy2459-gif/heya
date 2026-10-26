/* へや — 音（アラームの音、お知らせの音、BGM）
   音声ファイルは使わず、すべてブラウザの中で作る。 */
(() => {
  'use strict';

  let ctx = null, master = null, noiseBuf = null;
  let host = window; // 小窓のときは小窓のタイマーで動かす（裏のタブは遅れるため）

  function unlock() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      if (want && !cur) play(want);
    } catch { /* 音が使えない環境 */ }
    return !!ctx;
  }

  /* ---------- 短い音 ---------- */
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function tone(t, hz, len, type = 'square', vol = 0.08, dest) {
    const os = ctx.createOscillator(), g = ctx.createGain();
    os.type = type; os.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    os.connect(g).connect(dest || ctx.destination);
    os.start(t); os.stop(t + len + 0.02);
  }
  function seq(notes, type, vol, step = 0.12, len = 0.1) {
    if (!ctx && !unlock()) return;
    const t0 = ctx.currentTime + 0.02;
    notes.forEach((m, i) => m && tone(t0 + i * step, mtof(m), len, type, vol));
  }
  const alarm = () => seq([83, 88, 83, 88], 'square', 0.08, 0.12, 0.1);           // ピピピピ
  const CHIMES = {
    work: () => seq([72, 76, 79, 84], 'triangle', 0.18, 0.11, 0.25),                // 集中スタート
    break: () => seq([84, 79, 76, 72], 'triangle', 0.18, 0.13, 0.3),                // 休憩
    remind: () => seq([79, 84], 'sine', 0.2, 0.18, 0.4),                             // お知らせ
    reward: () => seq([72, 76, 79, 84, 0, 79, 84], 'square', 0.06, 0.09, 0.12),      // ごほうび
  };
  const chime = k => (CHIMES[k] || CHIMES.remind)();
  // お買い物の音
  const coin = () => seq([88, 95], 'square', 0.05, 0.07, 0.12);
  const gacha = () => seq([60, 62, 60, 62, 60, 62, 64], 'square', 0.035, 0.07, 0.05);
  const unbox = () => seq([67, 72, 79], 'triangle', 0.16, 0.08, 0.22);
  const reveal = r => (r === 'SR' ? seq([72, 76, 79, 84, 88, 91, 96], 'square', 0.06, 0.08, 0.16)
    : r === 'R' ? seq([72, 76, 79, 84], 'square', 0.06, 0.09, 0.14) : seq([72, 76, 79], 'triangle', 0.15, 0.09, 0.2));

  /* ---------- BGM ---------- */
  const BGM_LIST = { rain: '雨の音', fire: '焚き火', waves: '波の音', bugs: '虫の声', music: 'オルゴール', lofi: 'ローファイ', birds: '小鳥のさえずり' };
  let cur = null, want = null, nodes = [], timer = 0, timerHost = null, vol = 0.5, bgmGain = null;

  function noise() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(); nodes.push(s); return s; }
  function filt(type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function burst(t, len, ftype, f, q, v) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const b = filt(ftype, f, q), g = ctx.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(b).connect(g).connect(bgmGain);
    s.start(t, Math.random() * 1.5); s.stop(t + len + 0.02);
  }

  // それぞれの BGM：start で常に鳴る音を作り、tick(t) で次の 0.6 秒ぶんの音を予約する
  const MUSIC = {
    mel: [72, 76, 79, 76, 77, 76, 74, 0, 72, 76, 81, 79, 76, 74, 72, 0, 69, 72, 77, 76, 74, 72, 74, 0, 71, 74, 79, 77, 76, 74, 72, 0],
    bass: [[48, 55, 60, 55], [45, 52, 57, 52], [41, 48, 53, 48], [43, 50, 55, 50]],
  };
  const KINDS = {
    rain: {
      start() { noise().connect(filt('highpass', 400)).connect(filt('lowpass', 2600)).connect(gain(0.22)).connect(bgmGain); noise().connect(filt('lowpass', 500)).connect(gain(0.25)).connect(bgmGain); },
      tick(t, st) { while (st.next < t + 0.6) { burst(st.next, 0.03, 'bandpass', 2000 + Math.random() * 3000, 6, 0.12 + Math.random() * 0.1); st.next += 0.04 + Math.random() * 0.18; } },
    },
    fire: {
      start() { noise().connect(filt('lowpass', 280)).connect(gain(0.6)).connect(bgmGain); },
      tick(t, st) { while (st.next < t + 0.6) { burst(st.next, 0.006 + Math.random() * 0.02, 'highpass', 1500, 0.7, 0.1 + Math.random() * 0.35); st.next += 0.04 + Math.random() * 0.3; } },
    },
    waves: {
      start() {
        // 低いザーッという音と、波が砕けるシャーッという音。どちらもゆっくり寄せては返す
        const g = gain(0.7), g2 = gain(0.22);
        noise().connect(filt('lowpass', 900)).connect(g).connect(bgmGain);
        noise().connect(filt('bandpass', 2500, 0.6)).connect(g2).connect(bgmGain);
        const lfo = ctx.createOscillator(), depth = gain(0.55), depth2 = gain(0.2);
        lfo.frequency.value = 0.1; lfo.connect(depth).connect(g.gain); lfo.connect(depth2).connect(g2.gain); lfo.start(); nodes.push(lfo);
      },
      tick() {},
    },
    bugs: {
      start() { noise().connect(filt('lowpass', 180)).connect(gain(0.05)).connect(bgmGain); },
      tick(t, st) {
        while (st.next < t + 0.6) {
          const hz = 4000 + Math.random() * 800;
          for (let i = 0; i < 3; i++) tone(st.next + i * 0.07, hz, 0.04, 'sine', 0.03, bgmGain);
          st.next += 0.5 + Math.random() * 1.2;
        }
      },
    },
    lofi: {
      // ゆったりしたローファイ（コード・ドラム・レコードのノイズ）
      start() { noise().connect(filt('bandpass', 3000, 0.5)).connect(gain(0.012)).connect(bgmGain); },
      tick(t, st) {
        const step = 60 / 72 / 2;
        const CH = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
        const PENTA = [72, 74, 76, 79, 81];
        while (st.next < t + 0.6) {
          const i = st.i, b = i % 8, bar = Math.floor(i / 8) % 4, at = st.next + (b % 2 ? 0.04 : 0);
          if (b === 0) { CH[bar].forEach(m => tone(at, mtof(m), 2.4, 'triangle', 0.03, bgmGain)); tone(at, mtof(CH[bar][0] - 12), 1.6, 'sine', 0.09, bgmGain); }
          if (b === 0 || b === 5) kick(at);
          if (b === 2 || b === 6) burst(at, 0.14, 'bandpass', 1800, 1, 0.12);
          burst(at, 0.025, 'highpass', 7000, 0.7, b % 2 ? 0.025 : 0.04);
          if (Math.random() < 0.18) tone(at, mtof(pick(PENTA)), 0.5, 'sine', 0.035, bgmGain);
          if (Math.random() < 0.3) burst(at + 0.1, 0.004, 'highpass', 2500, 0.7, 0.05);
          st.i++; st.next += step;
        }
      },
    },
    birds: {
      start() { noise().connect(filt('lowpass', 400)).connect(gain(0.05)).connect(bgmGain); },
      tick(t, st) {
        while (st.next < t + 0.6) {
          const n = 2 + Math.floor(Math.random() * 4), base = 2400 + Math.random() * 1600;
          for (let k = 0; k < n; k++) chirp(st.next + k * 0.11, base * (1 + (k % 2) * 0.12));
          st.next += 0.4 + Math.random() * 2.2;
        }
      },
    },
    music: {
      start() {},
      tick(t, st) {
        const step = 60 / 84 / 2; // 8分音符
        while (st.next < t + 0.6) {
          const i = st.i % 32, m = MUSIC.mel[i];
          if (m) { tone(st.next, mtof(m), 0.9, 'sine', 0.09, bgmGain); tone(st.next, mtof(m + 12), 0.4, 'sine', 0.025, bgmGain); }
          if (i % 2 === 0) { const b = MUSIC.bass[Math.floor(i / 8)][(i / 2) % 4]; tone(st.next, mtof(b), 0.6, 'triangle', 0.05, bgmGain); }
          st.i++; st.next += step;
        }
      },
    },
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function kick(t) {
    const os = ctx.createOscillator(), g = ctx.createGain();
    os.frequency.setValueAtTime(110, t); os.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    os.connect(g).connect(bgmGain); os.start(t); os.stop(t + 0.3);
  }
  function chirp(t, f) {
    const os = ctx.createOscillator(), g = ctx.createGain();
    os.type = 'sine';
    os.frequency.setValueAtTime(f, t); os.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.04); os.frequency.exponentialRampToValueAtTime(f * 1.1, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    os.connect(g).connect(bgmGain); os.start(t); os.stop(t + 0.1);
  }
  function stopNodes() {
    if (timer) timerHost.clearInterval(timer); timer = 0;
    nodes.forEach(n => { try { n.stop(); } catch { /* 停止済み */ } });
    nodes = [];
    if (bgmGain) { try { bgmGain.disconnect(); } catch { /* なし */ } bgmGain = null; }
  }
  function play(kind) {
    want = kind;
    if (!ctx || ctx.state !== 'running') return; // 最初のクリックのあとで鳴らす
    stopNodes();
    cur = kind;
    const K = KINDS[kind];
    if (!K) return;
    bgmGain = ctx.createGain(); bgmGain.gain.value = vol; bgmGain.connect(master);
    K.start();
    const st = { next: ctx.currentTime + 0.05, i: 0 };
    const run = () => K.tick(ctx.currentTime, st);
    run(); timerHost = host; timer = host.setInterval(run, 200);
  }
  function stop() { want = null; cur = null; stopNodes(); }
  function setVolume(v) { vol = v; if (bgmGain) bgmGain.gain.value = v; }
  function setHost(w) { host = w; if (cur) { const k = cur; stopNodes(); cur = null; play(k); } }

  window.HeyaSound = { unlock, alarm, chime, coin, gacha, unbox, reveal, BGM_LIST, play, stop, setVolume, setHost, playing: () => cur || want };
})();
