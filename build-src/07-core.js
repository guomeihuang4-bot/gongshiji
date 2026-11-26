'use strict';
/* =====================================================================
   工时记 v1.0 · 完全离线 · 主程序（键盘模块见同目录 keypad.js）
   （源码分区：核心 / 节假日 / 算法 / 渲染 / 编辑器 / 键盘 / 设置 / 事件）
   ===================================================================== */

/* ==================== 基础工具 ==================== */
const $ = id => document.getElementById(id);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseD = k => new Date(k + 'T12:00:00');
const todayKey = () => ymd(new Date());
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clamp = (n, a, b) => n < a ? a : n > b ? b : n;
const sum = arr => arr.reduce((a, b) => a + b, 0);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, def, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return clamp(n, min === undefined ? -Infinity : min, max === undefined ? Infinity : max);
};
const money = n => {
  const v = round2(Number(n) || 0);
  const neg = v < 0;
  const s = '¥' + Math.abs(v).toLocaleString('zh-CN', { minimumFractionDigits: Math.abs(v) % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return (neg ? '-' : '') + s;
};
const moneyPlain = n => {
  const v = round2(Number(n) || 0);
  return Math.abs(v).toLocaleString('zh-CN', { minimumFractionDigits: Math.abs(v) % 1 ? 2 : 0, maximumFractionDigits: 2 });
};
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_KEY = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);

/* ==================== 常量 ==================== */
const APP_VERSION = '1.0';
const STORE_V3 = 'gongshi_v3';
const STORE_V2 = 'gongshi_v2';
const STORE_THEME = 'gongshi_bg';

const WORKER_ORDER = ['regular', 'temp', 'piece', 'site'];
const WORKER_META = {
  regular: { name: '正式工', short: '正式工', accent: 'blue' },
  temp: { name: '临时工', short: '临时工', accent: 'orange' },
  piece: { name: '计件', short: '计件', accent: 'purple' },
  site: { name: '工地', short: '工地', accent: 'green' }
};
const WORK_SHIFTS = ['白班', '早班', '中班', '晚班', '夜班'];
const LEAVE_SHIFTS = ['休息', '事假', '病假'];
const ALL_SHIFTS = WORK_SHIFTS.concat(LEAVE_SHIFTS);
const SHIFT_CLASS = {
  白班: 'sh-white', 早班: 'sh-morning', 中班: 'sh-noon', 晚班: 'sh-evening', 夜班: 'sh-night',
  休息: 'sh-rest', 事假: 'sh-leave', 病假: 'sh-sick'
};
const TYPE_LABEL = { holiday: '法定节假日', weekend: '周末', workday: '工作日', off: '休息日', work: '上班日' };

/* 背景预设：id / 名称 / CSS 背景 */
const BG_PRESETS = [
  { id: 'default', name: '经典白', css: 'linear-gradient(180deg,#f7f9fc 0%,#eef3fa 100%)' },
  { id: 'sky', name: '晴空蓝', css: 'linear-gradient(180deg,#eaf3ff 0%,#f6faff 58%,#eef4ff 100%)' },
  { id: 'mint', name: '薄荷绿', css: 'linear-gradient(160deg,#e9f8f0 0%,#f5fbf8 55%,#e8f4ee 100%)' },
  { id: 'peach', name: '暖桃橙', css: 'linear-gradient(160deg,#fff1e8 0%,#fff8f3 55%,#ffeadf 100%)' },
  { id: 'lilac', name: '淡紫', css: 'linear-gradient(160deg,#f2edff 0%,#faf8ff 55%,#eee8ff 100%)' },
  { id: 'night', name: '深蓝夜', css: 'linear-gradient(160deg,#243b63 0%,#1a2a48 60%,#16233c 100%)' },
  { id: 'paper', name: '牛皮纸', css: 'linear-gradient(160deg,#f6f0e4 0%,#fbf7ef 60%,#f1e9d8 100%)' },
  { id: 'grad', name: '青蓝渐变', css: 'linear-gradient(150deg,#e6f2ff 0%,#f2fbff 40%,#e8f7f4 100%)' }
];

/* 工种默认记录/设置 */
function blankMonth() { return { deductions: [], allowances: [] }; }

const DEFAULT_WORKWEEK_ARR = [0, 1, 1, 1, 1, 1, 0]; // 日..六，1=上班

function defaultWorkerSettings(kind) {
  const common = {
    workWeek: DEFAULT_WORKWEEK_ARR.slice(), // 每个工种自己的工作周
    followHoliday: true,                    // 法定节假日按休处理
    followMakeup: true                      // 调休补班日按上班处理
  };
  if (kind === 'regular') {
    return Object.assign(common, {
      baseSalary: 0,               // 月薪
      daysPerMonth: 21.75,         // 每月计薪天数
      autoDays: true,              // 按当月工作日自动算计薪天数
      hoursPerDay: 8,              // 每天标准工时
      hourlyRate: null,            // 自定义小时工资（null=自动）
      mulWeekday: 1.5,
      mulWeekend: 2,
      mulHoliday: 3
    });
  }
  if (kind === 'temp') {
    return Object.assign(common, { rate: 0, rateOut: 0, defaultHours: 8, defaultShift: '白班' });
  }
  if (kind === 'piece') {
    return Object.assign(common, { items: [{ name: '', rate: 0 }], unit: '件' });
  }
  return Object.assign(common, {
    dayRate: 0, hourRate: 0, otRate: 0, packageRate: 0,
    dayRateOut: 0, hourRateOut: 0, otRateOut: 0,
    hoursPerDay: 8
  });
}

function defaultMonthlySeed(kind) {
  const leave = { leaveHours: 0, leaveOrder: 'low' };
  if (kind === 'regular') {
    return Object.assign(leave, {
      deductions: [{ name: '社保', amount: 0 }, { name: '公积金', amount: 0 }, { name: '个人所得税', amount: 0 }],
      allowances: []
    });
  }
  if (kind === 'temp') {
    return Object.assign(leave, { deductions: [{ name: '保险', amount: 0 }], allowances: [] });
  }
  return Object.assign(leave, { deductions: [], allowances: [] });
}

function defaultState() {
  const data = {};
  WORKER_ORDER.forEach(k => {
    data[k] = { settings: defaultWorkerSettings(k), records: {}, monthly: {} };
  });
  return {
    v: 3,
    active: 'regular',
    cycleStartDay: 1,
    data,
    overrides: {},
    timer: null,
    settleNow: false,
    createdAt: Date.now()
  };
}

function defaultTheme() {
  return {
    preset: 'default',   // 内置配色
    image: '',           // 照片（dataURL）
    dim: 0.18,           // 壁纸压暗（0~0.75）
    cardAlpha: 0.86,     // 卡片/面板不透明度（0.1~1）
    blurPx: 0,           // 壁纸模糊（0~20px）
    glass: false,        // 卡片毛玻璃
    fit: 'cover'         // 铺满 / 完整
  };
}

let state = defaultState();
let theme = defaultTheme();
let view = 'calendar';
let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let storageOK = true;
let corruptRaw = null;
let booted = false;

/* ==================== 存储 ==================== */
function storageWarn() {
  const el = $('storageWarning');
  if (!el) return;
  if (storageOK) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = corruptRaw
    ? '本地数据读取异常，已暂停写入以保护原数据。请先用「导出备份」保留原文。'
    : '存储空间不可用，记录可能无法保存。请检查是否是隐私模式或空间已满。';
}

function rawGet(key) {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.kvGet === 'function') {
      const v = window.AndroidBridge.kvGet(key);
      if (v) return v;
    }
  } catch (e) { }
  try { return localStorage.getItem(key); } catch (e) { }
  return null;
}

