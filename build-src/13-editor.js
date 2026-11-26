/* =====================================================================
   记工编辑器（四工种各自字段）
   ===================================================================== */

let editingKey = null;
let editorDraft = null;
let editorKind = 'regular';

function blankDraft(kind, k) {
  if (kind === 'regular') {
    return { shift: '白班', otHours: '', regularHours: '', otSplit: [0, 0, 0], showSplit: false, note: '' };
  }
  if (kind === 'temp') {
    const s = state.data.temp.settings;
    return { shift: s.defaultShift || '白班', hours: '', rate: s.rate || '', note: '' };
  }
  if (kind === 'piece') {
    const s = state.data.piece.settings;
    const first = s.items[0] || { name: '', rate: 0 };
    return { items: [{ name: first.name || '', qty: '', rate: first.rate || '' }], note: '' };
  }
  const s = state.data.site.settings;
  return {
    type: 'work', unit: 'day', units: '1', hours: '', dayRate: s.dayRate || '', hourRate: s.hourRate || '',
    otHours: '', otRate: s.otRate || '', pkgQty: '', pkgRate: s.packageRate || '', amount: '', note: ''
  };
}

function draftFromRecord(kind, rec) {
  if (!rec) return null;
  if (kind === 'regular') {
    const split = Array.isArray(rec.otSplit) ? rec.otSplit.slice(0, 3) : null;
    return {
      shift: rec.shift,
      otHours: rec.otHours ? String(rec.otHours) : '',
      regularHours: (rec.regularHours === null || rec.regularHours === undefined) ? '' : String(rec.regularHours),
      otSplit: split ? split.map(x => num(x, 0, 0, 24)) : [0, 0, 0],
      showSplit: !!split,
      note: rec.note || ''
    };
  }
  if (kind === 'temp') {
    return { shift: rec.shift, hours: rec.hours ? String(rec.hours) : '', rate: rec.rate ? String(rec.rate) : '', note: rec.note || '' };
  }
  if (kind === 'piece') {
    const items = (rec.items || []).map(it => ({ name: it.name || '', qty: it.qty ? String(it.qty) : '', rate: it.rate ? String(it.rate) : '' }));
    return { items: items.length ? items : [{ name: '', qty: '', rate: '' }], note: rec.note || '' };
  }
  return {
    type: rec.type || 'work',
    unit: rec.unit || 'day',
    units: rec.units ? String(rec.units) : '',
    hours: rec.hours ? String(rec.hours) : '',
    dayRate: rec.dayRate ? String(rec.dayRate) : '',
    hourRate: rec.hourRate ? String(rec.hourRate) : '',
    otHours: rec.otHours ? String(rec.otHours) : '',
    otRate: rec.otRate ? String(rec.otRate) : '',
    pkgQty: rec.pkgQty ? String(rec.pkgQty) : '',
    pkgRate: rec.pkgRate ? String(rec.pkgRate) : '',
    amount: rec.amount ? String(rec.amount) : '',
    note: rec.note || ''
  };
}

function openEditor(k, opt) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
  opt = opt || {};
  // 先把键盘收起来并移回 body：下面要整体重写 editor 的 innerHTML，
  // 键盘如果正挂在 dialog 里会被一起删掉，之后再也弹不出来。
  if (window.GongKeypad) window.GongKeypad.close();
  editingKey = k;
  editorKind = state.active;
  const rec = state.data[editorKind].records[k] || null;
  editorDraft = draftFromRecord(editorKind, rec) || blankDraft(editorKind, k);
  if (opt.type === 'borrow' && editorKind === 'site') editorDraft.type = 'borrow';
  $('editor').innerHTML = editorShell(rec);
  openSheet($('editor'));
  bindEditorStatic();
}

