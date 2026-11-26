/* =====================================================================
   渲染：明细页
   ===================================================================== */

function liRow(name, val, opt) {
  opt = opt || {};
  const cls = opt.neg ? 'neg' : opt.pos ? 'pos' : '';
  const em = opt.tag ? `<em class="em">${esc(opt.tag)}</em>` : '';
  const sub = opt.sub ? `<div class="li-sub">${opt.sub}</div>` : '';
  return `<div class="li-row${opt.total ? ' total' : ''}"><div class="li-name"><span>${esc(name)}</span>${em}</div><span class="li-val ${cls}">${val}</span></div>${sub}`;
}

function settleBreakdown(kind, st) {
  if (kind === 'regular') {
    const otSub = [];
    if (st.otWeekday > 0) otSub.push(`平时 ${st.otWeekday}h ${money(st.payWeekday)}`);
    if (st.otWeekend > 0) otSub.push(`周末 ${st.otWeekend}h ${money(st.payWeekend)}`);
    if (st.otHoliday > 0) otSub.push(`节假日 ${st.otHoliday}h ${money(st.payHoliday)}`);
    if (st.leaveApplied > 0) otSub.push(`已调休抵扣 ${st.leaveApplied}h`);
    const otRest = round2(st.otHours - st.leaveApplied);
    const otLabel = st.leaveApplied > 0
      ? `加班费（原 ${st.otHours}h，抵扣后 ${otRest}h）`
      : `加班费（${st.otHours} 小时）`;
    const ded = st.deductions.filter(i => i.name || i.amount).map(i => `${esc(i.name || '扣款')} ${money(i.amount)}`).join('、') || '未设置';
    return liRow('底薪', money(st.base), { tag: st.baseProrated ? `已记录 ${st.recordedDays || 0} 天 / ${st.payDays || 0} 天` : '' })
      + liRow(otLabel, money(st.otPay), { sub: otSub.join(' · '), pos: st.otPay > 0 })
      + (st.otLoss > 0.005 ? liRow('倍率被调低', '-' + money(st.otLoss), { neg: true, sub: `按法定倍率应得 ${money(st.otLegalPay)}，实际 ${money(st.otPayGross)}` }) : '')
      + (st.otLoss < -0.005 ? liRow('倍率比法定高', '+' + money(-st.otLoss), { pos: true, sub: `按法定倍率应得 ${money(st.otLegalPay)}，实际 ${money(st.otPayGross)}` }) : '')
      + (st.leaveExcess > 0.005 ? liRow('调休多出', `${st.leaveExcess}h 未抵扣`, { sub: '本月加班已经全被调休抵掉，多出的部分不计' }) : '')
      + liRow('补贴', money(st.alwTotal), { pos: st.alwTotal > 0 })
      + liRow('扣款', st.dedTotal ? '-' + money(st.dedTotal) : money(0), { neg: st.dedTotal > 0, sub: ded })
      + (st.baseDeduct > 0 ? liRow('底薪扣款', '-' + money(st.baseDeduct), { neg: true, sub: `事假 ${money(st.leaveDeduct)} · 正班缺勤 ${money(st.shortDeduct)}` }) : '')
      + liRow('实发工资', money(st.net), { total: true });
  }
  if (kind === 'temp') {
    const ded = st.deductions.filter(i => i.name || i.amount).map(i => `${esc(i.name || '扣款')} ${money(i.amount)}`).join('、') || '未设置';
    const alw = st.allowances.filter(i => i.name || i.amount).map(i => `${esc(i.name || '补贴')} ${money(i.amount)}`).join('、') || '未设置';
    return liRow(`工时工资（${st.hours} 小时，到手价）`, money(st.pay), { pos: st.pay > 0 })
      + (st.rateOut > 0 ? liRow('应收（按对外价）', money(st.payOut), { sub: st.gap > 0.005 ? `差额 ${money(st.gap)} 没到手` : '和到手价一致' }) : '')
      + liRow('保险 / 扣款', st.dedTotal ? '-' + money(st.dedTotal) : money(0), { neg: st.dedTotal > 0, sub: ded })
      + liRow('补贴', money(st.alwTotal), { pos: st.alwTotal > 0, sub: alw })
      + liRow('实发工资', money(st.net), { total: true });
  }
  if (kind === 'piece') {
    const items = Object.entries(st.byItem || {}).map(([nm, v]) => `${esc(nm)} ${v.qty} × ${money(v.qty ? v.pay / v.qty : 0)} = ${money(v.pay)}`).join('；');
    const ded = st.deductions.filter(i => i.name || i.amount).map(i => `${esc(i.name || '扣款')} ${money(i.amount)}`).join('、') || '未设置';
    return liRow(`计件工资（${st.qty} ${esc(state.data.piece.settings.unit || '件')}）`, money(st.pay), { pos: st.pay > 0 })
      + (items ? `<div class="li-sub">${items}</div>` : '')
      + liRow('扣款', st.dedTotal ? '-' + money(st.dedTotal) : money(0), { neg: st.dedTotal > 0, sub: ded })
      + liRow('补贴', money(st.alwTotal), { pos: st.alwTotal > 0 })
      + liRow('实发工资', money(st.net), { total: true });
  }
  return liRow(`点工（${st.units} 个工）`, money(st.dayPay), { pos: st.dayPay > 0 })
    + liRow(`小时工（${st.hours} 小时）`, money(st.hourPay), { pos: st.hourPay > 0 })
    + liRow(`包工（${st.pkgQty} 件）`, money(st.pkgPay), { pos: st.pkgPay > 0 })
    + liRow('加班费', money(st.otPay), { pos: st.otPay > 0 })
    + (st.outEnabled ? liRow('应收（按对外单价）', money(st.grossOut), { sub: st.gap > 0.005 ? `差额 ${money(st.gap)} 没到手` : '和到手价一致' }) : '')
    + liRow('借支', st.borrow ? '-' + money(st.borrow) : money(0), { neg: st.borrow > 0 })
    + liRow('结算（已发）', st.settle ? '-' + money(st.settle) : money(0), { neg: st.settle > 0 })
    + liRow('应发合计', money(st.gross), {})
    + liRow('未结余款', money(st.net), { total: true });
}