function rawSet(key, val) {
  let ok = false;
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.kvSet === 'function') {
      window.AndroidBridge.kvSet(key, val);
      ok = true;
    }
  } catch (e) { }
  try { localStorage.setItem(key, val); ok = true; } catch (e) { }
  return ok;
}

let persistTimer = 0;
function persist(now) {
  if (corruptRaw) { storageOK = false; storageWarn(); return false; }
  if (!now) {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persist(true), 160);
    return true;
  }
  let json;
  try { json = JSON.stringify(state); } catch (e) { storageOK = false; storageWarn(); return false; }
  storageOK = rawSet(STORE_V3, json);
  try { rawSet(STORE_THEME, JSON.stringify(theme)); } catch (e) { }
  storageWarn();
  return storageOK;
}

/* 读入并清理 */
function cleanRecord(kind, v) {
  if (!v || typeof v !== 'object') return null;
  const note = String(v.note == null ? '' : v.note).slice(0, 200);
  if (kind === 'regular') {
    const shift = ALL_SHIFTS.includes(v.shift) ? v.shift : '白班';
    let otSplit = null;
    if (Array.isArray(v.otSplit)) {
      const arr = v.otSplit.slice(0, 3).map(x => num(x, 0, 0, 24));
      while (arr.length < 3) arr.push(0);
      if (arr.some(x => x > 0)) otSplit = arr;
    }
    let otHours = num(v.otHours, 0, 0, 24);
    // 有拆分时以拆分为准，避免总小时与分档对不上
    if (otSplit) otHours = round2(otSplit[0] + otSplit[1] + otSplit[2]);
    return {
      shift,
      otHours,
      otSplit,
      regularHours: (v.regularHours === null || v.regularHours === undefined) ? null : num(v.regularHours, 8, 0, 24),
      note
    };
  }
  if (kind === 'temp') {
    const shift = ALL_SHIFTS.includes(v.shift) ? v.shift : '白班';
    return {
      shift,
      hours: num(v.hours, 0, 0, 24),
      rate: num(v.rate, 0, 0, 1e6),
      note
    };
  }
  if (kind === 'piece') {
    const items = Array.isArray(v.items) ? v.items.slice(0, 20).map(it => ({
      name: String((it && it.name) || '').slice(0, 20),
      qty: num(it && it.qty, 0, 0, 1e6),
      rate: num(it && it.rate, 0, 0, 1e6)
    })).filter(it => it.qty > 0 || it.rate > 0 || it.name) : [];
    return { items, note };
  }
  // site
  const type = ['work', 'borrow', 'settle'].includes(v.type) ? v.type : 'work';
  const unit = ['day', 'hour', 'rest'].includes(v.unit) ? v.unit : 'day';
  return {
    type,
    unit,
    units: num(v.units, type === 'work' ? (unit === 'day' ? 1 : 0) : 0, 0, 30),
    hours: num(v.hours, 0, 0, 24),
    otHours: num(v.otHours, 0, 0, 24),
    dayRate: num(v.dayRate, 0, 0, 1e6),
    hourRate: num(v.hourRate, 0, 0, 1e6),
    otRate: num(v.otRate, 0, 0, 1e6),
    pkgQty: num(v.pkgQty, 0, 0, 1e6),
    pkgRate: num(v.pkgRate, 0, 0, 1e6),
    amount: num(v.amount, 0, 0, 1e7),
    note
  };
}