function editorShell(rec) {
  const d = parseD(editingKey);
  const kind = editorKind;
  const t = dateType(editingKey);
  const off = isOffDay(editingKey);
  const typeBadge = t === 'holiday' ? `<span class="badge holiday">${esc(holidayName(editingKey) || '节假日')}</span>`
    : off ? '<span class="badge rest">休息日</span>' : '<span class="badge weekend">工作日</span>';
  return `<div class="sheet-inner">
    <div class="grip"></div>
    <div class="sheet-head">
      <div>
        <p>${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEK_CN[d.getDay()]} ${typeBadge}</p>
        <h2>记工 · ${WORKER_META[kind].name}</h2>
      </div>
      <button class="close-x" type="button" data-action="close-editor" aria-label="关闭">×</button>
    </div>
    <div class="sheet-body" id="editorBody">${editorBodyHTML(rec)}</div>
    <div class="sheet-foot row">
      ${rec ? '<button class="btn btn-danger" type="button" data-action="del-record">删除</button>' : ''}
      <button class="btn btn-primary" type="button" data-action="save-entry">保存</button>
    </div>
  </div>`;
}

/* ---------- 日期类型纠正 ---------- */
function dayTypeButtons() {
  const t = dateType(editingKey);
  return `<div class="quick-row">
    <button class="qbtn ${t === 'workday' ? 'on' : ''}" type="button" data-action="set-daytype" data-t="workday">按上班日</button>
    <button class="qbtn ${t === 'holiday' ? 'on' : ''}" type="button" data-action="set-daytype" data-t="holiday">按休息日</button>
    ${state.overrides[editingKey] ? '<button class="qbtn" type="button" data-action="set-daytype" data-t="auto">恢复自动</button>' : ''}
  </div>`;
}

