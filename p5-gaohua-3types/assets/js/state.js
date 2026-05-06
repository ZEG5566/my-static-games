/* ============================================================
   全局游戏状态：段位 / 静音 / 三关进度
   localStorage 持久化，离线可用
   ============================================================ */
(function () {
  const KEY = 'p5gh.state.v1';
  const DEFAULTS = {
    muted: false,
    cleared: { l1: false, l2: false, l3: false },
    rank: 0, // 0=未解锁 1=青铜 2=白银 3=黄金
  };

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return { ...DEFAULTS };
    }
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  const state = read();
  const listeners = new Set();
  function notify() { listeners.forEach(fn => { try { fn(state); } catch (e) {} }); }

  const RANK_NAMES = ['未解锁', '青铜勇者', '白银智者', '黄金王者'];

  window.GameState = {
    get: () => Object.assign({}, state),
    isMuted: () => !!state.muted,
    setMuted(v) { state.muted = !!v; write(state); notify(); },
    toggleMuted() { this.setMuted(!state.muted); return state.muted; },
    isCleared(level) { return !!state.cleared['l' + level]; },
    clearLevel(level) {
      state.cleared['l' + level] = true;
      const cnt = ['l1','l2','l3'].filter(k => state.cleared[k]).length;
      state.rank = Math.max(state.rank, cnt);
      write(state); notify();
      return state.rank;
    },
    rankName(idx) { return RANK_NAMES[idx ?? state.rank] || '未解锁'; },
    reset() {
      state.cleared = { l1:false, l2:false, l3:false };
      state.rank = 0;
      write(state); notify();
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