function cleanItems(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(i => i && typeof i === 'object')
    .slice(0, 30)
    .map(i => ({ name: String(i.name == null ? '' : i.name).slice(0, 30), amount: num(i.amount, 0, 0, 1e7) }))
    .filter(i => i.name || i.amount);
}

function cleanSettings(kind, s) {
  const d = defaultWorkerSettings(kind);
  if (!s || typeof s !== 'object') return d;
  const wk = Array.isArray(s.workWeek) && s.workWeek.length === 7 ? s.workWeek.map(x => x ? 1 : 0) : d.workWeek.slice();
  const common = { workWeek: wk, followHoliday: s.followHoliday !== false, followMakeup: s.followMakeup !== false };
  if (kind === 'regular') {
    return Object.assign(common, {
      baseSalary: num(s.baseSalary, 0, 0, 1e8),
      daysPerMonth: num(s.daysPerMonth, 21.75, 1, 31),
      autoDays: s.autoDays !== false,
      hoursPerDay: num(s.hoursPerDay, 8, 0.5, 24),
      hourlyRate: (s.hourlyRate && Number(s.hourlyRate) > 0) ? num(s.hourlyRate, 0, 0, 1e8) : null,
      mulWeekday: num(s.mulWeekday, 1.5, 0, 10),
      mulWeekend: num(s.mulWeekend, 2, 0, 10),
      mulHoliday: num(s.mulHoliday, 3, 0, 10)
    });
  }
  if (kind === 'temp') {
    return Object.assign(common, {
      rate: num(s.rate, 0, 0, 1e6),
      rateOut: num(s.rateOut, 0, 0, 1e6),
      defaultHours: num(s.defaultHours, 8, 0, 24),
      defaultShift: WORK_SHIFTS.includes(s.defaultShift) ? s.defaultShift : '白班'
    });
  }
  if (kind === 'piece') {
    let items = Array.isArray(s.items) ? s.items.slice(0, 30).map(it => ({
      name: String((it && it.name) || '').slice(0, 20),
      rate: num(it && it.rate, 0, 0, 1e6)
    })) : [];
    if (!items.length) items = d.items;
    return Object.assign(common, { items, unit: String(s.unit || '件').slice(0, 6) || '件' });
  }
  return Object.assign(common, {
    dayRate: num(s.dayRate, 0, 0, 1e6),
    hourRate: num(s.hourRate, 0, 0, 1e6),
    otRate: num(s.otRate, 0, 0, 1e6),
    packageRate: num(s.packageRate, 0, 0, 1e6),
    dayRateOut: num(s.dayRateOut, 0, 0, 1e6),
    hourRateOut: num(s.hourRateOut, 0, 0, 1e6),
    otRateOut: num(s.otRateOut, 0, 0, 1e6),
    hoursPerDay: num(s.hoursPerDay, 8, 0.5, 24)
  });
}