function editorBodyHTML(rec) {
  const kind = editorKind, draft = editorDraft;
  let body = '';
  if (kind === 'regular') {
    const isLeave = !WORK_SHIFTS.includes(draft.shift);
    const shiftBtns = ALL_SHIFTS.map(x =>
      `<button class="shift-btn ${draft.shift === x ? 'on' : ''}" type="button" data-action="pick-shift" data-v="${x}"><span class="dot ${SHIFT_CLASS[x]}"></span>${x}</button>`
    ).join('');
    const full = state.data.regular.settings.hoursPerDay;
    body = `
      <div class="ed-mode"><span class="tag">正式工</span><span class="ed-dayinfo">底薪按月发，加班按倍数</span></div>
      ${dayTypeButtons()}
      <div class="field-title">班次</div>
      <div class="shifts">${shiftBtns}</div>
      ${isLeave
        ? `<div class="ed-calcs">${draft.shift === '事假' ? '事假会扣一天底薪（按 8 小时算）' : draft.shift === '病假' ? '病假不扣钱' : '休息日没有工资'}，不用填加班。</div>`
        : `<label class="field">加班小时（${full} 小时以外）
             <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="otHours" value="${esc(draft.otHours)}" placeholder="0" aria-label="加班小时"><span>小时</span></div>
           </label>
           <div class="quick-row">${[0, 1, 2, 3, 4, 6].map(v => `<button class="qbtn" type="button" data-action="quick-ot" data-v="${v}">${v ? v + 'h' : '无加班'}</button>`).join('')}</div>
           ${otSplitEditor()}
           <label class="field">正班实际工时（不满 ${full} 小时扣底薪）
             <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="regularHours" value="${esc(draft.regularHours)}" placeholder="${full}" aria-label="正班工时"><span>小时</span></div>
           </label>
           <div class="quick-row">${[full, full - 1, full - 2, 4].filter((v, i, a) => v >= 0 && a.indexOf(v) === i).map(v => `<button class="qbtn" type="button" data-action="quick-rh" data-v="${v}">${v}h</button>`).join('')}</div>
           <div class="ed-calcs" id="calcHint">${regularCalcText()}</div>`}
    `;
  } else if (kind === 'temp') {
    body = `
      <div class="ed-mode"><span class="tag temp">临时工</span><span class="ed-dayinfo">工时 × 单价，不含社保公积金</span></div>
      ${dayTypeButtons()}
      <div class="field-title">班次</div>
      <div class="shifts">${WORK_SHIFTS.concat(['休息']).map(x => `<button class="shift-btn ${draft.shift === x ? 'on' : ''}" type="button" data-action="pick-shift" data-v="${x}"><span class="dot ${SHIFT_CLASS[x]}"></span>${x}</button>`).join('')}</div>
      <label class="field">工时
        <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="hours" value="${esc(draft.hours)}" placeholder="${state.data.temp.settings.defaultHours}" aria-label="工时"><span>小时</span></div>
      </label>
      <div class="quick-row">${[4, 8, 10, 12, 14].map(v => `<button class="qbtn" type="button" data-action="quick-hours" data-v="${v}">${v}h</button>`).join('')}</div>
      <label class="field">单价
        <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="rate" value="${esc(draft.rate)}" placeholder="${state.data.temp.settings.rate || 0}" aria-label="单价"><span>元 / 小时</span></div>
      </label>
      <div class="ed-calcs" id="calcHint">${tempCalcText()}</div>`;
  } else if (kind === 'piece') {
    const s = state.data.piece.settings;
    const rows = draft.items.map((it, i) => {
      const opts = s.items.map(x => x.name).filter(Boolean);
      return `<div class="piece-row" data-pi="${i}">
        <div class="input-unit"><input type="text" readonly data-text="1" data-field="pname${i}" value="${esc(it.name)}" placeholder="品项" aria-label="品项"></div>
        <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="pqty${i}" value="${esc(it.qty)}" placeholder="数量" aria-label="数量"></div>
        <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="prate${i}" value="${esc(it.rate)}" placeholder="单价" aria-label="单价"></div>
        <button class="rate-del" type="button" data-action="del-piece" data-idx="${i}" aria-label="删除">×</button>
      </div>`;
    }).join('');
    body = `
      <div class="ed-mode"><span class="tag piece">计件</span><span class="ed-dayinfo">做得越多，拿得越多</span></div>
      ${dayTypeButtons()}
      <datalist id="pieceNames">${s.items.filter(x => x.name).map(x => `<option value="${esc(x.name)}">`).join('')}</datalist>
      <div class="field-title">品项 / 数量 / 单价</div>
      ${rows}
      <div class="piece-more">
        <button class="add-piece" type="button" data-action="add-piece">${ICON.plus} 再加一项</button>
      </div>
      <div class="piece-total"><span>今日计件合计</span><b id="calcHint">${money(pieceCalcTotal())}</b></div>
      <p class="help">单位：${esc(s.unit || '件')}。数量、单价都可以直接点开输入。</p>`;
  } else {
    const s = state.data.site.settings;
    const isWork = draft.type === 'work';
    body = `
      <div class="ed-mode"><span class="tag site">工地</span><span class="ed-dayinfo">点工 / 包工 / 借支 / 结算</span></div>
      ${dayTypeButtons()}
      <div class="field-title">这一笔记什么</div>
      <div class="tabs three" style="margin:0">
        <button class="${isWork ? 'on' : ''}" type="button" data-action="site-type" data-v="work">记工</button>
        <button class="${draft.type === 'borrow' ? 'on' : ''}" type="button" data-action="site-type" data-v="borrow">借支</button>
        <button class="${draft.type === 'settle' ? 'on' : ''}" type="button" data-action="site-type" data-v="settle">结算</button>
      </div>
      ${isWork ? `
        <div class="field-title">上班方式</div>
        <div class="site-seg">
          <button class="${draft.unit === 'day' ? 'on' : ''}" type="button" data-action="site-unit" data-v="day">点工<small>按个工</small></button>
          <button class="${draft.unit === 'hour' ? 'on' : ''}" type="button" data-action="site-unit" data-v="hour">小时<small>按工时</small></button>
          <button class="${draft.unit === 'rest' ? 'on' : ''}" type="button" data-action="site-unit" data-v="rest">休息<small>没干活</small></button>
        </div>
        ${draft.unit === 'day' ? `
          <div class="grid2">
            ${numLike('个数（1 个工 = 1 天）', 'units', draft.units, '个工', s.dayRate)}
            ${numLike('日薪', 'dayRate', draft.dayRate, '元 / 工', s.dayRate)}
          </div>
          <div class="quick-row">${[0.5, 1, 1.5, 2, 3].map(v => `<button class="qbtn" type="button" data-action="quick-units" data-v="${v}">${v}个工</button>`).join('')}</div>` : ''}
        ${draft.unit === 'hour' ? `
          <div class="grid2">
            ${numLike('工时', 'hours', draft.hours, '小时', s.hourRate)}
            ${numLike('时薪', 'hourRate', draft.hourRate, '元 / 小时', s.hourRate)}
          </div>
          <div class="quick-row">${[2, 4, 6, 8, 10, 12].map(v => `<button class="qbtn" type="button" data-action="quick-hours" data-v="${v}">${v}h</button>`).join('')}</div>` : ''}
        ${draft.unit === 'rest' ? '<div class="ed-calcs">休息这一天不算钱，可以留空直接保存。</div>' : ''}
        ${draft.unit !== 'rest' ? `
          <div class="field-title">加班（可选）</div>
          <div class="grid2">
            ${numLike('加班小时', 'otHours', draft.otHours, '小时', '')}
            ${numLike('加班单价', 'otRate', draft.otRate, '元 / 小时', s.otRate)}
          </div>
          <div class="field-title">包工（可选）</div>
          <div class="grid2">
            ${numLike('包工数量', 'pkgQty', draft.pkgQty, '件 / ㎡', s.packageRate)}
            ${numLike('包工单价', 'pkgRate', draft.pkgRate, '元 / 单位', s.packageRate)}
          </div>` : ''}
        <div class="ed-calcs" id="calcHint">${siteCalcText()}</div>
      ` : `
        <label class="field">${draft.type === 'borrow' ? '借支金额' : '已结算金额'}
          <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="amount" value="${esc(draft.amount)}" placeholder="0" aria-label="${draft.type === 'borrow' ? '借支金额' : '已结算金额'}"><span>元</span></div>
        </label>
        <div class="ed-calcs">${draft.type === 'borrow' ? '借支会从工资里扣掉，不参与点工/包工合计。' : '结算表示已经拿到手的钱，会从未结余款里扣掉。'}</div>
      `}`;
  }
  return `${body}
    <label class="field">备注
      <div class="input-unit"><input type="text" readonly data-text="1" data-field="note" value="${esc(draft.note)}" maxlength="100" placeholder="选填，100 字以内" aria-label="备注"></div>
    </label>
    <div class="error" id="entryError" role="alert" style="color:var(--red);font-size:12px;min-height:16px;margin-top:6px"></div>`;
}

