import puppeteer from 'puppeteer';
import fs from 'fs';

const DIR = '/sdcard/0.21版本工作区/全局管理/项目管理/应用开发';
const FILE = DIR + '/工时记.html';
const SHOT = DIR + '/截图-v1.4.2';
const exe = '/root/.cache/puppeteer/chrome/chrome-linux-arm64/chrome';
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto('file://' + encodeURI(FILE), { waitUntil: 'load' });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('gongshi_about_seen', '1'); });
await page.reload({ waitUntil: 'load' });
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(400);
// 关掉可能自动弹出的关于窗，避免挡住点击
await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
const ok = [];
const check = (n, c, extra) => { ok.push({ n, pass: !!c, extra }); if (!c) console.log('  ❌', n, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); };

// 1 首次启动
check('首次启动日历渲染', await page.$('.day') !== null);

// 2 记一笔工，让日历有内容
await page.evaluate(() => {
  const s = window.__app.state;
  s.data.regular.settings.baseSalary = 8000;
  s.data.regular.records['2026-11-16'] = { shift: '白班', otHours: 3, regularHours: null, note: '加班' };
  s.data.regular.records['2026-11-17'] = { shift: '白班', otHours: 3, regularHours: null, note: '加班' };
  s.data.regular.records['2026-11-18'] = { shift: '白班', otHours: 1, regularHours: null, note: '早走' };
  window.__app.setMonth(2026, 10);
  window.__app.render();
});
await wait(300);

// 3 截图：没有壁纸（对照）
await page.screenshot({ path: SHOT + '/01-日历-默认.png' });

// 4 选照片做壁纸
await page.click('#bgBtn');
await wait(350);
check('背景面板打开', await page.evaluate(() => document.getElementById('bgDialog').hasAttribute('open')));
const fileInput = await page.$('#bgFile');
await fileInput.uploadFile('/tmp/wall-test.jpg');
await wait(1200);
const bgState = await page.evaluate(() => ({
  hasImage: !!window.__app.theme.image,
  len: (window.__app.theme.image || '').length,
  cardAlpha: window.__app.theme.cardAlpha,
  dim: window.__app.theme.dim,
  blur: window.__app.theme.blurPx,
  fit: window.__app.theme.fit,
  cls: document.body.className,
  imgStyle: document.getElementById('wallImg').style.cssText,
  bodyBg: document.body.style.backgroundImage
}));
check('照片已读入', bgState.hasImage && bgState.len > 2000, bgState.len);
check('照片放到壁纸图层', bgState.imgStyle.includes('data:image'), bgState.imgStyle.slice(0, 80));
check('body 不再铺背景图', !bgState.bodyBg);
check('body 有 has-bg-image', bgState.cls.includes('has-bg-image'), bgState.cls);
check('换照片后默认卡片 55%', Math.abs(bgState.cardAlpha - 0.55) < 0.001, bgState.cardAlpha);
check('换照片后默认压暗 6%', Math.abs(bgState.dim - 0.06) < 0.001, bgState.dim);
await page.screenshot({ path: SHOT + '/03-壁纸-设置面板.png' });

// 5 关闭弹窗看日历（壁纸可见）
await page.evaluate(() => document.getElementById('bgDialog').close());
await wait(400);
await page.screenshot({ path: SHOT + '/02-壁纸-日历.png' });
// 对照：把卡片调成不透明再截一张
await page.evaluate(() => { window.__app.theme.cardAlpha = 1; window.__app.applyBackground(); });
await wait(300);
await page.screenshot({ path: SHOT + '/11-壁纸-卡片不透明对照.png' });
await page.evaluate(() => { window.__app.theme.cardAlpha = 0.55; window.__app.applyBackground(); });
await wait(300);

