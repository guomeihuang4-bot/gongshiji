import { boot, group, ok, eq, near, click, editDay, setField, saveBtn, navTo, switchWorker, report, $, $$ } from './helpers.mjs';

const { w, doc, api, errors } = boot();
const S = () => api.state;
api.setMonth(2026,10); api.render();

group('工作日设置与「休」标记');
switchWorker(doc,'regular');
api.setMonth(2026,10); api.render();
eq('默认 2026-11-22 周日休息', api.isOffDay('2026-11-22'), true);
eq('默认 2026-11-20 周五上班', api.isOffDay('2026-11-20'), false);
eq('周日的休标记', doc.querySelector('.day[data-date="2026-11-22"] .rest-tag')?.textContent, '休');
eq('周五没有休标记', !!doc.querySelector('.day[data-date="2026-11-20"] .rest-tag'), false);
// 改成周一到周四
S().data.regular.settings.workWeek = [0,1,1,1,1,0,0];
api.render();
eq('改设置后周五休息', api.isOffDay('2026-11-20'), true);
eq('周五显示休', doc.querySelector('.day[data-date="2026-11-20"] .rest-tag')?.textContent, '休');
eq('周四仍上班', api.isOffDay('2026-11-19'), false);
// 预设按钮
navTo(w, doc, 'settings');
click(doc, '#main [data-action="workweek-preset"][data-preset="5"]');
eq('预设 5 天恢复周五上班', api.isOffDay('2026-11-20'), false);
click(doc, '#main [data-action="workweek-preset"][data-preset="7"]');
eq('预设 7 天周日也上班', api.isOffDay('2026-11-22'), false);
click(doc, '#main [data-action="workweek-preset"][data-preset="5"]');
// 手动切换单个星期
click(doc, '#main [data-action="toggle-workweek"][data-dow="6"]');
eq('手动加上周六', api.isOffDay('2026-11-21'), false);
click(doc, '#main [data-action="toggle-workweek"][data-dow="6"]');
// 节假日开关
S().data.regular.settings.followHoliday = false;
eq('关闭节假日后 2026-10-01 不算休息', api.isOffDay('2026-10-01'), false);
S().data.regular.settings.followHoliday = true;
eq('打开节假日后 2026-10-01 休息', api.isOffDay('2026-10-01'), true);
S().data.regular.settings.followMakeup = false;
eq('关闭补班后 2026-10-10 周六仍休息', api.isOffDay('2026-10-10'), true);
S().data.regular.settings.followMakeup = true;
eq('打开补班后 2026-10-10 上班', api.isOffDay('2026-10-10'), false);

group('节假日 2025-2030');
const cases = [
  ['2025-01-01','元旦'],['2025-01-28','春节'],['2025-10-01','国庆中秋'],
  ['2026-02-15','春节'],['2026-02-17','春节'],['2026-10-01','国庆节'],
  ['2027-01-01','元旦'],['2027-02-06','春节'],['2027-10-01','国庆节'],
  ['2028-01-26','春节'],['2029-02-13','春节'],['2030-02-02','春节'],['2030-10-01','国庆节']
];
cases.forEach(([k,n]) => eq('节假日 ' + k, api.holidayName(k), n));
eq('范围外 2031 无节假日', api.holidayName('2031-10-01'), '');
eq('普通工作日无节假日', api.holidayName('2026-11-18'), '');
ok('2026-02-17 类型为节假日', api.dateType('2026-02-17') === 'holiday');
ok('2026-02-14 补班为工作日', api.dateType('2026-02-14') === 'workday');
eq('农历春节显示', api.lunarText('2026-02-17'), '正月');
// 手动覆盖
S().overrides['2026-11-21'] = 'workday';
eq('手动改成上班日', api.isOffDay('2026-11-21'), false);
eq('手动类型', api.dateType('2026-11-21'), 'workday');
delete S().overrides['2026-11-21'];

