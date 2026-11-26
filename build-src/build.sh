#!/usr/bin/env bash
# 拆分成两份产物：
#   ../工时记.html   主程序：界面、记账、设置（不含键盘）
#   ../keypad.js     键盘模块：数字 / 英文 / 拼音26键 / 九键 / 手写（含词库与手写字库）
# 两个文件必须放在同一目录，工时记.html 用 <script src="keypad.js"> 引入键盘。
set -euo pipefail
cd "$(dirname "$0")"

# ---------- 1. 主程序 ----------
OUT="../工时记.html"
{
  cat 01-head.html
  cat 02-css-calendar.css
  cat 03-css-details.css
  cat 04-css-settings.css
  cat 05-css-dialogs.css
  cat 06b-css-extra.css
  cat 06-body.html
  cat 07-core.js
  cat 08-holiday.js
  cat 09-calc.js
  cat 10-render-calendar.js
  cat 11-render-details.js
  cat 12-render-settings.js
  cat 13-editor.js
  cat 15-dialogs.js
  cat 16-events.js
  cat 17-tail.html
} > "$OUT"

# ---------- 2. 键盘模块 ----------
KP="../keypad.js"
{
  cat <<'HEADER'
/* =====================================================================
   工时记 v1.0 · 键盘模块（独立文件）
   模式：数字 / 英文 / 拼音26键 / 拼音九键 / 手写
   完全离线：拼音词库、手写识别引擎与 9507 字手写字库全部内嵌，
   不联网、不请求任何外部资源。

   用法：与 工时记.html 放在同一目录，由 <script src="keypad.js"> 引入。
   对外接口：window.GongKeypad（open / close / toggle / isOpen / state）
   ===================================================================== */
HEADER
  cat 08a-lex.js
  cat 08b-pinyin.js
  cat 08c-hanzi-engine.js
  cat 08d-hanzi-data.js
  cat 14-keypad.js
  printf '\n/* ---------- 键盘样式（构建时内嵌，避免多一个 css 文件） ---------- */\nconst KP_CSS = `'
  cat 06c-css-keypad.css
  printf '`;\n'
  printf '\n/* ---------- 键盘 DOM 模板 ---------- */\nconst KP_DOM = `'
  cat 06d-keypad-dom.html
  printf '`;\n'
  cat 14b-keypad-boot.js
} > "$KP"

echo "built: $OUT ($(wc -c < "$OUT") bytes, $(wc -l < "$OUT") lines)"
echo "built: $KP ($(wc -c < "$KP") bytes, $(wc -l < "$KP") lines)"

# ---------- 3. 打包 APK 用：把键盘内联回单文件 ----------
# 开发时用「主程序 + keypad.js」，打包时用这一份，避免 WebView 加载外部 js 的兼容问题
SINGLE="../工时记-单文件.html"
python3 - "$OUT" "$KP" "$SINGLE" <<'PY'
import sys
main_path, kp_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
html = open(main_path, encoding='utf-8').read()
js = open(kp_path, encoding='utf-8').read()
tag = '<script src="keypad.js"></script>'
if tag not in html:
    raise SystemExit('主程序中找不到 keypad.js 引用，单文件合并失败')
open(out_path, 'w', encoding='utf-8').write(html.replace(tag, '<script>\n' + js + '\n</script>', 1))
PY
echo "built: $SINGLE ($(wc -c < "$SINGLE") bytes)"