function detailCards(kind, st) {
  if (kind === 'regular') {
    return `<div class="stat-grid">
      <div class="stat blue"><b>${st.workDays}</b><span>出勤天数</span></div>
      <div class="stat orange"><b>${st.otHours}</b><span>加班小时</span></div>
      <div class="stat"><b>${st.payDays || 0}</b><span>本月应出勤</span></div>
    </div>
    <div class="shift-pills">${shiftPills(st)}</div>`;
  }
  if (kind === 'temp') {
    return `<div class="stat-grid">
      <div class="stat orange"><b>${st.attendance}</b><span>出勤天数</span></div>
      <div class="stat blue"><b>${st.hours}</b><span>总工时</span></div>
      <div class="stat green"><b>${st.hours ? (st.pay / st.hours).toFixed(2) : '0'}</b><span>平均时薪</span></div>
    </div>
    <div class="shift-pills">${shiftPills(st)}</div>`;
  }
  if (kind === 'piece') {
    const items = Object.entries(st.byItem || {});
    const pills = items.map(([nm, v]) => `<span class="pill" style="background:#f5f2ff">${esc(nm)} ${v.qty}${esc(state.data.piece.settings.unit || '件')} · ${money(v.pay)}</span>`).join('');
    return `<div class="stat-grid">
      <div class="stat purple"><b>${st.count}</b><span>计件天数</span></div>
      <div class="stat purple"><b>${st.qty}</b><span>总件数</span></div>
      <div class="stat green"><b>${st.qty ? (st.pay / st.qty).toFixed(2) : '0'}</b><span>平均单价</span></div>
    </div>
    <div class="shift-pills">${pills || '<span class="muted small">这个周期还没有计件记录</span>'}</div>`;
  }
  return `<div class="cat-grid">
    <div class="cat"><div class="cat-name">点工 <span>${st.units} 个工</span></div><div class="cat-val">${money(st.dayPay)}</div><div class="cat-sub">按个工结算</div></div>
    <div class="cat purple"><div class="cat-name">包工 <span>${st.pkgQty} 件</span></div><div class="cat-val">${money(st.pkgPay)}</div><div class="cat-sub">按量结算</div></div>
    <div class="cat"><div class="cat-name">小时工 <span>${st.hours} 小时</span></div><div class="cat-val">${money(st.hourPay)}</div><div class="cat-sub">按时结算</div></div>
    <div class="cat orange"><div class="cat-name">借支</div><div class="cat-val">${money(st.borrow)}</div><div class="cat-sub">从工资中扣除</div></div>
    <div class="cat green"><div class="cat-name">结算</div><div class="cat-val">${money(st.settle)}</div><div class="cat-sub">已发放金额</div></div>
    <div class="cat"><div class="cat-name">未结余款</div><div class="cat-val">${money(st.net)}</div><div class="cat-sub">应发 - 借支 - 结算</div></div>
  </div>`;
}

