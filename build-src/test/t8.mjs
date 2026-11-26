import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
const BACKUP = fs.readFileSync('/sdcard/0.21版本工作区/全局管理/项目管理/应用开发/工时记/工时记备份-2026-11-20 (1).json', 'utf8');
const OLD_HTML = fs.readFileSync('/sdcard/0.21版本工作区/全局管理/项目管理/应用开发/工时记/工时记-v1.3-备份.html', 'utf8');

function bootOld(preload) {
  const vc = new VirtualConsole(); const errs = [];
  vc.on('jsdomError', e => { if (!/scrollTo|Not implemented/.test(e.message)) errs.push(e.message); });
  const dom = new JSDOM(OLD_HTML, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/old/index.html', virtualConsole: vc,
    beforeParse(w) {
      w.scrollTo = () => { };
      if (preload) preload(w);
    }
  });
  return { dom, w: dom.window, doc: dom.window.document, errs };
}

// 旧版：把备份写进 localStorage 的 gongshi_v2
const old = bootOld(w => {
  w.localStorage.setItem('gongshi_v2', BACKUP);
});
const od = old.doc;
const oldMoney = od.querySelector('.income .money')?.textContent.trim();
console.log('旧版 2026-11 本月工资:', oldMoney);
console.log('旧版 汇总说明:', od.querySelector('.income-note')?.textContent.trim());
console.log('旧版记录格子:', od.querySelectorAll('.day.has').length);

// 新版
import('./helpers.mjs').then(async ({ boot, report, ok, eq }) => {
  const { w, doc, api } = boot();
  const file = new w.File([BACKUP], 'b.json', { type: 'application/json' });
  const input = doc.getElementById('importFile');
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new w.Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  api.setMonth(2026, 10); api.render();
  const newMoney = doc.querySelector('.summary .s-money')?.textContent.trim();
  console.log('新版 2026-11 本月工资:', newMoney);
  const st = api.cycleStats(2026, 10, 'regular');
  console.log('新版明细: 底薪', st.base, '加班', st.otPay, '事假', st.leaveDeduct, '实发', st.net);
  const oldNote=od.querySelector('.income-note')?.textContent.trim();const oldNum = Number(String(oldMoney).replace(/[^\d.-]/g, ''));
  const newNum = Number(String(newMoney).replace(/[^\d.-]/g, ''));
  console.log('差:', (newNum - oldNum).toFixed(2));
  ok('新旧金额一致', Math.abs(newNum - oldNum) < 0.01, { old: oldNum, now: newNum });
  process.exit(0);
});
