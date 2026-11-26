/* =====================================================================
   内置键盘：数字 / 英文 / 拼音 26 键 / 拼音九宫格
   - 所有输入框都不弹系统输入法，避免页面跳动
   - 候选栏支持翻页；空格上屏首个候选；长按退格连续删除
   - 点「系统键盘」可以临时切回手机自带输入法
   ===================================================================== */

let kpInput = null;
let kpOpen = false;
let kpFresh = false;
let kpOpenedAt = 0;
let kpMode = 'num';
let kpBuf = '';
let kpCands = [];
let kpPage = 0;
let kpSeg = '';
let kpShift = false;
let kpLastTextMode = 'py26';
const KP_PAGE_SIZE = 8;

/* 手写识别状态 */
let hwStrokes = [];    // 已完成的笔画，每笔是 [{x,y},...]
let hwDrawing = null;  // 正在画的那一笔
let hwPicked = false;  // 刚点过候选，下一笔开始前自动清屏
let hwTimer = 0;
let hwDpr = 1;
let hwMatcher = null;
let hwEngineReady = false;
let kpSysTarget = null;   // 点了「系统键盘」、本次聚焦不应再弹内置键盘的那个输入框
const KP_SYS_KEY = 'gongshi_syskb';   // 用户是否选择全程使用手机自带键盘

/** 用户是否在「关于」里选了用手机自带键盘（不做内置键盘） */
function kpSysKbOn() { try { return localStorage.getItem(KP_SYS_KEY) === '1'; } catch (e) { return false; } }

/**
 * 选了「手机自带键盘」后，输入框要恢复成普通输入框：
 * 编辑器模板给每个 input 都写死了 readonly + inputmode="none"，
 * 不清掉这两个，系统键盘照样弹不出来。
 */
function kpFreeInput(el) {
  if (!el) return;
  try { if (el.readOnly) el.readOnly = false; } catch (e) { }
  try {
    if (el.getAttribute && el.getAttribute('inputmode') === 'none') el.removeAttribute('inputmode');
    if (el.removeAttribute) { el.removeAttribute('inputmode'); el.removeAttribute('readonly'); }
  } catch (e) { }
}
function kpApplySystemKbUI() {
  if (!kpSysKbOn()) return;
  $$('input[data-num],input[data-text]').forEach(kpFreeInput);
}
/** 每页候选数按候选栏宽度算，窄屏少放几个，避免被裁掉 */
function kpPageSize() {
  const box = $('kpCands');
  const w = box && box.clientWidth ? box.clientWidth : 0;
  if (!w) return KP_PAGE_SIZE;
  return Math.max(4, Math.min(9, Math.floor(w / 46)));
}
const KP_MODE_KEY = 'gongshi_kp_textmode';

function kpIsText(input) { return !!input && !input.dataset.num; }

function kpSavedTextMode() {
  try {
    const m = localStorage.getItem(KP_MODE_KEY);
    if (m === 'py26' || m === 'py9' || m === 'en' || m === 'hw') return m;
  } catch (e) { }
  return 'py26';
}

function kpToggle(open, input) {
  // 键盘 DOM 可能被弹窗重写/销毁过（比如编辑器 innerHTML 整体替换），
  // 打开前先确保它还在，不在就重新注入，避免「键盘从此再也弹不出来」。
  if (!document.getElementById('keypad')) kpEnsureDom();
  const el = $('keypad');
  if (!el) return;
  if (open) {
    const dlg = document.querySelector('dialog[open]');
    const host = dlg || document.body;
    if (el.parentElement !== host) host.appendChild(el);
    if (kpSysKbOn()) return;   // 已选手机自带键盘，内置键盘不再弹出
    kpSysTarget = null;   // 用户主动点输入框，恢复内置键盘
    kpInput = input;
    kpOpen = true;
    kpFresh = true;
    kpOpenedAt = Date.now();
    kpBuf = '';
    kpCands = [];
    kpPage = 0;
    kpSeg = '';
    kpShift = false;
    kpMode = kpIsText(input) ? kpLastTextMode : 'num';
    try { input.readOnly = true; } catch (e) { }
    el.classList.add('on');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('kp-open');
    kpRefresh();
    setTimeout(() => kpScrollInputIntoView(input), 120);
    setTimeout(() => kpScrollInputIntoView(input), 320);
  } else {
    if (el.parentElement !== document.body) document.body.appendChild(el);
    kpOpen = false;
    kpBuf = '';
    kpCands = [];
    kpPage = 0;
    hwFreezeTimer();
    hwStrokes = [];
    hwDrawing = null;
    hwPicked = false;
    el.classList.remove('on');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('kp-open');
    kpHideBubble();
    if (kpInput) { try { kpInput.blur(); } catch (e) { } }
    kpInput = null;
  }
}