function cleanData(raw) {
  const out = defaultState();
  const src = (raw && raw.data && typeof raw.data === 'object') ? raw.data : {};
  WORKER_ORDER.forEach(kind => {
    const w = src[kind] || {};
    out.data[kind].settings = cleanSettings(kind, w.settings);
    if (w.records && typeof w.records === 'object') {
      for (const [k, v] of Object.entries(w.records)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
        const rec = cleanRecord(kind, v);
        if (rec) out.data[kind].records[k] = rec;
      }
    }
    if (w.monthly && typeof w.monthly === 'object') {
      for (const [k, v] of Object.entries(w.monthly)) {
        if (!/^\d{4}-\d{2}$/.test(k) || !v || typeof v !== 'object') continue;
        out.data[kind].monthly[k] = {
          deductions: cleanItems(v.deductions),
          allowances: cleanItems(v.allowances),
          leaveHours: num(v.leaveHours, 0, 0, 744),
          leaveOrder: v.leaveOrder === 'high' ? 'high' : 'low'
        };
      }
    }
  });
  if (raw) {
    out.active = WORKER_ORDER.includes(raw.active) ? raw.active : 'regular';
    out.cycleStartDay = Math.round(num(raw.cycleStartDay, 1, 1, 28));
    out.settleNow = !!raw.settleNow;
    if (raw.overrides && typeof raw.overrides === 'object') {
      for (const [k, v] of Object.entries(raw.overrides)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && (v === 'holiday' || v === 'workday')) out.overrides[k] = v;
      }
    }
    if (raw.timer && typeof raw.timer === 'object' && raw.timer.start) {
      out.timer = { start: num(raw.timer.start, Date.now()), paused: !!raw.timer.paused, acc: num(raw.timer.acc, 0, 0, 86400000) };
    }
  }
  return out;
}

