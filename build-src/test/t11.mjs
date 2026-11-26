import { boot, group, ok, eq, near, editDay, setField, saveBtn, navTo, switchWorker, report, $, $$ } from './helpers.mjs';

/* t11：加班倍率拆分 / 对调损失 / 调休抵扣 / 对外单价（4.2 新增） */
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const { w, doc, api, errors } = boot();
const S = () => api.state;

function seedMonth(kind, mk, extra) {
  const base = { deductions: [], allowances: [], leaveHours: 0, leaveOrder: 'low' };
  S().data[kind].monthly[mk] = Object.assign(base, extra || {});
}

api.setMonth(2026, 10); // 2026-11
S().data.regular.settings.baseSalary = 8000;
S().data.regular.settings.autoDays = false;
S().data.regular.settings.daysPerMonth = 21.75;
S().data.regular.settings.hoursPerDay = 8;
api.render();
const hr = 8000 / (21.75 * 8);

/* ================= 1. 倍率拆分 + 自动调平 ================= */
group('倍率拆分：改一档，其它档自动补齐');
eq('2026-11-18 是工作日', api.dateType('2026-11-18'), 'workday');
editDay(w, doc, '2026-11-18');
setField(doc, 'otHours', 4);
doc.querySelector('[data-action="toggle-otsplit"]').click();
eq('默认全部落在平时档', api.draft.otSplit, [4, 0, 0]);
ok('合计提示对上', (doc.querySelector('#otTotal')?.textContent || '').includes('✓'));

setField(doc, 'otwe', 2); // 改成 2h 按周末
eq('改周末档后平时自动减到 2h', api.draft.otSplit, [2, 2, 0]);
eq('总和仍然是 4h', round2(api.draft.otSplit.reduce((a, b) => a + b, 0)), 4);
saveBtn(doc).click();

const rec1 = S().data.regular.records['2026-11-18'];
eq('保存的拆分', rec1.otSplit, [2, 2, 0]);
eq('加班总小时不变', rec1.otHours, 4);
const payMix = round2(2 * hr * 1.5 + 2 * hr * 2);
near('单日工资按拆分算', api.dayWage('2026-11-18', rec1, 'regular'), payMix, 0.02);

/* ================= 2. 对调损失 ================= */
group('对调损失：节假日被按周末算');
eq('2026-10-01 是法定节假日', api.dateType('2026-10-01'), 'holiday');
editDay(w, doc, '2026-10-01');
setField(doc, 'otHours', 3);
saveBtn(doc).click();
let st = api.cycleStats(2026, 9, 'regular');
near('不拆分时没有损失', st.otLoss, 0, 0.01);
near('按 3 倍算加班费', st.otPay, round2(3 * hr * 3), 0.02);

editDay(w, doc, '2026-10-01');
doc.querySelector('[data-action="toggle-otsplit"]').click();
eq('默认在节假日档', S().data.regular.records['2026-10-01'].otSplit || api.draft.otSplit, [0, 0, 3]);
setField(doc, 'otwe', 3); // 公司按 2 倍结算
eq('改到周末档后节假日档清零', api.draft.otSplit, [0, 3, 0]);
saveBtn(doc).click();
st = api.cycleStats(2026, 9, 'regular');
near('加班费按 2 倍算', st.otPay, round2(3 * hr * 2), 0.02);
near('对调少拿的钱', st.otLoss, round2(3 * hr * 3 - 3 * hr * 2), 0.02);
near('法定应得多于实际', st.otLegalPay > st.otPayGross, true, 0.01);

/* ================= 3. 调休抵扣 ================= */
group('调休抵扣：按倍率顺序扣');
S().data.regular.records = {};
seedMonth('regular', '2026-11');
editDay(w, doc, '2026-11-19');
setField(doc, 'otHours', 2);
saveBtn(doc).click();
eq('2026-11-21 是周末', api.dateType('2026-11-21'), 'weekend');
editDay(w, doc, '2026-11-21');
setField(doc, 'otHours', 2);
saveBtn(doc).click();

st = api.cycleStats(2026, 10, 'regular');
near('没调休时加班费', st.otPay, round2(2 * hr * 1.5 + 2 * hr * 2), 0.03);
eq('没调休时抵扣 0', st.leaveApplied, 0);

S().data.regular.monthly['2026-11'].leaveHours = 2;
S().data.regular.monthly['2026-11'].leaveOrder = 'low';
st = api.cycleStats(2026, 10, 'regular');
eq('调休扣了 2h', st.leaveApplied, 2);
near('先扣低倍率：剩下周末 2 倍', st.otPay, round2(2 * hr * 2), 0.03);
near('抵扣部分金额', st.leaveCut, round2(2 * hr * 1.5), 0.03);

