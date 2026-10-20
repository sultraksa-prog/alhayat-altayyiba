package com.alhayat.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // تسجيل جسر الأندرويد الأصلي ليتصل بكود الجافاسكربت فوراً
        bridge.getWebView().addJavascriptInterface(new NativeAlarmBridge(this), "AndroidBridge");
    }

    @Override
    public void onResume() {
        super.onResume();
        checkAndHandleFloatingTasbeehResume(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        checkAndHandleFloatingTasbeehResume(intent);
    }

    private void checkAndHandleFloatingTasbeehResume(Intent intent) {
        android.content.SharedPreferences sp = getSharedPreferences("AlHayatTasbeehPrefs", MODE_PRIVATE);
        boolean autoOpen = sp.getBoolean("autoOpenOnLaunch", true);
        boolean fromLongPress = intent != null && "tasbeeh".equals(intent.getStringExtra("navigateToScreen"));

        if (FloatingTasbeehService.isServiceRunning() || fromLongPress) {
            if (autoOpen || fromLongPress) {
                Intent stopService = new Intent(this, FloatingTasbeehService.class);
                stopService(stopService);

                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().postDelayed(() -> {
                        bridge.getWebView().evaluateJavascript(
                                "if(typeof window.syncFloatingTasbeehToApp === 'function') window.syncFloatingTasbeehToApp(true);",
                                null
                        );
                    }, 250);
                }
            }
        } else {
            // مزامنة الأرقام حتى لو كانت الخدمة قد أُغلقت مسبقاً
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().postDelayed(() -> {
                    bridge.getWebView().evaluateJavascript(
                            "if(typeof window.syncFloatingTasbeehToApp === 'function') window.syncFloatingTasbeehToApp(false);",
                            null
                    );
                }, 250);
            }
        }
    }
}
