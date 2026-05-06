/* ============================================================
   关卡一·陷阱魔王 — 4 步流程控制器
   1.1 翻牌识陷阱
   1.2 故事浓缩条
   1.3 道理点睛
   1.4 公式合成
   ============================================================ */
(function () {
  const C = window.Content.level1;
  const totalSteps = 4;
  const HERO_HP_MAX = 100;
  const BOSS_HP_MAX = 120;

  // —— 状态 ——
  const S = {
    step: 1,
    bossHp: BOSS_HP_MAX,
    heroHp: HERO_HP_MAX,
    chosenOpt: null,    // 'A' or 'B'
    coreParaIds: [],    // user-selected core paragraphs
    moralWord: null,    // dragged moral
    formulaFilled: { opt: '', action: '', trait: '', title: '' },
  };

  // —— DOM refs ——
  const $center = document.querySelector('.lv-center');
  const $stepDots = [...document.querySelectorAll('.step-dot')];
  const $stepLines = [...document.querySelectorAll('.step-line')];
  const $stepHint = document.querySelector('.lv-step-hint .text');
  const $stepNum = document.querySelector('.lv-step-hint .num');
  const $heroHp = document.querySelector('.fighter.is-hero .hpnum');
  const $heroFill = document.querySelector('.fighter.is-hero .hpbar > .fill');
  const $bossHp = document.querySelector('.fighter.is-boss .hpnum');
  const $bossFill = document.querySelector('.fighter.is-boss .hpbar > .fill');
  const $progressFill = document.querySelector('.lv-progress .bar > span');
  const $bossEl = document.querySelector('.fighter.is-boss');
  const $heroEl = document.querySelector('.fighter.is-hero');

  // —— UI 同步 ——
  function syncStepIndicator() {
    $stepDots.forEach((d, i) => {
      const idx = i + 1;
      d.dataset.state = idx < S.step ? 'done' : (idx === S.step ? 'current' : '');
    });
    $stepLines.forEach((l, i) => l.classList.toggle('done', i + 1 < S.step));
    $progressFill.style.width = `${((S.step - 1) / totalSteps) * 100}%`;
  }

  function setHpBoss(v) {
    S.bossHp = Math.max(0, v);
    $bossHp.textContent = `${S.bossHp}/${BOSS_HP_MAX}`;
    $bossFill.style.width = (S.bossHp / BOSS_HP_MAX * 100) + '%';
    $bossEl.classList.add('is-hit');
    setTimeout(() => $bossEl.classList.remove('is-hit'), 320);
  }
  function setStepHint(num, text) {
    $stepNum.textContent = `第 ${num} 步`;
    $stepHint.textContent = text;
  }

  // —— 动画 —— pane 切换 ——
  function swapPane(html) {
    const old = $center.querySelector('.step-pane');
    if (old) {
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 280);
    }
    const tpl = document.createElement('template');
    tpl.innerHTML = `<div class="step-pane is-in">${html}</div>`;
    $center.appendChild(tpl.content.firstElementChild);
  }

  // ============================================================
  // STEP 1.1 — 翻牌识陷阱
  // ============================================================
  function renderStep1() {
    setStepHint(1, '翻开两张牌 — 哪一张才是文章真正的主旨？');
    syncStepIndicator();

    const cardsHtml = C.options.map(o => `
      <div class="flip-card" data-id="${o.id}" data-kind="${o.isAnswer ? 'answer' : 'trap'}" data-revealed="false">
        <div class="face front">
          <div class="icon">${o.icon}</div>
          <div class="label">${o.text}</div>
        </div>
        <div class="face back">
          <div class="lab-big">${o.text}</div>
          <div class="lab-sub">${o.label}</div>
        </div>
      </div>
    `).join('');

    swapPane(`
      <h3>翻牌识陷阱</h3>
      <div class="flip-cards">${cardsHtml}</div>
      <button type="button" class="next-btn" id="next-1" disabled>下一步 ▶</button>
    `);

    setTimeout(() => {
      const cards = [...$center.querySelectorAll('.flip-card')];
      let revealed = 0;
      cards.forEach(c => {
        c.addEventListener('click', () => {
          if (c.dataset.revealed === 'true') return;
          c.dataset.revealed = 'true';
          window.SFX && window.SFX.flip();
          revealed++;
          if (revealed === cards.length) {
            // both flipped → highlight
            setTimeout(() => {
              cards.forEach(card => {
                if (card.dataset.kind === 'answer') {
                  card.dataset.elevated = 'true';
                } else {
                  card.dataset.faded = 'true';
                }
              });
              S.chosenOpt = C.options.find(o => o.isAnswer).id;
              S.formulaFilled.opt = C.options.findIndex(o => o.isAnswer) + 1 + ''; // 2
              S.formulaFilled.title = C.options.find(o => o.isAnswer).text;
              setHpBoss(S.bossHp - 30);
              document.getElementById('next-1').disabled = false;
            }, 600);
          }
        });
      });
      document.getElementById('next-1').addEventListener('click', () => {
        S.step = 2; renderStep2();
      });
    }, 50);
  }

  // ============================================================
  // STEP 1.2 — 故事浓缩条
  // ============================================================
  function renderStep2() {
    setStepHint(2, '从六段故事里，留下「打碎 → 撒谎 → 坦白」三段核心。点击段落把它划入或移出核心区。');
    syncStepIndicator();

    const paragraphs = window.Content.paragraphs;
    const html = paragraphs.map(p => {
      const isCore = C.coreParagraphs.includes(p.id);
      const short = p.text.slice(0, 38) + (p.text.length > 38 ? '…' : '');
      return `<div class="para-card" data-id="${p.id}" data-iscore="${isCore}">
        <span class="pno">第${'一二三四五六'[p.id-1]}段</span>${short}
      </div>`;
    }).join('');

    swapPane(`
      <h3>故事浓缩条</h3>
      <div class="story-strip">
        <div class="lane" id="strip-lane">${html}</div>
      </div>
      <div style="font-size:18px;color:var(--c-text-soft);letter-spacing:.1em;text-align:center;">
        点击核心段落让它发光（金色边框） · 留下「打碎花瓶 / 撒谎隐瞒 / 坦白被原谅」三段
      </div>
      <button type="button" class="next-btn" id="next-2" disabled>下一步 ▶</button>
    `);

    setTimeout(() => {
      const cards = [...$center.querySelectorAll('.para-card')];
      const tryEnable = () => {
        const correctSet = new Set(C.coreParagraphs);
        const picked = cards.filter(c => c.classList.contains('is-core')).map(c => +c.dataset.id);
        const ok = picked.length === correctSet.size && picked.every(id => correctSet.has(id));
        document.getElementById('next-2').disabled = !ok;
      };
      cards.forEach(c => {
        c.addEventListener('click', () => {
          c.classList.toggle('is-core');
          window.SFX && window.SFX.select();
          tryEnable();
        });
      });
      document.getElementById('next-2').addEventListener('click', () => {
        S.coreParaIds = [...C.coreParagraphs];
        S.formulaFilled.action = '向妈妈坦白一切';
        setHpBoss(S.bossHp - 30);
        S.step = 3; renderStep3();
      });
    }, 50);
  }

  // ============================================================
  // STEP 1.3 — 道理点睛
  // ============================================================
  function renderStep3() {
    setStepHint(3, '飘动的品格气泡里，把"诚实"拖到中央金奖章上。');
    syncStepIndicator();

    const bubbles = C.moralBubbles.map((b, i) => {
      const angle = (i / C.moralBubbles.length) * Math.PI * 2;
      const r = 240;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      return `<div class="bubble" data-correct="${b.isAnswer}" data-word="${b.word}"
                   style="left: calc(50% + ${x}px); top: calc(50% + ${y}px); transform: translate(-50%, -50%); animation-delay: ${i * 0.3}s;">
        ${b.word}
      </div>`;
    }).join('');

    swapPane(`
      <h3>道理点睛</h3>
      <div class="bubble-stage" id="bubble-stage">
        <div class="medal" id="medal">主旨</div>
        ${bubbles}
      </div>
      <div style="font-size:18px;color:var(--c-text-soft);letter-spacing:.1em;text-align:center;">
        把代表本文道理的词拖到金奖章 · 错的会弹回不判错
      </div>
    `);

    setTimeout(() => {
      const stage = document.getElementById('bubble-stage');
      const medal = document.getElementById('medal');
      const bubbleEls = [...stage.querySelectorAll('.bubble')];

      bubbleEls.forEach(b => {
        b.addEventListener('mousedown', e => startDrag(e, b));
        b.addEventListener('touchstart', e => startDrag(e, b), { passive: false });
      });

      function startDrag(e, b) {
        e.preventDefault();
        const rect = b.getBoundingClientRect();
        const ox = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left - rect.width / 2;
        const oy = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top - rect.height / 2;
        const startLeft = b.style.left, startTop = b.style.top, startTransform = b.style.transform;
        b.style.animation = 'none';
        b.style.zIndex = 99;

        function move(ev) {
          ev.preventDefault();
          const cx = ev.touches?.[0]?.clientX ?? ev.clientX;
          const cy = ev.touches?.[0]?.clientY ?? ev.clientY;
          const sr = stage.getBoundingClientRect();
          b.style.left = (cx - sr.left - ox) + 'px';
          b.style.top  = (cy - sr.top - oy) + 'px';
          b.style.transform = 'translate(-50%, -50%)';
        }
        function end(ev) {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('touchmove', move);
          document.removeEventListener('mouseup', end);
          document.removeEventListener('touchend', end);
          // hit test
          const br = b.getBoundingClientRect();
          const mr = medal.getBoundingClientRect();
          const cx = br.left + br.width/2, cy = br.top + br.height/2;
          const dx = cx - (mr.left + mr.width/2), dy = cy - (mr.top + mr.height/2);
          const dist = Math.hypot(dx, dy);
          if (dist < mr.width/2 + 20) {
            // dropped on medal
            if (b.dataset.correct === 'true') {
              window.SFX && window.SFX.win();
              b.classList.add('is-merged');
              medal.dataset.fill = 'true';
              medal.textContent = b.dataset.word;
              S.moralWord = b.dataset.word;
              S.formulaFilled.trait = b.dataset.word;
              setHpBoss(S.bossHp - 30);
              setTimeout(() => { S.step = 4; renderStep4(); }, 800);
            } else {
              window.SFX && window.SFX.nudge();
              b.style.left = startLeft; b.style.top = startTop; b.style.transform = startTransform;
              b.classList.add('is-bounce'); setTimeout(() => b.classList.remove('is-bounce'), 480);
              b.style.animation = '';
            }
          } else {
            // returned
            window.SFX && window.SFX.drop();
            b.style.left = startLeft; b.style.top = startTop; b.style.transform = startTransform;
            b.style.animation = '';
          }
          b.style.zIndex = '';
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', end);
        document.addEventListener('touchend', end);
      }
    }, 50);
  }

  // ============================================================
  // STEP 1.4 — 公式合成
  // ============================================================
  function renderStep4() {
    setStepHint(4, '满分答案模板自动浮现 — 前三关的产出物已嵌入空格。');
    syncStepIndicator();

    const f = S.formulaFilled;
    const formula = `我选择（选项 <span class="blank">${f.opt}</span>）。因为短文主要讲述了「我」在客厅踢球时不小心打碎了妈妈心爱的花瓶并撒谎隐瞒，但最后因为心里难受，决定 <span class="blank">${f.action}</span>。这让我明白了即使做错了事，只要勇于坦白，这份 <span class="blank">${f.trait}</span> 的品格比任何物品都更加珍贵。所以，「<span class="blank">${f.title}</span>」最能概括文章的核心思想，是最适合的题目。`;

    swapPane(`
      <h3>公式合成 · 满分答案</h3>
      <div class="formula">${formula}</div>
      <button type="button" class="next-btn" id="finish-1">⚔ 击败陷阱魔王</button>
    `);

    setTimeout(() => {
      document.getElementById('finish-1').addEventListener('click', () => {
        setHpBoss(0);
        $progressFill.style.width = '100%';
        // syncStepIndicator after marking done
        $stepDots.forEach(d => d.dataset.state = 'done');
        $stepLines.forEach(l => l.classList.add('done'));
        setTimeout(() => {
          window.Victory.show({ level: 1, homeHref: '../index.html', nextHref: './level2.html' });
        }, 600);
      });
    }, 50);
  }

  // —— 老师工具：标准答案 ——
  function showStandardAnswer() {
    const f = window.Content.level1.answers;
    window.Victory.showAnswer({
      html: `
      <p><b style="color:var(--c-cyan)">题目：</b>从两个选项中选一个最适合的题目并说明理由。</p>
      <p><b style="color:var(--c-yellow)">选项 1：</b>打碎的花瓶 <span style="color:var(--c-text-soft)">（表面物品 · 陷阱）</span></p>
      <p><b style="color:var(--c-yellow)">选项 2：</b>诚实的可贵 <span style="color:var(--c-gold)">（深层主旨 · 答案）</span></p>
      <hr style="border-color:rgba(255,217,61,.3);margin:14px 0;">
      <p><b style="color:var(--c-gold)">满分答案模板：</b></p>
      <p style="font-size:22px;line-height:1.7;">
        我选择（选项 <b style="color:var(--c-yellow)">${f.opt}</b>）。因为短文主要讲述了「我」在客厅踢球时不小心打碎了妈妈心爱的花瓶并撒谎隐瞒，但最后因为心里难受，决定<b style="color:var(--c-yellow)">${f.action}</b>。这让我明白了即使做错了事，只要勇于坦白，这份<b style="color:var(--c-yellow)">${f.trait}</b>的品格比任何物品都更加珍贵。所以，「<b style="color:var(--c-yellow)">${f.title}</b>」最能概括文章的核心思想，是最适合的题目。
      </p>
      `
    });
  }

  // —— 启动 ——
  // 跳过键 → 直接到下一步（保留课堂可控性）
  window.addEventListener('tt:skip', () => {
    if (S.step < 4) { S.step++; [renderStep1, renderStep2, renderStep3, renderStep4][S.step - 1](); }
  });

  window.LV1 = { renderStep1, renderStep2, renderStep3, renderStep4, showStandardAnswer, _state: S };
})();
