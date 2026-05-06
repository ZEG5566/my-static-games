/* ============================================================
   关卡三·啰嗦魔王 — 4 步流程
   3.1 段落投影
   3.2 三分类剪枝
   3.3 浓缩传送带
   3.4 字数尺
   ============================================================ */
(function () {
  const C = window.Content.level3;
  const totalSteps = 4;
  const HERO_HP_MAX = 100;
  const BOSS_HP_MAX = 130;

  const S = {
    step: 1,
    bossHp: BOSS_HP_MAX,
    bins: {}, // s1 -> 'core' | 'aux' | 'fluff'
    compressionStage: 0,
    inputAnswer: '',
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

  function syncSteps() {
    $stepDots.forEach((d, i) => {
      const idx = i + 1;
      d.dataset.state = idx < S.step ? 'done' : (idx === S.step ? 'current' : '');
    });
    $stepLines.forEach((l, i) => l.classList.toggle('done', i + 1 < S.step));
    $progressFill.style.width = `${((S.step - 1) / totalSteps) * 100}%`;
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

  // ============================================================
  // 3.1 段落投影 — 显示第五段，三句变枝条卡
  // ============================================================
  function renderStep1() {
    setHint(1, '第五段被分成三根「枝条」 — 仔细读一遍，准备分类。');
    syncSteps();

    const branches = C.sentences.map((s, i) => `
      <div class="branch" data-id="${s.id}" data-tag="${i + 1}">${s.text}</div>
    `).join('');

    swapPane(`
      <h3>段落投影 · 第五段</h3>
      <div class="branch-stage">
        <div class="branches">${branches}</div>
      </div>
      <button type="button" class="next-btn" id="next-1">开始剪枝 ▶</button>
    `);
    setTimeout(() => {
      document.getElementById('next-1').addEventListener('click', () => {
        setBoss(S.bossHp - 25);
        S.step = 2; renderStep2();
      });
    }, 50);
  }

  // ============================================================
  // 3.2 三分类剪枝 — 拖拽分类（🟢主干 / 🟡辅助 / 🔴废话）
  // ============================================================
  function renderStep2() {
    setHint(2, '把每根枝条拖到对应分类：🟢 主干（人物+动作+原因） · 🟡 辅助 · 🔴 废话。错放不判错，会变灰提示。');
    syncSteps();

    const branches = C.sentences.map((s, i) => `
      <div class="branch" draggable="true" data-id="${s.id}" data-tag="${i + 1}" data-kind="${s.kind}">${s.text}</div>
    `).join('');

    swapPane(`
      <h3>三分类剪枝</h3>
      <div class="branch-stage">
        <div class="branches" id="branches-pool">${branches}</div>
        <div class="bins">
          <div class="bin" data-bin="core" id="bin-core">🟢 主干</div>
          <div class="bin" data-bin="aux"  id="bin-aux">🟡 辅助</div>
          <div class="bin" data-bin="fluff" id="bin-fluff">🔴 废话</div>
        </div>
      </div>
      <button type="button" class="next-btn" id="next-2" disabled>下一步 ▶</button>
    `);

    setTimeout(() => {
      const branchEls = [...$center.querySelectorAll('.branch')];
      const bins = [...$center.querySelectorAll('.bin')];
      let placed = 0;

      branchEls.forEach(b => {
        b.addEventListener('dragstart', e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', b.dataset.id);
        });
        // 点击切换分类（兼容触屏）
        b.addEventListener('click', () => {
          const order = ['', 'core', 'aux', 'fluff'];
          const cur = b.dataset.bin || '';
          const ni = (order.indexOf(cur) + 1) % order.length;
          place(b, order[ni]);
        });
      });

      bins.forEach(bin => {
        bin.addEventListener('dragover', e => { e.preventDefault(); bin.classList.add('is-hover'); });
        bin.addEventListener('dragleave', () => bin.classList.remove('is-hover'));
        bin.addEventListener('drop', e => {
          e.preventDefault();
          bin.classList.remove('is-hover');
          const id = e.dataTransfer.getData('text/plain');
          const b = branchEls.find(x => x.dataset.id === id);
          if (b) place(b, bin.dataset.bin);
        });
      });

      function place(b, kind) {
        const wasPlaced = !!b.dataset.bin;
        if (kind) b.dataset.bin = kind; else delete b.dataset.bin;
        const correct = b.dataset.kind === kind;
        if (kind && correct) {
          window.SFX && window.SFX.drop();
        } else if (kind && !correct) {
          window.SFX && window.SFX.nudge();
        }
        // 检查全部正确分类
        const all = branchEls.every(x => x.dataset.bin === x.dataset.kind);
        document.getElementById('next-2').disabled = !all;
      }

      document.getElementById('next-2').addEventListener('click', () => {
        setBoss(S.bossHp - 25);
        S.step = 3; renderStep3();
      });
    }, 50);
  }

  // ============================================================
  // 3.3 浓缩传送带
  // ============================================================
  function renderStep3() {
    setHint(3, '只保留 🟢 主干句进入压缩管道。每按一次"压缩"它就更短一档。');
    S.compressionStage = 0;
    syncSteps();

    swapPane(`
      <h3>浓缩传送带</h3>
      <div class="compress">
        <div class="compress-step-num" id="comp-num">压缩档位 · 第 1 档</div>
        <div class="compress-pipe" id="comp-pipe">${C.compressionStages[0]}</div>
        <button type="button" class="compress-btn" id="comp-btn">⚙ 压一下</button>
        <button type="button" class="next-btn" id="next-3" disabled>下一步 ▶</button>
      </div>
    `);

    setTimeout(() => {
      const pipe = document.getElementById('comp-pipe');
      const num = document.getElementById('comp-num');
      const btn = document.getElementById('comp-btn');
      const next = document.getElementById('next-3');

      btn.addEventListener('click', () => {
        if (S.compressionStage < C.compressionStages.length - 1) {
          S.compressionStage++;
          window.SFX && window.SFX.step();
          pipe.style.opacity = '0';
          pipe.style.transform = 'scale(.92)';
          setTimeout(() => {
            pipe.textContent = C.compressionStages[S.compressionStage];
            num.textContent = `压缩档位 · 第 ${S.compressionStage + 1} 档`;
            pipe.style.opacity = '1';
            pipe.style.transform = '';
          }, 220);
        }
        if (S.compressionStage === C.compressionStages.length - 1) {
          btn.disabled = true;
          next.disabled = false;
        }
      });
      next.addEventListener('click', () => {
        setBoss(S.bossHp - 25);
        S.step = 4; renderStep4();
      });
    }, 50);
  }

  // ============================================================
  // 3.4 字数尺
  // ============================================================
  function renderStep4() {
    setHint(4, '在输入框里写出概括 — 不超过 15 个字。每打一字一格亮起，超 15 字会变红。');
    syncSteps();

    swapPane(`
      <h3>字数尺 · ≤ 15 字斩段意</h3>
      <div class="ruler" id="ruler">
        ${Array.from({ length: 15 }).map((_, i) => `<div class="cell" data-i="${i}"></div>`).join('')}
      </div>
      <input type="text" class="ruler-input" id="ruler-input" placeholder="把想到的概括打进来…" maxlength="30" />
      <div id="ruler-status" style="font-size:20px;letter-spacing:.1em;color:var(--c-text-soft);min-height:30px;">字数：<b id="ruler-cnt" style="color:var(--c-cyan);">0</b> / 15</div>
      <button type="button" class="next-btn" id="finish-3" disabled>⚔ 击败啰嗦魔王</button>
    `);

    setTimeout(() => {
      const input = document.getElementById('ruler-input');
      const cells = [...$center.querySelectorAll('.ruler .cell')];
      const cnt = document.getElementById('ruler-cnt');
      const status = document.getElementById('ruler-status');
      const finish = document.getElementById('finish-3');
      input.focus();

      input.addEventListener('input', () => {
        const txt = input.value;
        cnt.textContent = txt.length;
        S.inputAnswer = txt;

        // 字数尺
        cells.forEach((c, i) => {
          if (i < Math.min(txt.length, 15)) {
            c.dataset.state = 'on';
            c.textContent = txt[i] || '';
          } else if (i < txt.length) {
            // overflow（>15 没有 16 格，警示前一格）
          } else {
            c.dataset.state = '';
            c.textContent = '';
          }
        });

        if (txt.length > 15) {
          cells[14].dataset.state = 'over';
          cnt.style.color = 'var(--c-danger)';
          status.innerHTML = `字数：<b style="color:var(--c-danger);">${txt.length}</b> / 15 · ⚠️ 再砍一刀`;
          window.SFX && window.SFX.overcap();
        } else {
          cnt.style.color = 'var(--c-cyan)';
          status.innerHTML = `字数：<b id="ruler-cnt" style="color:var(--c-cyan);">${txt.length}</b> / 15`;
        }

        // 关键词命中检查
        const ok = checkAnswer(txt);
        finish.disabled = !ok;
        if (ok) {
          status.innerHTML += ` · <span style="color:var(--c-yellow);">✨ 命中三要素</span>`;
        }
      });

      finish.addEventListener('click', () => {
        setBoss(0);
        $progressFill.style.width = '100%';
        $stepDots.forEach(d => d.dataset.state = 'done');
        $stepLines.forEach(l => l.classList.add('done'));
        setTimeout(() => {
          window.Victory.show({ level: 3, homeHref: '../index.html' });
        }, 600);
      });
    }, 50);
  }

  function checkAnswer(txt) {
    if (!txt || txt.length > C.maxChars) return false;
    return C.requiredKeywordGroups.every(group => group.some(w => txt.includes(w)));
  }

  function showStandardAnswer() {
    window.Victory.showAnswer({
      html: `
        <p><b style="color:var(--c-cyan)">题目：</b>用不超过 15 字概括第五段段落大意。</p>
        <p style="font-size:22px;line-height:1.7;">第五段：${window.Content.paragraphs[4].text}</p>
        <hr style="border-color:rgba(255,217,61,.2);margin:14px 0;">
        <p><b style="color:var(--c-gold)">参考答案（≤ 15 字）：</b></p>
        <ul style="font-size:24px;line-height:1.8;list-style:none;padding-left:0;">
          ${window.Content.level3.sampleAnswers.map(a => `<li>· <b style="color:var(--c-yellow);">${a}</b>（${a.replace(/[，。\s]/g,'').length} 字）</li>`).join('')}
        </ul>
        <p style="font-size:20px; color:var(--c-text-soft);">三要素 = 「我」+「撒谎/做错事」+「坦白/认错」。同义词命中即过关。</p>
      `
    });
  }

  window.addEventListener('tt:skip', () => {
    if (S.step < 4) { S.step++; [renderStep1, renderStep2, renderStep3, renderStep4][S.step - 1](); }
  });

  window.LV3 = { renderStep1, renderStep2, renderStep3, renderStep4, showStandardAnswer, _state: S };
})();