/** 键盘挡住输入框时，把它滚到可见区域中间 */
function kpScrollInputIntoView(input) {
  if (!input || !input.isConnected) return;
  try {
    const box = input.closest('.sheet-body') || input.closest('dialog');
    if (!box) { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const r = input.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.bottom > b.bottom - 10 || r.top < b.top + 10 || r.bottom < b.top) {
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  } catch (e) { }
}

function kpLabelOf(input) {
  const node = input.closest('label');
  if (node) {
    const first = node.firstChild;
    if (first && first.nodeType === 3) {
      const t = first.textContent.trim();
      if (t) return t;
    }
    const span = node.querySelector('.field-title, b');
    if (span) return span.textContent.trim();
  }
  return input.getAttribute('aria-label') || input.placeholder || '输入';
}

function kpUnitOf(input) {
  const wrap = input.closest('.input-unit');
  if (!wrap) return '';
  const unit = wrap.querySelector('span');
  return unit ? unit.textContent.trim() : '';
}

function kpSetMode(mode) {
  if (!$('keypad') || !kpOpen) return;
  if (kpInput && kpInput.dataset.num && mode !== 'num') return;
  kpMode = mode;
  if (mode === 'py26' || mode === 'py9' || mode === 'en' || mode === 'hw') {
    kpLastTextMode = mode;
    try { localStorage.setItem(KP_MODE_KEY, mode); } catch (e) { }
  }
  kpBuf = '';
  kpCands = [];
  kpPage = 0;
  kpSeg = '';
  kpFreezeDel();
  hwFreezeTimer();
  if (mode === 'hw') { hwStrokes = []; hwDrawing = null; hwPicked = false; hwRedraw(); }
  kpRefresh();
  setTimeout(() => kpScrollInputIntoView(kpInput), 120);
}

/* ==================== 渲染 ==================== */
function kpRefresh() {
  if (!kpInput) return;
  const isNum = !!kpInput.dataset.num;
  if (isNum) kpMode = 'num';
  const modes = $$('#kpModes [data-mode]');
  modes.forEach(b => {
    b.classList.toggle('on', b.dataset.mode === kpMode);
    b.disabled = isNum && b.dataset.mode !== 'num';
  });
  const grid = $('kpGrid'), alpha = $('kpAlpha'), t9 = $('kpT9'), hwBox = $('kpHw');
  if (grid) grid.hidden = kpMode !== 'num';
  if (alpha) alpha.hidden = !(kpMode === 'en' || kpMode === 'py26');
  if (t9) t9.hidden = kpMode !== 'py9';
  if (hwBox) hwBox.hidden = kpMode !== 'hw';
  if (kpMode === 'hw') hwSync(); else kpAnalyzeBuf();
  const lbl = $('kpLabel'), val = $('kpVal'), unit = $('kpUnit'), py = $('kpPy');
  if (lbl) lbl.textContent = kpLabelOf(kpInput);
  if (val) val.textContent = kpInput.value === '' ? (kpMode === 'num' ? '0' : '') : kpInput.value;
  if (unit) unit.textContent = kpUnitOf(kpInput);
  // 九键显示数字串（一位多字母，猜一个拼音出来反而误导）
  if (py) py.textContent = kpBuf ? (kpMode === 'py9' ? kpBuf : (kpSeg || kpBuf)) : '';
  const kpEl = $('keypad');
  if (kpEl) kpEl.dataset.kpMode = kpMode;
  const shiftKey = $('kpShift');
  if (shiftKey) {
    shiftKey.hidden = kpMode !== 'en';
    shiftKey.classList.toggle('on', kpShift);
  }
  kpRenderCands();
  kpSyncPad();
}

/** 按当前缓冲算候选 */
function kpAnalyzeBuf() {
  kpCands = [];
  kpSeg = '';
  if (!kpBuf) return;
  if (kpMode === 'py26') {
    const r = pyAnalyze(kpBuf);
    kpCands = r.cands;
    kpSeg = r.seg;
  } else if (kpMode === 'py9') {
    const r = t9Analyze(kpBuf);
    kpCands = r.cands;
    kpSeg = r.seg;
  }
}

function kpRenderCands() {
  const box = $('kpCands');
  if (!box) return;
  const prev = $('kpPrev'), next = $('kpNext');
  const total = kpCands.length;
  const size = kpPageSize();
  const pages = Math.max(1, Math.ceil(total / size));
  if (kpPage >= pages) kpPage = pages - 1;
  if (kpPage < 0) kpPage = 0;
  if (prev) prev.hidden = !(pages > 1);
  if (next) next.hidden = !(pages > 1);
  if (prev) prev.disabled = kpPage <= 0;
  if (next) next.disabled = kpPage >= pages - 1;

  if (!total) {
    const showEmpty = !!kpBuf && (kpMode === 'py26' || kpMode === 'py9');
    box.hidden = !showEmpty;
    box.innerHTML = showEmpty ? '<span class="cand-empty">没有这个拼音，可换「九键」或系统键盘</span>' : '';
    return;
  }
  box.hidden = false;
  const start = kpPage * size;
  const slice = kpCands.slice(start, start + size);
  box.innerHTML = slice.map((c, i) => {
    const idx = start + i;
    return `<button type="button" class="cand${i === 0 ? ' first' : ''}" data-cand="${esc(c.t)}" data-ci="${idx}">${esc(c.t)}</button>`;
  }).join('');
}

/** 按键盘实际高度给弹窗留出底部空间 */
function kpSyncPad() {
  const el = $('keypad');
  if (!el) return;
  try {
    requestAnimationFrame(() => {
      const h = el.getBoundingClientRect().height;
      if (h > 40) document.documentElement.style.setProperty('--kp-pad', Math.round(h + 6) + 'px');
    });
  } catch (e) { }
}

/* ==================== 编辑动作 ==================== */
function kpDispatch() {
  if (!kpInput) return;
  try { kpInput.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { }
}

function kpInsert(text) {
  if (!kpInput) return;
  kpInput.value = String(kpInput.value || '') + text;
  kpDispatch();
}

function kpPickIndex(i) {
  const c = kpCands[i];
  if (!c) return;
  kpInsert(c.t);
  kpBuf = c.rest || '';
  kpPage = 0;
  if (kpMode === 'hw') hwPicked = true;   // 已上屏，下一笔开始前自动清屏
  kpRefresh();
  if (kpMode === 'hw') hwAfterPick();
}

/** 候选上屏后清空画板，方便直接写下一个字 */
function hwAfterPick() {
  hwFreezeTimer();
  hwStrokes = [];
  hwDrawing = null;
  hwPicked = false;
  kpCands = [];
  kpPage = 0;
  hwRedraw();
  hwHint(true);
  kpRenderCands();
  kpSyncPad();
}

function kpDelete() {
  if (!kpInput) return;
  if (kpBuf) {
    kpBuf = kpBuf.slice(0, -1);
    kpPage = 0;
    kpRefresh();
    return;
  }
  kpInput.value = String(kpInput.value || '').slice(0, -1);
  kpDispatch();
  kpRefresh();
}

function kpPressNumber(key) {
  const isInt = kpInput.dataset.num === 'int';
  let v = String(kpInput.value || '');
  const isInputKey = /^[0-9]$/.test(key) || key === '.' || key === '00';
  if (kpFresh && isInputKey) v = '';
  kpFresh = false;
  if (key === 'clear') v = '';
  else if (key === '.') {
    if (isInt) return;
    if (v.indexOf('.') >= 0) return;
    v = v === '' ? '0.' : v + '.';
  } else if (key === '00') {
    if (v === '' || v === '0') return;
    v = v + '00';
  } else {
    if (v === '0') v = key;
    else v = v + key;
    if (v.replace('.', '').length > 9) return;
  }
  kpInput.value = v;
  kpDispatch();
  kpRefresh();
}

/** 空格：拼音模式下上屏第一个候选 */
function kpSpace() {
  if ((kpMode === 'py26' || kpMode === 'py9') && kpBuf && kpCands.length) {
    kpPickIndex(0);
    return;
  }
  kpInsert(' ');
  kpRefresh();
}

function kpPress(key) {
  if (!kpInput) return;
  if (key !== 'del') kpRepeated = false;
  if (key === 'done') { kpToggle(false); persist(true); return; }
  if (key === 'hide') { kpToggle(false); return; }
  if (key === 'sys') {
    /* 切系统键盘：先收起内置键盘，再告诉 focusin「这次是我自己聚焦的」，
       否则 input.focus() 会立刻触发 focusin 把内置键盘弹回来、readOnly 也设回去 */
    const el = kpInput;
    kpToggle(false);
    if (!el) return;
    kpSysTarget = el;
    try { el.readOnly = false; } catch (e) { }
    /* 必须同步聚焦：iOS/Android 只在用户手势的调用栈里才允许弹系统键盘 */
    try { el.focus(); } catch (e) { }
    return;
  }
  if (key === 'del') { kpDelete(); return; }
  if (key === 'space') { kpSpace(); return; }
  if (key === 'comma') { kpInsert('，'); kpRefresh(); return; }
  if (key === 'period') { kpInsert('。'); kpRefresh(); return; }
  if (key === 'shift') { kpShift = !kpShift; kpRefresh(); return; }
  if (key === 'prevpage') { if (kpPage > 0) { kpPage--; kpRenderCands(); } return; }
  if (key === 'nextpage') { kpPage++; kpRenderCands(); return; }

  if (kpMode === 'num') { kpPressNumber(key); return; }
  if (kpMode === 'en') {
    if (/^[a-z]$/.test(key)) {
      kpInsert(kpShift ? key.toUpperCase() : key);
      kpRefresh();
    }
    return;
  }
  if (/^t[0-9]$/.test(key)) {
    if (kpMode === 'py9') { kpBuf += key.slice(1); kpPage = 0; kpRefresh(); }
    return;
  }
  if (kpMode === 'py26') {
    if (/^[a-z]$/.test(key)) { kpBuf += key; kpPage = 0; kpRefresh(); }
    return;
  }
  if (kpMode === 'py9') {
    if (/^[0-9]$/.test(key)) { kpBuf += key; kpPage = 0; kpRefresh(); }
  }
}

/* ==================== 按下反馈：震动 / 气泡 / 长按连删 ==================== */
let kpDelTimer = 0;
let kpDelRepeat = 0;
let kpRepeated = false;

function kpFreezeDel() {
  if (kpDelTimer) { clearTimeout(kpDelTimer); kpDelTimer = 0; }
  if (kpDelRepeat) { clearInterval(kpDelRepeat); kpDelRepeat = 0; }
}

function kpVibrate(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) { }
}

function kpShowBubble(target) {
  const bub = $('kpBubble');
  if (!bub || !target) return;
  let label = '';
  if (target.dataset.k && /^[a-z]$/.test(target.dataset.k)) label = target.dataset.k;
  else if (target.dataset.k && /^t[0-9]$/.test(target.dataset.k)) {
    const b = target.querySelector('b');
    label = b ? b.textContent : '';
  } else if (target.dataset.key) label = target.dataset.key;
  if (!label) { kpHideBubble(); return; }
  const r = target.getBoundingClientRect();
  bub.textContent = label;
  bub.style.left = Math.round(r.left + r.width / 2) + 'px';
  bub.style.top = Math.round(r.top - 8) + 'px';
  bub.classList.add('on');
}

function kpHideBubble() {
  const bub = $('kpBubble');
  if (bub) bub.classList.remove('on');
}

function bindKeypadPointer() {
  const kp = $('keypad');
  if (!kp) return;
  kp.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled) return;
    kpVibrate(8);
    kpShowBubble(b);
    const isDel = b.dataset.k === 'del';
    if (isDel) {
      kpRepeated = false;
      kpFreezeDel();
      kpDelTimer = setTimeout(() => {
        kpRepeated = true;
        kpDelRepeat = setInterval(() => {
          kpDelete();
          kpVibrate(4);
        }, 55);
      }, 380);
    }
  }, { passive: true });
  const up = () => { kpHideBubble(); kpFreezeDel(); };
  kp.addEventListener('pointerup', up);
  kp.addEventListener('pointercancel', up);
  kp.addEventListener('pointerleave', up);
  kp.addEventListener('contextmenu', e => e.preventDefault());
}

