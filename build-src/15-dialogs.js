/* =====================================================================
   弹窗：关于 / 背景 / 工资条 / 周期 / 计时 / 确认 / 提示
   ===================================================================== */

/** 打开底部弹窗：打开后去掉自动聚焦产生的焦点框 */
function openSheet(el) {
  try { el.showModal(); } catch (e) { el.setAttribute('open', ''); }
  setTimeout(() => {
    try {
      const a = document.activeElement;
      if (a && a.closest && a.closest('dialog')) a.blur();
    } catch (e) { }
  }, 40);
}

/* ==================== 通用提示 ==================== */
let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

let confirmCb = null;
function confirmDialog(title, text, cb) {
  const el = $('confirmDialog');
  if (!el) return;
  $('confirmTitle').textContent = title;
  $('confirmText').textContent = text;
  confirmCb = cb;
  openSheet(el);
}

/* ==================== 关于 ==================== */
function sourceJS() {
  return $$('script').map(s => s.textContent).join('\n');
}

function sourceHTML() {
  const clone = document.documentElement.cloneNode(true);
  clone.removeAttribute('style');
  const bodyEl = clone.querySelector('body');
  if (bodyEl) {
    bodyEl.removeAttribute('style');
    bodyEl.className = String(bodyEl.className || '').replace(/\b(has-bg-image|bg-custom|bg-blur|bg-glass|kp-open)\b/g, '').replace(/\s+/g, ' ').trim();
  }
  // 去掉壁纸图层的运行时样式，避免把用户的照片塞进源码
  ['wallpaper', 'wallImg', 'wallScrim', 'kpBubble'].forEach(id => {
    const n = clone.querySelector('#' + id);
    if (n) { n.removeAttribute('style'); n.classList.remove('on'); n.textContent = id === 'kpBubble' ? '' : n.textContent; }
  });
  const main = clone.querySelector('#main');
  if (main) main.innerHTML = '';
  clone.querySelectorAll('dialog').forEach(d => { d.innerHTML = ''; d.removeAttribute('open'); });
  const kp = clone.querySelector('#keypad');
  if (kp) { kp.classList.remove('on'); kp.setAttribute('aria-hidden', 'true'); }
  const tst = clone.querySelector('#toast');
  if (tst) { tst.className = 'toast'; tst.textContent = ''; }
  const pa = clone.querySelector('#printArea');
  if (pa) pa.innerHTML = '';
  const bg = clone.querySelector('#bgBtn');
  if (bg) bg.removeAttribute('style');
  return '<!doctype html>\n' + clone.outerHTML;
}

function copyText(text, btn) {
  const done = ok => {
    if (!btn) return;
    const old = btn.dataset.old || btn.textContent;
    btn.dataset.old = old;
    btn.textContent = ok ? '已复制' : '复制失败';
    btn.classList.toggle('done', ok);
    setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1800);
  };
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      done(ok);
    } catch (e) { done(false); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done(true)).catch(fallback);
  } else fallback();
}

function openAbout() {
  const html = sourceHTML();
  const el = $('aboutDialog');
  el.innerHTML = `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div><h2>关于工时记</h2><p>版本 ${APP_VERSION} · 完全离线</p></div>
      <button class="close-x" type="button" data-action="close-sheet" data-sheet="aboutDialog" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body">
      <div class="about-hero">
        <div class="logo">工</div>
        <h2>工时记</h2>
        <p>无账号 · 无联网 · 内置隐私键盘</p>
      </div>
      <div class="about-text">无账号、无联网、内置隐私键盘（虽然没什么用，很多手机系统都是能后台看你的屏幕的）的纯本地记薪水软件，因无联网的缘故，暂且假期显示只做了 2025 年到 2030 年，可能会因为国家修改节假日产生变化从而产生错误。

作者：deep seek

联系方式：deepseekharmness，遇到问题请自行维护或者卸载

数据全部保存在这台手机里，不会上传到任何地方。换手机或清理数据前，请先在「设置 → 数据与备份」里导出备份。</div>

      <div class="about-block">
        <div class="bh"><b>源码（HTML代码）</b>
          <button class="copy-btn" type="button" data-action="copy-html">一键复制</button>
        </div>
        <pre>${esc(html.slice(0, 420))}…</pre>
      </div>

      <p class="help">点「一键复制」会把包含样式、脚本和全部代码的完整 HTML 复制下来，可以直接发给别人，或者存成 .html 用浏览器打开。</p>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" type="button" data-action="close-sheet" data-sheet="aboutDialog">知道了</button>
    </div>
  </div>`;
  el.dataset.html = html;
  openSheet(el);
}

