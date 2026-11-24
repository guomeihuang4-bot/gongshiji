#!/usr/bin/env bash
# 把分区源码拼成单文件 工时记.html
set -euo pipefail
cd "$(dirname "$0")"
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
  cat 08a-lex.js
  cat 08b-pinyin.js
  cat 09-calc.js
  cat 10-render-calendar.js
  cat 11-render-details.js
  cat 12-render-settings.js
  cat 13-editor.js
  cat 14-keypad.js
  cat 15-dialogs.js
  cat 16-events.js
  cat 17-tail.html
} > "$OUT"
echo "built: $OUT ($(wc -c < "$OUT") bytes, $(wc -l < "$OUT") lines)"