function shiftPills(st) {
  const rows = ALL_SHIFTS.filter(s => st.shiftCount[s] > 0)
    .map(s => `<span class="pill ${SHIFT_CLASS[s]}">${s} ${st.shiftCount[s]} 天</span>`).join('');
  return rows || '<span class="muted small">这个周期还没有班次记录</span>';
}

function yearCard(kind) {
  const y = month.getFullYear();
  const months = yearMonths(y, kind);
  const total = round2(sum(months));
  const max = Math.max.apply(null, months.concat([1]));
  const curM = (month.getFullYear() === y) ? month.getMonth() : -1;
  const bars = months.map((v, i) => {
    const h = Math.max(3, Math.round(Math.abs(v) / max * 42));
    const cls = 'bar' + (v > 0 ? ' on' : '') + (i === curM ? ' cur' : '');
    return `<span class="${cls}" style="height:${h}px" title="${i + 1}月 ${money(v)}"></span>`;
  }).join('');
  const labels = months.map((v, i) => `<span class="${i === curM ? 'cur' : ''}">${i + 1}</span>`).join('');
  return `<div class="year-row"><span class="y">${y} 年累计（${WORKER_META[kind].name}）</span><span class="v">${money(total)}</span></div>
    <div class="year-bars">${bars}</div>
    <div class="year-labels">${labels}</div>`;
}

function recordList(kind, cyc) {
  const dict = state.data[kind].records;
  const rows = cyc.dates.slice().reverse().map(k => {
    const rec = dict[k];
    const d = parseD(k);
    const t = dateType(k);
    const badge = holidayName(k) ? `<span class="badge holiday">${esc(holidayName(k))}</span>`
      : (isOffDay(k) ? '<span class="badge rest">休</span>' : '');
    if (!rec) {
      return `<button class="rec-row empty-row" type="button" data-action="edit-day" data-date="${k}">
        <span class="datebox"><b>${d.getDate()}</b><small>${d.getMonth() + 1}月 周${WEEK_CN[d.getDay()]}</small></span>
        <span class="rec-info"><span class="t"><span class="txt muted">未记录 · 点击补记</span>${badge}</span></span>
        <span class="rec-amt zero">—</span>
      </button>`;
    }
    const w = dayWage(k, rec, kind, cyc);
    const totalW = kind === 'site' && (rec.type === 'borrow' || rec.type === 'settle') ? -num(rec.amount, 0, 0, 1e7) : w;
    const extraBadge = kind === 'site' && rec.type === 'borrow' ? '<span class="badge borrow">借支</span>'
      : kind === 'site' && rec.type === 'settle' ? '<span class="badge site">结算</span>' : '';
    return `<button class="rec-row" type="button" data-action="edit-day" data-date="${k}">
      <span class="datebox"><b>${d.getDate()}</b><small>${d.getMonth() + 1}月 周${WEEK_CN[d.getDay()]}</small></span>
      <span class="rec-info">
        <span class="t"><span class="txt">${esc(dayDesc(rec, kind))}</span>${badge}${extraBadge}</span>
        ${rec.note ? `<span class="note">${esc(rec.note)}</span>` : ''}
      </span>
      <span class="rec-amt ${totalW < 0 ? 'neg' : totalW === 0 ? 'zero' : ''}">${totalW ? (totalW > 0 ? '+' : '-') + moneyPlain(Math.abs(totalW)) : '—'}</span>
    </button>`;
  }).join('');
  return rows || '<div class="empty"><span class="big">☀️</span>这个周期还没有记录</div>';
}