function numLike(label, field, val, unit, hintVal) {
  return `<label class="field">${esc(label)}
    <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="${field}" value="${esc(val)}" placeholder="${hintVal || ''}" aria-label="${esc(label)}"><span>${esc(unit)}</span></div>
  </label>`;
}

/* ---------- 加班倍率拆分（公司不按法定倍率时用） ---------- */
const SPLIT_FIELDS = ['otwd', 'otwe', 'othd'];

function otSplitSum() {
  return round2(sum((editorDraft.otSplit || []).map(x => num(x, 0, 0, 24))));
}

function otSplitTotalText() {
  const total = num(editorDraft.otHours, 0, 0, 24);
  const got = otSplitSum();
  const diff = round2(total - got);
  const ok = Math.abs(diff) < 0.005;
  return `合计 ${got} / 总加班 ${total} 小时 <b class="${ok ? 'pos' : 'neg'}">${ok ? '✓ 对上了' : '还差 ' + diff + ' 小时'}</b>`;
}

function otSplitEditor() {
  const s = state.data.regular.settings;
  const d = editorDraft;
  const rows = OT_KEYS.map((key, i) => {
    const v = num((d.otSplit || [])[i], 0, 0, 24);
    return `<div class="ot-row">
      <span class="ot-name">${OT_LABEL[key]}<em>×${num(s[OT_MULKEY[key]], 1, 0, 10)}</em></span>
      <div class="input-unit"><input type="text" readonly inputmode="none" data-num="dec" data-field="${SPLIT_FIELDS[i]}" value="${v ? String(v) : ''}" placeholder="0" aria-label="${OT_LABEL[key]}加班小时"><span>小时</span></div>
    </div>`;
  }).join('');
  return `<div class="ot-split">
    <button class="textbtn" type="button" data-action="toggle-otsplit">${d.showSplit ? '收起「倍率拆分」' : '公司不按法定倍率算？改这里'}</button>
    ${d.showSplit ? `<div class="ot-split-body">
      <p class="help">加班可以拆成几段不同倍率（比如 3 小时按 3 倍、2 小时按 2 倍）。改一段，其余自动补，总小时不变。</p>
      ${rows}
      <div class="ot-total" id="otTotal">${otSplitTotalText()}</div>
    </div>` : ''}
  </div>`;
}

