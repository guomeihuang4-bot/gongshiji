/* =====================================================================
   渲染：设置页
   ===================================================================== */

function numField(label, attr, value, unit, opt) {
  opt = opt || {};
  const v = (value === null || value === undefined || value === '' || value === 0) ? '' : value;
  return `<label class="field">${esc(label)}
    <div class="input-unit">
      <input type="text" readonly inputmode="none" data-num="${opt.dec === false ? 'int' : 'dec'}" data-set="${attr}"
        value="${esc(v)}" placeholder="${esc(opt.ph || '')}" aria-label="${esc(label)}">
      <span>${esc(unit || '')}</span>
    </div>
    ${opt.hint ? `<small class="help" style="display:block;margin-top:5px">${opt.hint}</small>` : ''}
  </label>`;
}

function switchRow(title, sub, attr, on) {
  return `<div class="switch-row">
    <div class="sw-txt"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
    <button class="switch ${on ? 'on' : ''}" type="button" role="switch" aria-checked="${on ? 'true' : 'false'}"
      data-action="toggle-set" data-attr="${attr}"></button>
  </div>`;
}

function workWeekPicker(wk) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return `<div class="week-picker">${order.map(i =>
    `<button class="wd ${wk[i] ? 'on' : ''}" type="button" data-action="toggle-workweek" data-dow="${i}" aria-pressed="${wk[i] ? 'true' : 'false'}">${WEEK_CN[i]}<small>${wk[i] ? '上班' : '休息'}</small></button>`
  ).join('')}</div>`;
}

function presetChips(wk) {
  const eq = a => a.length === wk.length && a.every((v, i) => v === wk[i]);
  const p5 = [0, 1, 1, 1, 1, 1, 0], p6 = [0, 1, 1, 1, 1, 1, 1], p7 = [1, 1, 1, 1, 1, 1, 1];
  return `<div class="preset-row">
    <button class="preset-chip ${eq(p5) ? 'on' : ''}" type="button" data-action="workweek-preset" data-preset="5">5 天 8 小时</button>
    <button class="preset-chip ${eq(p6) ? 'on' : ''}" type="button" data-action="workweek-preset" data-preset="6">6 天工作制</button>
    <button class="preset-chip ${eq(p7) ? 'on' : ''}" type="button" data-action="workweek-preset" data-preset="7">7 天全上班</button>
  </div>`;
}

function rateRows(items, prefix) {
  return items.map((it, i) => `<div class="rate-row">
    <div class="input-unit"><input type="text" readonly data-text="1" data-item="${prefix}:${i}:name" value="${esc(it.name || '')}" placeholder="产品 / 工序名称" aria-label="名称"></div>
    <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-item="${prefix}:${i}:rate" value="${it.rate || ''}" placeholder="单价" aria-label="单价"></div>
    <button class="rate-del" type="button" data-action="del-rate" data-prefix="${prefix}" data-idx="${i}" aria-label="删除">×</button>
  </div>`).join('');
}