S().data.regular.monthly['2026-11'].leaveOrder = 'high';
st = api.cycleStats(2026, 10, 'regular');
near('先扣高倍率：剩下平时 1.5 倍', st.otPay, round2(2 * hr * 1.5), 0.03);
eq('两种顺序都只扣 2h', st.leaveApplied, 2);

S().data.regular.monthly['2026-11'].leaveHours = 10;
S().data.regular.monthly['2026-11'].leaveOrder = 'low';
st = api.cycleStats(2026, 10, 'regular');
eq('调休超过加班：全部抵掉', st.leaveApplied, 4);
near('多出未抵扣的小时', st.leaveExcess, 6, 0.01);
near('加班费归零', st.otPay, 0, 0.01);

S().data.regular.monthly['2026-11'].leaveHours = 2;
st = api.cycleStats(2026, 10, 'regular');
navTo(w, doc, 'details');
const detailTxt = (doc.querySelector('.settle-card')?.textContent || '').replace(/\s+/g, '');
ok('明细里说明调休抵扣', detailTxt.includes('已调休抵扣') || detailTxt.includes('抵扣后'));

/* ================= 4. 对外单价 / 应收实收差额 ================= */
group('临时工：对外价与到手价分离');
switchWorker(doc, 'temp');
api.setMonth(2026, 10);
S().data.temp.settings.rate = 25;
S().data.temp.settings.rateOut = 30;
S().data.temp.records = {};
seedMonth('temp', '2026-11');
api.render();
editDay(w, doc, '2026-11-18');
setField(doc, 'hours', 8);
saveBtn(doc).click();
let stt = api.cycleStats(2026, 10, 'temp');
near('实收按到手价', stt.pay, 200, 0.01);
near('应收按对外价', stt.payOut, 240, 0.01);
near('差额', stt.gap, 40, 0.01);
navTo(w, doc, 'details');
ok('明细显示应收', (doc.querySelector('.settle-card')?.textContent || '').includes('应收'));

group('工地：对外日薪分离');
switchWorker(doc, 'site');
api.setMonth(2026, 10);
S().data.site.settings.dayRate = 260;
S().data.site.settings.dayRateOut = 300;
S().data.site.records = {};
seedMonth('site', '2026-11');
api.render();
editDay(w, doc, '2026-11-18');
setField(doc, 'units', 1);
setField(doc, 'dayRate', 260);
saveBtn(doc).click();
const stg = api.cycleStats(2026, 10, 'site');
near('实收到手', stg.gross, 260, 0.01);
near('应收对外', stg.grossOut, 300, 0.01);
near('差额', stg.gap, 40, 0.01);
eq('对外价开关打开', stg.outEnabled, true);
navTo(w, doc, 'details');
ok('工地明细显示应收', (doc.querySelector('.settle-card')?.textContent || '').includes('应收'));

/* ================= 4.5 设置页入口 ================= */
group('设置页：调休入口可用');
switchWorker(doc, 'regular');
api.setMonth(2026, 10);
api.render();
doc.querySelector('[data-action="view"][data-view="settings"]').click();
const setTxt = (doc.getElementById('main')?.textContent || '');
ok('设置页有「调休抵扣」', setTxt.includes('调休抵扣'));
const leaveInp = doc.querySelector('#main input[data-mon="leaveHours"]');
ok('有调休小时输入框', !!leaveInp);
if (leaveInp) {
  leaveInp.value = '3';
  leaveInp.dispatchEvent(new w.Event('input', { bubbles: true }));
  eq('调休小时写进本月数据', S().data.regular.monthly['2026-11'].leaveHours, 3);
}
doc.querySelector('[data-action="set-leave-order"][data-v="high"]').click();
eq('抵扣顺序可改成先扣高倍率', S().data.regular.monthly['2026-11'].leaveOrder, 'high');

/* ================= 5. 旧数据兼容 ================= */
group('旧数据：没有新字段也能正常算');
switchWorker(doc, 'regular');
api.setMonth(2026, 10);
S().data.regular.settings.rateOut = undefined;
S().data.regular.records = {};
S().data.regular.monthly = {};
S().data.regular.records['2026-11-20'] = { shift: '白班', otHours: 2, regularHours: null, note: '' };
const oldRec = S().data.regular.records['2026-11-20'];
near('旧记录按法定倍率算', api.dayWage('2026-11-20', oldRec, 'regular'), round2(2 * hr * 1.5), 0.02);
const oldSt = api.cycleStats(2026, 10, 'regular');
near('旧数据加班费不变', oldSt.otPay, round2(2 * hr * 1.5), 0.02);
eq('旧数据没有调休', oldSt.leaveApplied, 0);
near('旧数据没有对调损失', oldSt.otLoss, 0, 0.01);

const r = report();
console.log('errors:', errors);
process.exit(r.fail ? 1 : 0);