/** 自动调平：改一档，差额从其它档补/扣，总和保持等于总加班 */
function rebalanceSplit(changedIdx, val) {
  const total = num(editorDraft.otHours, 0, 0, 24);
  const arr = (editorDraft.otSplit || [0, 0, 0]).map((x, i) => i === changedIdx ? val : num(x, 0, 0, 24));
  let diff = round2(sum(arr) - total);
  if (diff > 0) {
    for (const j of [0, 1, 2]) {
      if (j === changedIdx) continue;
      const take = Math.min(arr[j], diff);
      arr[j] = round2(arr[j] - take);
      diff = round2(diff - take);
      if (diff <= 0) break;
    }
  } else if (diff < 0) {
    const j = [1, 2, 0].find(x => x !== changedIdx);
    arr[j] = round2(arr[j] + (-diff));
  }
  editorDraft.otSplit = arr;
}

function syncSplitInputs() {
  SPLIT_FIELDS.forEach((f, i) => {
    const inp = document.querySelector(`#editorBody input[data-field="${f}"]`);
    if (inp) {
      const v = num((editorDraft.otSplit || [])[i], 0, 0, 24);
      inp.value = v ? String(v) : '';
    }
  });
  const t = $('otTotal');
  if (t) t.innerHTML = otSplitTotalText();
}

/* ---------- 计算提示 ---------- */
function regularCalcText() {
  const s = state.data.regular.settings;
  const hr = hourlyRateFor('regular', currentCycle());
  const ot = Number(editorDraft.otHours) || 0;
  const rh = editorDraft.regularHours === '' ? s.hoursPerDay : Number(editorDraft.regularHours);
  const short = Math.max(0, s.hoursPerDay - rh);
  let txt = '';
  if (editorDraft.showSplit) {
    const parts = OT_KEYS.map((key, i) => ({ key, h: num((editorDraft.otSplit || [])[i], 0, 0, 24) })).filter(p => p.h > 0);
    const pay = sum(parts.map(p => p.h * num(s[OT_MULKEY[p.key]], 1, 0, 10))) * hr;
    if (parts.length) {
      txt = parts.map(p => `${OT_LABEL[p.key]} ${p.h}h ×${num(s[OT_MULKEY[p.key]], 1, 0, 10)}`).join(' + ') + ` = ${money(pay)}`;
    } else {
      txt = '还没拆，填一下各档小时';
    }
    const legalKey = legalOtKey(editingKey);
    const legal = ot * num(s[OT_MULKEY[legalKey]], 1, 0, 10) * hr;
    if (Math.abs(legal - pay) > 0.005) {
      txt += `；按法定（${OT_LABEL[legalKey]} ×${num(s[OT_MULKEY[legalKey]], 1, 0, 10)}）应 ${money(legal)}，少 ${money(legal - pay)}`;
    }
  } else {
    const mul = multiplierFor(editingKey);
    const t = dateType(editingKey);
    const label = t === 'holiday' ? '节假日' : t === 'weekend' ? '周末' : '平时';
    txt = `${label}：${money(hr)} × ${mul} 倍 × ${ot} 小时 = ${money(ot * hr * mul)}`;
  }
  if (short > 0) txt += `；正班少 ${short} 小时，扣 ${money(short * hr)}`;
  return txt;
}

