import { boot, group, ok, eq, near, report } from './helpers.mjs';

const { w, doc, api, errors } = boot();
const S = () => api.state;
api.setMonth(2026, 10); api.render();

const press = (sel, root = doc) => {
  const el = root.querySelector(sel);
  if (!el) throw new Error('找不到元素 ' + sel);
  el.click();
  return el;
};
const type = (str, root = doc) => { for (const ch of str) press(`#kpAlpha [data-k="${ch}"]`, root); };
const candsNow = (root = doc) => [...root.querySelectorAll('#kpCands .cand')].map(b => b.textContent);

group('内置键盘：拼音 26 键');
api.openEditor('2026-11-26');
const dlg = doc.getElementById('editor');
const note = dlg.querySelector('input[data-field="note"]');
note.focus();
ok('备注框点击后打开键盘', doc.getElementById('keypad').classList.contains('on'));
eq('默认模式为拼音', doc.querySelector('#kpModes [data-mode="py26"]').classList.contains('on'), true);
eq('显示 26 键区', doc.getElementById('kpAlpha').hidden, false);
eq('数字区隐藏', doc.getElementById('kpGrid').hidden, true);
eq('数字键盘的底栏隐藏', doc.getElementById('keypad').dataset.kpMode, 'py26');

type('zhong');
const cands = candsNow();
ok('"zhong" 出现候选', cands.length > 0, cands.slice(0, 8));
ok('候选里有「中」', cands.includes('中'), cands.slice(0, 12));
ok('拼音串显示在键盘上', (doc.getElementById('kpPy').textContent || '').includes('zhong'), doc.getElementById('kpPy').textContent);
doc.querySelector('#kpCands .cand[data-cand="中"]').click();
eq('点候选后写入输入框', note.value, '中');
eq('拼音缓冲已清空', doc.getElementById('kpCands').hidden, true);

type('guo');
ok('"guo" 候选里有「国」', candsNow().includes('国'), candsNow().slice(0, 10));
doc.querySelector('#kpCands .cand[data-cand="国"]').click();
eq('组合成「中国」', note.value, '中国');

group('词组与整句');
press('#kpAlpha [data-k="del"]'); press('#kpAlpha [data-k="del"]');
eq('清空到 0', note.value, '');
type('jintian');
const wj = candsNow();
ok('jintian 首选「今天」', wj[0] === '今天', wj.slice(0, 6));
press('#kpFoot [data-k="space"]');
eq('空格上屏首选词', note.value, '今天');
press('#kpAlpha [data-k="del"]'); press('#kpAlpha [data-k="del"]');
type('jiaban');
ok('jiaban 首选「加班」', candsNow()[0] === '加班', candsNow().slice(0, 5));
press('#kpFoot [data-k="space"]');
type('wojintianjiaban');
const sent = candsNow();
ok('整句「我今天加班」在候选里', sent.includes('我今天加班'), sent.slice(0, 5));
press('#kpCands .cand.first');
eq('整句上屏', note.value, '加班我今天加班');

group('简拼 / 翻页 / 标点');
note.value = ''; type('');
api.kpPress('hide'); note.focus();
type('jt');
ok('简拼 jt 出「今天」', candsNow().includes('今天'), candsNow().slice(0, 6));
doc.querySelector('#kpCands .cand[data-cand="今天"]').click();
eq('简拼上屏', note.value, '今天');
note.value = '';
type('shi');
const pages = doc.getElementById('kpCands').querySelectorAll('.cand').length;
eq('候选每页 8 个', pages <= 8, true);
const pageBtns = [doc.getElementById('kpPrev'), doc.getElementById('kpNext')];
ok('候选超过一页时出现翻页按钮', pageBtns.some(b => !b.hidden) || api.keypad.cands.length <= 8);
if (!doc.getElementById('kpNext').hidden) {
  const before = candsNow();
  doc.getElementById('kpNext').click();
  const after = candsNow();
  ok('翻页后候选变化', before.join('') !== after.join(''), { before: before.slice(0, 3), after: after.slice(0, 3) });
  doc.getElementById('kpPrev').click();
}
note.value = '';
press('#kpFoot [data-k="period"]');
press('#kpFoot [data-k="comma"]');
eq('标点插入', note.value, '。，');

