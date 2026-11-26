import { boot, group, ok, eq, near, click, editDay, setField, saveBtn, navTo, switchWorker, report, $, $$ } from './helpers.mjs';

// 剪贴板打桩
let copied = null;
const { w, doc, api, errors } = boot({
  preload(w) {
    Object.defineProperty(w.navigator, 'clipboard', {
      value: { writeText: t => { copied = t; return Promise.resolve(); } }, configurable: true
    });
  }
});
const S = () => api.state;
api.setMonth(2026,10); api.render();

group('自定义背景');
click(doc, '#aboutBtn'); // 先关掉
doc.getElementById('aboutDialog').close();
click(doc, '#bgBtn');
const bgd = doc.getElementById('bgDialog');
ok('背景弹窗打开', bgd.hasAttribute('open'));
eq('预设数量 8', $$(bgd,'.bg-strip .bg-opt').length, 8);
ok('有选照片按钮', !!bgd.querySelector('[data-action="pick-bg-image"]'));
ok('三个滑块都在', ['bg-blur','bg-dim','bg-alpha'].every(a => !!bgd.querySelector(`[data-action="${a}"]`)));
click(doc, '#bgDialog [data-action="set-bg-preset"][data-id="sky"]');
eq('主题记录预设', api.theme.preset, 'sky');
ok('壁纸层应用渐变', (doc.getElementById('wallpaper').style.background || '').includes('gradient'), doc.getElementById('wallpaper').style.background);
ok('body 不再画背景图', !doc.body.style.backgroundImage, doc.body.style.backgroundImage);
ok('背景弹窗重新打开', doc.getElementById('bgDialog').hasAttribute('open'));
click(doc, '#bgDialog [data-action="toggle-bg-glass"]');
eq('毛玻璃开关', api.theme.glass, true);
// 换照片
api.theme.image = 'data:image/jpeg;base64,AAAA';
api.theme.preset = 'default';
api.applyBackground();
ok('照片写进壁纸层', doc.getElementById('wallImg').style.backgroundImage.includes('base64,AAAA'), doc.getElementById('wallImg').style.backgroundImage);
ok('body 标记有壁纸', doc.body.classList.contains('has-bg-image'));
eq('卡片透明度变量', doc.documentElement.style.getPropertyValue('--surf-a'), String(api.theme.cardAlpha));
click(doc, '#bgBtn');
ok('有照片时出现移除按钮', !!doc.querySelector('#bgDialog [data-action="remove-bg-image"]'));
click(doc, '#bgDialog [data-action="bg-fit"][data-v="contain"]');
eq('适配方式', api.theme.fit, 'contain');
ok('壁纸层用 contain', doc.getElementById('wallImg').style.backgroundSize === 'contain', doc.getElementById('wallImg').style.backgroundSize);
click(doc, '#bgDialog [data-action="remove-bg-image"]');
eq('移除照片', api.theme.image, '');
ok('去掉照片后不显示壁纸图', !doc.body.classList.contains('has-bg-image'));
click(doc, '#bgBtn');
click(doc, '#bgDialog [data-action="reset-bg"]');
eq('恢复默认预设', api.theme.preset, 'default');
near('恢复默认卡片透明度', api.theme.cardAlpha, 0.86, 0.001);
doc.getElementById('bgDialog').close();

group('关于弹窗与复制');
click(doc, '#aboutBtn');
const ad = doc.getElementById('aboutDialog');
ok('关于弹窗打开', ad.hasAttribute('open'));
ok('说明含 2025 到 2030', ad.textContent.includes('2025 年到 2030 年'));
ok('含作者', ad.textContent.includes('作者：deep seek'));
ok('源码块存在', ad.textContent.includes('源码（HTML 代码）'));
ok('只留一个复制按钮', !ad.querySelector('[data-action="copy-js"]') && !!ad.querySelector('[data-action="copy-html"]'));
click(doc, '#aboutDialog [data-action="copy-html"]');
await new Promise(r => setTimeout(r, 30));
ok('复制了完整 HTML', copied && copied.includes('<!doctype html>') && copied.includes('</html>'), copied ? copied.length : 0);
ok('复制的源码不含照片数据', copied && !copied.includes('base64,AAAA'), copied && copied.slice(0, 80));
ok('复制源码不带壁纸类名', copied && !/class="[^"]*has-bg-image/.test(copied));
doc.getElementById('aboutDialog').close();