function tempCalcText() {
  const h = Number(editorDraft.hours) || 0;
  const r = editorDraft.rate === '' ? state.data.temp.settings.rate : Number(editorDraft.rate);
  return `${h} 小时 × ${money(r)} = <b>${money(h * r)}</b>`;
}

function pieceCalcTotal() {
  return round2(sum((editorDraft.items || []).map(it => (Number(it.qty) || 0) * (Number(it.rate) || 0))));
}

function siteCalcText() {
  const d = editorDraft;
  const parts = [];
  let total = 0;
  if (d.unit === 'day') {
    const v = (Number(d.units) || 0) * (Number(d.dayRate) || 0);
    total += v;
    parts.push(`${Number(d.units) || 0} 个工 × ${money(Number(d.dayRate) || 0)} = ${money(v)}`);
  } else if (d.unit === 'hour') {
    const v = (Number(d.hours) || 0) * (Number(d.hourRate) || 0);
    total += v;
    parts.push(`${Number(d.hours) || 0} 小时 × ${money(Number(d.hourRate) || 0)} = ${money(v)}`);
  }
  const ot = (Number(d.otHours) || 0) * (Number(d.otRate) || 0);
  if (ot) { total += ot; parts.push(`加班 ${money(ot)}`); }
  const pk = (Number(d.pkgQty) || 0) * (Number(d.pkgRate) || 0);
  if (pk) { total += pk; parts.push(`包工 ${money(pk)}`); }
  if (!parts.length) return '还没填工量，填完这里会算钱。';
  return parts.join(' · ') + ` ≈ <b>${money(total)}</b>`;
}

/* ---------- 交互 ---------- */
function bindEditorStatic() {
  const body = $('editorBody');
  if (!body) return;
  body.addEventListener('input', onEditorInput);
  body.addEventListener('change', onEditorInput);
  syncCalcHint();
}

function onEditorInput(e) {
  const t = e.target;
  if (!t || !t.dataset || !t.dataset.field) return;
  const f = t.dataset.field;
  if (f.indexOf('pname') === 0) {
    const i = Number(f.replace('pname', ''));
    if (editorDraft.items[i]) editorDraft.items[i].name = t.value;
    onPieceNameChange(i, t.value);
    return;
  }
  if (f.indexOf('pqty') === 0) {
    const i = Number(f.replace('pqty', ''));
    if (editorDraft.items[i]) editorDraft.items[i].qty = t.value;
    syncCalcHint();
    return;
  }
  if (f.indexOf('prate') === 0) {
    const i = Number(f.replace('prate', ''));
    if (editorDraft.items[i]) editorDraft.items[i].rate = t.value;
    syncCalcHint();
    return;
  }
  if (SPLIT_FIELDS.includes(f)) {
    const idx = SPLIT_FIELDS.indexOf(f);
    const v = t.value === '' ? 0 : num(t.value, 0, 0, 24);
    rebalanceSplit(idx, v);
    syncSplitInputs();
    syncCalcHint();
    return;
  }
  editorDraft[f] = t.value;
  syncCalcHint();
}

