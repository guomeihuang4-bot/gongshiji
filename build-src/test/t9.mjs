import { boot, group, ok, eq, report } from './helpers.mjs';
import fs from 'fs';
const BACKUP = fs.readFileSync('/sdcard/Download/工时记备份-2026-11-20.json', 'utf8');
let kv = { gongshiji_data: BACKUP };
const saved = {};
const { w, doc, api, errors } = boot({
  preload(w2) {
    w2.AndroidBridge = {
      kvGet: k => kv[k] || null,
      kvSet: (k, v) => { saved[k] = v; kv[k] = v; },
      saveFile: () => { }
    };
  }
});
const S = () => api.state;

group('旧 APK（SharedPreferences）数据迁移');
eq('迁移后记录数', Object.keys(S().data.regular.records).length, 20);
eq('底薪', S().data.regular.settings.baseSalary, 2450);
eq('自动天数关闭', S().data.regular.settings.autoDays, false);
ok('已写入新版存储 key', !!saved['gongshi_v3'] && saved['gongshi_v3'].length > 100);
ok('迁移后金额正确', Math.abs(api.cycleStats(2026,10,'regular').net - 3828.13) < 0.02, api.cycleStats(2026,10,'regular').net);
// 再启动一次不应该重复迁移出问题
const b2 = boot({ preload(w3) { w3.AndroidBridge = { kvGet: k => kv[k] || null, kvSet: () => { } }; } });
eq('二次启动读 v3', Object.keys(b2.api.state.data.regular.records).length, 20);
eq('二次启动底薪', b2.api.state.data.regular.settings.baseSalary, 2450);
b2.dom.window.close();
const r = report();
console.log('errors:', errors.slice(0,4));
process.exit(r.fail?1:0);