/** 第一次打开时自动弹一次 */
function maybeAutoAbout() {
  try {
    if (localStorage.getItem('gongshi_about_seen')) return;
    localStorage.setItem('gongshi_about_seen', '1');
  } catch (e) { }
  setTimeout(() => {
    try { if (!document.querySelector('dialog[open]')) openAbout(); } catch (e) { }
  }, 700);
}

/* ==================== 壁纸 / 背景 ==================== */

function bgPresetCss() {
  const p = BG_PRESETS.find(x => x.id === theme.preset) || BG_PRESETS[0];
  return p.css;
}

/** 把主题应用到页面：壁纸用独立固定图层，不依赖 body 背景 */
function applyBackground() {
  const body = document.body;
  if (!body) return;
  const custom = !!theme.image;
  const alpha = theme.cardAlpha == null ? 0.86 : theme.cardAlpha;
  const root = document.documentElement;
  try {
    root.style.setProperty('--card-alpha', String(alpha));
    root.style.setProperty('--surf-a', String(alpha));
    root.style.setProperty('--surf-a2', String(Math.min(1, alpha + 0.16)));
    // 明细/设置页文字多，底子更实一点（不低于 90%），保证看得清
    root.style.setProperty('--surf-b', String(Math.min(1, Math.max(0.9, alpha + 0.35))));
  } catch (e) { }
  body.classList.toggle('has-bg-image', custom);
  body.classList.toggle('bg-custom', custom || theme.preset !== 'default');
  body.classList.toggle('bg-glass', !!theme.glass);

  const wall = $('wallpaper'), img = $('wallImg'), scrim = $('wallScrim');
  if (wall) wall.style.background = custom ? 'transparent' : bgPresetCss();
  if (img) {
    img.style.backgroundImage = custom ? `url("${theme.image}")` : 'none';
    img.style.backgroundSize = theme.fit === 'contain' ? 'contain' : 'cover';
    const blur = Number(theme.blurPx) || 0;
    img.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
  }
  if (scrim) scrim.style.opacity = custom ? String(theme.dim) : '0';
  // body 不再画背景图，避免安卓 WebView 上 background-attachment 失效
  body.style.backgroundImage = '';
  body.style.backgroundSize = '';
  body.style.backgroundPosition = '';
}

function bgSlidersHTML() {
  return `
      <div class="bg-slider">
        <span>壁纸模糊</span>
        <input type="range" min="0" max="20" step="1" value="${theme.blurPx}" data-action="bg-blur" aria-label="壁纸模糊">
        <span>${Math.round(theme.blurPx)}px</span>
      </div>
      <div class="bg-slider">
        <span>压暗</span>
        <input type="range" min="0" max="0.75" step="0.01" value="${theme.dim}" data-action="bg-dim" aria-label="壁纸压暗">
        <span>${Math.round(theme.dim * 100)}%</span>
      </div>
      <div class="bg-slider">
        <span>卡片</span>
        <input type="range" min="0.1" max="1" step="0.02" value="${theme.cardAlpha}" data-action="bg-alpha" aria-label="卡片不透明度">
        <span>${Math.round(theme.cardAlpha * 100)}%</span>
      </div>`;
}