group('工资周期');
S().cycleStartDay = 26; api.render();
const cyc = api.cycleRange(2026,10);
eq('周期开始（26号-下月25号）', cyc.dates[0], '2026-11-26');
eq('周期结束', cyc.dates[cyc.dates.length-1], '2026-12-25');
eq('周期天数', cyc.dates.length, 30);
ok('周期标签', cyc.label.includes('11月26日') && cyc.label.includes('12月25日'), cyc.label);
const cyc2 = api.cycleRange(2026,0); // 2026-01 → 01/26 - 02/25
eq('跨年周期', cyc2.dates[0], '2026-01-26');
S().cycleStartDay = 1; api.render();
eq('自然月天数 11 月', api.cycleRange(2026,10).dates.length, 30);

group('现在结算（底薪按已过工作日折算）');
S().data.regular.settings.baseSalary = 8000;
S().data.regular.settings.daysPerMonth = 21.75;
S().data.regular.records['2026-11-18'] = { shift:'白班', otHours:0, regularHours:null, note:'' };
S().settleNow = false; api.render();
navTo(w, doc, 'calendar');
const full = api.cycleStats(2026,10,'regular');
S().settleNow = true; api.render();
const partial = api.cycleStats(2026,10,'regular');
ok('今天在周期内时底薪被折算', partial.baseProrated === true, {base: partial.base, full: full.base});
ok('折算后底薪更少', partial.base < full.base, {partial: partial.base, full: full.base});
S().settleNow = false; api.render();

group('工资条');
navTo(w, doc, 'details');
api.openPayslip();
const pd = doc.getElementById('payslipDialog');
ok('工资条弹窗打开', pd.hasAttribute('open'));
ok('工资条表格有行', pd.querySelectorAll('.payslip tr').length >= 3);
ok('打印区有内容', doc.getElementById('printArea').innerHTML.includes('payslip'));
ok('存图片返回 dataURL', api.version && typeof w.__app === 'object');
pd.querySelector('[data-action="save-payslip-img"]').click();
ok('无异常', true);

group('防呆校验');
switchWorker(doc,'temp');
api.setMonth(2026,10); api.render();
const d1 = editDay(w, doc, '2026-11-23');
setField(doc, 'hours', 30);
saveBtn(doc).click();
eq('超 24 小时不保存', !!S().data.temp.records['2026-11-23'], false);
ok('有错误提示', doc.getElementById('entryError').textContent.length > 0, doc.getElementById('entryError').textContent);
// 负数
setField(doc, 'hours', 8);
setField(doc, 'rate', -5);
saveBtn(doc).click();
eq('负单价不保存', !!S().data.temp.records['2026-11-23'], false);
setField(doc, 'rate', 20);
saveBtn(doc).click();
ok('正常数据可保存', !!S().data.temp.records['2026-11-23']);

switchWorker(doc,'piece');
api.render();
const d2 = editDay(w, doc, '2026-11-24');
saveBtn(doc).click();
eq('计件空行不保存', !!S().data.piece.records['2026-11-24'], false);
setField(doc, 'pqty0', 5);
saveBtn(doc).click();
ok('填数量未填单价有提示', doc.getElementById('entryError').textContent.includes('单价'), doc.getElementById('entryError').textContent);
setField(doc, 'prate0', 2);
saveBtn(doc).click();
ok('计件可保存', !!S().data.piece.records['2026-11-24']);

switchWorker(doc,'site');
api.render();
const d3 = editDay(w, doc, '2026-11-24');
d3.querySelector('[data-action="site-type"][data-v="borrow"]').click();
saveBtn(doc).click();
eq('借支 0 不保存', !!S().data.site.records['2026-11-24'], false);
setField(doc, 'amount', 50);
saveBtn(doc).click();
ok('借支可保存', !!S().data.site.records['2026-11-24']);

switchWorker(doc,'regular');
api.render();
const d4 = editDay(w, doc, '2026-11-24');
setField(doc, 'otHours', 25);
saveBtn(doc).click();
eq('加班 25 小时不保存', !!S().data.regular.records['2026-11-24'], false);

const r = report();
console.log('errors:', errors);
process.exit(r.fail?1:0);
