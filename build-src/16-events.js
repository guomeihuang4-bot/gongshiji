/* =====================================================================
   事件与启动
   ===================================================================== */

/* ---------- 设置字段写入 ---------- */
function curMonthly() {
  const mk = MONTH_KEY(month);
  if (!state.data[state.active].monthly[mk]) {
    state.data[state.active].monthly[mk] = defaultMonthlySeed(state.active);
  }
  return state.data[state.active].monthly[mk];
}

function setSetting(path, raw, isNum) {
  const s = state.data[state.active].settings;
  let v = raw;
  if (isNum) v = raw === '' ? 0 : num(raw, 0, 0, 1e8);
  if (path === 'unit') v = String(raw || '').slice(0, 6);
  if (path === 'defaultShift') v = WORK_SHIFTS.includes(raw) ? raw : '白班';
  s[path] = v;
}

function updateHourlyHint() {
  const el = $('hourlyHint');
  if (!el) return;
  const s = state.data.regular.settings;
  const cyc = cycleRange(month.getFullYear(), month.getMonth());
  if (s.hourlyRate && s.hourlyRate > 0) {
    el.innerHTML = '已自定义为 <b>' + money(s.hourlyRate) + '</b> / 小时。清空可恢复自动计算。';
  } else {
    const days = s.autoDays ? payDaysInCycle(cyc) : s.daysPerMonth;
    el.innerHTML = '自动：底薪 ÷（' + days + ' × ' + s.hoursPerDay + '）= <b>' + money(hourlyRateFor('regular', cyc)) + '</b> / 小时';
  }
}

function onFieldInput(e) {
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.set) {
    const isNum = !!t.dataset.num;
    setSetting(t.dataset.set, t.value, isNum);
    persist();
    updateHourlyHint();
    return;
  }
  if (t.dataset.item) {
    const parts = t.dataset.item.split(':');
    const prefix = parts[0], idx = Number(parts[1]), field = parts[2];
    if (prefix === 'deductions' || prefix === 'allowances') {
      const mon = curMonthly();
      const arr = mon[prefix];
      if (!arr[idx]) return;
      if (field === 'name') arr[idx].name = String(t.value).slice(0, 30);
      if (field === 'amount') arr[idx].amount = t.value === '' ? 0 : num(t.value, 0, 0, 1e7);
      persist();
      return;
    }
    if (prefix === 'pieceItems') {
      const s = state.data.piece.settings;
      const arr = s.items;
      if (!arr[idx]) return;
      if (field === 'name') arr[idx].name = String(t.value).slice(0, 20);
      if (field === 'rate') arr[idx].rate = t.value === '' ? 0 : num(t.value, 0, 0, 1e6);
      persist();
    }
  }
}

/* ---------- 点击 ---------- */
function closeAllSheets() {
  ['aboutDialog', 'bgDialog', 'payslipDialog', 'timerDialog', 'cycleDialog', 'editor'].forEach(id => {
    const el = $(id);
    if (el && el.open) el.close();
  });
  kpToggle(false);
  clearInterval(timerTick);
}