/* ==================== 事件绑定 ==================== */
function bindKeypadTriggers() {
  const SEL = 'input[data-num],input[data-text]';
  document.addEventListener('focusin', e => {
    const t = e.target;
    if (!(t && t.matches && t.matches(SEL))) return;
    /* 刚从「系统键盘」按钮切过来的这一次聚焦，交给系统输入法，不再弹内置键盘 */
    if (t === kpSysTarget) { kpSysTarget = null; return; }
    if (kpSysKbOn()) return;      // 全程用手机自带键盘
    kpToggle(true, t);
  });
  document.addEventListener('pointerdown', e => {
    if (!kpSysKbOn()) return;
    const t = e.target;
    if (t && t.matches && t.matches(SEL)) kpFreeInput(t);
  }, true);
  document.addEventListener('mousedown', e => {
    const t = e.target;
    if (t && t.matches && t.matches(SEL)) {
      if (kpSysKbOn()) { kpFreeInput(t); return; }   // 交给原生聚焦，别妨碍系统键盘
      e.preventDefault();
      try { t.focus(); } catch (err) { }
    }
  });
  const kp = $('keypad');
  if (kp) {
    kp.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.disabled) return;
      if (b.dataset.mode) { kpSetMode(b.dataset.mode); return; }
      if (b.dataset.hw) { hwAction(b.dataset.hw); return; }
      if (b.dataset.cand !== undefined && b.dataset.cand !== '') {
        const i = b.dataset.ci !== undefined ? Number(b.dataset.ci) : kpCands.findIndex(c => c.t === b.dataset.cand);
        if (i >= 0) kpPickIndex(i);
        return;
      }
      if (b.dataset.k) {
        // 长按连删后浏览器还会补一个 click，这里吃掉它，避免多删一个字
        if (b.dataset.k === 'del' && kpRepeated) { kpRepeated = false; return; }
        kpPress(b.dataset.k);
        return;
      }
      if (b.dataset.key) { kpPress(b.dataset.key); return; }
    });
  }
  bindKeypadPointer();
  hwBind();
  // 点击键盘和输入框以外的地方收起（刚打开 450ms 内的点击忽略）
  document.addEventListener('click', e => {
    if (!kpOpen) return;
    if (Date.now() - kpOpenedAt < 450) return;
    const kpEl = $('keypad');
    const path = (e.composedPath && e.composedPath()) || [];
    if (kpEl && path.indexOf(kpEl) >= 0) return; // 点键盘本身（候选字会重建 DOM，用 path 判断）
    if (e.target && e.target.closest && e.target.closest('#keypad')) return;
    if (e.target && e.target.closest && e.target.closest('input[data-num],input[data-text]')) return;
    const lab = e.target && e.target.closest && e.target.closest('label.field');
    if (lab && lab.querySelector('input[data-num],input[data-text]')) return;
    kpToggle(false);
  });
  // 弹窗关闭时先收起键盘，并把键盘 DOM 移回 body。
  // 否则键盘还挂在 dialog 里，下次 openEditor 重写 dialog.innerHTML 时会把它删掉，
  // 内置键盘从此弹不出来。
  $$('dialog').forEach(d => {
    d.addEventListener('close', () => { if (kpOpen) kpToggle(false); });
  });
}

