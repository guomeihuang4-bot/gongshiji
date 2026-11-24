import { boot, group, ok, eq, near, click, navTo, switchWorker, report } from './helpers.mjs';
import fs from 'fs';

const backup = fs.readFileSync('/sdcard/Download/工时记备份-2026-11-20.json', 'utf8');
const raw = JSON.parse(backup);
console.log('备份记录数:', Object.keys(raw.records).length, '月份:', Object.keys(raw.monthly));

const { w, doc, api, errors } = boot();
const S = () => api.state;

group('导入用户真实备份（v2）');
const file = new w.File([backup], '工时记备份-2026-11-20.json', { type: 'application/json' });
const input = doc.getElementById('importFile');
Object.defineProperty(input, 'files', { value: [file], configurable: true });
input.dispatchEvent(new w.Event('change', { bubbles: true }));
await new Promise(r => setTimeout(r, 200));
eq('记录数', Object.keys(S().data.regular.records).length, 20);
eq('底薪', S().data.regular.settings.baseSalary, 2450);
eq('计薪天数', S().data.regular.settings.daysPerMonth, 22);
eq('默认按固定天数（保持旧版口径）', S().data.regular.settings.autoDays, false);
eq('模式', S().active, 'regular');
eq('工时/天', S().data.regular.settings.hoursPerDay, 8);
eq('平时倍数', S().data.regular.settings.mulWeekday, 1.5);
eq('周末倍数', S().data.regular.settings.mulWeekend, 2);
eq('节假日倍数', S().data.regular.settings.mulHoliday, 3);

group('旧口径金额核对');
const hr = 2450 / (22 * 8);
const st = api.cycleStats(2026, 10, 'regular');
near('小时工资', st.hourlyRate, hr, 0.0001);
console.log('  小时工资:', st.hourlyRate.toFixed(4));
console.log('  加班小时:', st.otHours, ' 加班费:', st.otPay, ' 事假扣:', st.leaveDeduct, ' 实发:', st.net);
// 手工核对
let ot = 0, leave = 0;
for (const [k, r] of Object.entries(raw.records)) {
  if (r.worker !== 'regular') continue;
  if (r.shift === '事假') leave++;
  else if (['白班','早班','中班','晚班','夜班'].includes(r.shift)) ot += r.otHours || 0;
}
const expectOtPay = Math.round(ot * hr * 1.5 * 100) / 100; // 全部是工作日的 1.5 倍
console.log('  备份里加班小时:', ot, '事假天数:', leave, '按 1.5 倍算:', expectOtPay);
near('加班小时合计', st.otHours, ot, 0.001);
near('事假扣款', st.leaveDeduct, leave * 8 * hr, 0.02);
ok('实发合理（底薪 + 加班 - 事假）', Math.abs(st.net - (2450 + st.otPay - st.leaveDeduct)) < 0.02, st.net);

group('导入后界面正常');
navTo(w, doc, 'calendar');
api.setMonth(2026, 10);
api.render();
ok('日历有记录格子', doc.querySelectorAll('.day.has').length >= 20, doc.querySelectorAll('.day.has').length);
ok('汇总有金额', doc.querySelector('.summary .s-money').textContent.includes('¥'));
navTo(w, doc, 'details');
api.render();
const rows = [...doc.querySelectorAll('.settle-card .li-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
console.log('  明细:', rows);
ok('明细显示底薪 2450', rows.some(r => r.includes('2,450')), rows);
ok('明细显示加班费', rows.some(r => r.includes('加班费')), rows);
ok('明细显示实发', rows.some(r => r.includes('实发')), rows);
ok('记录列表 20 条', doc.querySelectorAll('.rec-list .rec-row').length === 28 || doc.querySelectorAll('.rec-list .rec-row').length >= 28, doc.querySelectorAll('.rec-list .rec-row').length);

group('导入后可继续记工');
switchWorker(doc, 'temp');
api.render();
const d = api.openEditor('2026-11-21');
doc.getElementById('editor').querySelector('input[data-field="hours"]').value = '8';
doc.getElementById('editor').querySelector('input[data-field="hours"]').dispatchEvent(new w.Event('input', { bubbles: true }));
doc.querySelector('#editor [data-action="save-entry"]').click();
eq('临时工新记录', !!S().data.temp.records['2026-11-21'], true);
eq('正式工记录不受影响', Object.keys(S().data.regular.records).length, 20);

const r = report();
console.log('errors:', errors.slice(0, 5));
process.exit(r.fail ? 1 : 0);