/* 旧版（v2：单表 records + mode）迁移 */
function migrateFromV2(old) {
  const out = defaultState();
  const isTemp = old.mode === 'temp';
  out.active = isTemp ? 'temp' : 'regular';
  const r = old.regular || {};
  out.cycleStartDay = Math.round(num(r.cycleStartDay, 1, 1, 28));
  const reg = out.data.regular;
  reg.settings = cleanSettings('regular', {
    baseSalary: r.baseSalary, daysPerMonth: r.daysPerMonth, hoursPerDay: r.hoursPerDay,
    hourlyRate: r.hourlyRate, mulWeekday: r.mulWeekday, mulWeekend: r.mulWeekend, mulHoliday: r.mulHoliday,
    autoDays: false
  });
  out.data.temp.settings = cleanSettings('temp', { rate: (old.temp || {}).rate });
  if (old.records && typeof old.records === 'object') {
    for (const [k, v] of Object.entries(old.records)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v) continue;
      const kind = v.worker === 'temp' ? 'temp' : 'regular';
      const rec = cleanRecord(kind, v);
      if (rec) out.data[kind].records[k] = rec;
    }
  }
  if (old.monthly && typeof old.monthly === 'object') {
    for (const [k, v] of Object.entries(old.monthly)) {
      if (!/^\d{4}-\d{2}$/.test(k) || !v) continue;
      const clean = {
        deductions: cleanItems(v.deductions),
        allowances: cleanItems(v.allowances),
        leaveHours: num(v.leaveHours, 0, 0, 744),
        leaveOrder: v.leaveOrder === 'high' ? 'high' : 'low'
      };
      out.data.regular.monthly[k] = JSON.parse(JSON.stringify(clean));
      out.data.temp.monthly[k] = JSON.parse(JSON.stringify(clean));
    }
  }
  if (old.overrides) {
    for (const [k, v] of Object.entries(old.overrides)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && (v === 'holiday' || v === 'workday')) out.overrides[k] = v;
    }
  }
  return out;
}

function load() {
  let raw = null;
  let migrated = false;
  try {
    raw = rawGet(STORE_V3);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = cleanData(parsed);
    } else {
      // 旧版数据可能在 localStorage 的 gongshi_v2，也可能在旧 APK 的 SharedPreferences (gongshiji_data)
      let oldRaw = rawGet(STORE_V2);
      if (!oldRaw) oldRaw = rawGet('gongshiji_data');
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        if (old && typeof old === 'object') {
          state = migrateFromV2(old);
          migrated = true;
        }
      }
    }
  } catch (e) {
    storageOK = false;
    corruptRaw = raw || '';
  }
  try {
    const t = JSON.parse(rawGet(STORE_THEME) || 'null');
    if (t && typeof t === 'object') {
      theme = {
        preset: BG_PRESETS.some(p => p.id === t.preset) ? t.preset : 'default',
        image: typeof t.image === 'string' ? t.image.slice(0, 3.2e6) : '',
        dim: num(t.dim, 0.18, 0, 0.75),
        cardAlpha: num(t.cardAlpha, 0.86, 0.1, 1),
        blurPx: num(t.blurPx, typeof t.blur === 'boolean' && t.blur ? 10 : 0, 0, 20),
        glass: !!(t.glass || t.blur === true),
        fit: t.fit === 'contain' ? 'contain' : 'cover'
      };
    }
  } catch (e) { }
  storageWarn();
  if (migrated && !corruptRaw) persist(true);
  return state;
}

/* 当前工种快捷访问 */
const cur = () => state.data[state.active];
const curKind = () => state.active;
const curSettings = () => cur().settings;
const curRecords = () => cur().records;
