/* =====================================================================
   农历与节假日
   - 农历：内置 1900-2100 标准数据自己算，不依赖系统日历（不同手机的日历实现会差一天）
   - 节假日：2025-2026 按国务院公布安排，2027-2030 按标准日期
   - 四种工种各有自己的「工作日」设置
   ===================================================================== */

/* 农历 1900-2100 年闰月/大小月信息表 */
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,// 1900-1909
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,// 1910-1919
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,// 1920-1929
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,// 1930-1939
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,// 1940-1949
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,// 1950-1959
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,// 1960-1969
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,// 1970-1979
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,// 1980-1989
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,// 1990-1999
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,// 2000-2009
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,// 2010-2019
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,// 2020-2029
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,// 2030-2039
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,// 2040-2049
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,// 2050-2059
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,// 2060-2069
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,// 2070-2079
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,// 2080-2089
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,// 2090-2099
  0x0d520,// 2100-2100
];

function lunarLeapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
function lunarLeapDays(y) {
  const lm = lunarLeapMonth(y);
  return lm ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0;
}
function lunarMonthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
function lunarYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  return sum + lunarLeapDays(y);
}

/** 公历转农历 */
function solarToLunar(y, m, d) {
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
  let i, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) { temp = lunarYearDays(i); offset -= temp; }
  if (offset < 0) { offset += temp; i--; }
  const lYear = i, leap = lunarLeapMonth(lYear);
  let isLeap = false, lMonth = 1;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && isLeap === false) {
      --i; isLeap = true; temp = lunarLeapDays(lYear);
    } else {
      temp = lunarMonthDays(lYear, i);
    }
    if (isLeap === true && i === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) { isLeap = false; } else { isLeap = true; --i; }
  }
  if (offset < 0) { offset += temp; --i; }
  return { year: lYear, month: i, day: offset + 1, isLeap };
}

const LUNAR_MONTH_CN = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_CN = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

const lunarCache = new Map();
/** 农历信息 { m: '正月', d: 1, isLeap: false, year, monthNum } */
function lunarOf(d) {
  const k = ymd(d);
  if (lunarCache.has(k)) return lunarCache.get(k);
  let out = null;
  try {
    const r = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (r && r.month >= 1 && r.month <= 12) {
      out = { m: (r.isLeap ? '闰' : '') + LUNAR_MONTH_CN[r.month], d: r.day, isLeap: r.isLeap, year: r.year, monthNum: r.month };
    }
  } catch (e) { out = null; }
  lunarCache.set(k, out);
  return out;
}

const LUNAR_SUPPORT = true;

/** 农历小字：初一显示月名，其余显示日 */
function lunarText(k) {
  const l = lunarOf(parseD(k));
  if (!l) return '';
  if (l.d === 1) return l.m;
  return LUNAR_DAY_CN[l.d] || (l.d + '日');
}

/** 农历传统节日（不含法定节假日） */
function lunarFestival(k) {
  const l = lunarOf(parseD(k));
  if (!l || l.isLeap) return '';
  if (l.m === '腊月' && l.d === lunarMonthDays(l.year, 12)) return '除夕';
  const map = {
    '正月|1': '春节', '正月|15': '元宵节', '二月|2': '龙抬头',
    '五月|5': '端午节', '七月|7': '七夕', '七月|15': '中元节',
    '八月|15': '中秋节', '九月|9': '重阳节', '腊月|8': '腊八节', '腊月|23': '小年'
  };
  return map[l.m + '|' + l.d] || '';
}

