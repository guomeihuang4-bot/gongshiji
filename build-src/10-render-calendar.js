/* =====================================================================
   渲染：框架 / 顶栏 / 日历页
   ===================================================================== */

const ICON = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="M13.5 6.5 17.5 10.5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.2v.2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2z"/><path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4V20"/></svg>',
  helmet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18.5v-3a8 8 0 0 1 16 0v3"/><path d="M2.5 18.5h19M9 7.2V4.4c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v2.8"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  calendar2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path d="m8 14 2 2 4-4"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.3-4.7L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.7L20 16"/><path d="M20 20v-4h-4"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-2.5-1.6L14 21l-2-1.6L10 21l-2.5-1.6L5 21V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h1.5A4.5 4.5 0 0 0 21 10c0-3.9-4-7-9-7Z"/><circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5V3Z"/><path d="M8 3v6h8V3"/><rect x="8" y="13" width="8" height="5" rx="1"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.2"/></svg>'
};
const WORKER_ICON = { regular: ICON.wallet, temp: ICON.clock, piece: ICON.box, site: ICON.helmet };

let lastView = null;
function render() {
  renderTop();
  renderNav();
  const main = $('main');
  if (!main) return;
  const keepY = (lastView === view) ? (window.scrollY || window.pageYOffset || 0) : 0;
  const html = view === 'calendar' ? calendarPage()
    : view === 'details' ? detailsPage()
      : settingsPage();
  main.innerHTML = html;
  lastView = view;
  applyBackground();
  try { window.scrollTo(0, keepY); } catch (e) { }
}

function renderNav() {
  $$('[data-nav]').forEach(b => {
    const on = b.dataset.nav === view;
    b.classList.toggle('on', on);
    b.setAttribute('aria-current', on ? 'page' : 'false');
  });
}