/** 文本输入框使用内置键盘（不再弹系统输入法） */
function makeTextInputsCustom() {
  const sys = kpSysKbOn();
  $$('input[data-text]').forEach(el => { el.readOnly = !sys; });
}

/* =====================================================================
   手写输入（半屏手写板）
   - 识别引擎 HanziLookupJS（08c）+ 内嵌字库（08d），完全离线，无网络请求
   - 写完一笔停顿自动识别，候选显示在键盘上方候选栏，点选上屏
   - 点选后下一笔开始前自动清屏；也可手动清空 / 退一格
   ===================================================================== */

/** 初始化识别引擎（首次进入手写模式时才真正解码字库） */
function hwEnsureEngine() {
  if (hwEngineReady) return true;
  if (typeof HanziLookup === 'undefined' || typeof HL_MMAH === 'undefined') return false;
  try {
    HanziLookup.initInline('mmah', HL_MMAH);
    hwEngineReady = true;
    return true;
  } catch (e) {
    return false;
  }
}

/** 键盘尺寸变化时同步 canvas 像素尺寸 */
function hwSync() {
  const cv = $('kpHwCanvas'), board = $('kpHwBoard');
  if (!cv || !board) return;
  const w = board.clientWidth, h = board.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
  if (cv.width !== pw || cv.height !== ph || hwDpr !== dpr) {
    cv.width = pw;
    cv.height = ph;
    hwDpr = dpr;
    hwRedraw();
  }
}

