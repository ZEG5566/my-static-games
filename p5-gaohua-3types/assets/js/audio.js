/* ============================================================
   音效系统：WebAudio 合成短音（≤ 1.5s），无外部资源
   尊重 GameState.isMuted()
   ============================================================ */
(function () {
  let ctx = null;
  function ensure() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq=440, dur=0.18, type='sine', vol=0.35, glide=null, when=0 }) {
    if (window.GameState && window.GameState.isMuted()) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ dur=0.12, vol=0.18, when=0, hp=2000 }) {
    if (window.GameState && window.GameState.isMuted()) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + when;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hp;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(c.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  const SFX = {
    flip()   { tone({ freq: 880, dur: 0.12, type: 'triangle', vol: .25, glide: 1320 }); },
    drop()   { tone({ freq: 660, dur: 0.10, type: 'triangle', vol: .25, glide: 990 }); },
    nudge()  { tone({ freq: 220, dur: 0.18, type: 'sine', vol: .25, glide: 160 }); },
    overcap(){ tone({ freq: 180, dur: 0.10, type: 'square', vol: .15 }); },
    select() { tone({ freq: 540, dur: 0.07, type: 'square', vol: .14 }); },
    step()   { tone({ freq: 740, dur: 0.10, type: 'triangle', vol: .22, glide: 1100 }); },
    win() {
      // 三连音 + 闪光（≤ 1.5s）
      tone({ freq: 523, dur: .14, type: 'triangle', vol: .28, when: 0 });
      tone({ freq: 659, dur: .14, type: 'triangle', vol: .28, when: .12 });
      tone({ freq: 784, dur: .26, type: 'triangle', vol: .32, when: .24, glide: 1046 });
      noise({ dur: .25, vol: .14, when: .25, hp: 4000 });
    },
    rankup() {
      tone({ freq: 392, dur: .14, type: 'square', vol: .22, when: 0 });
      tone({ freq: 587, dur: .14, type: 'square', vol: .22, when: .14 });
      tone({ freq: 784, dur: .22, type: 'square', vol: .26, when: .28 });
      tone({ freq: 1046, dur: .42, type: 'triangle', vol: .3, when: .5, glide: 1568 });
    },
  };

  window.SFX = SFX;
})();