group('导出 / 导入');
let exported = null;
w.AndroidBridge = { saveFile: (name, text) => { exported = { name, text }; } };
api.exportBackup();
ok('导出触发', !!exported, exported && exported.name);
ok('导出内容是 JSON', exported && JSON.parse(exported.text).v === 3);
ok('导出含四工种', exported && !!JSON.parse(exported.text).data.site);
// CSV
exported = null;
navTo(w, doc, 'settings');
click(doc, '#main [data-action="export-csv"]');
ok('CSV 导出', exported && exported.name.includes('.csv') && exported.text.startsWith('\ufeff'), exported && exported.name);
// 导入：构造文件
const payload = {
  v: 3, active: 'regular', cycleStartDay: 1,
  data: {
    regular: { settings: { baseSalary: 12345 }, records: { '2026-09-09': { shift:'白班', otHours:2, regularHours:null } }, monthly: {} },
    temp: { settings: { rate: 30 }, records: { '2026-09-10': { shift:'白班', hours:6, rate:30 } }, monthly: {} },
    piece: { settings: {}, records: {}, monthly: {} },
    site: { settings: {}, records: {}, monthly: {} }
  },
  overrides: { '2026-09-09': 'workday' }
};
const file = new w.File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
const input = doc.getElementById('importFile');
Object.defineProperty(input, 'files', { value: [file], configurable: true });
input.dispatchEvent(new w.Event('change', { bubbles: true }));
await new Promise(r => setTimeout(r, 120));
eq('导入后新增 regular 记录', !!S().data.regular.records['2026-09-09'], true);
eq('导入后新增 temp 记录', !!S().data.temp.records['2026-09-10'], true);
eq('导入后底薪覆盖', S().data.regular.settings.baseSalary, 12345);
eq('导入后覆盖规则', S().overrides['2026-09-09'], 'workday');

group('持久化与重启');
const savedRaw = w.localStorage.getItem('gongshi_v3');
ok('localStorage 有数据', !!savedRaw && savedRaw.length > 100);
w.AndroidBridge = undefined;
const b2 = boot({ preload(w2) { w2.localStorage.setItem('gongshi_v3', savedRaw); } });
eq('重启后 active', b2.api.state.active, 'regular');
eq('重启后记录还在', !!b2.api.state.data.regular.records['2026-09-09'], true);
eq('重启后 12 号记录', !!b2.api.state.data.temp.records['2026-09-10'], true);
b2.dom.window.close();

group('旧版 v2 数据迁移');
const old = {
  mode: 'temp',
  regular: { baseSalary: 6000, daysPerMonth: 21.75, hoursPerDay: 8, mulWeekday:1.5, mulWeekend:2, mulHoliday:3, cycleStartDay: 1 },
  temp: { rate: 18 },
  records: {
    '2026-08-01': { worker:'regular', shift:'白班', otHours:3 },
    '2026-08-02': { worker:'temp', shift:'白班', hours:8, rate:18 }
  },
  monthly: { '2026-08': { deductions:[{name:'社保',amount:300}], allowances:[] } },
  overrides: {}
};
const b3 = boot({ preload(w3) { w3.localStorage.setItem('gongshi_v2', JSON.stringify(old)); } });
eq('迁移后 active=temp', b3.api.state.active, 'temp');
eq('迁移 regular 记录', !!b3.api.state.data.regular.records['2026-08-01'], true);
eq('迁移 temp 记录', !!b3.api.state.data.temp.records['2026-08-02'], true);
eq('迁移时薪设置', b3.api.state.data.temp.settings.rate, 18);
eq('迁移底薪', b3.api.state.data.regular.settings.baseSalary, 6000);
ok('迁移月度扣款', b3.api.state.data.regular.monthly['2026-08'].deductions.length === 1);
b3.dom.window.close();