function hwCtx() {
  const cv = $('kpHwCanvas');
  if (!cv) return null;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(hwDpr, 0, 0, hwDpr, 0, 0);
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2b3d58';
  return ctx;
}

function hwRedraw() {
  const cv = $('kpHwCanvas');
  if (!cv) return;
  const ctx = hwCtx();
  if (!ctx) return;
  ctx.clearRect(0, 0, cv.width / hwDpr, cv.height / hwDpr);
  for (let i = 0; i < hwStrokes.length; i++) {
    const st = hwStrokes[i];
    if (!st || !st.length) continue;
    ctx.beginPath();
    ctx.moveTo(st[0].x, st[0].y);
    if (st.length === 1) {
      ctx.lineTo(st[0].x + 0.1, st[0].y + 0.1);
    } else {
      for (let j = 1; j < st.length; j++) ctx.lineTo(st[j].x, st[j].y);
    }
    ctx.stroke();
  }
}

function hwHint(show) {
  const el = $('kpHwHint');
  if (el) el.classList.toggle('off', !show);
}

/** 清空手写板与候选 */
function hwReset() {
  hwFreezeTimer();
  hwStrokes = [];
  hwDrawing = null;
  hwPicked = false;
  kpCands = [];
  kpPage = 0;
  hwRedraw();
  hwHint(true);
  kpRenderCands();
  kpSyncPad();
}