function onPieceNameChange(i, name) {
  const s = state.data.piece.settings;
  const found = s.items.find(x => x.name === name);
  if (found && editorDraft.items[i]) {
    editorDraft.items[i].rate = String(found.rate || '');
    const row = document.querySelector(`#editorBody .piece-row[data-pi="${i}"]`);
    if (row) {
      const ri = row.querySelector('input[data-field^="prate"]');
      if (ri) ri.value = found.rate || '';
    }
    syncCalcHint();
  }
}

function syncCalcHint() {
  const el = $('calcHint');
  if (!el || !editorDraft || !editingKey) return;
  if (editorKind === 'regular') el.innerHTML = regularCalcText();
  else if (editorKind === 'temp') el.innerHTML = tempCalcText();
  else if (editorKind === 'piece') el.innerHTML = money(pieceCalcTotal());
  else if (editorKind === 'site' && editorDraft.type === 'work') el.innerHTML = siteCalcText();
}

function readEditorValues() {
  // 已由 input 事件同步；这里补一遍防止键盘输入未触发 input
  $$('#editorBody input[data-field]').forEach(inp => {
    const f = inp.dataset.field;
    if (f.indexOf('pname') === 0) {
      const i = Number(f.replace('pname', ''));
      if (editorDraft.items[i]) editorDraft.items[i].name = inp.value;
    } else if (f.indexOf('pqty') === 0) {
      const i = Number(f.replace('pqty', ''));
      if (editorDraft.items[i]) editorDraft.items[i].qty = inp.value;
    } else if (f.indexOf('prate') === 0) {
      const i = Number(f.replace('prate', ''));
      if (editorDraft.items[i]) editorDraft.items[i].rate = inp.value;
    } else if (SPLIT_FIELDS.includes(f)) {
      const idx = SPLIT_FIELDS.indexOf(f);
      if (!Array.isArray(editorDraft.otSplit)) editorDraft.otSplit = [0, 0, 0];
      editorDraft.otSplit[idx] = inp.value === '' ? 0 : num(inp.value, 0, 0, 24);
    } else {
      editorDraft[f] = inp.value;
    }
  });
}

function refreshEditorBody() {
  const box = $('editorBody');
  if (!box) return;
  const rec = state.data[editorKind].records[editingKey] || null;
  box.innerHTML = editorBodyHTML(rec);
  syncCalcHint();
}