function onClick(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const a = t.dataset.action;

  switch (a) {
    case 'view': view = t.dataset.view; render(); return;
    case 'prev-month': changeMonth(-1); return;
    case 'next-month': changeMonth(1); return;
    case 'set-worker': {
      const w = t.dataset.w;
      if (!WORKER_ORDER.includes(w) || w === state.active) return;
      state.active = w;
      persist(true);
      render();
      toast('已切到' + WORKER_META[w].name);
      return;
    }
    case 'edit-day': openEditor(t.dataset.date); return;
    case 'edit-today': openEditor(todayKey(), { type: t.dataset.type }); return;
    case 'go-today': {
      month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      view = 'calendar';
      render();
      openEditor(todayKey());
      return;
    }
    case 'close-editor': $('editor').close(); return;
    case 'save-entry': saveEntry(); return;
    case 'del-record': deleteCurrentRecord(); return;
    case 'pick-shift': {
      editorDraft.shift = t.dataset.v;
      refreshEditorBody();
      return;
    }
    case 'set-daytype': {
      const v = t.dataset.t;
      if (v === 'auto') delete state.overrides[editingKey];
      else state.overrides[editingKey] = v;
      persist(true);
      refreshEditorBody();
      return;
    }
    case 'quick-ot': {
      editorDraft.otHours = t.dataset.v === '0' ? '' : t.dataset.v;
      refreshEditorBody();
      return;
    }
    case 'quick-rh': { editorDraft.regularHours = t.dataset.v; refreshEditorBody(); return; }
    case 'quick-hours': { editorDraft.hours = t.dataset.v; refreshEditorBody(); return; }
    case 'quick-units': { editorDraft.units = t.dataset.v; refreshEditorBody(); return; }
    case 'site-type': {
      editorDraft.type = t.dataset.v;
      if (t.dataset.v !== 'work') editorDraft.amount = editorDraft.amount || '';
      refreshEditorBody();
      return;
    }
    case 'site-unit': { editorDraft.unit = t.dataset.v; refreshEditorBody(); return; }
    case 'add-piece': {
      if (editorDraft.items.length >= 8) { toast('最多 8 项'); return; }
      const s = state.data.piece.settings;
      const first = s.items[0] || { name: '', rate: '' };
      editorDraft.items.push({ name: '', qty: '', rate: first.rate || '' });
      refreshEditorBody();
      return;
    }
    case 'del-piece': {
      if (editorDraft.items.length <= 1) { editorDraft.items[0] = { name: '', qty: '', rate: '' }; refreshEditorBody(); return; }
      editorDraft.items.splice(Number(t.dataset.idx), 1);
      refreshEditorBody();
      return;
    }

    case 'cycle': openCycleDialog(); return;
    case 'close-sheet': {
      const el = $(t.dataset.sheet);
      if (el) el.close();
      return;
    }
    case 'set-cycle': setCycle(t.dataset.day); return;
    case 'wheel-pick': {
      const w = $('cycleWheel');
      const d = Number(t.dataset.day) || 1;
      if (w) {
        w.scrollTo({ top: (d - 1) * 44, behavior: 'smooth' });
        const idx = d - 1;
        w.querySelectorAll('.wheel-item').forEach((it, i) => it.classList.toggle('on', i === idx));
      }
      return;
    }
    case 'apply-cycle-wheel': {
      const w = $('cycleWheel');
      const d = w ? Math.round(w.scrollTop / 44) + 1 : 1;
      setCycle(Math.max(1, Math.min(28, d)));
      return;
    }

    case 'about': openAbout(); return;
    case 'copy-js': {
      const el = $('aboutDialog');
      copyText(el.dataset.js || sourceJS(), t);
      return;
    }
    case 'copy-html': {
      const el = $('aboutDialog');
      copyText(el.dataset.html || sourceHTML(), t);
      return;
    }

    case 'open-bg': openBg(); return;
    case 'set-bg-preset': setBgPreset(t.dataset.id); return;
    case 'pick-bg-image': $('bgFile').click(); return;
    case 'remove-bg-image': theme.image = ''; persist(true); applyBackground(); openBg(); return;
    case 'toggle-bg-glass': theme.glass = !theme.glass; persist(true); applyBackground(); openBg(); return;
    case 'bg-fit': theme.fit = t.dataset.v === 'contain' ? 'contain' : 'cover'; persist(true); applyBackground(); openBg(); return;
    case 'reset-bg': resetBg(); return;

    case 'payslip': openPayslip(); return;
    case 'print-payslip': doPrint(); return;
    case 'save-payslip-img': savePayslipImage(); return;

    case 'backup': exportBackup(); return;
    case 'import': $('importFile').click(); return;
    case 'export-csv': exportCSV(); return;
    case 'clear-worker': clearWorkerData(); return;

    case 'add-item': {
      const mon = curMonthly();
      mon[t.dataset.kind].push({ name: '', amount: 0 });
      persist(true); render(); return;
    }
    case 'del-item': {
      const mon = curMonthly();
      const arr = mon[t.dataset.kind];
      if (arr && arr[Number(t.dataset.idx)]) { arr.splice(Number(t.dataset.idx), 1); persist(true); render(); }
      return;
    }
    case 'add-rate': {
      const s = state.data.piece.settings;
      if (s.items.length >= 30) return;
      s.items.push({ name: '', rate: 0 });
      persist(true); render(); return;
    }
    case 'del-rate': {
      const s = state.data.piece.settings;
      if (s.items.length <= 1) { s.items[0] = { name: '', rate: 0 }; }
      else s.items.splice(Number(t.dataset.idx), 1);
      persist(true); render(); return;
    }

    case 'toggle-set': {
      const key = t.dataset.attr;
      const s = state.data[state.active].settings;
      if (key in s) {
        s[key] = !s[key];
        persist(true);
        render();
        if (key === 'autoDays') toast(s.autoDays ? '计薪天数改为按工作日自动算' : '计薪天数改为固定值');
      }
      return;
    }
    case 'toggle-workweek': {
      const dow = Number(t.dataset.dow);
      const s = state.data.regular.settings;
      if (!Array.isArray(s.workWeek)) s.workWeek = [0, 1, 1, 1, 1, 1, 0];
      s.workWeek[dow] = s.workWeek[dow] ? 0 : 1;
      if (s.workWeek.every(v => !v)) { s.workWeek[dow] = 1; toast('至少要留一天上班'); }
      persist(true); render(); return;
    }
    case 'workweek-preset': {
      const p = t.dataset.preset;
      const s = state.data.regular.settings;
      s.workWeek = p === '7' ? [1, 1, 1, 1, 1, 1, 1] : p === '6' ? [0, 1, 1, 1, 1, 1, 1] : [0, 1, 1, 1, 1, 1, 0];
      persist(true); render();
      toast(p === '5' ? '已设为 5 天 8 小时' : p === '6' ? '已设为 6 天工作制' : '已设为 7 天全上班');
      return;
    }

    case 'open-timer': openTimer(); return;
    case 'close-timer': $('timerDialog').close(); clearInterval(timerTick); return;
    case 'timer-toggle': timerToggle(); return;
    case 'timer-reset': timerReset(); return;
    case 'timer-finish': timerFinish(); return;

    case 'cancel-confirm': $('confirmDialog').close(); confirmCb = null; return;
    case 'settle-now': {
      state.settleNow = !state.settleNow;
      persist(true); render();
      toast(state.settleNow ? '已按今天结算（未到的底薪已扣除）' : '已恢复整月结算');
      return;
    }
    default: return;
  }
}