// 6 拖动滑块：压暗 / 模糊 / 完整显示
const setSlider = async (action, v) => {
  await page.evaluate((a, val) => {
    const el = document.querySelector(`#bgDialog [data-action="${a}"]`);
    if (!el) return;
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, action, v);
};
await page.click('#bgBtn'); await wait(350);
await setSlider('bg-dim', 0.4);
await setSlider('bg-blur', 8);
await wait(200);
const afterSlider = await page.evaluate(() => ({
  dim: window.__app.theme.dim, blur: window.__app.theme.blurPx,
  scrim: document.getElementById('wallScrim').style.opacity,
  filter: document.getElementById('wallImg').style.filter
}));
check('滑块改压暗', Math.abs(afterSlider.dim - 0.4) < 0.02, afterSlider.dim);
check('遮罩层跟随', Math.abs(parseFloat(afterSlider.scrim) - 0.4) < 0.03, afterSlider.scrim);
check('滑块改模糊', afterSlider.blur === 8 && afterSlider.filter.includes('blur(8px)'), afterSlider.filter);
await page.click('#bgDialog [data-action="bg-fit"][data-v="contain"]');
await wait(300);
check('完整显示生效', await page.evaluate(() => document.getElementById('wallImg').style.backgroundSize === 'contain'));
await page.click('#bgDialog [data-action="toggle-bg-glass"]');
await wait(300);
check('毛玻璃开关', await page.evaluate(() => document.body.classList.contains('bg-glass')));
await page.screenshot({ path: SHOT + '/04-壁纸-压暗模糊.png' });
await page.click('#bgDialog [data-action="reset-bg"]');
await wait(300);
check('恢复默认', await page.evaluate(() => !window.__app.theme.image && window.__app.theme.cardAlpha > 0.8));
// 重新设回照片，后面截图用
await page.evaluate(() => { document.getElementById('bgFile').value = ''; });
await (await page.$('#bgFile')).uploadFile('/tmp/wall-test.jpg');
await wait(1200);
await page.evaluate(() => document.getElementById('bgDialog').close());
await wait(300);

// 壁纸下的明细 / 设置页
await page.evaluate(() => document.querySelector('.nav [data-view="details"]').click());
await wait(350);
await page.screenshot({ path: SHOT + '/05-明细-壁纸.png' });
await page.evaluate(() => document.querySelector('.nav [data-view="settings"]').click());
await wait(350);
await page.screenshot({ path: SHOT + '/13-设置-壁纸.png' });
await page.evaluate(() => document.querySelector('.nav [data-view="calendar"]').click());
await wait(250);

// 7 刷新后壁纸还在
await page.reload({ waitUntil: 'load' });
await wait(600);
check('刷新后壁纸保留', await page.evaluate(() => !!window.__app.theme.image && document.body.classList.contains('has-bg-image')));

// 8 拼音输入：词组 / 空格上屏 / 翻页 / 长按删除
await page.evaluate(() => window.__app.openEditor('2026-11-18'));
await wait(400);
await page.click('#editorBody input[data-field="otHours"]');
await wait(500);
check('数字键盘打开', await page.evaluate(() => document.getElementById('keypad').dataset.kpMode === 'num'));
await page.screenshot({ path: SHOT + '/07-数字键盘.png' });
await page.click('#editorBody input[data-field="note"]');
await wait(600);
check('键盘打开', await page.evaluate(() => document.getElementById('keypad').classList.contains('on')));
const typeAlpha = async s => { for (const ch of s) { await page.click(`#kpAlpha [data-k="${ch}"]`); await wait(45); } };
await page.evaluate(() => { const i = document.querySelector('#editorBody input[data-field="note"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
await typeAlpha('jintian');
const cands1 = await page.evaluate(() => [...document.querySelectorAll('#kpCands .cand')].map(b => b.textContent));
check('jintian 首选「今天」', cands1[0] === '今天', cands1.slice(0, 6));
check('拼音串显示', await page.evaluate(() => document.getElementById('kpPy').textContent === 'jin tian'),
  await page.evaluate(() => document.getElementById('kpPy').textContent));
await page.screenshot({ path: SHOT + '/06-拼音-词组候选.png' });
await page.click('#kpFoot [data-k="space"]');
await wait(200);
check('空格上屏首选', await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value === '今天'),
  await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value));
await typeAlpha('jiaban');
await page.click('#kpCands .cand.first');
await wait(200);
check('词组「加班」上屏', await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value === '今天加班'),
  await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value));

