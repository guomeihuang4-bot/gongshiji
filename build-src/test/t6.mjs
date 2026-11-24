import { boot, group, ok, eq, near, click, editDay, setField, saveBtn, navTo, switchWorker, report } from './helpers.mjs';

const { w, doc, api, errors } = boot();
const S = () => api.state;
api.setMonth(2026,10);

group('非自然月：日历与明细金额一致');
S().cycleStartDay = 26;
S().data.regular.settings.baseSalary = 8000;
S().data.regular.settings.hoursPerDay = 8;
S().data.regular.settings.autoDays = true;
S().settleNow = false;
api.render();
const cyc = api.cycleRange(2026,10);
const payDays = cyc.dates.filter(k => !api.isOffDay(k)).length;
const hr = 8000 / (payDays * 8);
// 编辑周期内的一天
const dlg = editDay(w, doc, '2026-11-26'); // 26 号起的账期：11/26 - 12/25
setField(doc, 'otHours', 2);
saveBtn(doc).click();
const rec = S().data.regular.records['2026-11-26'];
const dayAmt = api.dayWage('2026-11-26', rec, 'regular', cyc);
near('单日金额按周期时薪', dayAmt, 2 * hr * 1.5, 0.02);
const st = api.cycleStats(2026,10,'regular');
near('明细加班费一致', st.otPay, dayAmt, 0.02);
near('周期时薪', st.hourlyRate, hr, 0.001);
// 日历 DOM 上的金额
navTo(w, doc, 'calendar');
api.render();
const cellText = doc.querySelector('.day[data-date="2026-11-26"] .d-wage')?.textContent;
ok('日历显示金额', cellText && cellText.includes('+'), cellText);
S().cycleStartDay = 1;
api.render();

group('四工种同一天数据隔离');
const day = '2026-11-17';
const setRec = (kind, rec) => { S().data[kind].records[day] = rec; };
setRec('regular', { shift:'白班', otHours:1, regularHours:null, note:'正式' });
setRec('temp', { shift:'白班', hours:8, rate:20, note:'临时' });
setRec('piece', { items:[{name:'甲',qty:10,rate:2}], note:'计件' });
setRec('site', { type:'work', unit:'day', units:1, dayRate:260, hours:0, hourRate:0, otHours:0, otRate:0, pkgQty:0, pkgRate:0, amount:0, note:'工地' });
Object.keys(S().data).forEach(k => eq(k + ' 各自记录', !!S().data[k].records[day], true));
switchWorker(doc, 'temp');
navTo(w, doc, 'calendar'); api.render();
ok('临时工日历显示 8h', doc.querySelector(`.day[data-date="${day}"] .lunar`)?.textContent === '8h');
ok('临时工明细 160', Math.abs(api.cycleStats(2026,10,'temp').net - 160) < 0.01);
switchWorker(doc, 'piece');
api.render();
ok('计件明细 20', Math.abs(api.cycleStats(2026,10,'piece').net - 20) < 0.01);
switchWorker(doc, 'site');
api.render();
ok('工地明细 260', Math.abs(api.cycleStats(2026,10,'site').net - 260) < 0.01);
switchWorker(doc, 'regular');
api.render();
const stR = api.cycleStats(2026,10,'regular');
const hrR = stR.hourlyRate;
near('正式工明细 = 底薪 + 1h 加班 + 之前2h', stR.net, 8000 + hrR * 1.5 * 3, 0.03);
ok('正式工备注保留', S().data.regular.records[day].note === '正式');

group('CSV 导出内容');
let exported = null;
w.AndroidBridge = { saveFile: (n, t) => { exported = { n, t }; } };
navTo(w, doc, 'settings'); api.render();
click(doc, '#main [data-action="export-csv"]');
ok('CSV 文件名', exported && exported.n.includes('正式工'));
const lines = exported.t.split('\r\n');
ok('CSV 有表头', lines[0].includes('日期') && lines[0].includes('金额'));
ok('CSV 含记录行', lines.some(l => l.includes('2026-11-26')));
ok('CSV 有备注', lines.some(l => l.includes('正式')));
w.AndroidBridge = undefined;

group('年度卡片与打印');
navTo(w, doc, 'details'); api.render();
ok('年度柱状图存在', doc.querySelectorAll('.year-bars .bar').length === 12);
ok('年度标签 12 个', doc.querySelectorAll('.year-labels span').length === 12);
let printed = false;
w.AndroidBridge = { printPage: () => { printed = true; }, saveFile: () => { }, saveBase64: () => { } };
click(doc, '#main [data-action="payslip"]');
click(doc, '#payslipDialog [data-action="print-payslip"]');
ok('调起系统打印', printed);
let savedImg = false;
w.AndroidBridge = { saveBase64: () => { savedImg = true; }, printPage: () => { }, saveFile: () => { } };
click(doc, '#payslipDialog [data-action="save-payslip-img"]');
ok('保存工资条图片', savedImg);
doc.getElementById('payslipDialog').close();

group('补贴影响实发');
const before = api.cycleStats(2026,10,'regular').net;
S().data.regular.monthly['2026-11'] = { deductions:[{name:'社保',amount:300}], allowances:[{name:'饭补',amount:200}] };
api.render();
const after = api.cycleStats(2026,10,'regular').net;
near('补贴 - 扣款', after - before, -100, 0.01);

const r = report();
console.log('errors:', errors.slice(0,6));
process.exit(r.fail?1:0);
