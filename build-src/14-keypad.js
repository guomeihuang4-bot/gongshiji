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
    if (m === 'py26' || m === 'py9' || m === 'en') return m;
  } catch (e) { }
  return 'py26';
}

function kpToggle(open, input) {
  const el = $('keypad');
  if (!el) return;
  if (open) {
    const dlg = document.querySelector('dialog[open]');
    const host = dlg || document.body;
    if (el.parentElement !== host) host.appendChild(el);
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
  if (mode === 'py26' || mode === 'py9' || mode === 'en') {
    kpLastTextMode = mode;
    try { localStorage.setItem(KP_MODE_KEY, mode); } catch (e) { }
  }
  kpBuf = '';
  kpCands = [];
  kpPage = 0;
  kpSeg = '';
  kpFreezeDel();
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
  const grid = $('kpGrid'), alpha = $('kpAlpha'), t9 = $('kpT9');
  if (grid) grid.hidden = kpMode !== 'num';
  if (alpha) alpha.hidden = !(kpMode === 'en' || kpMode === 'py26');
  if (t9) t9.hidden = kpMode !== 'py9';
  kpAnalyzeBuf();   // 先算候选与分词，界面才能显示最新的拼音串
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
  kpRefresh();
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
    const el = kpInput;
    kpToggle(false);
    try {
      el.readOnly = false;
      el.focus();
    } catch (e) { }
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
    if (t && t.matches && t.matches(SEL)) kpToggle(true, t);
  });
  document.addEventListener('mousedown', e => {
    const t = e.target;
    if (t && t.matches && t.matches(SEL)) {
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
}

/** 文本输入框使用内置键盘（不再弹系统输入法） */
function makeTextInputsCustom() {
  $$('input[data-text]').forEach(el => { el.readOnly = true; });
}
