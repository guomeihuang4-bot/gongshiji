/* =====================================================================
   算法层：工资周期 / 四工种各自的结算
   ===================================================================== */

/** 工资周期（全局一个周期设置） */
function cycleRange(y, m) {
  const sd = clamp(Math.round(state.cycleStartDay || 1), 1, 28);
  let start, end;
  if (sd === 1) {
    // 自然月：1 号到月底
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
  } else {
    // 非自然月：本月 sd 号 ～ 下月 sd-1 号（例如 2号 - 下月1号）
    start = new Date(y, m, sd);
    end = new Date(y, m + 1, sd - 1);
  }
  const dates = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard++ < 40) {
    dates.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const natural = sd === 1;
  const label = natural
    ? `${y}年${m + 1}月`
    : `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
  return { start, end, dates, natural, label, y, m, sd };
}

/** 某一天属于哪个月份的工资周期（返回 {y, m}） */
function cycleMonthOf(k) {
  const d = parseD(k);
  const sd = clamp(Math.round(state.cycleStartDay || 1), 1, 28);
  let y = d.getFullYear(), m = d.getMonth();
  if (sd > 1 && d.getDate() < sd) {
    const p = new Date(y, m - 1, 1);
    y = p.getFullYear(); m = p.getMonth();
  }
  return { y, m };
}

/** 周期内应出勤天数（按指定工种的工作周） */
function payDaysInCycle(cyc, kind) {
  kind = kind || state.active;
  let n = 0;
  for (const k of cyc.dates) if (!isOffDay(k, kind)) n++;
  return n;
}

/** 正式工小时工资（按周期算；自定义优先） */
function hourlyRateFor(kind, cyc) {
  const s = state.data[kind || 'regular'].settings;
  if (s.hourlyRate && s.hourlyRate > 0) return s.hourlyRate;
  if (s.autoDays) {
    const days = cyc ? payDaysInCycle(cyc, 'regular') : state.data.regular.settings.daysPerMonth;
    return days > 0 ? s.baseSalary / (days * s.hoursPerDay) : 0;
  }
  const div = s.daysPerMonth * s.hoursPerDay;
  return div > 0 ? s.baseSalary / div : 0;
}

/** 单日所属自然月的周期 */
function cycleOfDay(k) {
  const d = parseD(k);
  return cycleRange(d.getFullYear(), d.getMonth());
}

/** 单日时薪（按该日所在自然月） */
function hourlyRateOfDay(k) {
  return hourlyRateFor('regular', cycleOfDay(k));
}

/** 当前查看月份对应的周期（编辑器计算提示用） */
function currentCycle() {
  return cycleRange(month.getFullYear(), month.getMonth());
}

/* ---------------- 单日工资 ---------------- */
function fullDayHours() { return state.data.regular.settings.hoursPerDay; }

function regularShortHours(rec) {
  const full = fullDayHours();
  const rh = (rec.regularHours === null || rec.regularHours === undefined) ? full : rec.regularHours;
  return Math.max(0, full - rh);
}

/** 正式工当天除底薪外的增减（加班费 / 缺勤扣款 / 事假扣款） */
function regularDayWage(k, rec, cyc) {
  if (!rec) return 0;
  if (rec.shift === '休息' || rec.shift === '病假') return 0;
  const hr = hourlyRateFor('regular', cyc || cycleOfDay(k));
  if (rec.shift === '事假') {
    return isOffDay(k, 'regular') ? 0 : -round2(fullDayHours() * hr);
  }
  const ot = num(rec.otHours, 0, 0, 24);
  const short = regularShortHours(rec);
  return round2(ot * hr * multiplierFor(k) - short * hr);
}

/** 临时工当天工资 */
function tempDayWage(rec) {
  if (!rec) return 0;
  return round2(num(rec.hours, 0, 0, 24) * num(rec.rate, 0, 0, 1e6));
}

/** 计件当天工资 */
function pieceDayWage(rec) {
  if (!rec || !Array.isArray(rec.items)) return 0;
  return round2(sum(rec.items.map(it => num(it.qty, 0, 0, 1e6) * num(it.rate, 0, 0, 1e6))));
}

function pieceDayQty(rec) {
  if (!rec || !Array.isArray(rec.items)) return 0;
  return round2(sum(rec.items.map(it => num(it.qty, 0, 0, 1e6))));
}

/** 工地当天「干活」收入（点工 + 小时 + 包工 + 加班）；借支/结算单独统计 */
function siteDayWage(rec) {
  if (!rec || rec.type !== 'work') return 0;
  let v = 0;
  if (rec.unit === 'day') v += num(rec.units, 0, 0, 30) * num(rec.dayRate, 0, 0, 1e6);
  else if (rec.unit === 'hour') v += num(rec.hours, 0, 0, 24) * num(rec.hourRate, 0, 0, 1e6);
  v += num(rec.pkgQty, 0, 0, 1e6) * num(rec.pkgRate, 0, 0, 1e6);
  v += num(rec.otHours, 0, 0, 24) * num(rec.otRate, 0, 0, 1e6);
  return round2(v);
}

/** 通用单日金额（用于日历与明细显示） */
function dayWage(k, rec, kind, cyc) {
  kind = kind || state.active;
  if (!rec) return 0;
  if (kind === 'regular') return regularDayWage(k, rec, cyc);
  if (kind === 'temp') return tempDayWage(rec);
  if (kind === 'piece') return pieceDayWage(rec);
  return siteDayWage(rec);
}

/** 单日描述（明细列表用） */
function dayDesc(rec, kind) {
  kind = kind || state.active;
  if (!rec) return '未记录';
  if (kind === 'regular') {
    if (!WORK_SHIFTS.includes(rec.shift)) return rec.shift;
    const short = regularShortHours(rec);
    let s = rec.shift + ' · 加班 ' + num(rec.otHours, 0, 0, 24) + ' 小时';
    if (short > 0) s += ' · 正班缺 ' + short + ' 小时';
    return s;
  }
  if (kind === 'temp') return `${rec.shift} · ${num(rec.hours, 0, 0, 24)} 小时 × ${money(rec.rate)}`;
  if (kind === 'piece') {
    const n = rec.items ? rec.items.length : 0;
    const q = pieceDayQty(rec);
    if (!n) return '计件';
    if (n === 1) return `${rec.items[0].name || '计件'} ${rec.items[0].qty}${state.data.piece.settings.unit} × ${money(rec.items[0].rate)}`;
    return `${n} 项 · 共 ${q}${state.data.piece.settings.unit}`;
  }
  if (rec.type === 'borrow') return '借支 ' + money(rec.amount);
  if (rec.type === 'settle') return '结算 ' + money(rec.amount);
  let parts = [];
  if (rec.unit === 'day') parts.push(`${num(rec.units, 0, 0, 30)} 个工 × ${money(rec.dayRate)}`);
  else if (rec.unit === 'hour') parts.push(`${num(rec.hours, 0, 0, 24)} 小时 × ${money(rec.hourRate)}`);
  else parts.push('休息');
  if (num(rec.otHours, 0, 0, 24) > 0) parts.push(`加班 ${num(rec.otHours, 0, 0, 24)} 小时`);
  if (num(rec.pkgQty, 0, 0, 1e6) > 0) parts.push(`包工 ${num(rec.pkgQty)} × ${money(rec.pkgRate)}`);
  return parts.join(' · ');
}

/* ---------------- 周期结算 ---------------- */
function monthPeek(kind, mk) {
  return state.data[kind].monthly[mk] || defaultMonthlySeed(kind);
}

function cycleStats(y, m, kind) {
  kind = kind || state.active;
  const cyc = cycleRange(y, m);
  const mk = y + '-' + pad(m + 1);
  const mon = monthPeek(kind, mk);
  const dedTotal = round2(sum(mon.deductions.map(i => num(i.amount, 0, 0, 1e7))));
  const alwTotal = round2(sum(mon.allowances.map(i => num(i.amount, 0, 0, 1e7))));
  const shiftCount = {};
  ALL_SHIFTS.forEach(s => shiftCount[s] = 0);

  let hasAny = false, attendance = 0;
  const st = {
    kind, cyc, mk, deductions: mon.deductions, allowances: mon.allowances,
    dedTotal, alwTotal, shiftCount, hasAny, attendance
  };

  if (kind === 'regular') {
    const s = state.data.regular.settings;
    let base = 0, baseFull = 0, baseProrated = false, otPay = 0, leaveDeduct = 0, shortDeduct = 0;
    let workDays = 0, otHours = 0, otWeekday = 0, otWeekend = 0, otHoliday = 0;
    let payWeekday = 0, payWeekend = 0, payHoliday = 0;
    const hr = hourlyRateFor('regular', cyc);

    for (const k of cyc.dates) {
      const rec = state.data.regular.records[k];
      if (!rec) continue;
      hasAny = true;
      shiftCount[rec.shift] = (shiftCount[rec.shift] || 0) + 1;
      if (WORK_SHIFTS.includes(rec.shift)) {
        attendance++;
        workDays++;
        const ot = num(rec.otHours, 0, 0, 24);
        const pay = ot * hr * multiplierFor(k);
        otPay += pay;
        otHours += ot;
        shortDeduct += regularShortHours(rec) * hr;
        const t = dateType(k, 'regular');
        if (t === 'holiday') { otHoliday += ot; payHoliday += pay; }
        else if (t === 'weekend') { otWeekend += ot; payWeekend += pay; }
        else { otWeekday += ot; payWeekday += pay; }
      } else if (rec.shift === '事假' && !isOffDay(k, 'regular')) {
        leaveDeduct += s.hoursPerDay * hr;
      }
    }
    baseFull = hasAny ? s.baseSalary : 0;
    base = baseFull;
    if (baseFull > 0 && state.settleNow) {
      const tk = todayKey();
      if (tk >= ymd(cyc.start) && tk <= ymd(cyc.end)) {
        let done = 0;
        const payDays = payDaysInCycle(cyc, 'regular');
        for (const k of cyc.dates) {
          if (k > tk) break;
          if (!isOffDay(k, 'regular')) done++;
        }
        base = round2(baseFull * Math.min(done, payDays) / Math.max(1, payDays));
        baseProrated = true;
      }
    }
    const baseDeduct = round2(leaveDeduct + shortDeduct);
    Object.assign(st, {
      hourlyRate: hr, base, baseFull, baseProrated, otPay: round2(otPay),
      leaveDeduct: round2(leaveDeduct), shortDeduct: round2(shortDeduct), baseDeduct,
      workDays, otHours: round2(otHours), otWeekday: round2(otWeekday), otWeekend: round2(otWeekend), otHoliday: round2(otHoliday),
      payWeekday: round2(payWeekday), payWeekend: round2(payWeekend), payHoliday: round2(payHoliday),
      net: round2(base + otPay + alwTotal - baseDeduct - dedTotal),
      payDays: payDaysInCycle(cyc, 'regular')
    });
    st.hasAny = hasAny;
    st.attendance = attendance;
    return st;
  }

  if (kind === 'temp') {
    let pay = 0, hours = 0;
    for (const k of cyc.dates) {
      const rec = state.data.temp.records[k];
      if (!rec) continue;
      hasAny = true;
      shiftCount[rec.shift] = (shiftCount[rec.shift] || 0) + 1;
      attendance++;
      pay += num(rec.hours, 0, 0, 24) * num(rec.rate, 0, 0, 1e6);
      hours += num(rec.hours, 0, 0, 24);
    }
    Object.assign(st, {
      pay: round2(pay), hours: round2(hours),
      net: round2(pay + alwTotal - dedTotal)
    });
    st.hasAny = hasAny;
    st.attendance = attendance;
    return st;
  }

  if (kind === 'piece') {
    let pay = 0, qty = 0, count = 0;
    const byItem = {};
    for (const k of cyc.dates) {
      const rec = state.data.piece.records[k];
      if (!rec) continue;
      hasAny = true;
      attendance++;
      count++;
      if (Array.isArray(rec.items)) {
        rec.items.forEach(it => {
          const q = num(it.qty, 0, 0, 1e6), r = num(it.rate, 0, 0, 1e6);
          pay += q * r;
          qty += q;
          const nm = it.name || '未命名';
          byItem[nm] = byItem[nm] || { qty: 0, pay: 0 };
          byItem[nm].qty += q;
          byItem[nm].pay += q * r;
        });
      }
    }
    Object.assign(st, {
      pay: round2(pay), qty: round2(qty), count, byItem,
      net: round2(pay + alwTotal - dedTotal)
    });
    st.hasAny = hasAny;
    st.attendance = attendance;
    return st;
  }

  // site
  let dayPay = 0, hourPay = 0, pkgPay = 0, otPay = 0, borrow = 0, settle = 0, units = 0, hours = 0, pkgQty = 0;
  let workDays = 0;
  for (const k of cyc.dates) {
    const rec = state.data.site.records[k];
    if (!rec) continue;
    hasAny = true;
    if (rec.type === 'borrow') { borrow += num(rec.amount, 0, 0, 1e7); continue; }
    if (rec.type === 'settle') { settle += num(rec.amount, 0, 0, 1e7); continue; }
    workDays++;
    attendance++;
    if (rec.unit === 'day') { dayPay += num(rec.units, 0, 0, 30) * num(rec.dayRate, 0, 0, 1e6); units += num(rec.units, 0, 0, 30); }
    else if (rec.unit === 'hour') { hourPay += num(rec.hours, 0, 0, 24) * num(rec.hourRate, 0, 0, 1e6); hours += num(rec.hours, 0, 0, 24); }
    pkgPay += num(rec.pkgQty, 0, 0, 1e6) * num(rec.pkgRate, 0, 0, 1e6);
    pkgQty += num(rec.pkgQty, 0, 0, 1e6);
    otPay += num(rec.otHours, 0, 0, 24) * num(rec.otRate, 0, 0, 1e6);
  }
  const gross = round2(dayPay + hourPay + pkgPay + otPay);
  Object.assign(st, {
    dayPay: round2(dayPay), hourPay: round2(hourPay), pkgPay: round2(pkgPay), otPay: round2(otPay),
    borrow: round2(borrow), settle: round2(settle), units: round2(units), hours: round2(hours), pkgQty: round2(pkgQty),
    workDays, gross,
    net: round2(gross + alwTotal - dedTotal - borrow - settle),
    unpaid: round2(gross + alwTotal - dedTotal - borrow - settle)
  });
  st.hasAny = hasAny;
  st.attendance = attendance;
  return st;
}

/** 某工种某自然年的总收入（按 12 个周期） */
function yearTotal(y, kind) {
  let v = 0;
  for (let m = 0; m < 12; m++) v += cycleStats(y, m, kind).net;
  return round2(v);
}

/** 某工种某年逐月净收入（画小柱状图用） */
function yearMonths(y, kind) {
  const out = [];
  for (let m = 0; m < 12; m++) out.push(cycleStats(y, m, kind).net);
  return out;
}