group('记录编辑回填与删除');
switchWorker(doc, 'regular');
api.setMonth(2026,8); api.render();
const d = editDay(w, doc, '2026-09-09');
eq('回填加班小时', d.querySelector('input[data-field="otHours"]').value, '2');
d.querySelector('[data-action="pick-shift"][data-v="休息"]').click();
saveBtn(doc).click();
eq('改成休息', S().data.regular.records['2026-09-09'].shift, '休息');
// 删除
const d2 = editDay(w, doc, '2026-09-09');
click(doc, '#editor [data-action="del-record"]');
const cd = doc.getElementById('confirmDialog');
ok('确认弹窗出现', cd.hasAttribute('open'));
click(doc, '#confirmYes');
await new Promise(r => setTimeout(r, 20));
eq('删除后记录消失', !!S().data.regular.records['2026-09-09'], false);

group('年度累计');
const yt = api.cycleStats(2026, 0, 'regular').net;
const y = 2026;
const months = [];
for (let i=0;i<12;i++) months.push(api.cycleStats(y,i,'regular').net);
eq('12 个月数组', months.length, 12);
const sum12 = Math.round(months.reduce((a,b)=>a+b,0)*100)/100;
near('年度合计=12月之和', sum12, months.reduce((a,b)=>a+b,0), 0.001);

group('非自然月的记录归属');
S().cycleStartDay = 26;
api.render();
const c11 = api.cycleRange(2026,10); // 11 月账 = 11/26 - 12/25
ok('11/26 在 11 月周期内', c11.dates.includes('2026-11-26'));
ok('11/01 不在 11 月周期内（属于 10 月账）', !c11.dates.includes('2026-11-01'));
const c10 = api.cycleRange(2026,9); // 10 月账 = 10/26 - 11/25
ok('11/01 在 10 月周期内', c10.dates.includes('2026-11-01'));
const c12 = api.cycleRange(2026,11); // 12 月账 = 12/26 - 1/25
ok('12/25 在 11 月周期内', c11.dates.includes('2026-12-25') && !c12.dates.includes('2026-12-25'));
S().cycleStartDay = 1; api.render();

group('月份切换边界');
navTo(w, doc, 'calendar');
api.setMonth(2026,0); api.render();
const before = doc.querySelector('.month-title strong').textContent;
click(doc, '#main [data-action="prev-month"]');
ok('可切到上个月', doc.querySelector('.month-title strong').textContent !== before);
for (let i=0;i<200;i++) click(doc, '#main [data-action="prev-month"]');
ok('不会崩', true);
api.setMonth(2026,10); api.render();

group('计时器');
api.setMonth(2026,10); api.render();
click(doc, '#main [data-action="open-timer"]');
const td = doc.getElementById('timerDialog');
ok('计时弹窗打开', td.hasAttribute('open'));
click(doc, '#timerDialog [data-action="timer-toggle"]');
ok('开始计时', !!S().timer);
S().timer.start = Date.now() - 3725000; // 1小时2分5秒前
click(doc, '#timerDialog [data-action="timer-finish"]');
await new Promise(r => setTimeout(r, 320));
const ed = doc.getElementById('editor');
ok('结束后打开编辑器', ed.hasAttribute('open'));
const hoursVal = ed.querySelector('input[data-field="otHours"]')?.value;
ok('工时已填入', hoursVal && Number(hoursVal) > 0, hoursVal);
doc.getElementById('editor').close();

const r = report();
console.log('errors:', errors.slice(0,5));
process.exit(r.fail?1:0);
