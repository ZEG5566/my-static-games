/* ============================================================
   关卡二·迷雾魔王 — 3 步流程（Q2 + Q3 共用模板）
   2.1 现场勘察 — 线索 → 槽位（是谁/事件/情绪）
   2.2 情绪温度计 — 圈选词云 + 温度计指针
   2.3 公式合成
   ============================================================ */
(function () {
  const Q = window.Content.level2.questions;
  const totalSteps = 3;
  const HERO_HP_MAX = 100;
  const BOSS_HP_MAX = 110;

  const S = {
    qIdx: 0,
    step: 1,
    bossHp: BOSS_HP_MAX,
    slots: { who: '我', event: '', emo: '' },
    emoSel: [],
  };

  const $center = document.querySelector('.lv-center');
  const $stepDots = [...document.querySelectorAll('.step-dot')];
  const $stepLines = [...document.querySelectorAll('.step-line')];
  const $stepHint = document.querySelector('.lv-step-hint .text');
  const $stepNum = document.querySelector('.lv-step-hint .num');
  const $bossHp = document.querySelector('.fighter.is-boss .hpnum');
  const $bossFill = document.querySelector('.fighter.is-boss .hpbar > .fill');
  const $progressFill = document.querySelector('.lv-progress .bar > span');
  const $bossEl = document.querySelector('.fighter.is-boss');
  const $title = document.querySelector('.lv-title .name');

  function syncSteps() {
    $stepDots.forEach((d, i) => {
      const idx = i + 1;
      d.dataset.state = idx < S.step ? 'done' : (idx === S.step ? 'current' : '');
    });
    $stepLines.forEach((l, i) => l.classList.toggle('done', i + 1 < S.step));
    const totalProgress = S.qIdx * totalSteps + (S.step - 1);
    $progressFill.style.width = `${(totalProgress / (Q.length * totalSteps)) * 100}%`;
  }

  function setBoss(v) {
    S.bossHp = Math.max(0, v);
    $bossHp.textContent = `${S.bossHp}/${BOSS_HP_MAX}`;
    $bossFill.style.width = (S.bossHp / BOSS_HP_MAX * 100) + '%';
    $bossEl.classList.add('is-hit');
    setTimeout(() => $bossEl.classList.remove('is-hit'), 320);
  }
  function setHint(num, text) {
    $stepNum.textContent = `第 ${num} 步`;
    $stepHint.textContent = text;
  }

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

  function setQTitle() {
    const q = Q[S.qIdx];
    $title.innerHTML = `<span class="small">第二座山 · Q${S.qIdx + 2}</span>解释「${q.phrase}」`;
  }

  // ============================================================
  // 2.1 现场勘察 — 拖线索到三槽
  // ============================================================
  function renderStep1() {
    setQTitle();
    setHint(1, `把原文线索拖到下面三个槽：是谁 / 发生了什么事 / 真实情绪。`);
    S.slots = { who: '我', event: '', emo: '' };
    syncSteps();

    const q = Q[S.qIdx];
    // 线索池 = 正确 + 干扰 混合
    const clues = [...q.clueCorrect, ...q.clueDistractor]
      .sort(() => Math.random() - 0.5)
      .map((c, i) => `<div class="clue-card" draggable="true" data-text="${c}" data-correct="${q.clueCorrect.includes(c)}">${c}</div>`)
      .join('');

    swapPane(`
      <h3>现场勘察 · ${q.from}</h3>
      <div class="slot-row">
        <div class="slot" data-key="who" data-filled="true">
          <div class="slab">是 谁</div>
          <div class="filled-text">我</div>
        </div>
        <div class="slot" data-key="event" data-filled="false">
          <div class="slab">发生了什么</div>
          <div class="filled-text" style="color:var(--c-text-dim);">把原文线索拖到这里</div>
        </div>
        <div class="slot" data-key="emo" data-filled="false">
          <div class="slab">真实情绪</div>
          <div class="filled-text" style="color:var(--c-text-dim);">下一步用温度计圈选</div>
        </div>
      </div>
      <div class="clue-pool">${clues}</div>
      <button type="button" class="next-btn" id="next-1" disabled>下一步 ▶</button>
    `);

    setTimeout(() => {
      const slots = [...$center.querySelectorAll('.slot')];
      const cards = [...$center.querySelectorAll('.clue-card')];
      const eventSlot = $center.querySelector('.slot[data-key="event"]');

      cards.forEach(card => {
        card.addEventListener('dragstart', e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.dataset.text);
          card.dataset.dragging = 'true';
        });
        card.addEventListener('dragend', () => { delete card.dataset.dragging; });
        // 也支持点击直接落入
        card.addEventListener('click', () => fillEvent(card));
      });

      function fillEvent(card) {
        if (card.dataset.correct === 'true') {
          eventSlot.dataset.filled = 'true';
          eventSlot.querySelector('.filled-text').textContent = card.dataset.text;
          eventSlot.querySelector('.filled-text').style.color = '';
          card.classList.add('is-used');
          window.SFX && window.SFX.drop();
          S.slots.event = card.dataset.text;
          document.getElementById('next-1').disabled = false;
        } else {
          card.classList.add('is-bounce');
          setTimeout(() => card.classList.remove('is-bounce'), 480);
          window.SFX && window.SFX.nudge();
        }
      }

      eventSlot.addEventListener('dragover', e => { e.preventDefault(); eventSlot.classList.add('is-hover'); });
      eventSlot.addEventListener('dragleave', () => eventSlot.classList.remove('is-hover'));
      eventSlot.addEventListener('drop', e => {
        e.preventDefault();
        eventSlot.classList.remove('is-hover');
        const text = e.dataTransfer.getData('text/plain');
        const card = cards.find(c => c.dataset.text === text);
        if (card) fillEvent(card);
      });

      document.getElementById('next-1').addEventListener('click', () => {
        setBoss(S.bossHp - 18);
        S.step = 2; renderStep2();
      });
    }, 50);
  }

  // ============================================================
  // 2.2 情绪温度计
  // ============================================================
  function renderStep2() {
    setHint(2, '在词云里圈出"真实情绪/状态" — 多选 2–3 个词，温度计指针上滑到位即过关。');
    syncSteps();

    const q = Q[S.qIdx];
    const allEmos = [...q.emotionRight, ...q.emotionWrong].sort(() => Math.random() - 0.5);
    const chips = allEmos.map(w => {
      const correct = q.emotionRight.includes(w);
      return `<div class="emo-chip" data-on="false" data-correct="${correct}" data-word="${w}">${w}</div>`;
    }).join('');

    swapPane(`
      <h3>情绪温度计</h3>
      <div class="thermo-wrap">
        <div class="thermo">
          <div class="liquid"></div>
          <div class="marks"></div>
          <div class="label-top" id="thermo-label">极度</div>
        </div>
        <div class="emotion-cloud">${chips}</div>
      </div>
      <div style="font-size:18px; color:var(--c-text-soft); letter-spacing:.1em; text-align:center;">
        圈出 <b style="color:var(--c-yellow)">2 个以上</b>"真实情绪"词 → 温度计指针达到顶端即可过关
      </div>
      <button type="button" class="next-btn" id="next-2" disabled>下一步 ▶</button>
    `);

    setTimeout(() => {
      const liquid = $center.querySelector('.thermo .liquid');
      const label = $center.querySelector('#thermo-label');
      const chips = [...$center.querySelectorAll('.emo-chip')];
      let picked = [];

      chips.forEach(c => {
        c.addEventListener('click', () => {
          const on = c.dataset.on === 'true';
          c.dataset.on = String(!on);
          window.SFX && window.SFX.select();

          picked = chips.filter(x => x.dataset.on === 'true' && x.dataset.correct === 'true').map(x => x.dataset.word);
          // 温度计：每选一个正确词上升 33%
          const ratio = Math.min(1, picked.length / 2);
          liquid.style.height = (ratio * 100) + '%';
          if (picked.length >= 2) {
            label.textContent = picked.length >= 3 ? '极度' : '强烈';
            label.style.color = 'var(--c-yellow)';
            document.getElementById('next-2').disabled = false;
          } else {
            label.textContent = picked.length === 1 ? '微弱' : '冷静';
            label.style.color = 'var(--c-orange)';
            document.getElementById('next-2').disabled = true;
          }
        });
      });
      document.getElementById('next-2').addEventListener('click', () => {
        S.emoSel = picked;
        S.slots.emo = picked.slice(0, 3).join('、');
        setBoss(S.bossHp - 18);
        S.step = 3; renderStep3();
      });
    }, 50);
  }

  // ============================================================
  // 2.3 公式合成
  // ============================================================
  function renderStep3() {
    setHint(3, '满分答案模板自动浮现 — 三要素已嵌入。齐声朗读，盖章。');
    syncSteps();

    const q = Q[S.qIdx];
    const emoText = S.slots.emo || q.answer.emo;
    const eventText = S.slots.event || q.answer.event;

    const lastQ = S.qIdx === Q.length - 1;
    const ctaText = lastQ ? '⚔ 击败迷雾魔王' : `Q${S.qIdx + 3} · 继续解第二个短语 ▶`;

    swapPane(`
      <h3>公式合成 · ${q.phrase}</h3>
      <div class="formula">
        形容【<span class="blank">${S.slots.who}</span>】在【<span class="blank">${eventText}</span>】时，内心感到 / 表现出【<span class="blank">${emoText}</span>】。
      </div>
      <button type="button" class="next-btn" id="finish-step">${ctaText}</button>
    `);

    setTimeout(() => {
      document.getElementById('finish-step').addEventListener('click', () => {
        if (!lastQ) {
          // 进入下一题
          S.qIdx++;
          S.step = 1;
          setBoss(S.bossHp - 18);
          renderStep1();
        } else {
          // 击败 boss
          setBoss(0);
          $progressFill.style.width = '100%';
          $stepDots.forEach(d => d.dataset.state = 'done');
          $stepLines.forEach(l => l.classList.add('done'));
          setTimeout(() => {
            window.Victory.show({ level: 2, homeHref: '../index.html', nextHref: './level3.html' });
          }, 600);
        }
      });
    }, 50);
  }

  function showStandardAnswer() {
    const html = Q.map((q, i) => `
      <p><b style="color:var(--c-cyan)">Q${i + 2}：</b>解释「${q.phrase}」（${q.from}）</p>
      <p style="font-size:22px;line-height:1.7;">
        形容【<b style="color:var(--c-yellow)">我</b>】在【<b style="color:var(--c-yellow)">${q.answer.event}</b>】时，内心感到 / 表现出【<b style="color:var(--c-yellow)">${q.answer.emo}</b>】。
      </p>
      <hr style="border-color:rgba(255,217,61,.2);margin:14px 0;">
    `).join('');
    window.Victory.showAnswer({ html });
  }

  // 跳过键
  window.addEventListener('tt:skip', () => {
    if (S.step < 3) { S.step++; [renderStep1, renderStep2, renderStep3][S.step - 1](); }
    else if (S.qIdx < Q.length - 1) { S.qIdx++; S.step = 1; renderStep1(); }
  });

  window.LV2 = { renderStep1, renderStep2, renderStep3, showStandardAnswer, _state: S };
})();