// 整句
await page.evaluate(() => { const i = document.querySelector('#editorBody input[data-field="note"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
await typeAlpha('wojintianjiaban');
const sent = await page.evaluate(() => [...document.querySelectorAll('#kpCands .cand')].map(b => b.textContent));
check('整句候选「我今天加班」', sent.includes('我今天加班'), sent.slice(0, 4));
await page.click('#kpCands .cand.first');
await wait(200);
check('整句上屏', await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value === '我今天加班'));

// 翻页
await page.evaluate(() => { const i = document.querySelector('#editorBody input[data-field="note"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
await typeAlpha('shi');
const p1 = await page.evaluate(() => [...document.querySelectorAll('#kpCands .cand')].map(b => b.textContent));
const hasNext = await page.evaluate(() => !document.getElementById('kpNext').hidden);
check('候选可翻页', hasNext || p1.length <= 8, p1.slice(0, 4));
if (hasNext) {
  await page.click('#kpNext'); await wait(200);
  const p2 = await page.evaluate(() => [...document.querySelectorAll('#kpCands .cand')].map(b => b.textContent));
  check('第二页与第一页不同', p1.join() !== p2.join(), { p1: p1.slice(0, 3), p2: p2.slice(0, 3) });
  await page.screenshot({ path: SHOT + '/09-候选翻页.png' });
  await page.click('#kpPrev'); await wait(150);
}

// 长按退格
await page.evaluate(() => { const i = document.querySelector('#editorBody input[data-field="note"]'); i.value = '中文测试长按删除'; i.dispatchEvent(new Event('input', { bubbles: true })); });
const delBox = await page.evaluate(() => {
  const b = document.querySelector('#kpAlpha [data-k="del"]').getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
});
await page.mouse.move(delBox.x, delBox.y);
await page.mouse.down();
await wait(800);
await page.mouse.up();
await wait(200);
const afterHold = await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value);
check('长按退格连续删除', afterHold.length < 7, afterHold);

// 9 九键
await page.click('#kpModes [data-mode="py9"]');
await wait(300);
await page.evaluate(() => { const i = document.querySelector('#editorBody input[data-field="note"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
for (const d of '94664') { await page.click(`#kpT9 [data-k="t${d}"]`); await wait(50); }
const t9c = await page.evaluate(() => [...document.querySelectorAll('#kpCands .cand')].map(b => b.textContent));
check('九键候选里有「中」', t9c.includes('中'), t9c.slice(0, 6));
await page.screenshot({ path: SHOT + '/08-九键.png' });
await page.click('#kpCands .cand[data-cand="中"]');
await wait(200);
check('九键上屏', await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').value.includes('中')));
await page.evaluate(() => document.querySelector('#editorBody input[data-field="note"]').blur());
await page.evaluate(() => document.getElementById('editor').close());
await wait(200);

// 10 工资条 / 返回键 / 持久化
await page.evaluate(() => document.querySelector('.nav [data-view="details"]').click());
await wait(250);
await page.click('#main [data-action="payslip"]');
await wait(400);
check('工资条弹窗', await page.evaluate(() => document.getElementById('payslipDialog').hasAttribute('open')));
await page.evaluate(() => document.getElementById('payslipDialog').close());
await page.evaluate(() => document.querySelector('.nav [data-view="settings"]').click());
await wait(200);
check('返回键可用', await page.evaluate(() => window.__onBack() === true));
check('刷新后记录保留', await page.evaluate(() => !!window.__app.state.data.regular.records['2026-11-16']));

// 11 关于弹窗只有一个复制按钮
await page.click('#aboutBtn');
await wait(300);
check('关于弹窗', await page.evaluate(() => document.getElementById('aboutDialog').hasAttribute('open')));
check('只有一个复制按钮', await page.evaluate(() => document.querySelectorAll('#aboutDialog .copy-btn').length === 1));
await page.screenshot({ path: SHOT + '/12-关于弹窗.png' });
await page.evaluate(() => document.getElementById('aboutDialog').close());

console.log(JSON.stringify({ ok, errors }, null, 1));
const fails = ok.filter(o => !o.pass);
console.log(`E2E: ${ok.length - fails.length}/${ok.length} 通过`, fails.length ? JSON.stringify(fails) : '');
console.log('errors:', errors.slice(0, 8));
await browser.close();
process.exit(fails.length || errors.length ? 1 : 0);