/* ---------- 法定节假日 ---------- */
const HOLIDAY_FIXED = [
  /* 2025（国务院公布） */
  ['2025-01-01', '2025-01-01', '元旦'],
  ['2025-01-28', '2025-02-04', '春节'],
  ['2025-04-04', '2025-04-06', '清明节'],
  ['2025-05-01', '2025-05-05', '劳动节'],
  ['2025-05-31', '2025-06-02', '端午节'],
  ['2025-10-01', '2025-10-08', '国庆中秋'],
  /* 2026（国务院公布） */
  ['2026-01-01', '2026-01-03', '元旦'],
  ['2026-02-15', '2026-02-23', '春节'],
  ['2026-04-04', '2026-04-06', '清明节'],
  ['2026-05-01', '2026-05-05', '劳动节'],
  ['2026-06-19', '2026-06-21', '端午节'],
  ['2026-09-25', '2026-09-27', '中秋节'],
  ['2026-10-01', '2026-10-07', '国庆节'],
  /* 2027-2030（按农历标准日期推算） */
  ['2027-01-01', '2027-01-03', '元旦'],
  ['2027-02-05', '2027-02-11', '春节'],
  ['2027-04-04', '2027-04-06', '清明节'],
  ['2027-05-01', '2027-05-05', '劳动节'],
  ['2027-06-09', '2027-06-09', '端午节'],
  ['2027-09-15', '2027-09-15', '中秋节'],
  ['2027-10-01', '2027-10-07', '国庆节'],
  ['2028-01-01', '2028-01-03', '元旦'],
  ['2028-01-25', '2028-01-31', '春节'],
  ['2028-04-04', '2028-04-06', '清明节'],
  ['2028-05-01', '2028-05-05', '劳动节'],
  ['2028-05-28', '2028-05-28', '端午节'],
  ['2028-10-01', '2028-10-07', '国庆节'],
  ['2028-10-03', '2028-10-03', '中秋节'],
  ['2029-01-01', '2029-01-03', '元旦'],
  ['2029-02-12', '2029-02-18', '春节'],
  ['2029-04-04', '2029-04-06', '清明节'],
  ['2029-05-01', '2029-05-05', '劳动节'],
  ['2029-06-16', '2029-06-16', '端午节'],
  ['2029-09-22', '2029-09-22', '中秋节'],
  ['2029-10-01', '2029-10-07', '国庆节'],
  ['2030-01-01', '2030-01-03', '元旦'],
  ['2030-02-02', '2030-02-08', '春节'],
  ['2030-04-04', '2030-04-06', '清明节'],
  ['2030-05-01', '2030-05-05', '劳动节'],
  ['2030-06-05', '2030-06-05', '端午节'],
  ['2030-09-12', '2030-09-12', '中秋节'],
  ['2030-10-01', '2030-10-07', '国庆节']
];

/* 调休上班日（周末补班）——只收录已公布年份 */
const MAKEUP_WORKDAYS = new Set([
  '2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11',
  '2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'
]);

let holidayMap = null;

function buildHolidayMap() {
  const map = {};
  const addRange = (a, b, name) => {
    let cur = parseD(a);
    const end = parseD(b);
    let guard = 0;
    while (cur <= end && guard++ < 60) {
      map[ymd(cur)] = name;
      cur.setDate(cur.getDate() + 1);
    }
  };
  HOLIDAY_FIXED.forEach(r => addRange(r[0], r[1], r[2]));
  return map;
}

function ensureHolidays() {
  if (!holidayMap) holidayMap = buildHolidayMap();
  return holidayMap;
}

/** 节假日名称；'' 表示不是节假日 */
function holidayName(k) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return '';
  const m = ensureHolidays();
  return m[k] || '';
}

const HOLIDAY_MIN = '2025-01-01';
const HOLIDAY_MAX = '2030-12-31';

/* ---------- 工作日 / 日期类型（每个工种独立） ---------- */
const DEFAULT_WORKWEEK = [0, 1, 1, 1, 1, 1, 0];

function workWeekOf(kind) {
  const s = state.data[kind || state.active].settings;
  const wk = s && s.workWeek;
  return (Array.isArray(wk) && wk.length === 7) ? wk : DEFAULT_WORKWEEK;
}

/** 当前/指定工种视角是否休息日 */
function isOffDay(k, kind) {
  kind = kind || state.active;
  const s = state.data[kind].settings;
  const o = state.overrides[k];
  if (o === 'holiday') return true;
  if (o === 'workday') return false;
  if (s.followMakeup !== false && MAKEUP_WORKDAYS.has(k)) return false;
  if (s.followHoliday !== false && holidayName(k)) return true;
  const wk = workWeekOf(kind);
  return !wk[parseD(k).getDay()];
}

/** 日期类型：holiday | weekend | workday | off */
function dateType(k, kind) {
  kind = kind || state.active;
  if (state.overrides[k] === 'holiday') return 'holiday';
  if (state.overrides[k] === 'workday') return 'workday';
  if (holidayName(k)) return 'holiday';
  if (MAKEUP_WORKDAYS.has(k) && state.data.regular.settings.followMakeup !== false) return 'workday';
  if (isOffDay(k, kind)) {
    const dow = parseD(k).getDay();
    return (dow === 0 || dow === 6) ? 'weekend' : 'off';
  }
  return 'workday';
}

/** 加班倍数（正式工参数；其他工种没有倍数时按正式工的算） */
function multiplierFor(k, kind) {
  const s = state.data[kind || 'regular'].settings;
  const r = state.data.regular.settings;
  const mw = (s && s.mulWeekday !== undefined) ? s : r;
  const t = dateType(k, kind);
  return t === 'holiday' ? mw.mulHoliday : t === 'weekend' ? mw.mulWeekend : mw.mulWeekday;
}
