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

/** 加班倍率档位：wd=平时 / we=周末 / hd=节假日 */
const OT_KEYS = ['wd', 'we', 'hd'];
const OT_LABEL = { wd: '平时', we: '周末', hd: '节假日' };
const OT_MULKEY = { wd: 'mulWeekday', we: 'mulWeekend', hd: 'mulHoliday' };

/** 某档在正式工设置里的倍率 */
function otMul(key, s) {
  s = s || state.data.regular.settings;
  return num(s[OT_MULKEY[key]], 1, 0, 10);
}

/** 某天的法定档位（由日类型决定） */
function legalOtKey(k) {
  const t = dateType(k, 'regular');
  return t === 'holiday' ? 'hd' : t === 'weekend' ? 'we' : 'wd';
}

/** 把一条记录的加班拆成分段 [{key,h,mul}]；未拆分时整天按法定档 */
function otPartsOf(k, rec) {
  if (!rec) return [];
  const ot = num(rec.otHours, 0, 0, 24);
  if (ot <= 0) return [];
  const s = state.data.regular.settings;
  if (Array.isArray(rec.otSplit)) {
    const parts = [];
    OT_KEYS.forEach((key, i) => {
      const h = num(rec.otSplit[i], 0, 0, 24);
      if (h > 0) parts.push({ key, h, mul: otMul(key, s) });
    });
    return parts;
  }
  const key = legalOtKey(k);
  return [{ key, h: ot, mul: otMul(key, s) }];
}

/** 正式工当天的加班费（按实际拆分） */
function regularDayOtPay(k, rec) {
  if (!rec) return 0;
  const hr = hourlyRateOfDay(k);
  return round2(sum(otPartsOf(k, rec).map(p => p.h * p.mul)) * hr);
}

/** 如果全天按法定倍率应当拿多少 */
function regularDayOtLegalPay(k, rec) {
  if (!rec) return 0;
  const ot = num(rec.otHours, 0, 0, 24);
  if (ot <= 0) return 0;
  return round2(ot * otMul(legalOtKey(k)) * hourlyRateOfDay(k));
}

