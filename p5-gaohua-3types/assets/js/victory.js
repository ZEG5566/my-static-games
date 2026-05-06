/* ============================================================
   通关 / 段位升级蒙层 — 三关共用
   ============================================================ */
(function () {
  const RANKS = [
    null,
    { key:'bronze', name: '青铜勇者' },
    { key:'silver', name: '白银智者' },
    { key:'gold',   name: '黄金王者' },
  ];

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function show(opts = {}) {
    const level = opts.level || 1;
    const newRank = window.GameState.clearLevel(level);
    const rank = RANKS[newRank];
    const homeHref = opts.homeHref || '../index.html';
    const nextHref = opts.nextHref || null;

    const ov = el(`
      <div class="victory-overlay" role="dialog" aria-label="通关">
        <button class="vt-skip" type="button">跳过 ▶</button>
        <h2 class="vt-banner">通关！</h2>
        <p class="vt-sub">第 ${level} 座山 · 已被征服</p>
        <div class="vt-rank-stage">
          <div class="vt-hex" data-rank="${rank ? rank.key : 'bronze'}">
            <div class="hex-shape"></div>
            <div class="hex-name">${rank ? rank.name : '青铜勇者'}</div>
          </div>
        </div>
        <p class="vt-sub">解锁段位</p>
        <div class="vt-actions">
          ${nextHref ? `<a class="vt-cta" href="${nextHref}">下一座山</a>` : ''}
          <a class="vt-cta" href="${homeHref}" style="margin-left:14px; background: linear-gradient(180deg,#0089b3,#003a55); border-color: var(--c-cyan);">回到山谷</a>
        </div>
      </div>
    `);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-on'));

    if (window.SFX) {
      window.SFX.win();
      setTimeout(() => window.SFX.rankup(), 600);
    }

    ov.querySelector('.vt-skip').addEventListener('click', () => ov.remove());
    return ov;
  }

  function showAnswer(opts = {}) {
    const m = el(`
      <div class="answer-modal">
        <div class="am-card">
          <h3>💡 标准答案 / 讲评要点</h3>
          <div class="am-body">${opts.html || ''}</div>
          <button type="button" class="am-close">收起</button>
        </div>
      </div>
    `);
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('is-on'));
    m.querySelector('.am-close').addEventListener('click', () => m.remove());
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    return m;
  }

  window.Victory = { show, showAnswer };
})();