function detailsPage() {
  const y = month.getFullYear(), m = month.getMonth();
  const kind = state.active;
  const cyc = cycleRange(y, m);
  const st = cycleStats(y, m, kind);
  const dict = state.data[kind].records;
  const filled = cyc.dates.filter(k => dict[k]).length;
  const titleMap = { regular: '正式工结算', temp: '临时工结算', piece: '计件结算', site: '工地记工结算' };

  return `
  <div class="page-head">
    <div class="ph-main">
      <h2>${WORKER_META[kind].name}明细</h2>
      <div class="ph-sub">${cyc.label} · 已记 ${filled} 天</div>
    </div>
    <div class="ph-act">
      <button class="iconbtn" type="button" data-action="prev-month" aria-label="上个周期">‹</button>
      <button class="iconbtn" type="button" data-action="next-month" aria-label="下个周期">›</button>
    </div>
  </div>

  <section class="card settle-card">
    <div class="sc-top">
      <div class="sc-title"><span class="ico">${WORKER_ICON[kind]}</span>${titleMap[kind]}</div>
      <span class="sc-badge ${st.hasAny ? '' : 'warn'}">${st.hasAny ? (st.kind === 'site' ? '未结 ' + money(st.net) : '已算 ' + money(st.net)) : '暂无记录'}</span>
    </div>
    <div class="money-hero">
      <span class="amt ${st.net < 0 ? 'neg' : ''}">${money(st.net)}</span>
      <span class="unit">${kind === 'site' ? '未结余款' : '本月实发'}</span>
      <div class="delta">${kind === 'regular' ? `时薪 ${money(st.hourlyRate)}<br>${state.data.regular.settings.autoDays ? '应出勤 ' + (st.payDays || 0) + ' 天' : '计薪 ' + state.data.regular.settings.daysPerMonth + ' 天'}` : kind === 'temp' ? `工时 ${st.hours} 小时` : kind === 'piece' ? `${st.qty} ${esc(state.data.piece.settings.unit || '件')}` : `点工 ${st.units} 个工`}</div>
    </div>
    <div class="line-items">${settleBreakdown(kind, st)}</div>
  </section>

  <section class="card">
    <div class="card-head"><h2>${kind === 'site' ? '工地台账' : '出勤统计'}</h2><span class="hint">${cyc.label}</span></div>
    ${detailCards(kind, st)}
  </section>

  <section class="card">
    <div class="card-head"><h2>${y} 年度</h2><span class="hint">按 ${WORKER_META[kind].name} 统计</span></div>
    ${yearCard(kind)}
  </section>

  <section class="card">
    <div class="card-head"><h2>记录</h2><span class="hint">点一条可修改</span></div>
    <div class="rec-list">${recordList(kind, cyc)}</div>
  </section>

  <div class="grid2" style="margin-top:14px">
    <button class="btn btn-soft" type="button" data-action="payslip">${ICON.print}<span>工资条</span></button>
    <button class="btn btn-primary" type="button" data-action="edit-today">${ICON.plus}<span>记一笔</span></button>
  </div>
  <p class="footer-note">数据只存在本机 · 换设备前请先导出备份</p>`;
}