/** 倍率被对调后少拿的钱（正数=被少算） */
function regularDayOtLoss(k, rec) {
  return round2(regularDayOtLegalPay(k, rec) - regularDayOtPay(k, rec));
}

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
  const short = regularShortHours(rec);
  return round2(regularDayOtPay(k, rec) - short * hr);
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
    if (Array.isArray(rec.otSplit)) {
      const txt = OT_KEYS.map((key, i) => rec.otSplit[i] > 0 ? OT_LABEL[key] + round2(rec.otSplit[i]) + 'h' : '').filter(Boolean).join(' + ');
      if (txt) s += '（' + txt + '）';
    }
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
    let base = 0, baseFull = 0, baseProrated = false, otPayGross = 0, leaveDeduct = 0, shortDeduct = 0;
    let workDays = 0, otHours = 0, otSplitDays = 0, otLegalPay = 0;
    const otRaw = { wd: 0, we: 0, hd: 0 };
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
        const parts = otPartsOf(k, rec);
        parts.forEach(p => { otRaw[p.key] += p.h; });
        otPayGross += sum(parts.map(p => p.h * p.mul)) * hr;
        otHours += ot;
        if (Array.isArray(rec.otSplit)) otSplitDays++;
        otLegalPay += ot * otMul(legalOtKey(k), s) * hr;
        shortDeduct += regularShortHours(rec) * hr;
      } else if (rec.shift === '事假' && !isOffDay(k, 'regular')) {
        leaveDeduct += s.hoursPerDay * hr;
      }
    }

    // 调休抵扣：默认从低倍率开始扣（先抵便宜的加班），也可改成从高倍率扣
    const leaveHours = num(mon.leaveHours, 0, 0, 744);
    const leaveOrder = mon.leaveOrder === 'high' ? 'high' : 'low';
    const order = leaveOrder === 'high' ? OT_KEYS.slice().reverse() : OT_KEYS.slice();
    let leaveLeft = leaveHours;
    const leaved = { wd: 0, we: 0, hd: 0 };
    for (const key of order) {
      if (leaveLeft <= 0) break;
      const take = Math.min(leaveLeft, otRaw[key]);
      leaved[key] = round2(take);
      otRaw[key] = round2(otRaw[key] - take);
      leaveLeft = round2(leaveLeft - take);
    }
    const leaveApplied = round2(sum(OT_KEYS.map(x => leaved[x])));
    const leaveExcess = round2(leaveLeft);
    const otPay = round2(sum(OT_KEYS.map(key => otRaw[key] * otMul(key, s) * hr)));
    const otWeekday = round2(otRaw.wd), otWeekend = round2(otRaw.we), otHoliday = round2(otRaw.hd);
    const payWeekday = round2(otWeekday * s.mulWeekday * hr);
    const payWeekend = round2(otWeekend * s.mulWeekend * hr);
    const payHoliday = round2(otHoliday * s.mulHoliday * hr);

    baseFull = hasAny ? s.baseSalary : 0;
    base = baseFull;
    // 结算本月：底薪只按「记过的应出勤日」折算，没记的日子不发底薪。
    // 与自然月/非自然月无关——直接数这个工资周期里已记录的日子。
    let recordedDays = 0;
    if (state.settleNow) {
      for (const k of cyc.dates) {
        if (isOffDay(k, 'regular')) continue;      // 休息日不在计薪天数里
        const rec = state.data.regular.records[k];
        if (!rec) continue;
        if (rec.shift === '休息') continue;        // 工作日记「休息」不发底薪
        recordedDays++;
        // 事假 / 病假照常计入，事假的扣款在后面单独减，避免双扣
      }
      const payDays = payDaysInCycle(cyc, 'regular');
      base = round2(baseFull * Math.min(recordedDays, payDays) / Math.max(1, payDays));
      baseProrated = true;
    }
    const baseDeduct = round2(leaveDeduct + shortDeduct);
    Object.assign(st, {
      hourlyRate: hr, base, baseFull, baseProrated, recordedDays,
      otPay: round2(otPay), otPayGross: round2(otPayGross),
      otLegalPay: round2(otLegalPay),
      otLoss: round2(otLegalPay - otPayGross),
      leaveCut: round2(otPayGross - otPay),
      leaveHours, leaveOrder, leaveApplied, leaveExcess,
      leaveParts: leaved,
      otSplitDays,
      rawOtParts: { wd: round2(otRaw.wd + leaved.wd), we: round2(otRaw.we + leaved.we), hd: round2(otRaw.hd + leaved.hd) },
      leaveDeduct: round2(leaveDeduct), shortDeduct: round2(shortDeduct), baseDeduct,
      workDays, otHours: round2(otHours), otWeekday, otWeekend, otHoliday,
      payWeekday, payWeekend, payHoliday,
      net: round2(base + otPay + alwTotal - baseDeduct - dedTotal),
      payDays: payDaysInCycle(cyc, 'regular')
    });
    st.hasAny = hasAny;
    st.attendance = attendance;
    return st;
  }

  if (kind === 'temp') {
    const s = state.data.temp.settings;
    const rateOut = num(s.rateOut, 0, 0, 1e6);
    let pay = 0, hours = 0, payOut = 0;
    for (const k of cyc.dates) {
      const rec = state.data.temp.records[k];
      if (!rec) continue;
      hasAny = true;
      shiftCount[rec.shift] = (shiftCount[rec.shift] || 0) + 1;
      attendance++;
      const h = num(rec.hours, 0, 0, 24);
      pay += h * num(rec.rate, 0, 0, 1e6);
      payOut += h * (rateOut > 0 ? rateOut : num(rec.rate, 0, 0, 1e6));
      hours += h;
    }
    Object.assign(st, {
      pay: round2(pay), hours: round2(hours),
      rateOut, payOut: round2(payOut), gap: rateOut > 0 ? round2(payOut - pay) : 0,
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
  const ss = state.data.site.settings;
  const dOut = num(ss.dayRateOut, 0, 0, 1e6);
  const hOut = num(ss.hourRateOut, 0, 0, 1e6);
  const oOut = num(ss.otRateOut, 0, 0, 1e6);
  let dayPay = 0, hourPay = 0, pkgPay = 0, otPay = 0, borrow = 0, settle = 0, units = 0, hours = 0, pkgQty = 0;
  let dayPayOut = 0, hourPayOut = 0, otPayOut = 0;
  let workDays = 0;
  for (const k of cyc.dates) {
    const rec = state.data.site.records[k];
    if (!rec) continue;
    hasAny = true;
    if (rec.type === 'borrow') { borrow += num(rec.amount, 0, 0, 1e7); continue; }
    if (rec.type === 'settle') { settle += num(rec.amount, 0, 0, 1e7); continue; }
    workDays++;
    attendance++;
    if (rec.unit === 'day') {
      const u = num(rec.units, 0, 0, 30), r = num(rec.dayRate, 0, 0, 1e6);
      dayPay += u * r; dayPayOut += u * (dOut > 0 ? dOut : r); units += u;
    } else if (rec.unit === 'hour') {
      const h = num(rec.hours, 0, 0, 24), r = num(rec.hourRate, 0, 0, 1e6);
      hourPay += h * r; hourPayOut += h * (hOut > 0 ? hOut : r); hours += h;
    }
    pkgPay += num(rec.pkgQty, 0, 0, 1e6) * num(rec.pkgRate, 0, 0, 1e6);
    pkgQty += num(rec.pkgQty, 0, 0, 1e6);
    const oh = num(rec.otHours, 0, 0, 24), or = num(rec.otRate, 0, 0, 1e6);
    otPay += oh * or; otPayOut += oh * (oOut > 0 ? oOut : or);
  }
  const gross = round2(dayPay + hourPay + pkgPay + otPay);
  const grossOut = round2(dayPayOut + hourPayOut + pkgPay + otPayOut);
  Object.assign(st, {
    dayPay: round2(dayPay), hourPay: round2(hourPay), pkgPay: round2(pkgPay), otPay: round2(otPay),
    grossOut, gap: round2(grossOut - gross), outEnabled: (dOut > 0 || hOut > 0 || oOut > 0),
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