function hwFreezeTimer() {
  if (hwTimer) { clearTimeout(hwTimer); hwTimer = 0; }
}

/** 笔一停就安排识别（防抖，避免每移动一下就匹配） */
function hwSchedule() {
  hwFreezeTimer();
  hwTimer = setTimeout(function () {
    hwTimer = 0;
    hwRecognize();
  }, 220);
}

/**
 * 候选重排：字形分数相近时让常用字优先。
 * 手写识别容易把「口/囗」「人/入」「日/曰」这类形近字搞混，
 * 借词库里的常用度表（CHAR_RANK，越靠前越常用）做一点加权。
 */
function hwCharBonus(ch) {
  const r = (typeof CHAR_RANK_MAP !== 'undefined') ? CHAR_RANK_MAP.get(ch) : undefined;
  const rank = (r === undefined) ? 6000 : r;   // 生僻字按最不常用处理
  return -0.12 * Math.log(rank + 10);
}

/** 拿笔画做识别，结果塞进候选栏 */
function hwRecognize() {
  if (!hwStrokes.length) return;
  const strokes = [];
  for (let i = 0; i < hwStrokes.length; i++) {
    const st = hwStrokes[i];
    if (!st || st.length < 2) continue;
    const pts = [];
    for (let j = 0; j < st.length; j++) pts.push([st[j].x, st[j].y]);
    strokes.push(pts);
  }
  if (!strokes.length) return;
  if (!hwEnsureEngine()) {
    toast('手写字库未加载');
    return;
  }
  try {
    const analyzed = new HanziLookup.AnalyzedCharacter(strokes);
    if (!hwMatcher) hwMatcher = new HanziLookup.Matcher('mmah', 0.25);
    hwMatcher.match(analyzed, 16, function (matches) {
      const list = (matches || []).map(function (m) {
        return { t: m.character, rest: '', sc: m.score + hwCharBonus(m.character) };
      });
      list.sort(function (a, b) { return b.sc - a.sc; });
      kpCands = list;
      kpPage = 0;
      kpRenderCands();
    });
  } catch (e) {
    /* 笔画太短或异常时忽略，不打断输入 */
  }
}

