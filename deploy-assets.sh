#!/usr/bin/env bash
# 把构建产物放进 APK 的 assets 目录（打包前跑一次，只复制不构建）
#
# 用单文件版：工时记-单文件.html → assets/index.html
# 键盘已内联在单文件里，assets 只留 index.html 一个文件（不再需要 keypad.js）。
# 这样 WebView 只加载一个资源，不会出现「键盘没出来」的问题，旧版 APK 也是这么打的。
set -euo pipefail
cd "$(dirname "$0")"
DEST="gongshiji-app/app/src/main/assets"
[ -d "$DEST" ] || { echo "找不到 $DEST，先确认 apk 工程还在"; exit 1; }
[ -f 工时记-单文件.html ] || { echo "缺少 工时记-单文件.html，先在 build-src 里跑 bash build.sh"; exit 1; }
cp 工时记-单文件.html "$DEST/index.html"
rm -f "$DEST/keypad.js"
echo "已放进 assets："
ls -la "$DEST"
echo
echo "接着打包：cd gongshiji-app && ./build.sh assembleRelease"