function renderTop() {
  $$('#workerSwitch button').forEach(b => {
    const on = b.dataset.w === state.active;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const ct = $('cycleText');
  if (ct) {
    const sd = state.cycleStartDay || 1;
    ct.textContent = sd === 1 ? '自然月' : `${sd}号起`;
  }
  const cb = $('cycleBtn');
  if (cb) cb.classList.toggle('on', (state.cycleStartDay || 1) !== 1);
  const bg = $('bgBtn');
  if (bg) bg.title = '自定义背景';
}

/* ---------------- 日历页 ---------------- */
function fmtMoneySigned(v) {
  if (!v) return '';
  const sign = v > 0 ? '+' : '-';
  return `<span class="d-wage ${v < 0 ? 'neg' : ''}">${sign}${moneyPlain(Math.abs(v))}</span>`;
}

/** 日历格子第二行的小字 */
function dayMiniText(kind, rec, k) {
  if (!rec) return '';
  if (kind === 'regular') {
    if (!WORK_SHIFTS.includes(rec.shift)) return rec.shift;
    const ot = num(rec.otHours, 0, 0, 24);
    if (ot > 0) return '加' + (ot % 1 ? ot.toFixed(1) : ot) + 'h';
    return rec.shift.slice(0, 1);
  }
  if (kind === 'temp') {
    const h = num(rec.hours, 0, 0, 24);
    return h ? (h % 1 ? h.toFixed(1) : h) + 'h' : (rec.shift === '休息' ? '休' : '');
  }
  if (kind === 'piece') {
    const q = pieceDayQty(rec);
    return q ? (q % 1 ? q.toFixed(1) : q) + (state.data.piece.settings.unit || '件') : '';
  }
  if (rec.type === 'borrow') return '借支';
  if (rec.type === 'settle') return '结算';
  if (rec.unit === 'day') {
    const u = num(rec.units, 0, 0, 30);
    return (u % 1 ? u.toFixed(1) : u) + '个工';
  }
  if (rec.unit === 'hour') {
    const h = num(rec.hours, 0, 0, 24);
    return (h % 1 ? h.toFixed(1) : h) + 'h';
  }
  if (num(rec.pkgQty, 0, 0, 1e6) > 0) return '包工';
  return '休息';
}

/** 汇总横幅右侧统计（按工种） */
function summaryStats(kind, st) {
  if (kind === 'regular') {
    const leaveTip = st.leaveApplied > 0 ? `（调休抵 ${st.leaveApplied}h）` : '';
    return `<div class="row"><b>${st.workDays}</b> 天上班</div>
      <div class="row"><b>${st.otHours % 1 ? st.otHours.toFixed(1) : st.otHours}</b> 小时加班${leaveTip}</div>
      <div class="row">时薪 <b>${money(st.hourlyRate)}</b></div>`;
  }
  if (kind === 'temp') {
    return `<div class="row"><b>${st.attendance}</b> 天出勤</div>
      <div class="row"><b>${st.hours % 1 ? st.hours.toFixed(1) : st.hours}</b> 小时</div>
      <div class="row">时薪 <b>${money(state.data.temp.settings.rate)}</b></div>`;
  }
  if (kind === 'piece') {
    return `<div class="row"><b>${st.count}</b> 天计件</div>
      <div class="row"><b>${st.qty % 1 ? st.qty.toFixed(1) : st.qty}</b> ${esc(state.data.piece.settings.unit || '件')}</div>
      <div class="row">共 <b>${st.byItem ? Object.keys(st.byItem).length : 0}</b> 个品项</div>`;
  }
  return `<div class="row"><b>${st.units % 1 ? st.units.toFixed(1) : st.units}</b> 个工</div>
    <div class="row">包工 <b>${st.pkgQty % 1 ? st.pkgQty.toFixed(1) : st.pkgQty}</b></div>
    <div class="row">加班 <b>${st.otPay ? st.otPay.toFixed(0) : 0}</b> 元</div>`;
}

function summaryNote(kind, st) {
  if (!st.hasAny) return '这个周期还没有记工，点下面开始记录';
  if (kind === 'regular') {
    let line = `底薪 ${money(st.base)} · 加班 ${money(st.otPay)} · 扣 ${money(st.dedTotal + st.baseDeduct)}`;
    if (st.leaveApplied > 0) line += ` · 调休抵 ${st.leaveApplied}h`;
    return line;
  }
  if (kind === 'temp') return `工时 ${st.hours} 小时 · 扣 ${money(st.dedTotal)}`;
  if (kind === 'piece') return `计件 ${st.qty} ${state.data.piece.settings.unit || '件'} · 扣 ${money(st.dedTotal)}`;
  return `点工 ${money(st.dayPay)} · 包工 ${money(st.pkgPay)} · 借支 ${money(st.borrow)}`;
}

function calendarPage() {
  const y = month.getFullYear(), m = month.getMonth();
  const kind = state.active;
  const cyc = cycleRange(y, m);
  const st = cycleStats(y, m, kind);
  const dict = state.data[kind].records;

  // 以周一为一周第一天（国内习惯）
  const gs = new Date(cyc.start); gs.setDate(gs.getDate() - ((gs.getDay() + 6) % 7));
  const ge = new Date(cyc.end); ge.setDate(ge.getDate() + (6 - ((ge.getDay() + 6) % 7)));
  const tk = todayKey();
  let cells = '';
  const cursor = new Date(gs);
  let guard = 0;
  while (cursor <= ge && guard++ < 60) {
    const k = ymd(cursor);
    const inCycle = cursor >= cyc.start && cursor <= cyc.end;
    const rec = dict[k];
    const off = !inCycle ? false : isOffDay(k);
    const isToday = k === tk;
    const hname = inCycle ? holidayName(k) : '';
    const dow = cursor.getDay();

    let cls = 'day';
    if (!inCycle) cls += ' outside';
    if (isToday) cls += ' is-today';
    if (inCycle && hname) cls += ' holiday';
    else if (inCycle && (dow === 0 || dow === 6)) cls += ' weekend';
    if (rec) cls += ' has';

    const lfest = inCycle && !hname ? lunarFestival(k) : '';
    let second = '';
    if (hname) second = `<span class="lunar">${esc(hname.slice(0, 3))}</span>`;
    else if (rec) {
      const t = dayMiniText(kind, rec, k);
      second = t ? `<span class="lunar">${esc(t)}</span>` : '';
    } else if (lfest) {
      second = `<span class="lunar lf">${esc(lfest.slice(0, 3))}</span>`;
    } else if (LUNAR_SUPPORT) {
      const lt = lunarText(k);
      if (lt) second = `<span class="lunar">${esc(lt)}</span>`;
    }

    let third = '';
    if (rec && inCycle) {
      const w = dayWage(k, rec, kind, cyc);
      if (kind === 'site' && rec.type === 'borrow') third = `<span class="d-wage neg">-${moneyPlain(rec.amount)}</span>`;
      else if (kind === 'site' && rec.type === 'settle') third = `<span class="d-wage neg">-${moneyPlain(rec.amount)}</span>`;
      else if (w) third = fmtMoneySigned(w);
    }

    const rest = inCycle && off ? '<span class="rest-tag">休</span>' : '';

    cells += `<button type="button" class="${cls}" data-action="edit-day" data-date="${k}" ${inCycle ? '' : 'disabled'} aria-label="${k}">
      ${rest}
      <span class="dnum">${cursor.getDate()}</span>
      ${second}
      ${third}
    </button>`;
    cursor.setDate(cursor.getDate() + 1);
  }

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']
    .map((d, i) => `<span class="${i >= 5 ? 'we' : ''}">${d}</span>`).join('');

  const legend = legendHTML(kind);
  const modeNote = state.settleNow ? '<span class="tag">已按记录结算</span>' : '';

  return `
  <div class="monthbar">
    <button class="iconbtn" type="button" data-action="prev-month" aria-label="上个月">‹</button>
    <div class="month-title">
      <span class="eyebrow">${cyc.natural ? '自然月' : (state.cycleStartDay + ' 号起 · 工资周期')}</span>
      <strong>${cyc.natural ? `${y}年${m + 1}月` : cyc.label}</strong>
      <span class="tap-hint">${WORKER_META[kind].name} · 本月记录 ${Object.keys(dict).filter(k => k >= ymd(cyc.start) && k <= ymd(cyc.end)).length} 天</span>
    </div>
    <button class="iconbtn" type="button" data-action="next-month" aria-label="下个月">›</button>
  </div>

  <div class="summary">
    <div class="s-main">
      <div class="s-label">本月工资 ${modeNote}
        <button class="settle-mini ${state.settleNow ? 'on' : ''}" type="button" data-action="settle-now">${state.settleNow ? '恢复整月' : '结算本月'}</button>
      </div>
      <div class="s-money ${st.net < 0 ? 'neg' : ''}">${money(st.net)}</div>
      <div class="s-note">${summaryNote(kind, st)}</div>
    </div>
    <div class="s-stats">${summaryStats(kind, st)}</div>
  </div>

  ${missReminder(kind, cyc)}

  <div class="card calendar-card">
    <div class="week">${weekdays}</div>
    <div class="days">${cells}</div>
    <div class="cal-foot">${legend}</div>
  </div>

  <div class="cal-actions">
    <button class="btn btn-soft" type="button" data-action="open-timer">${ICON.clock}<span>计时</span></button>
    <button class="btn btn-primary" type="button" data-action="edit-today">
      ${ICON.plus}<span>记工</span>
    </button>
  </div>
  ${kind === 'site' ? `<div class="cal-actions" style="grid-template-columns:1fr;margin-top:9px">
    <button class="btn btn-ghost" type="button" data-action="edit-today" data-type="borrow">记借支 / 结算</button>
  </div>` : ''}
  <p class="footer-note">${WORKER_META[kind].name} · 点日期可补记或修改 · 数据只存在本机</p>`;
}

function legendHTML(kind) {
  const dot = (c, t) => `<span class="lg"><span class="dot" style="background:${c}"></span>${t}</span>`;
  if (kind === 'regular') {
    return dot('#5b8def', '上班') + dot('#b9c3d1', '休息') + dot('#e0533d', '事假') + dot('#e8b93a', '病假') + dot('#e0533d', '节假日') + `<span class="lg muted">灰「休」= 非工作日</span>`;
  }
  if (kind === 'temp') {
    return dot('#5b8def', '上班') + dot('#b9c3d1', '休息') + dot('#e0533d', '节假日') + `<span class="lg muted">记录工时 × 单价</span>`;
  }
  if (kind === 'piece') {
    return dot('#7a5cd6', '计件') + dot('#e0533d', '节假日') + `<span class="lg muted">件数 × 单价</span>`;
  }
  return dot('#189a63', '点工') + dot('#7a5cd6', '包工') + dot('#d97b1f', '借支') + dot('#8794a8', '结算') + `<span class="lg muted">绿「休」= 非工作日</span>`;
}

function missReminder(kind, cyc) {
  const tk = todayKey();
  const dict = state.data[kind].records;
  let missed = 0;
  for (const k of cyc.dates) {
    if (k >= tk) break;
    if (isOffDay(k)) continue;
    if (!dict[k]) missed++;
  }
  if (!missed) return '';
  return `<div class="reminder">${ICON.warn}<span>这个周期有 <b>${missed}</b> 个工作日还没记录</span>
    <button class="go" type="button" data-action="go-today">去记录</button></div>`;
}
