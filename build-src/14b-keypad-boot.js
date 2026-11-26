/* =====================================================================
   键盘模块自举
   - 把 KP_CSS 注入 <head>，把 KP_DOM 注入 <body>
   - 绑定输入框 → 键盘的触发逻辑
   - 对外暴露 window.GongKeypad，主程序只通过它开/关键盘
   依赖主程序已有的全局工具：$ / $$ / esc / persist / toast
   ===================================================================== */
(function () {
  'use strict';

  if (window.__gongKeypadBooted) return;
  window.__gongKeypadBooted = true;

  /* ---------- 1. 注入样式 ---------- */
  if (!document.getElementById('gkStyle')) {
    const st = document.createElement('style');
    st.id = 'gkStyle';
    st.textContent = KP_CSS;
    document.head.appendChild(st);
  }

  /* ---------- 2. 注入键盘 DOM ---------- */
  kpEnsureDom();

  /* ---------- 3. 绑定事件 ---------- */
  // 脚本在 body 末尾，DOM 已经就绪，这里立即绑定一次；
  // 不把绑定全押在 DOMContentLoaded 上，避免脚本被内联进单文件时抢在事件之前。
  function boot() {
    if (window.__gongKpEventsBound) return;
    window.__gongKpEventsBound = true;
    try {
      makeTextInputsCustom();
      bindKeypadTriggers();
    } catch (e) {
      /* 某个输入框还没生成也不影响后面点击时按需绑定 */
    }
  }
  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);

  /* ---------- 4. 对外接口 ---------- */
  window.GongKeypad = {
    /** 打开键盘并绑定到某个 input */
    open: function (input) { if (input) kpToggle(true, input); },
    /** 收起键盘（没开时也做一次归位，把误挂在弹窗里的键盘移回 body） */
    close: function () { kpToggle(false); },
    /** 通用开关 */
    toggle: function (open, input) { kpToggle(!!open, input || kpInput); },
    isOpen: function () { return !!kpOpen; },
    /** 当前状态（调试 / 自动化用） */
    state: function () {
      return {
        open: kpOpen, mode: kpMode, buf: kpBuf,
        cands: kpCands, page: kpPage, seg: kpSeg,
        input: kpInput, lastTextMode: kpLastTextMode
      };
    },
    pick: function (i) { kpPickIndex(i); },
    press: function (k) { kpPress(k); },
    /** 切换「用手机自带键盘 / 用内置键盘」，由关于弹窗调用 */
    setSystemKb: function (on) {
      if (on) {
        if (kpOpen) kpToggle(false);
        kpApplySystemKbUI();          // 清掉 readonly / inputmode=none，系统键盘才弹得出来
      } else {
        $$('input[data-text]').forEach(function (el) { try { el.readOnly = true; } catch (e) { } });
      }
    },
    isSystemKb: function () { return kpSysKbOn(); },
    /** 拼音 / 九键分析（给外部做联想时用） */
    analyze: function (raw) { return pyAnalyze(raw); },
    analyzeT9: function (digits) { return t9Analyze(digits); },
    version: '4.4'
  };
})();