function openBg() {
  const el = $('bgDialog');
  if (!el) return;
  const custom = !!theme.image;
  const wallStyle = custom
    ? `background-image:url('${theme.image}');background-size:${theme.fit === 'contain' ? 'contain' : 'cover'};background-position:center;background-repeat:no-repeat;filter:blur(${Math.round(theme.blurPx)}px)`
    : `background:${bgPresetCss()}`;
  el.innerHTML = `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div><h2>壁纸</h2><p>选照片或配色，三个滑块边拉边看</p></div>
      <button class="close-x" type="button" data-action="close-sheet" data-sheet="bgDialog" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body">
      <div class="bg-preview-tall">
        <div class="bp-wall" style="${wallStyle}"></div>
        <div class="bp-scrim" style="opacity:${custom ? theme.dim : 0}"></div>
        <span class="bp-tag">效果预览</span>
        <div class="bp-card" style="background:rgba(255,255,255,${theme.cardAlpha})">
          <b>工时记 · 今天 ¥232.33</b><span>卡片 ${Math.round(theme.cardAlpha * 100)}% · 压暗 ${Math.round(theme.dim * 100)}% · 模糊 ${Math.round(theme.blurPx)}px</span>
        </div>
      </div>

      <div class="bg-actions">
        <button class="btn btn-primary" type="button" data-action="pick-bg-image">${custom ? '换一张照片' : '从相册选照片'}</button>
        ${custom ? '<button class="btn btn-ghost" type="button" data-action="remove-bg-image">移除照片</button>' : ''}
      </div>

      <div class="bg-slider-row">
        ${bgSlidersHTML()}
      </div>

      <div class="bg-seg">
        <button type="button" class="${theme.fit !== 'contain' ? 'on' : ''}" data-action="bg-fit" data-v="cover">铺满屏幕</button>
        <button type="button" class="${theme.fit === 'contain' ? 'on' : ''}" data-action="bg-fit" data-v="contain">完整显示</button>
      </div>

      <div class="switch-row" style="margin-top:10px">
        <div class="sw-txt"><b>卡片毛玻璃</b><small>像磨砂玻璃，字更清楚，壁纸会糊一点</small></div>
        <button class="switch ${theme.glass ? 'on' : ''}" type="button" data-action="toggle-bg-glass" role="switch" aria-checked="${theme.glass}"></button>
      </div>

      <div class="field-title" style="margin-top:14px">内置配色（不想用照片就选这个）</div>
      <div class="bg-strip">
        ${BG_PRESETS.map(p => `<button class="bg-opt ${!custom && theme.preset === p.id ? 'on' : ''}" type="button" data-action="set-bg-preset" data-id="${p.id}" aria-label="${p.name}">
          <span class="sw" style="background:${p.css}"></span><span class="nm">${p.name}</span><span class="ck">✓</span>
        </button>`).join('')}
      </div>

      <p class="help">「压暗」越高壁纸越暗、字越清楚；「卡片」越低卡片越透；「壁纸模糊」只糊照片，不糊文字。照片只存在这台手机上，不会上传。</p>
      <button class="btn btn-ghost btn-block" style="margin-top:6px;height:38px" type="button" data-action="reset-bg">恢复默认（浅色 + 无照片）</button>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" type="button" data-action="close-sheet" data-sheet="bgDialog">完成</button>
    </div>
  </div>`;
  openSheet(el);
}

function setBgPreset(id) {
  theme.preset = id;
  theme.image = '';
  persist(true);
  applyBackground();
  openBg();
}

function resetBg() {
  theme = defaultTheme();
  persist(true);
  applyBackground();
  openBg();
}

/** 选中照片后给一组「一眼能看到壁纸」的默认值 */
function applyPhotoDefaults() {
  theme.dim = 0.06;
  theme.cardAlpha = 0.55;
  theme.blurPx = 0;
  theme.glass = false;
  theme.fit = 'cover';
}