function settingsPage() {
  const kind = state.active;
  const s = state.data[kind].settings;
  const mk = MONTH_KEY(month);
  if (!state.data[kind].monthly[mk]) state.data[kind].monthly[mk] = defaultMonthlySeed(kind);
  const mon = state.data[kind].monthly[mk];
  const st = cycleStats(month.getFullYear(), month.getMonth(), kind);

  const itemRows = (list, kindKey) => list.map((it, i) => `<div class="rate-row" data-kind="${kindKey}" data-idx="${i}">
      <div class="input-unit"><input type="text" readonly data-text="1" data-item="${kindKey}:${i}:name" value="${esc(it.name || '')}" placeholder="名称" aria-label="名称"></div>
      <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-item="${kindKey}:${i}:amount" value="${it.amount || ''}" placeholder="金额" aria-label="金额"></div>
      <button class="rate-del" type="button" data-action="del-item" data-kind="${kindKey}" data-idx="${i}" aria-label="删除">×</button>
    </div>`).join('');

  let paramCard = '';
  if (kind === 'regular') {
    const hr = st.hourlyRate || hourlyRateFor('regular', cycleRange(month.getFullYear(), month.getMonth()));
    paramCard = `
    <section class="card set-card">
      <div class="sc-head"><span class="ico">${ICON.wallet}</span><div><h2>正式工工资参数</h2><div class="sub">底薪、时薪、加班倍数</div></div></div>
      <div class="sc-body">
        ${numField('月薪（底薪）', 'baseSalary', s.baseSalary || '', '元 / 月', { ph: '例如 8000' })}
        ${numField('小时工资（可改）', 'hourlyRate', s.hourlyRate || '', '元 / 小时', { ph: hr && hr > 0 ? hr.toFixed(2) : '自动计算', hint: `<span id="hourlyHint">${regularHourlyHint(s, st, month)}</span>` })}
        <div class="grid2">
          <label class="field">每月计薪天数
            <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-set="daysPerMonth" value="${s.daysPerMonth}" aria-label="每月计薪天数"><span>天</span></div>
            <small class="help" style="display:block;margin-top:5px">默认 21.75 天（法定标准）</small>
          </label>
          <label class="field">每天标准工时
            <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-set="hoursPerDay" value="${s.hoursPerDay}" aria-label="每天标准工时"><span>小时</span></div>
          </label>
        </div>
        ${switchRow('按当月工作日自动算计薪天数', '开启后不用手动改天数，按下面「工作日」实际天数算时薪', 'autoDays', s.autoDays)}
        <div class="grid3" style="margin-top:12px">
          ${miniRate('平时加班', 'mulWeekday', s.mulWeekday, hr)}
          ${miniRate('周末加班', 'mulWeekend', s.mulWeekend, hr)}
          ${miniRate('节假日', 'mulHoliday', s.mulHoliday, hr)}
        </div>
      </div>
    </section>`;
  } else if (kind === 'temp') {
    paramCard = `
    <section class="card set-card">
      <div class="sc-head"><span class="ico">${ICON.clock}</span><div><h2>临时工参数</h2><div class="sub">按小时结算，不含社保公积金</div></div></div>
      <div class="sc-body">
        ${numField('默认小时单价（到手）', 'rate', s.rate || '', '元 / 小时', { ph: '例如 20' })}
        ${numField('对外单价（报价）', 'rateOut', s.rateOut || '', '元 / 小时', { ph: '不填 = 和到手价一样', hint: '用来区分「谈好的价」和「实际到手的价」，明细里会算差额。' })}
        <div class="grid2">
          ${numField('默认每天工时', 'defaultHours', s.defaultHours, '小时')}
          <label class="field">默认班次
            <div class="input-unit">
              <select data-set="defaultShift" style="flex:1;border:0;background:none;outline:none;height:100%">
                ${WORK_SHIFTS.map(x => `<option ${x === s.defaultShift ? 'selected' : ''}>${x}</option>`).join('')}
              </select>
            </div>
          </label>
        </div>
        <p class="help">临时工只有「保险」可以扣，不计算底薪、社保、公积金。日历里也没有「正班」选项。</p>
      </div>
    </section>`;
  } else if (kind === 'piece') {
    paramCard = `
    <section class="card set-card">
      <div class="sc-head"><span class="ico">${ICON.box}</span><div><h2>计件单价表</h2><div class="sub">做多少件算多少钱，可维护多个品项</div></div></div>
      <div class="sc-body">
        <label class="field">计量单位
          <div class="input-unit"><input type="text" readonly data-text="1" data-set="unit" value="${esc(s.unit || '件')}" maxlength="6" placeholder="件 / 平方 / 米" aria-label="计量单位"><span></span></div>
        </label>
        <div class="field-title" style="margin-top:14px">品项与单价</div>
        ${rateRows(s.items, 'pieceItems')}
        <button class="textbtn" type="button" data-action="add-rate" data-prefix="pieceItems">+ 添加品项</button>
        <p class="help">记工时从这张表里选品项，单价自动带入。也可以每次手动改价。</p>
      </div>
    </section>`;
  } else {
    paramCard = `
    <section class="card set-card">
      <div class="sc-head"><span class="ico">${ICON.helmet}</span><div><h2>工地记工参数</h2><div class="sub">点工 / 包工 / 小时 / 加班 / 借支结算</div></div></div>
      <div class="sc-body">
        <div class="grid2">
          ${numField('日薪（1 个工）', 'dayRate', s.dayRate || '', '元 / 工', { ph: '例如 260' })}
          ${numField('时薪', 'hourRate', s.hourRate || '', '元 / 小时', { ph: '例如 30' })}
        </div>
        <div class="grid2" style="margin-top:2px">
          ${numField('加班单价', 'otRate', s.otRate || '', '元 / 小时')}
          ${numField('包工默认单价', 'packageRate', s.packageRate || '', '元 / 件')}
        </div>
        <div class="field-title" style="margin-top:14px">对外单价（报价，可选）</div>
        <div class="grid2">
          ${numField('对外日薪', 'dayRateOut', s.dayRateOut || '', '元 / 工')}
          ${numField('对外时薪', 'hourRateOut', s.hourRateOut || '', '元 / 小时')}
        </div>
        ${numField('对外加班单价', 'otRateOut', s.otRateOut || '', '元 / 小时')}
        <p class="help">不填就按上面的到手价算。填了以后，明细里会多出「应收 / 实收 / 差额」——差额就是被抽走或没拿到的那部分。</p>
        <p class="help">点工默认按 1 个工＝一个日薪；半天可填 0.5 个工。包工按「数量 × 单价」算，借支和结算单独记账，不参与工资。</p>
      </div>
    </section>`;
  }

  return `
  <div class="page-head">
    <div class="ph-main"><h2>设置</h2><div class="ph-sub">当前：${WORKER_META[kind].name} · 所有数据保存在本机</div></div>
    <div class="ph-act">
      <button class="btn btn-soft btn-sm" type="button" data-action="about">关于</button>
    </div>
  </div>

  ${paramCard}

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.calendar2}</span><div><h2>工作日与休息日（${WORKER_META[kind].name}）</h2><div class="sub">决定哪些天算上班：日历会显示「休」</div></div></div>
    <div class="sc-body">
      ${workWeekPicker(s.workWeek)}
      ${presetChips(s.workWeek)}
      <div style="margin-top:12px">
        ${switchRow('法定节假日自动休息', '元旦、春节、国庆等按国家安排标为休息', 'followHoliday', s.followHoliday)}
        ${switchRow('调休补班日自动上班', '周末被调成上班的日子按工作日算', 'followMakeup', s.followMakeup)}
      </div>
      <p class="help">四种工种各有自己的工作日设置，互不影响。非工作日的日期会在日历右上角显示「休」字。${kind === 'regular' ? '正式工的底薪也会按这里的出勤天数折算。' : ''}</p>
    </div>
  </section>

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.refresh}</span><div><h2>工资周期</h2><div class="sub">${state.cycleStartDay === 1 ? '自然月：1 号到月底' : `每月 ${state.cycleStartDay} 号起，到下月 ${state.cycleStartDay - 1} 号`}</div></div></div>
    <div class="sc-body">
      <button class="set-action" type="button" data-action="cycle">
        <span><b>调整工资周期</b><small>非自然月，例如每月 26 号到次月 25 号</small></span>
        <span class="chev">${ICON.chev}</span>
      </button>
      <p class="help">周期是全局的，四种工种共用；切换工种只换数据，不换周期。</p>
    </div>
  </section>

  ${kind === 'regular' ? `
  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.refresh}</span><div><h2>调休抵扣</h2><div class="sub">本月用调休换掉了多少加班 · 维护月份：${month.getFullYear()} 年 ${month.getMonth() + 1} 月</div></div></div>
    <div class="sc-body">
      <label class="field">本月调休小时
        <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-mon="leaveHours" value="${mon.leaveHours || ''}" placeholder="0" aria-label="本月调休小时"><span>小时</span></div>
      </label>
      <div class="field-title" style="margin-top:12px">抵扣顺序</div>
      <div class="quick-row">
        <button class="qbtn ${mon.leaveOrder !== 'high' ? 'on' : ''}" type="button" data-action="set-leave-order" data-v="low">先扣低倍率</button>
        <button class="qbtn ${mon.leaveOrder === 'high' ? 'on' : ''}" type="button" data-action="set-leave-order" data-v="high">先扣高倍率</button>
      </div>
      <p class="help">调休会按顺序抵掉当月加班，抵掉的部分不再算加班费。先扣低倍率时，3 倍加班留到最后，对员工更划算；有些公司反着扣，可以在这里选。</p>
    </div>
  </section>` : ''}

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.receipt}</span><div><h2>${kind === 'temp' ? '保险 / 扣款' : '月度扣款与补贴'}</h2><div class="sub">维护月份：${month.getFullYear()} 年 ${month.getMonth() + 1} 月（跟日历）</div></div></div>
    <div class="sc-body">
      <div class="field-title">扣款项</div>
      ${itemRows(mon.deductions, 'deductions') || '<p class="muted small" style="padding:2px 0 6px">还没有扣款项</p>'}
      <button class="textbtn" type="button" data-action="add-item" data-kind="deductions">+ 添加扣款项</button>
      <div class="field-title" style="margin-top:14px">补贴项</div>
      ${itemRows(mon.allowances, 'allowances') || '<p class="muted small" style="padding:2px 0 6px">还没有补贴项</p>'}
      <button class="textbtn" type="button" data-action="add-item" data-kind="allowances">+ 添加补贴项</button>
      <p class="help">${kind === 'regular' ? '常见：社保、公积金、个人所得税。每月单独维护，互不影响。' : kind === 'temp' ? '临时工只有「保险」可以扣，不计算社保、公积金和底薪。' : '可选：工具损耗、餐费、罚款，或者高温补贴、饭补等。'}</p>
    </div>
  </section>

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.palette}</span><div><h2>外观</h2><div class="sub">自定义背景、图标按钮</div></div></div>
    <div class="sc-body">
      <button class="set-action" type="button" data-action="open-bg">
        <span><b>自定义背景</b><small>内置 8 套配色，也可以用自己的照片</small></span>
        <span class="chev">${ICON.chev}</span>
      </button>
      <button class="set-action" type="button" data-action="open-timer">
        <span><b>计时器</b><small>上下班打卡，自动算出工时</small></span>
        <span class="chev">${ICON.chev}</span>
      </button>
    </div>
  </section>

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.save}</span><div><h2>数据与备份</h2><div class="sub">不联网、不上传，只在这台手机</div></div></div>
    <div class="sc-body">
      <button class="set-action" type="button" data-action="backup">
        <span><b>导出完整备份</b><small>四种工种的全部记录与设置 · JSON</small></span><span class="chev">${ICON.chev}</span>
      </button>
      <button class="set-action" type="button" data-action="import">
        <span><b>导入备份</b><small>合并同一天的记录，不会清空现有数据</small></span><span class="chev">${ICON.chev}</span>
      </button>
      <button class="set-action" type="button" data-action="export-csv">
        <span><b>导出当前工种 CSV</b><small>Excel / WPS 可直接打开</small></span><span class="chev">${ICON.chev}</span>
      </button>
      <button class="set-action" type="button" data-action="payslip">
        <span><b>工资条</b><small>预览、打印或保存成图片</small></span><span class="chev">${ICON.chev}</span>
      </button>
      <button class="set-action danger" type="button" data-action="clear-worker">
        <span><b>清空「${WORKER_META[kind].name}」的数据</b><small>只清当前工种，其他工种不受影响</small></span><span class="chev">${ICON.chev}</span>
      </button>
    </div>
  </section>

  <section class="card set-card">
    <div class="sc-head"><span class="ico">${ICON.info}</span><div><h2>关于</h2><div class="sub">版本 ${APP_VERSION} · 完全离线</div></div></div>
    <div class="sc-body">
      <div class="info-list">
        <div class="kv"><span>版本</span><b>${APP_VERSION}</b></div>
        <div class="kv"><span>节假日范围</span><b>2025 – 2030</b></div>
        <div class="kv"><span>记录总数</span><b>${totalRecords()} 条</b></div>
        <div class="kv"><span>数据存储</span><b>本机 · 不上传</b></div>
      </div>
      <div class="mode-note">${ICON.warn}<span>节假日为离线内置，2025–2026 按国务院公布安排；2027 之后按标准推算，如遇国家调整可能不准，可在记工时手动改成「上班 / 休息」。</span></div>
    </div>
  </section>
  <p class="footer-note">工时记 ${APP_VERSION} · 用之前建议先导出一份备份</p>`;
}

function miniRate(label, attr, val, hr) {
  return `<label class="field">${esc(label)}
    <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-set="${attr}" value="${val}" aria-label="${label}"><span>倍</span></div>
    <small class="help" style="display:block;margin-top:5px">≈ ${money((hr || 0) * val)} / 时</small>
  </label>`;
}

function regularHourlyHint(s, st, m) {
  if (s.hourlyRate && s.hourlyRate > 0) {
    return `已自定义为 <b>${money(s.hourlyRate)}</b> / 小时。清空可恢复自动计算。`;
  }
  const cyc = cycleRange(m.getFullYear(), m.getMonth());
  const days = s.autoDays ? payDaysInCycle(cyc, 'regular') : s.daysPerMonth;
  return `自动：底薪 ÷（${days} × ${s.hoursPerDay}）= <b>${money(hourlyRateFor('regular', cyc))}</b> / 小时`;
}

function totalRecords() {
  return WORKER_ORDER.reduce((a, k) => a + Object.keys(state.data[k].records).length, 0);
}

function ensureMonthSeeds() {
  const kind = state.active;
  const mk = MONTH_KEY(month);
  if (!state.data[kind].monthly[mk]) state.data[kind].monthly[mk] = defaultMonthlySeed(kind);
}