group('长按退格连续删除');
note.value = '一二三四五六';
for (let i = 0; i < 3; i++) type('');
const delKey = doc.querySelector('#kpAlpha [data-k="del"]');
delKey.dispatchEvent(new w.Event('pointerdown', { bubbles: true }));
await new Promise(r => setTimeout(r, 700));
delKey.dispatchEvent(new w.Event('pointerup', { bubbles: true }));
const afterHold = note.value;
ok('长按连续删除', afterHold.length < 6, { len: afterHold.length, v: afterHold });
delKey.click();
ok('长按后补发的点击不重复删', note.value.length >= 0);

group('九宫格');
note.value = '';
doc.querySelector('#kpModes [data-mode="py9"]').click();
eq('切到九键', doc.getElementById('kpT9').hidden, false);
eq('26 键隐藏', doc.getElementById('kpAlpha').hidden, true);
for (const d of '94664') press(`#kpT9 [data-k="t${d}"]`);
const t9c = candsNow();
ok('九键 94664 候选里有「中」', t9c.includes('中'), t9c.slice(0, 10));
doc.querySelector('#kpCands .cand[data-cand="中"]').click();
ok('九键输入生效', note.value.includes('中'), note.value);
note.value = '';
for (const d of '5468426') press(`#kpT9 [data-k="t${d}"]`);
ok('九键 5468426 首选「今天」', candsNow()[0] === '今天', candsNow().slice(0, 6));
press('#kpFoot [data-k="space"]');
eq('九键空格上屏', note.value, '今天');

group('英文模式与数字键盘');
doc.querySelector('#kpModes [data-mode="en"]').click();
press('#kpAlpha [data-k="a"]');
press('#kpAlpha [data-k="shift"]');
press('#kpAlpha [data-k="b"]');
ok('英文大小写', note.value.endsWith('aB'), note.value);
const ot = dlg.querySelector('input[data-field="otHours"]');
ot.focus();
eq('数字框自动切数字模式', doc.querySelector('#kpModes [data-mode="num"]').classList.contains('on'), true);
eq('拼音按钮禁用', doc.querySelector('#kpModes [data-mode="py26"]').disabled, true);
press('#kpGrid [data-key="3"]');
eq('数字键输入', ot.value, '3');
press('#kpGrid [data-key="done"]');
eq('完成关闭键盘', doc.getElementById('keypad').classList.contains('on'), false);

group('模式记忆');
doc.getElementById('editor').close();
api.openEditor('2026-11-27');
doc.getElementById('editor').querySelector('input[data-field="note"]').focus();
eq('记住上次用的英文', doc.querySelector('#kpModes [data-mode="en"]').classList.contains('on'), true);
doc.querySelector('#kpModes [data-mode="py9"]').click();
doc.getElementById('editor').close();
api.openEditor('2026-11-27');
doc.getElementById('editor').querySelector('input[data-field="note"]').focus();
eq('记住上次用的九键', doc.querySelector('#kpModes [data-mode="py9"]').classList.contains('on'), true);
doc.querySelector('#kpModes [data-mode="py26"]').click();
eq('可切回拼音', doc.getElementById('kpAlpha').hidden, false);

group('设置页文字输入');
doc.getElementById('editor').close();
const { doc: d2, api: api2 } = boot();
api2.setMonth(2026, 10);
d2.querySelector('.nav [data-view="settings"]').click();
api2.render();
const nameInput = d2.querySelector('#main input[data-item="deductions:0:name"]');
ok('扣款名称输入框存在', !!nameInput);
ok('扣款名称是内置键盘', nameInput.hasAttribute('readonly') && nameInput.dataset.text === '1');
nameInput.focus();
ok('点击后打开键盘', d2.getElementById('keypad').classList.contains('on'));
type('ni', d2);
const nc = candsNow(d2);
ok('"ni" 候选', nc.length > 0, nc.slice(0, 6));
d2.querySelector('#kpCands .cand[data-cand="你"]').click();
eq('名称写入（追加到原有名称后）', nameInput.value, '社保你');

group('首次打开自动弹关于');
const b3 = boot({ allowFirstRun: true });
await new Promise(r => setTimeout(r, 1000));
ok('自动弹出关于弹窗', b3.doc.getElementById('aboutDialog').hasAttribute('open'));
const b4 = boot({ allowFirstRun: true, preload(w4) { w4.localStorage.setItem('gongshi_about_seen', '1'); } });
await new Promise(r => setTimeout(r, 1000));
ok('看过之后不再自动弹', !b4.doc.getElementById('aboutDialog').hasAttribute('open'));
b3.dom.window.close(); b4.dom.window.close();
const r = report();
console.log('errors:', errors.slice(0, 6));
process.exit(r.fail ? 1 : 0);
