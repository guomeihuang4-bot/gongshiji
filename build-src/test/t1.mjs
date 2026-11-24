import { boot, group, ok, eq, near, typeNums, click, editDay, setField, saveBtn, monthText, navTo, switchWorker, report, $, $$ } from './helpers.mjs';

group('启动与基础渲染');
const { w, doc, api, errors } = boot();
ok('__app 存在', !!api);
ok('无脚本错误', errors.length === 0, errors);
eq('默认工种', api.state.active, 'regular');
eq('日历格子数', $$(doc,'.day').length, 42);
eq('导航数量', $$(doc,'.nav button').length, 3);
ok('汇总金额显示', !!doc.querySelector('.summary .s-money'));
eq('农历/节日第二行存在', $$(doc,'.day .lunar').length > 0, true);
console.log('  今日格:', doc.querySelector('.day.is-today')?.textContent.trim().replace(/\s+/g,'|'));
console.log('  头部工按钮:', doc.querySelector('.mark-btn')?.textContent);
console.log('  背景按钮:', !!doc.querySelector('#bgBtn'));

group('工种切换与数据隔离');
const y=2026,m=10; // 2026-11
api.setMonth(y,m); 
for (const k of ['temp','piece','site','regular']) {
  switchWorker(doc,k);
  eq('切到 '+k+' 后 active', api.state.active, k);
  eq('切到 '+k+' 后按钮高亮', doc.querySelector(`#workerSwitch [data-w="${k}"]`).classList.contains('on'), true);
}
// 在 regular 记一笔
doc.querySelector('.cal-actions [data-action="edit-today"]').click();
const dlg = doc.getElementById('editor');
ok('编辑器已打开', dlg.hasAttribute('open'));
console.log('  编辑器标题:', dlg.querySelector('h2')?.textContent.trim());
console.log('  编辑器字段:', $$(dlg,'input[data-field]').map(i=>i.dataset.field));
console.log('  键盘未打开:', !doc.getElementById('keypad').classList.contains('on'));
// 选加班 2h
dlg.querySelector('[data-action="quick-ot"][data-v="2"]').click();
const ot = dlg.querySelector('input[data-field="otHours"]');
eq('快速加班写入', ot.value, '2');
saveBtn(doc).click();
eq('保存后关闭', dlg.hasAttribute('open'), false);
const today = w.__app.state ? null : null;
const keys = Object.keys(api.state.data.regular.records);
eq('regular 有一条记录', keys.length, 1);
console.log('  记录日期:', keys[0], JSON.stringify(api.state.data.regular.records[keys[0]]));
// 切到 temp 应看不到
switchWorker(doc,'temp');
eq('临时工日历无记录', Object.keys(api.state.data.temp.records).length, 0);
const hasRecDays = $$(doc,'.day.has').length;
eq('临时工日历无 has 格子', hasRecDays, 0);
switchWorker(doc,'regular');
eq('切回正式工有记录格子', $$(doc,'.day.has').length, 1);

group('数字键盘');
switchWorker(doc,'temp');
api.openEditor(keys[0]);
const dlg2 = doc.getElementById('editor');
const hours = dlg2.querySelector('input[data-field="hours"]');
hours.focus();
ok('点击数字框打开键盘', doc.getElementById('keypad').classList.contains('on'));
eq('键盘标题', doc.getElementById('kpLabel').textContent, '工时');
typeNums(w,doc,hours,'8');
eq('输入 8', hours.value, '8');
typeNums(w,doc,hours,'.5');
eq('输入小数点', hours.value, '8.5');
doc.querySelector('#kpGrid [data-key="del"]').click();
eq('退格', hours.value, '8.');
doc.querySelector('#kpGrid [data-key="clear"]').click();
eq('清空', hours.value, '');
doc.querySelector('#kpGrid [data-key="done"]').click();
ok('完成后键盘关闭', !doc.getElementById('keypad').classList.contains('on'));

const r = report();
process.exit(r.fail ? 1 : 0);
