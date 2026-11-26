package com.dsha.gongshiji;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int REQ_FILE = 1001;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 23) {
            w.setStatusBarColor(Color.parseColor("#F5F7FB"));
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);

        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = cb;
                boolean wantImage = false;
                try {
                    String[] accepts = params.getAcceptTypes();
                    if (accepts != null) {
                        for (String a : accepts) {
                            if (a != null && a.toLowerCase().contains("image")) { wantImage = true; break; }
                        }
                    }
                } catch (Exception ignored) { }
                Intent intent = null;
                if (wantImage) {
                    // 系统相册/图片选择器（覆盖壁纸这种入口直接进相册，不让人去文件管理器里翻）
                    if (Build.VERSION.SDK_INT >= 33) {
                        try {
                            intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
                            intent.setType("image/*");
                        } catch (Exception ignored) { intent = null; }
                    }
                    if (intent == null) {
                        intent = new Intent(Intent.ACTION_GET_CONTENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("image/*");
                    }
                    intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
                } else {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                }
                try {
                    startActivityForResult(Intent.createChooser(intent, wantImage ? "选择图片" : "选择文件"), REQ_FILE);
                } catch (Exception e) {
                    // 找不到图片选择器时退回通用文件选择
                    try {
                        Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
                        fallback.addCategory(Intent.CATEGORY_OPENABLE);
                        fallback.setType(wantImage ? "image/*" : "*/*");
                        startActivityForResult(Intent.createChooser(fallback, "选择文件"), REQ_FILE);
                    } catch (Exception e2) {
                        filePathCallback = null;
                        return false;
                    }
                }
                return true;
            }

            @Override
            public boolean onJsAlert(WebView v, String url, String msg, JsResult r) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(msg)
                        .setPositiveButton("知道了", (d, which) -> r.confirm())
                        .setCancelable(false)
                        .show();
                return true;
            }
        });

        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            if (filePathCallback != null) {
                Uri[] arr = null;
                if (res == RESULT_OK && data != null) {
                    if (data.getClipData() != null && data.getClipData().getItemCount() > 0) {
                        int n = data.getClipData().getItemCount();
                        arr = new Uri[n];
                        for (int k = 0; k < n; k++) arr[k] = data.getClipData().getItemAt(k).getUri();
                    } else if (data.getData() != null) {
                        arr = new Uri[]{data.getData()};
                    }
                }
                filePathCallback.onReceiveValue(arr);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(req, res, data);
    }

    /** 返回键：先让网页处理（关弹窗、收回键盘、回日历），没处理才退出 */
    @Override
    public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        try {
            web.evaluateJavascript(
                    "(function(){try{return (window.__onBack && window.__onBack()) ? '1' : '0';}catch(e){return '0';}})()",
                    value -> {
                        String v = value == null ? "" : value.replace("\"", "");
                        if (!"1".equals(v)) {
                            if (web.canGoBack()) web.goBack();
                            else finish();
                        }
                    });
        } catch (Exception e) {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK) {
            onBackPressed();
            return true;
        }
        return super.onKeyDown(code, e);
    }

    public class Bridge {
        @JavascriptInterface
        public String kvGet(String key) {
            return getSharedPreferences("gongshiji", MODE_PRIVATE).getString(key, null);
        }

        @JavascriptInterface
        public void kvSet(String key, String value) {
            getSharedPreferences("gongshiji", MODE_PRIVATE).edit().putString(key, value).commit();
        }

        /** 文本导出（备份 JSON / CSV）到「下载」 */
        @JavascriptInterface
        public void saveFile(final String name, final String content) {
            runOnUiThread(() -> {
                String safe = (name == null ? "backup.json" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
                try {
                    if (Build.VERSION.SDK_INT >= 29) {
                        ContentValues cv = new ContentValues();
                        cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                        cv.put(MediaStore.Downloads.MIME_TYPE, safe.endsWith(".csv") ? "text/csv" : "application/json");
                        cv.put(MediaStore.Downloads.IS_PENDING, 1);
                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                        if (uri == null) {
                            Toast.makeText(MainActivity.this, "保存失败：无法创建文件", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        OutputStream os = getContentResolver().openOutputStream(uri);
                        os.write(content.getBytes(StandardCharsets.UTF_8));
                        os.close();
                        cv.clear();
                        cv.put(MediaStore.Downloads.IS_PENDING, 0);
                        getContentResolver().update(uri, cv, null, null);
                        Toast.makeText(MainActivity.this, "已保存到「下载」：" + safe, Toast.LENGTH_LONG).show();
                    } else {
                        File dir = getExternalFilesDir("exports");
                        if (dir == null) dir = getFilesDir();
                        if (!dir.exists()) dir.mkdirs();
                        File f = new File(dir, safe);
                        FileOutputStream fos = new FileOutputStream(f);
                        fos.write(content.getBytes(StandardCharsets.UTF_8));
                        fos.close();
                        Toast.makeText(MainActivity.this, "已保存：" + f.getAbsolutePath(), Toast.LENGTH_LONG).show();
                    }
                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "保存失败：" + ex.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        /** 图片（工资条 PNG）base64 保存到相册/下载 */
        @JavascriptInterface
        public void saveBase64(final String name, final String base64) {
            runOnUiThread(() -> {
                String safe = (name == null ? "payslip.png" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
                try {
                    byte[] data = Base64.decode(base64, Base64.DEFAULT);
                    if (Build.VERSION.SDK_INT >= 29) {
                        ContentValues cv = new ContentValues();
                        cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                        cv.put(MediaStore.Downloads.MIME_TYPE, "image/png");
                        cv.put(MediaStore.Downloads.IS_PENDING, 1);
                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                        if (uri == null) {
                            Toast.makeText(MainActivity.this, "保存失败", Toast.LENGTH_SHORT).show();
                            return;
                        }
                        OutputStream os = getContentResolver().openOutputStream(uri);
                        os.write(data);
                        os.close();
                        cv.clear();
                        cv.put(MediaStore.Downloads.IS_PENDING, 0);
                        getContentResolver().update(uri, cv, null, null);
                        Toast.makeText(MainActivity.this, "工资条已保存到「下载」：" + safe, Toast.LENGTH_LONG).show();
                    } else {
                        File dir = getExternalFilesDir("exports");
                        if (dir == null) dir = getFilesDir();
                        if (!dir.exists()) dir.mkdirs();
                        File f = new File(dir, safe);
                        FileOutputStream fos = new FileOutputStream(f);
                        fos.write(data);
                        fos.close();
                        Toast.makeText(MainActivity.this, "已保存：" + f.getAbsolutePath(), Toast.LENGTH_LONG).show();
                    }
                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "保存图片失败：" + ex.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        /** 调起系统打印（可另存为 PDF） */
        @JavascriptInterface
        public void printPage() {
            runOnUiThread(() -> {
                try {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (pm == null) {
                        Toast.makeText(MainActivity.this, "当前设备没有打印服务", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    String jobName = "工时记工资条-" + System.currentTimeMillis();
                    PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(jobName);
                    PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                            .build();
                    pm.print(jobName, adapter, attrs);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "打印失败：" + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
