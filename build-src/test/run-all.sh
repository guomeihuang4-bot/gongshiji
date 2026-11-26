#!/usr/bin/env bash
# 工时记自动化长测试：依次运行 t1~t6
set -uo pipefail
cd "$(dirname "$0")"

if [ ! -d node_modules/jsdom ]; then
  echo "未找到 jsdom，尝试安装…"
  npm init -y >/dev/null 2>&1 || true
  npm i jsdom --silent || {
    echo "安装失败：请在有写入权限的目录（如 /tmp）中安装 jsdom 后复制 node_modules 过来"
    exit 1
  }
fi

fail=0
pass=0
for f in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 t12; do
  echo ""
  echo "════════════ $f ════════════"
  if node "$f.mjs"; then
    pass=$((pass+1))
  else
    fail=$((fail+1))
  fi
done

echo ""
echo "════════════════════════════"
echo "测试文件通过：$pass，失败：$fail"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