function saveEntry() {
  const k = editingKey, kind = editorKind;
  readEditorValues();
  const err = $('entryError');
  const fail = msg => { if (err) err.textContent = msg; };
  if (err) err.textContent = '';
  const note = String(editorDraft.note || '').slice(0, 100);
  let rec = null;

  if (kind === 'regular') {
    const shift = editorDraft.shift;
    const isLeave = !WORK_SHIFTS.includes(shift);
    const ot = Number(editorDraft.otHours) || 0;
    const rh = editorDraft.regularHours === '' ? null : Number(editorDraft.regularHours);
    if (ot < 0 || ot > 24) return fail('加班小时要在 0–24 之间');
    if (rh !== null && (rh < 0 || rh > 24)) return fail('正班工时要在 0–24 之间');
    let otSplit = null;
    if (!isLeave && editorDraft.showSplit) {
      const arr = (editorDraft.otSplit || [0, 0, 0]).map(x => round2(num(x, 0, 0, 24)));
      const ssum = round2(sum(arr));
      if (ssum > 0) {
        if (Math.abs(ssum - ot) > 0.005) return fail(`拆分合计 ${ssum} 小时，和加班总数 ${ot} 小时对不上`);
        otSplit = arr;
      }
    }
    rec = { shift, otHours: isLeave ? 0 : ot, otSplit: isLeave ? null : otSplit, regularHours: isLeave ? null : (rh === null || rh >= state.data.regular.settings.hoursPerDay ? null : rh), note };
  } else if (kind === 'temp') {
    const hours = Number(editorDraft.hours) || 0;
    const rate = editorDraft.rate === '' ? state.data.temp.settings.rate : Number(editorDraft.rate) || 0;
    if (hours < 0 || hours > 24) return fail('工时要在 0–24 之间');
    if (rate < 0) return fail('单价不能是负数');
    if (editorDraft.shift !== '休息' && hours === 0 && !note) return fail('填一下工时，或者选「休息」');
    rec = { shift: editorDraft.shift, hours: editorDraft.shift === '休息' ? 0 : hours, rate, note };
  } else if (kind === 'piece') {
    const items = (editorDraft.items || []).map(it => ({
      name: String(it.name || '').slice(0, 20),
      qty: Number(it.qty) || 0,
      rate: Number(it.rate) || 0
    })).filter(it => it.qty > 0 || it.rate > 0 || it.name);
    if (!items.length) return fail('至少填一行件数和单价');
    for (const it of items) {
      if (it.qty < 0 || it.qty > 1e6) return fail('数量不对');
      if (it.rate < 0) return fail('单价不能是负数');
      if (it.qty > 0 && it.rate === 0) return fail(`「${it.name || '未命名'}」还没填单价`);
    }
    rec = { items, note };
  } else {
    const d = editorDraft;
    if (d.type === 'work') {
      if (d.unit === 'day') {
        const u = Number(d.units) || 0;
        const r = Number(d.dayRate) || 0;
        if (u < 0 || u > 30) return fail('个工数要在 0–30 之间');
        if (u > 0 && r <= 0) return fail('填一下日薪（元 / 个工）');
        rec = { type: 'work', unit: 'day', units: u, dayRate: r, hours: 0, hourRate: 0, otHours: Number(d.otHours) || 0, otRate: Number(d.otRate) || 0, pkgQty: Number(d.pkgQty) || 0, pkgRate: Number(d.pkgRate) || 0, amount: 0, note };
      } else if (d.unit === 'hour') {
        const h = Number(d.hours) || 0;
        const r = Number(d.hourRate) || 0;
        if (h < 0 || h > 24) return fail('工时要在 0–24 之间');
        if (h > 0 && r <= 0) return fail('填一下时薪');
        rec = { type: 'work', unit: 'hour', hours: h, hourRate: r, units: 0, dayRate: 0, otHours: Number(d.otHours) || 0, otRate: Number(d.otRate) || 0, pkgQty: Number(d.pkgQty) || 0, pkgRate: Number(d.pkgRate) || 0, amount: 0, note };
      } else {
        rec = { type: 'work', unit: 'rest', units: 0, hours: 0, dayRate: 0, hourRate: 0, otHours: 0, otRate: 0, pkgQty: 0, pkgRate: 0, amount: 0, note };
      }
    } else {
      const amt = Number(d.amount) || 0;
      if (amt <= 0) return fail(d.type === 'borrow' ? '填一下借支金额' : '填一下结算金额');
      rec = { type: d.type, unit: 'day', units: 0, hours: 0, dayRate: 0, hourRate: 0, otHours: 0, otRate: 0, pkgQty: 0, pkgRate: 0, amount: amt, note };
    }
  }

  state.data[kind].records[k] = rec;
  persist(true);
  if (window.GongKeypad) window.GongKeypad.close();
  $('editor').close();
  editingKey = null;
  // 如果补记的日期不在当前查看的周期，自动跳到那个周期，避免"存了却看不到"
  const cycM = cycleMonthOf(k);
  if (cycM.y !== month.getFullYear() || cycM.m !== month.getMonth()) {
    month = new Date(cycM.y, cycM.m, 1);
  }
  render();
  toast(kind === 'site' && rec.type === 'borrow' ? '借支已记' : kind === 'site' && rec.type === 'settle' ? '结算已记' : '已保存');
}

function deleteCurrentRecord() {
  if (!editingKey) return;
  const k = editingKey, kind = editorKind;
  confirmDialog('删除记录', '这一天（' + k + '）的记录会被删除，确定吗？', () => {
    delete state.data[kind].records[k];
    persist(true);
    $('editor').close();
    editingKey = null;
    render();
    toast('已删除');
  });
}
