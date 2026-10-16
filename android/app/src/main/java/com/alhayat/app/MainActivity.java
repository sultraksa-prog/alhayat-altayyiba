package com.alhayat.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // تسجيل جسر الأندرويد الأصلي ليتصل بكود الجافاسكربت فوراً
        bridge.getWebView().addJavascriptInterface(new NativeAlarmBridge(this), "AndroidBridge");
    }
}