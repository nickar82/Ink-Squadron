package com.inksquadron.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

/**
 * Ink Squadron – native shell around the HTML5 game in assets/.
 * Fullscreen, notch safe-area, Back button, vibration, pause/resume,
 * plus bridges to AdMob (AdsManager), Play Games (PgsManager) and Nearby (NearbyManager).
 */
public class MainActivity extends Activity {

    private WebView webView;
    private FrameLayout root;
    AdsManager ads;
    PgsManager pgs;
    NearbyManager nearby;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#F3F6FC"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#F3F6FC"));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setHapticFeedbackEnabled(false);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        ads = new AdsManager(this);
        pgs = new PgsManager(this);
        nearby = new NearbyManager(this);
        webView.addJavascriptInterface(new GameBridge(this), "AndroidBridge");

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int top = 0, bottom = 0, left = 0, right = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                DisplayCutout dc = insets.getDisplayCutout();
                if (dc != null) {
                    top = dc.getSafeInsetTop();
                    bottom = dc.getSafeInsetBottom();
                    left = dc.getSafeInsetLeft();
                    right = dc.getSafeInsetRight();
                }
            }
            v.setPadding(left, top, right, bottom);
            return insets;
        });
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl("file:///android_asset/index.html");
        hideSystemUi();

        ads.start();   // consent form (EU) → AdMob → App Open ad on launch
        pgs.start();   // Play Games sign-in (only when a real project id is configured)
    }

    /** Calls a JS function safely from any thread. */
    void js(final String code) {
        runOnUiThread(() -> { if (webView != null) webView.evaluateJavascript(code, null); });
    }

    void netEvent(JSONObject o) {
        js("window.inkNet&&window.inkNet.onEvent(" + JSONObject.quote(o.toString()) + ")");
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            w.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("(window.inkBack && window.inkBack()) ? 'y' : 'n'", value -> {
            if (value == null || !value.contains("y")) finish();
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        nearby.onPermissionsResult(requestCode, grantResults);
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript("window.inkPause && window.inkPause()", null);
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript("window.inkResume && window.inkResume()", null);
        }
        hideSystemUi();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (nearby != null) nearby.stop();
        if (webView != null) {
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    /** Methods callable from JavaScript as window.AndroidBridge.* */
    public static class GameBridge {
        private final MainActivity a;

        GameBridge(MainActivity a) { this.a = a; }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void vibrate(int ms) {
            try {
                Vibrator v = (Vibrator) a.getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null || !v.hasVibrator()) return;
                int d = Math.max(5, Math.min(ms, 400));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.vibrate(VibrationEffect.createOneShot(d, VibrationEffect.DEFAULT_AMPLITUDE));
                else v.vibrate(d);
            } catch (Exception ignored) { }
        }

        // ---- ads ----
        @JavascriptInterface public void adsInterstitial(String reason) { a.ads.showInterstitial(); }
        @JavascriptInterface public void adsPrivacy() { a.ads.showPrivacyOptions(); }

        // ---- Play Games ----
        @JavascriptInterface public boolean pgsAvailable() { return a.pgs.isConfigured(); }
        @JavascriptInterface public void pgsSignIn() { a.pgs.signIn(); }
        @JavascriptInterface public void pgsAchievement(String key, int inc) { a.pgs.achievement(key, inc); }
        @JavascriptInterface public void pgsScore(String key, int value) { a.pgs.score(key, value); }
        @JavascriptInterface public void pgsShowAchievements() { a.pgs.showAchievements(); }
        @JavascriptInterface public void pgsShowLeaderboards() { a.pgs.showLeaderboards(); }

        // ---- Nearby (Wi-Fi / Bluetooth) ----
        @JavascriptInterface public boolean netAvailable() { return true; }
        @JavascriptInterface public void netHost(String name) { a.nearby.host(name); }
        @JavascriptInterface public void netJoin(String name) { a.nearby.join(name); }
        @JavascriptInterface public void netSend(String data) { a.nearby.send(data); }
        @JavascriptInterface public void netStop() { a.nearby.stop(); }
    }
}