function handleBgFile(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '')) {
    toast('请选择图片文件');
    return;
  }
  toast('正在处理图片…');
  const reader = new FileReader();
  reader.onerror = () => toast('图片读取失败，换一张试试');
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => toast('这张图片打不开，换一张试试');
    img.onload = () => {
      try {
        const maxW = 1080;
        const scale = Math.min(1, maxW / Math.max(1, img.width));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        theme.image = cv.toDataURL('image/jpeg', 0.72);
        theme.preset = 'default';
        applyPhotoDefaults();
        const okSaved = persist(true);
        applyBackground();
        openBg();
        toast(okSaved ? '壁纸已换好，可以拉滑块微调' : '壁纸已换好，但保存失败（图片太大）');
      } catch (e) {
        toast('图片处理失败：' + (e && e.message ? e.message : e));
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/** 弹窗里改滑块时，同步刷新预览 */
function refreshBgPreview() {
  const dlg = $('bgDialog');
  if (!dlg) return;
  const wall = dlg.querySelector('.bp-wall');
  if (wall) wall.style.filter = theme.blurPx > 0 ? `blur(${Math.round(theme.blurPx)}px)` : 'none';
  const scrim = dlg.querySelector('.bp-scrim');
  if (scrim) scrim.style.opacity = theme.image ? String(theme.dim) : '0';
  const card = dlg.querySelector('.bp-card');
  if (card) {
    card.style.background = `rgba(255,255,255,${theme.cardAlpha})`;
    const sub = card.querySelector('span');
    if (sub) sub.textContent = '卡片透明度 ' + Math.round(theme.cardAlpha * 100) + '%';
  }
}

/* ==================== 工资条 ==================== */
function payslipMeta() {
  const kind = state.active;
  const y = month.getFullYear(), m = month.getMonth();
  const cyc = cycleRange(y, m);
  const st = cycleStats(y, m, kind);
  return { kind, y, m, cyc, st };
}

function payslipRows(kind, st) {
  if (kind === 'regular') {
    return [
      ['底薪', money(st.base)],
      ['加班费（' + st.otHours + ' 小时）', money(st.otPay)],
      ['补贴', money(st.alwTotal)],
      ['社保公积金等扣款', '-' + money(st.dedTotal)],
      ['缺勤 / 事假扣款', '-' + money(st.baseDeduct)]
    ];
  }
  if (kind === 'temp') {
    return [
      ['工时工资（' + st.hours + ' 小时）', money(st.pay)],
      ['保险 / 扣款', '-' + money(st.dedTotal)],
      ['补贴', money(st.alwTotal)]
    ];
  }
  if (kind === 'piece') {
    const items = Object.entries(st.byItem || {}).map(([nm, v]) => [nm + '（' + v.qty + '）', money(v.pay)]);
    return items.concat([['扣款', '-' + money(st.dedTotal)], ['补贴', money(st.alwTotal)]]);
  }
  return [
    ['点工（' + st.units + ' 个工）', money(st.dayPay)],
    ['小时工（' + st.hours + ' 小时）', money(st.hourPay)],
    ['包工（' + st.pkgQty + ' 件）', money(st.pkgPay)],
    ['加班费', money(st.otPay)],
    ['借支', '-' + money(st.borrow)],
    ['已结算', '-' + money(st.settle)]
  ];
}

function payslipHTML(kind, st, cyc, forPrint) {
  const rows = payslipRows(kind, st).map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td></tr>`).join('');
  const title = kind === 'site' ? '工地记工结算单' : '工资条';
  const totalLabel = kind === 'site' ? '未结余款' : '实发金额';
  return `<div class="payslip" id="payslipBody">
    <div class="ps-head">
      <h3>${title}</h3>
      <p>工时记 · ${WORKER_META[kind].name} · ${esc(cyc.label)}</p>
    </div>
    <div class="ps-meta">
      <div>姓名：<b>＿＿＿＿</b></div>
      <div>工种：<b>${WORKER_META[kind].name}</b></div>
      <div>周期：<b>${esc(cyc.label)}</b></div>
      <div>生成：<b>${todayKey()}</b></div>
    </div>
    <table>${rows}
      <tr class="total"><td>${totalLabel}</td><td>${money(st.net)}</td></tr>
    </table>
    <div class="ps-sign"><span>员工签字：＿＿＿＿＿＿</span><span>日期：＿＿＿＿</span></div>
    <div class="ps-foot"><span>本单由「工时记」离线生成，数据仅存于本机</span><span>${APP_VERSION}</span></div>
  </div>`;
}

function openPayslip() {
  const { kind, cyc, st } = payslipMeta();
  const html = payslipHTML(kind, st, cyc);
  const pa = $('printArea');
  if (pa) pa.innerHTML = html;
  const el = $('payslipDialog');
  el.innerHTML = `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div><h2>工资条</h2><p>${WORKER_META[kind].name} · ${esc(cyc.label)}</p></div>
      <button class="close-x" type="button" data-action="close-sheet" data-sheet="payslipDialog" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body">${html}
      <p class="help">「打印 / PDF」会调起手机自带打印服务（可另存为 PDF）；「存成图片」会把这张工资条存到相册/下载。</p>
    </div>
    <div class="sheet-foot row">
      <button class="btn btn-ghost" type="button" data-action="save-payslip-img">存成图片</button>
      <button class="btn btn-primary" type="button" data-action="print-payslip">打印 / PDF</button>
    </div>
  </div>`;
  openSheet(el);
}

function doPrint() {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.printPage === 'function') {
      window.AndroidBridge.printPage();
      return;
    }
  } catch (e) { }
  try { window.print(); } catch (e) { toast('当前环境不支持打印'); }
}

function payslipImageDataURL() {
  const { kind, cyc, st } = payslipMeta();
  const rows = payslipRows(kind, st);
  const W = 760, padX = 44, lineH = 46;
  const headH = 190, footH = 150;
  const H = headH + rows.length * lineH + 90 + footH;
  const cv = document.createElement('canvas');
  const ratio = Math.min(3, (window.devicePixelRatio || 2) * 1.5);
  cv.width = W * ratio;
  cv.height = H * ratio;
  const ctx = cv.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  // 头部
  ctx.fillStyle = '#2567e8';
  ctx.fillRect(0, 0, W, 7);
  ctx.fillStyle = '#23344e';
  ctx.font = '700 30px "PingFang SC","Noto Sans CJK SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(kind === 'site' ? '工地记工结算单' : '工资条', W / 2, 78);
  ctx.fillStyle = '#8794a8';
  ctx.font = '400 15px "PingFang SC",sans-serif';
  ctx.fillText('工时记 · ' + WORKER_META[kind].name + ' · ' + cyc.label, W / 2, 108);
  ctx.strokeStyle = '#2a6bee';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padX, 132); ctx.lineTo(W - padX, 132); ctx.stroke();
  // 行
  let y = 170;
  ctx.textAlign = 'left';
  rows.forEach((r, i) => {
    ctx.fillStyle = '#4a5d78';
    ctx.font = '400 17px "PingFang SC",sans-serif';
    ctx.fillText(r[0], padX, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#23344e';
    ctx.font = '600 17px "PingFang SC",sans-serif';
    ctx.fillText(r[1], W - padX, y);
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#eef3f9';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, y + 13); ctx.lineTo(W - padX, y + 13); ctx.stroke();
    y += lineH;
  });
  // 合计
  y += 26;
  ctx.strokeStyle = '#2a6bee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padX, y - 22); ctx.lineTo(W - padX, y - 22); ctx.stroke();
  ctx.fillStyle = '#23344e';
  ctx.font = '700 19px "PingFang SC",sans-serif';
  ctx.fillText(kind === 'site' ? '未结余款' : '实发金额', padX, y + 10);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2567e8';
  ctx.font = '700 28px "PingFang SC",sans-serif';
  ctx.fillText(money(st.net), W - padX, y + 12);
  ctx.textAlign = 'left';
  y += 66;
  ctx.fillStyle = '#8794a8';
  ctx.font = '400 14px "PingFang SC",sans-serif';
  ctx.fillText('员工签字：＿＿＿＿＿＿', padX, y);
  ctx.textAlign = 'right';
  ctx.fillText('日期：＿＿＿＿', W - padX, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#b3bfce';
  ctx.font = '400 11px "PingFang SC",sans-serif';
  ctx.fillText('本单由「工时记」离线生成 · 数据仅存于本机 · ' + APP_VERSION, padX, H - 36);
  return cv.toDataURL('image/png');
}

function savePayslipImage() {
  try {
    const data = payslipImageDataURL();
    const name = `工时记工资条-${todayKey()}.png`;
    if (window.AndroidBridge && typeof window.AndroidBridge.saveBase64 === 'function') {
      window.AndroidBridge.saveBase64(name, data.split(',')[1]);
      toast('已保存到「下载」');
      return;
    }
    const a = document.createElement('a');
    a.href = data;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('已保存图片');
  } catch (e) {
    toast('生成图片失败');
  }
}

/* ==================== 工资周期 ==================== */
function cycleLabelFor(day) {
  if (day <= 1) return '1号 - 本月月底';
  return day + '号 - 下月' + (day - 1) + '号';
}

function openCycleDialog() {
  const cur = state.cycleStartDay || 1;
  const rows = [];
  for (let d = 1; d <= 28; d++) {
    rows.push(`<button class="wheel-item ${d === cur ? 'on' : ''}" type="button" data-action="wheel-pick" data-day="${d}">${cycleLabelFor(d)}</button>`);
  }
  const el = $('cycleDialog');
  el.innerHTML = `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div><h2>工资周期</h2><p>上下拨动选择：这个月几号到下面个月几号</p></div>
      <button class="close-x" type="button" data-action="close-sheet" data-sheet="cycleDialog" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body">
      <p class="help">选「26号 - 下月25号」，则 11 月的账显示 <b>11月26日 - 12月25日</b>，算 11 月的工资。选「1号 - 本月月底」就是普通自然月。四种工种共用这个周期。</p>
      <div class="wheel-wrap">
        <div class="wheel-mid"></div>
        <div class="wheel" id="cycleWheel" role="listbox" aria-label="工资周期">
          <div class="wheel-pad"></div>
          ${rows.join('')}
          <div class="wheel-pad"></div>
        </div>
      </div>
      <p class="help center" style="color:#b3bfce">上下拨动选择</p>
    </div>
    <div class="sheet-foot row">
      <button class="btn btn-ghost" type="button" data-action="close-sheet" data-sheet="cycleDialog">取消</button>
      <button class="btn btn-primary" type="button" data-action="apply-cycle-wheel">确定</button>
    </div>
  </div>`;
  openSheet(el);
  const w = $('cycleWheel');
  if (w) {
    const upd = () => {
      const idx = Math.max(0, Math.min(27, Math.round(w.scrollTop / 44)));
      w.querySelectorAll('.wheel-item').forEach((it, i) => it.classList.toggle('on', i === idx));
    };
    w.addEventListener('scroll', upd, { passive: true });
    w.scrollTop = (cur - 1) * 44;
    upd();
  }
}

function setCycle(day) {
  day = Math.round(num(day, 1, 1, 28));
  state.cycleStartDay = day;
  persist(true);
  $('cycleDialog').close();
  render();
  toast(day === 1 ? '已改为自然月' : '已设为每月 ' + day + ' 号起');
}

/* ==================== 计时器 ==================== */
let timerTick = 0;
function openTimer() {
  const el = $('timerDialog');
  el.innerHTML = `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div><h2>计时</h2><p>上班点开始，下班点结束</p></div>
      <button class="close-x" type="button" data-action="close-timer" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body">
      <div class="about-hero" style="padding-top:6px">
        <div id="timerClock" style="font-size:46px;font-weight:700;letter-spacing:2px;color:var(--blue);font-variant-numeric:tabular-nums">00:00:00</div>
        <p id="timerState" style="font-size:12px;color:var(--muted-2)">没有在计时</p>
      </div>
      <div class="grid2" style="margin-top:8px">
        <button class="btn btn-soft" type="button" data-action="timer-toggle" id="timerToggle">开始</button>
        <button class="btn btn-ghost" type="button" data-action="timer-reset">清零</button>
      </div>
      <button class="btn btn-primary btn-block" type="button" data-action="timer-finish" style="margin-top:10px">结束并记到今天</button>
      <p class="help">结束时会自动按分钟四舍五入，把工时填进「今天」的记录里；不想记可以点清零。</p>
    </div>
  </div>`;
  openSheet(el);
  timerRefresh();
  clearInterval(timerTick);
  timerTick = setInterval(timerRefresh, 1000);
}

function timerElapsed() {
  const t = state.timer;
  if (!t) return 0;
  let ms = num(t.acc, 0, 0, 86400000);
  if (t.start && !t.paused) ms += Date.now() - num(t.start, Date.now(), 0, 1e15);
  return Math.max(0, ms);
}

function timerRefresh() {
  const clk = $('timerClock');
  if (!clk) { clearInterval(timerTick); return; }
  const ms = timerElapsed();
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  clk.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
  const t = state.timer;
  const st = $('timerState');
  if (st) st.textContent = !t ? '没有在计时' : t.paused ? '已暂停' : '正在计时…';
  const btn = $('timerToggle');
  if (btn) btn.textContent = !t ? '开始' : t.paused ? '继续' : '暂停';
}

function timerToggle() {
  const t = state.timer;
  if (!t) {
    state.timer = { start: Date.now(), paused: false, acc: 0 };
  } else if (t.paused) {
    t.start = Date.now(); t.paused = false;
  } else {
    t.acc = timerElapsed(); t.start = 0; t.paused = true;
  }
  persist(true);
  timerRefresh();
}

function timerReset() {
  state.timer = null;
  persist(true);
  timerRefresh();
  toast('已清零');
}

function timerFinish() {
  const ms = timerElapsed();
  state.timer = null;
  persist(true);
  clearInterval(timerTick);
  $('timerDialog').close();
  const mins = Math.round(ms / 60000);
  const hours = Math.round(mins / 6) / 10; // 保留 1 位小数
  if (hours <= 0) { toast('还没计时，先点开始'); return; }
  const k = todayKey();
  if (state.active === 'regular') {
    openEditor(k);
    setTimeout(() => {
      const inp = document.querySelector('#editorBody input[data-field="otHours"]');
      if (inp) { inp.value = String(hours); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      toast('已把 ' + hours + ' 小时填进加班，确认后保存');
    }, 200);
    return;
  }
  if (state.active === 'temp') {
    openEditor(k);
    setTimeout(() => {
      const inp = document.querySelector('#editorBody input[data-field="hours"]');
      if (inp) { inp.value = String(hours); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      toast('已填入 ' + hours + ' 小时，确认后保存');
    }, 200);
    return;
  }
  if (state.active === 'site') {
    openEditor(k);
    setTimeout(() => {
      const btn = document.querySelector('#editorBody [data-action="site-unit"][data-v="hour"]');
      if (btn) btn.click();
      setTimeout(() => {
        const inp = document.querySelector('#editorBody input[data-field="hours"]');
        if (inp) { inp.value = String(hours); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      }, 60);
    }, 200);
    return;
  }
  openEditor(k);
  toast('计件不按小时算，请填件数');
}