/* ---------- 月份 ---------- */
function changeMonth(n) {
  const d = new Date(month.getFullYear(), month.getMonth() + n, 1);
  if (d.getFullYear() < 2000 || d.getFullYear() > 2059) { toast('超出可查看范围'); return; }
  month = d;
  render();
}

/* ---------- 数据导出 / 导入 ---------- */
function download(name, text, type) {
  if (window.AndroidBridge && typeof window.AndroidBridge.saveFile === 'function') {
    try { window.AndroidBridge.saveFile(name, text); toast('已保存到「下载」：' + name); return; } catch (e) { }
  }
  const blob = new Blob([text], { type: type || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('已导出 ' + name);
}

function exportBackup() {
  download('工时记备份-' + todayKey() + '.json', JSON.stringify(state, null, 2), 'application/json');
}

function csvEscape(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}

function exportCSV() {
  const kind = state.active;
  const y = month.getFullYear(), m = month.getMonth();
  const cyc = cycleRange(y, m);
  const dict = state.data[kind].records;
  const head = ['日期', '星期', '日期类型', '工种', '摘要', '金额', '备注'];
  const lines = [head.map(csvEscape).join(',')];
  cyc.dates.forEach(k => {
    const rec = dict[k];
    const d = parseD(k);
    lines.push([
      k, '周' + WEEK_CN[d.getDay()], TYPE_LABEL[dateType(k)] || '', WORKER_META[kind].name,
      rec ? dayDesc(rec, kind) : '',
      rec ? dayWage(k, rec, kind) : '',
      rec ? (rec.note || '') : ''
    ].map(csvEscape).join(','));
  });
  download(`工时记-${WORKER_META[kind].name}-${y}${pad(m + 1)}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object') throw new Error('文件格式不对');
      if (data.v === 3 && data.data) {
        const incoming = cleanData(data);
        let n = 0;
        WORKER_ORDER.forEach(kind => {
          const src = incoming.data[kind];
          if (!src) return;
          Object.assign(state.data[kind].settings, src.settings);
          for (const [k, rec] of Object.entries(src.records)) { state.data[kind].records[k] = rec; n++; }
          for (const [k, mon] of Object.entries(src.monthly)) state.data[kind].monthly[k] = mon;
        });
        if (incoming.cycleStartDay) state.cycleStartDay = incoming.cycleStartDay;
        state.overrides = Object.assign({}, state.overrides, incoming.overrides);
        persist(true); render();
        toast(`已导入 ${n} 条记录`);
      } else if (data.records || data.regular || data.mode) {
        const old = migrateFromV2(data);
        let n = 0;
        WORKER_ORDER.forEach(kind => {
          const src = old.data[kind];
          Object.assign(state.data[kind].settings, src.settings);
          Object.keys(src.records).forEach(k => { state.data[kind].records[k] = src.records[k]; n++; });
          Object.entries(src.monthly).forEach(([mk, mon]) => { state.data[kind].monthly[mk] = mon; });
        });
        if (old.cycleStartDay) state.cycleStartDay = old.cycleStartDay;
        if (old.overrides) state.overrides = Object.assign({}, state.overrides, old.overrides);
        persist(true); render();
        toast(`已导入旧版备份，共 ${n} 条记录`);
      } else {
        throw new Error('没有可导入的记录');
      }
    } catch (e) {
      toast('导入失败：' + e.message);
    }
  };
  reader.readAsText(file);
}

function clearWorkerData() {
  const kind = state.active;
  const n = Object.keys(state.data[kind].records).length;
  confirmDialog('清空' + WORKER_META[kind].name + '数据', `会删除「${WORKER_META[kind].name}」的 ${n} 条记录和该工种的设置，其他工种不受影响。\n\n建议先导出备份。`, () => {
    state.data[kind] = { settings: defaultWorkerSettings(kind), records: {}, monthly: {} };
    persist(true);
    render();
    toast('已清空' + WORKER_META[kind].name);
  });
}

/* ---------- 绑定 ---------- */
function bindEvents() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', onFieldInput);
  document.addEventListener('change', e => {
    const t = e.target;
    if (t && t.id === 'importFile') {
      const f = t.files && t.files[0];
      if (f) importBackup(f);
      t.value = '';
    }
    if (t && t.id === 'bgFile') {
      const f = t.files && t.files[0];
      if (f) handleBgFile(f);
      t.value = '';
    }
    if (t && t.dataset && t.dataset.set === 'defaultShift') {
      state.data.temp.settings.defaultShift = t.value;
      persist();
    }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (!t || !t.dataset) return;
    const lblOf = () => (t.parentElement && t.parentElement.querySelectorAll('span')[1]) || null;
    if (t.dataset.action === 'bg-alpha') {
      theme.cardAlpha = num(t.value, 0.86, 0.1, 1);
      persist();
      applyBackground();
      refreshBgPreview();
      const lbl = lblOf(); if (lbl) lbl.textContent = Math.round(theme.cardAlpha * 100) + '%';
      return;
    }
    if (t.dataset.action === 'bg-dim') {
      theme.dim = num(t.value, 0.18, 0, 0.75);
      persist();
      applyBackground();
      refreshBgPreview();
      const lbl = lblOf(); if (lbl) lbl.textContent = Math.round(theme.dim * 100) + '%';
      return;
    }
    if (t.dataset.action === 'bg-blur') {
      theme.blurPx = num(t.value, 0, 0, 20);
      persist();
      applyBackground();
      refreshBgPreview();
      const lbl = lblOf(); if (lbl) lbl.textContent = Math.round(theme.blurPx) + 'px';
    }
  });
  window.addEventListener('scroll', () => {
    const tb = $('topbar');
    if (tb) tb.classList.toggle('scrolled', window.scrollY > 4);
  }, { passive: true });
  const yes = $('confirmYes');
  if (yes) yes.addEventListener('click', () => {
    const cb = confirmCb; confirmCb = null;
    $('confirmDialog').close();
    if (cb) cb();
  });
  ['editor', 'aboutDialog', 'bgDialog', 'payslipDialog', 'timerDialog', 'cycleDialog'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('close', () => {
      if (id === 'editor') { editingKey = null; editorDraft = null; kpToggle(false); }
      if (id === 'timerDialog') clearInterval(timerTick);
    });
  });
  bindKeypadTriggers();
}

/* ---------- 后台守护：自动保存 + 定时刷新计时 ---------- */
setInterval(() => {
  if (state.timer) persist();
}, 30000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist(true);
});
window.addEventListener('beforeunload', () => persist(true));

/* ---------- 返回键（APP 内调用） ---------- */
window.__onBack = function () {
  try {
    if (kpOpen) { kpToggle(false); return true; }
    const order = ['confirmDialog', 'editor', 'cycleDialog', 'payslipDialog', 'bgDialog', 'aboutDialog', 'timerDialog'];
    for (const id of order) {
      const el = $(id);
      if (el && el.open) { el.close(); return true; }
    }
    if (view !== 'calendar') { view = 'calendar'; render(); return true; }
    return false;
  } catch (e) { return false; }
};

/* ---------- 调试/自动化接口（离线单文件，不联网） ---------- */
window.__app = {
  get state() { return state; },
  get theme() { return theme; },
  get month() { return month; },
  get view() { return view; },
  get draft() { return editorDraft; },
  get editing() { return editingKey; },
  setMonth(y, m) { month = new Date(y, m, 1); },
  reset() { state = defaultState(); theme = defaultTheme(); month = new Date(); render(); },
  cycleRange, cycleStats, dateType, isOffDay, holidayName, dayWage, dayDesc,
  hourlyRateFor, hourlyRateOfDay, multiplierFor, lunarText, pieceDayWage, siteDayWage,
  render, persist, openEditor, saveEntry, openPayslip, payslipHTML, exportBackup,
  applyBackground, openBg, resetBg, handleBgFile,
  /* 键盘：测试与调试用 */
  get keypad() { return { open: kpOpen, mode: kpMode, buf: kpBuf, cands: kpCands, page: kpPage, seg: kpSeg }; },
  kpPick: i => kpPickIndex(i),
  kpPress: k => kpPress(k),
  pyAnalyze, t9Analyze, pySegDisplay,
  get lexSize() { return LEX.size; },
  toast: msg => toast(msg),
  version: APP_VERSION
};

/* ---------- 启动 ---------- */
load();
ensureHolidays();
render();
bindEvents();
maybeAutoAbout();
booted = true;
