/* ============================================================
   老师工具条：暂停 / 跳过动画 / 标准答案(长按1s) / 静音 / 重玩
   ============================================================ */
(function () {
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function mount(opts = {}) {
    const onAnswer = opts.onAnswer || null; // function(): show standard answer
    const onReplay = opts.onReplay || null; // function(): replay current level
    const homeHref = opts.homeHref || './index.html';

    const bar = el(`
      <header class="tt" role="toolbar" aria-label="老师工具条">
        <a class="tt-btn tt-home" href="${homeHref}" title="返回首页">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
        </a>
        <button class="tt-btn tt-pause" title="暂停 / 继续动画" aria-pressed="false">
          <svg class="ic-pause" viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          <svg class="ic-play hidden" viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
        </button>
        <button class="tt-btn tt-skip" title="跳过当前转场">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M5 5v14l9-7zM15 5h3v14h-3z"/></svg>
        </button>
        <button class="tt-btn tt-mute" title="静音 / 开声音" aria-pressed="false">
          <svg class="ic-on" viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3z"/><path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          <svg class="ic-off hidden" viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3z"/><path d="M16 9l5 5M21 9l-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        ${onReplay ? `<button class="tt-btn tt-replay" title="重玩本关"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg></button>` : ''}
        ${onAnswer ? `<button class="tt-btn tt-answer" title="长按 1 秒查看标准答案">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2a7 7 0 00-4 12.8V17a2 2 0 002 2h4a2 2 0 002-2v-2.2A7 7 0 0012 2zm-2 19h4v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1z"/></svg>
          <span class="tt-answer-fill"></span>
        </button>` : ''}
      </header>
    `);
    document.body.appendChild(bar);

    // —— 静音键 ——
    const muteBtn = bar.querySelector('.tt-mute');
    function syncMute() {
      const m = window.GameState ? window.GameState.isMuted() : false;
      muteBtn.setAttribute('aria-pressed', String(m));
      muteBtn.querySelector('.ic-on').classList.toggle('hidden', m);
      muteBtn.querySelector('.ic-off').classList.toggle('hidden', !m);
    }
    muteBtn.addEventListener('click', () => {
      window.GameState && window.GameState.toggleMuted();
      window.SFX && window.SFX.select();
      syncMute();
    });
    syncMute();

    // —— 暂停键：冻结所有 CSS 动画 + 自定义事件供 JS 监听 ——
    const pauseBtn = bar.querySelector('.tt-pause');
    let paused = false;
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      document.body.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.querySelector('.ic-pause').classList.toggle('hidden', paused);
      pauseBtn.querySelector('.ic-play').classList.toggle('hidden', !paused);
      window.SFX && window.SFX.select();
      window.dispatchEvent(new CustomEvent('tt:pause', { detail: { paused } }));
    });

    // —— 跳过键 ——
    const skipBtn = bar.querySelector('.tt-skip');
    skipBtn.addEventListener('click', () => {
      window.SFX && window.SFX.select();
      window.dispatchEvent(new CustomEvent('tt:skip'));
    });

    // —— 标准答案：长按 1s ——
    if (onAnswer) {
      const ansBtn = bar.querySelector('.tt-answer');
      const fill = ansBtn.querySelector('.tt-answer-fill');
      let timer = null;
      function start(e) {
        e.preventDefault();
        fill.style.transition = 'width 1s linear';
        fill.style.width = '100%';
        timer = setTimeout(() => {
          fill.style.transition = 'none';
          fill.style.width = '100%';
          window.SFX && window.SFX.win();
          onAnswer();
          setTimeout(() => { fill.style.width = '0%'; }, 200);
        }, 1000);
      }
      function cancel() {
        clearTimeout(timer); timer = null;
        fill.style.transition = 'width 200ms ease-out';
        fill.style.width = '0%';
      }
      ansBtn.addEventListener('mousedown', start);
      ansBtn.addEventListener('touchstart', start, { passive: false });
      ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => ansBtn.addEventListener(ev, cancel));
    }

    // —— 重玩 ——
    if (onReplay) {
      bar.querySelector('.tt-replay').addEventListener('click', () => {
        window.SFX && window.SFX.select();
        onReplay();
      });
    }
  }

  // CSS 一并注入（避免每个页面重复 link）
  const style = document.createElement('style');
  style.textContent = `
.tt {
  position: fixed; top: 0; left: 0; right: 0;
  height: 88px; padding: 12px 24px;
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(180deg, rgba(13,27,61,.96) 0%, rgba(13,27,61,.78) 100%);
  border-bottom: 2px solid rgba(0,194,255,.45);
  box-shadow: 0 0 18px rgba(0,194,255,.25);
  z-index: 1000;
  backdrop-filter: blur(6px);
}
.tt::after {
  content: '老师工具条 · 长按灯泡 1 秒看标准答案';
  margin-left: auto;
  font-size: 22px;
  color: var(--c-text-soft);
  letter-spacing: .1em;
}
.tt-btn {
  width: 64px; height: 64px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(0,30,70,.7);
  color: var(--c-cyan);
  border: 2px solid rgba(0,194,255,.45);
  border-radius: 14px;
  position: relative; overflow: hidden;
  transition: transform var(--t-fast) var(--ease), border-color var(--t-fast);
  text-decoration: none;
}
.tt-btn:hover { transform: translateY(-2px); border-color: var(--c-cyan); box-shadow: 0 0 14px rgba(0,194,255,.55); }
.tt-btn:active { transform: translateY(0); }
.tt-btn[aria-pressed="true"] { background: var(--c-cyan); color: #001428; }
.tt-answer { color: var(--c-yellow); border-color: rgba(255,217,61,.55); }
.tt-answer:hover { box-shadow: 0 0 14px rgba(255,217,61,.55); }
.tt-answer-fill {
  position: absolute; left:0; bottom:0; height: 4px; width: 0%;
  background: var(--c-yellow);
  box-shadow: 0 0 8px var(--c-yellow);
}
body.is-paused *, body.is-paused *::before, body.is-paused *::after {
  animation-play-state: paused !important;
}
`;
  document.head.appendChild(style);

  window.TeacherToolbar = { mount };
})();