/** 手写面板下方四个按钮 */
function hwAction(a) {
  if (a === 'clear') { hwReset(); return; }
  if (a === 'undo') {
    hwFreezeTimer();
    if (hwStrokes.length) {
      hwStrokes.pop();
      hwDrawing = null;
      hwPicked = false;
      hwRedraw();
      if (hwStrokes.length) hwSchedule();
      else { kpCands = []; kpPage = 0; hwHint(true); kpRenderCands(); }
    } else {
      // 画板已空时退格当作删输入框里的字
      kpDelete();
    }
    return;
  }
  if (a === 'space') { kpInsert(' '); kpRefresh(); return; }
  if (a === 'done') { kpToggle(false); persist(true); return; }
}

/** 绑定手写板指针事件 */
function hwBind() {
  const board = $('kpHwBoard');
  if (!board || board.dataset.hwBound) return;
  board.dataset.hwBound = '1';

  function pos(e) {
    const r = board.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, e.clientY - r.top))
    };
  }

  board.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType !== 'touch') return;
    e.preventDefault();
    if (hwPicked) { hwReset(); }
    hwFreezeTimer();
    try { board.setPointerCapture(e.pointerId); } catch (err) { }
    hwDrawing = [pos(e)];
    hwStrokes.push(hwDrawing);
    hwHint(false);
    const ctx = hwCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(hwDrawing[0].x, hwDrawing[0].y);
      ctx.lineTo(hwDrawing[0].x + 0.1, hwDrawing[0].y + 0.1);
      ctx.stroke();
    }
  }, { passive: false });

  board.addEventListener('pointermove', function (e) {
    if (!hwDrawing) return;
    e.preventDefault();
    const p = pos(e);
    const last = hwDrawing[hwDrawing.length - 1];
    if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 1.2) return;
    hwDrawing.push(p);
    const ctx = hwCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, { passive: false });

  function end(e) {
    if (!hwDrawing) return;
    if (e && e.preventDefault) e.preventDefault();
    hwDrawing = null;
    hwSchedule();
  }
  board.addEventListener('pointerup', end, { passive: false });
  board.addEventListener('pointercancel', end, { passive: false });
  board.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}

/* 把键盘 DOM 注入 body（已存在则跳过）。kpToggle 和自举都会调用，
   保证键盘被弹窗重写删掉之后还能自己长回来。 */
function kpEnsureDom() {
  if (document.getElementById('keypad')) return true;
  try {
    if (typeof KP_DOM !== 'string') return false;
    const box = document.createElement('div');
    box.innerHTML = KP_DOM.trim();
    const el = box.firstElementChild;
    if (!el) return false;
    document.body.appendChild(el);
    return true;
  } catch (e) { return false; }
}

/* 屏幕旋转 / 键盘高度变化时重算手写板尺寸 */
window.addEventListener('resize', function () {
  const el = document.getElementById('keypad');
  if (kpOpen && kpMode === 'hw' && el && el.classList.contains('on')) hwSync();
});
window.addEventListener('orientationchange', function () {
  setTimeout(function () {
    if (kpOpen && kpMode === 'hw') hwSync();
  }, 260);
});
