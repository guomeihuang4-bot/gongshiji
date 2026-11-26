import { boot, group, ok, eq, near, editDay, setField, saveBtn, navTo, report } from './helpers.mjs';

/* t12：结算本月——底薪只按「记过的应出勤日」折算（4.3 改动） */
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const { w, doc, api, errors } = boot();
const S = () => api.state;

function reset() {
  S().data.regular.records = {};
  S().data.regular.monthly = {};
  S().data.regular.settings.baseSalary = 8000;
  S().data.regular.settings.autoDays = true;
  S().data.regular.settings.hoursPerDay = 8;
  S().data.regular.settings.cycleStartDay = 1;
  S().cycleStartDay = 1;
  S().settleNow = false;
  api.setMonth(2026, 10); // 2026-11
  api.render();
}

/* ================= 1. 自然月：只算记过的日子 ================= */
group('结算本月：没记录的日子不发底薪');
reset();
const full = api.cycleStats(2026, 10, 'regular');
const payDays = full.payDays;
ok('本月应出勤天数合理', payDays > 15 && payDays < 31, payDays);

// 只记 2 个工作日
S().data.regular.records['2026-11-02'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-03'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
const st2 = api.cycleStats(2026, 10, 'regular');
eq('记录天数 = 2', st2.recordedDays, 2);
near('底薪只算 2 天', st2.base, round2(8000 * 2 / payDays), 0.02);
ok('底薪远少于整月', st2.base < 8000 * 0.2, st2.base);
eq('标记为已结算', st2.baseProrated, true);

// 再记一天
S().data.regular.records['2026-11-04'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
const st3 = api.cycleStats(2026, 10, 'regular');
near('多记一天多一天底薪', st3.base, round2(8000 * 3 / payDays), 0.02);

group('结算本月：全勤 = 全额底薪');
reset();
const cyc = api.cycleRange(2026, 10);
for (const k of cyc.dates) {
  if (!api.isOffDay(k, 'regular')) S().data.regular.records[k] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
}
S().settleNow = true;
const stFull = api.cycleStats(2026, 10, 'regular');
eq('记录天数 = 应出勤天数', stFull.recordedDays, payDays);
near('底薪回到全额', stFull.base, 8000, 0.01);

/* ================= 2. 事假 / 病假 / 休息 ================= */
group('事假计入天数但不双扣');
reset();
S().data.regular.records['2026-11-02'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-03'] = { shift: '事假', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
const stLeave = api.cycleStats(2026, 10, 'regular');
eq('事假也算已记录', stLeave.recordedDays, 2);
const oneDay = 8000 / payDays;
near('底薪按 2 天给', stLeave.base, round2(oneDay * 2), 0.02);
near('事假扣一天', stLeave.leaveDeduct, round2(oneDay), 0.02);
near('事假当天净收入为 0', round2(stLeave.base - stLeave.leaveDeduct - oneDay), 0, 0.05);

group('工作日记「休息」不计底薪');
reset();
S().data.regular.records['2026-11-02'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-03'] = { shift: '休息', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
const stRest = api.cycleStats(2026, 10, 'regular');
eq('休息不占底薪天数', stRest.recordedDays, 1);
near('底薪只算 1 天', stRest.base, round2(8000 / payDays), 0.02);

group('病假带薪');
reset();
S().data.regular.records['2026-11-02'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-03'] = { shift: '病假', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
const stSick = api.cycleStats(2026, 10, 'regular');
eq('病假计入天数', stSick.recordedDays, 2);
near('病假不扣钱', stSick.leaveDeduct, 0, 0.01);
near('底薪按 2 天给', stSick.base, round2(oneDay * 2), 0.02);

/* ================= 3. 关掉开关恢复整月 ================= */
group('切回整月');
S().settleNow = false;
const stOff = api.cycleStats(2026, 10, 'regular');
near('底薪恢复全额', stOff.base, 8000, 0.01);
eq('不再标记已结算', stOff.baseProrated, false);
eq('无记录天数为 0 也不影响', stOff.recordedDays, 0);

/* ================= 4. 非自然月（26 号起） ================= */
group('非自然月：按 26 号起的周期数记录');
reset();
S().cycleStartDay = 26;
S().data.regular.settings.cycleStartDay = 26;
api.setMonth(2026, 10);
api.render();
const cyc26 = api.cycleRange(2026, 10);
eq('周期从 11/26 开始', cyc26.dates[0], '2026-11-26');
eq('周期到 12/25 结束', cyc26.dates[cyc26.dates.length - 1], '2026-12-25');
const payDays26 = api.cycleStats(2026, 10, 'regular').payDays;

// 记 11/27、11/30（都在周期内）
S().data.regular.records['2026-11-27'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-30'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
const st26 = api.cycleStats(2026, 10, 'regular');
eq('周期内记录 2 天', st26.recordedDays, 2);
near('底薪按周期应出勤折算', st26.base, round2(8000 * 2 / payDays26), 0.02);

// 周期外的记录（11/20）不算进来
S().data.regular.records['2026-11-20'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
const st26b = api.cycleStats(2026, 10, 'regular');
eq('周期外的记录不参与', st26b.recordedDays, 2);

/* ================= 5. 界面：按钮文案与切换 ================= */
group('界面：按钮叫「结算本月」');
reset();
navTo(w, doc, 'calendar');
const btn = doc.querySelector('[data-action="settle-now"]');
ok('有结算按钮', !!btn);
eq('按钮文案', btn.textContent.trim(), '结算本月');
btn.click();
eq('点击后开启结算', S().settleNow, true);
eq('开启后按钮变恢复整月', doc.querySelector('[data-action="settle-now"]').textContent.trim(), '恢复整月');
ok('横幅显示已按记录结算', (doc.querySelector('.summary')?.textContent || '').includes('已按记录结算'));
doc.querySelector('[data-action="settle-now"]').click();
eq('再点回到整月', S().settleNow, false);

/* ================= 6. 明细里的记录天数 ================= */
group('明细显示已记录天数');
reset();
S().data.regular.records['2026-11-02'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().data.regular.records['2026-11-03'] = { shift: '白班', otHours: 0, regularHours: null, note: '' };
S().settleNow = true;
navTo(w, doc, 'details');
const dTxt = (doc.querySelector('.settle-card')?.textContent || '').replace(/\s+/g, '');
ok('明细标出已记录天数', /已记录2天\/\d+天/.test(dTxt), dTxt.slice(0, 120));

const r = report();
console.log('errors:', errors);
process.exit(r.fail ? 1 : 0);
