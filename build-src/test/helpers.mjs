import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';

const HTML_PATH = '/sdcard/0.21版本工作区/全局管理/项目管理/应用开发/工时记/工时记-单文件.html';

export const results = [];
let current = '';

export function group(name) { current = name; console.log('\n### ' + name); }
export function ok(name, cond, extra) {
  const pass = !!cond;
  results.push({ group: current, name, pass, extra });
  console.log((pass ? '  ✅ ' : '  ❌ ') + name + (pass ? '' : (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')));
  return pass;
}
export function eq(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((pass ? '  ✅ ' : '  ❌ ') + name + (pass ? '' : `  → 实际 ${JSON.stringify(actual)} / 期望 ${JSON.stringify(expected)}`));
  results.push({ group: current, name, pass, actual, expected });
  return pass;
}
export function near(name, actual, expected, eps = 0.02) {
  const pass = Math.abs(Number(actual) - Number(expected)) <= eps;
  console.log((pass ? '  ✅ ' : '  ❌ ') + name + (pass ? '' : `  → 实际 ${actual} / 期望 ${expected}`));
  results.push({ group: current, name, pass, actual, expected });
  return pass;
}

export function boot(options = {}) {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const vc = new VirtualConsole();
  const logs = [];
  const errors = [];
  ['log', 'info'].forEach(k => vc.on(k, (...a) => logs.push(a.join(' '))));
  ['error', 'warn'].forEach(k => vc.on(k, (...a) => errors.push(a.join(' '))));
  vc.on('jsdomError', e => {
    if (/scrollTo|Not implemented/.test(e.message)) return;
    errors.push('jsdomError: ' + e.message);
  });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/gongshiji/index.html',
    virtualConsole: vc,
    storageQuota: 50 * 1024 * 1024,
    beforeParse(w) {
      w.scrollTo = () => { };
      w.scrollBy = () => { };
      try {
        const proto = w.HTMLDialogElement && w.HTMLDialogElement.prototype;
        if (proto) {
          proto.showModal = function () { this.setAttribute('open', ''); };
          proto.show = function () { this.setAttribute('open', ''); };
          proto.close = function () {
            this.removeAttribute('open');
            this.dispatchEvent(new w.Event('close'));
          };
        }
      } catch (e) { }
      try {
        w.HTMLCanvasElement.prototype.getContext = function () {
          const self = this;
          return new Proxy({}, {
            get(t, k) {
              if (k === 'canvas') return self;
              if (k === 'measureText') return () => ({ width: 40 });
              if (k === 'createLinearGradient') return () => ({ addColorStop() { } });
              return typeof k === 'string' ? () => { } : undefined;
            },
            set() { return true; }
          });
        };
        w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,TESTPNG';
      } catch (e) { }
      try { w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => { }; } catch (e) { }
      if (options.preload) {
        try { options.preload(w); } catch (e) { }
      }
    }
  });
  const w = dom.window;
  const doc = w.document;
  const api = w.__app;
  return { dom, w, doc, api, logs, errors, html };
}

export const $ = (doc, sel) => doc.querySelector(sel);
export const $$ = (doc, sel) => Array.from(doc.querySelectorAll(sel));

/** 用页面键盘在 input 上输入 */
export function typeNums(w, doc, input, text) {
  input.focus();
  const keys = String(text).split('');
  for (const ch of keys) {
    const btn = doc.querySelector(`#kpGrid [data-key="${ch}"]`);
    if (!btn) throw new Error('没有键 ' + ch);
    btn.click();
  }
  return input.value;
}

export function click(doc, sel) {
  const el = typeof sel === 'string' ? doc.querySelector(sel) : sel;
  if (!el) throw new Error('找不到元素 ' + sel);
  el.click();
  return el;
}

/** 打开某天编辑器：直接调 api */
export function editDay(w, doc, key) {
  w.__app.openEditor(key);
  return doc.getElementById('editor');
}

export function setField(doc, field, text) {
  const el = doc.querySelector(`#editorBody input[data-field="${field}"]`);
  if (!el) throw new Error('没有字段 ' + field);
  el.value = String(text);
  el.dispatchEvent(new (el.ownerDocument.defaultView.Event)('input', { bubbles: true }));
  return el;
}

export function saveBtn(doc) {
  return doc.querySelector('#editor [data-action="save-entry"]');
}

export function monthText(doc) {
  return doc.querySelector('.summary .s-money')?.textContent.trim();
}

export function navTo(w, doc, v) {
  doc.querySelector(`.nav [data-view="${v}"]`).click();
}

export function switchWorker(doc, kind) {
  doc.querySelector(`#workerSwitch [data-w="${kind}"]`).click();
}

export function summary(doc) {
  return results.filter(r => !r.pass);
}

export function report() {
  const total = results.length;
  const pass = results.filter(r => r.pass).length;
  console.log(`\n================= 结果：${pass}/${total} 通过 =================`);
  if (pass !== total) {
    console.log('失败项：');
    results.filter(r => !r.pass).forEach(r => console.log(' - [' + r.group + '] ' + r.name + ' ' + JSON.stringify(r.actual ?? r.extra)));
  }
  return { total, pass, fail: total - pass };
}
