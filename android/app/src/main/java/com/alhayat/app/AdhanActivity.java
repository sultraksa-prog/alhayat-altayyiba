package com.alhayat.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class AdhanActivity extends Activity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private boolean isSensorArmed = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. إيقاظ الشاشة والعرض فوق شاشة القفل وفوق أي تطبيق
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        // 2. تفعيل حساس قلب الهاتف (Flip to Mute)
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (accelerometer != null) {
                sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
            }
        }

        String incomingPrayerName = getIntent().getStringExtra("prayerName");
        final String prayerName = (incomingPrayerName != null && !incomingPrayerName.isEmpty()) ? incomingPrayerName : "الصلاة";
        final boolean isGeneralAlarm = getIntent().getBooleanExtra("isGeneralAlarm", false);

        // 3. بناء الواجهة المنبثقة برمجياً ككرت عائم علوي فاخر مطابق لمنبه شاومي
        LinearLayout rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setGravity(Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        rootLayout.setPadding(30, 60, 30, 30);
        rootLayout.setBackgroundColor(Color.TRANSPARENT);
        // كرت المنبه العائم
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setPadding(30, 24, 30, 24);

        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#09203F")); // الكحلي الملكي
        cardBg.setCornerRadius(50f);
        cardBg.setStroke(3, Color.parseColor("#D4AF37")); // إطار ذهبي
        card.setBackground(cardBg);

        // نصوص المنبه
        LinearLayout textCol = new LinearLayout(this);
        textCol.setOrientation(LinearLayout.VERTICAL);
        textCol.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView titleText = new TextView(this);
        titleText.setText(isGeneralAlarm ? ("⏰ حان موعد: " + prayerName) : ("حان الآن أذان " + prayerName + " 🕌"));
        titleText.setTextColor(Color.parseColor("#FDE68A"));
        titleText.setTextSize(16f);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);

        TextView subText = new TextView(this);
        subText.setText("اضغط هنا لفتح التطبيق");
        subText.setTextColor(Color.parseColor("#E2E8F0"));
        subText.setTextSize(12f);

        textCol.addView(titleText);
        textCol.addView(subText);

        // حاوية أزرار الإجراءات
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setGravity(Gravity.CENTER_VERTICAL);

        // زر الغفوة (5 دقائق) يظهر فقط للمنبهات العامة
        if (isGeneralAlarm) {
            Button snoozeBtn = new Button(this);
            snoozeBtn.setText("💤 غفوة");
            snoozeBtn.setTextColor(Color.parseColor("#09203F"));
            snoozeBtn.setTextSize(13f);
            snoozeBtn.setTypeface(null, android.graphics.Typeface.BOLD);

            GradientDrawable snoozeBg = new GradientDrawable();
            snoozeBg.setColor(Color.parseColor("#FCD34D")); // ذهبي المنبه
            snoozeBg.setCornerRadius(30f);
            snoozeBtn.setBackground(snoozeBg);
            snoozeBtn.setPadding(20, 10, 20, 10);
            LinearLayout.LayoutParams snzParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            snzParams.setMargins(0, 0, 12, 0);
            snoozeBtn.setLayoutParams(snzParams);

            snoozeBtn.setOnClickListener(v -> {
                // جدولة غفوة تلقائية بعد 5 دقائق
                NativeAlarmBridge bridge = new NativeAlarmBridge(this);
                bridge.scheduleGeneralAlarm("snooze_" + System.currentTimeMillis(), System.currentTimeMillis() + (5 * 60 * 1000L), prayerName, "", true);
                dismissAlarmAndFinish();
            });
            btnRow.addView(snoozeBtn);
        }

        // زر إيقاف المنبه البارز
        Button stopBtn = new Button(this);
        stopBtn.setText("⏹ إيقاف");
        stopBtn.setTextColor(Color.WHITE);
        stopBtn.setTextSize(14f);
        stopBtn.setTypeface(null, android.graphics.Typeface.BOLD);

        GradientDrawable stopBtnBg = new GradientDrawable();
        stopBtnBg.setColor(Color.parseColor("#DC2626")); // أحمر المنبه
        stopBtnBg.setCornerRadius(30f);
        stopBtn.setBackground(stopBtnBg);
        stopBtn.setPadding(24, 12, 24, 12);
        stopBtn.setOnClickListener(v -> dismissAlarmAndFinish());

        btnRow.addView(stopBtn);

        // الضغط على الكرت يفتح التطبيق الرئيسي
        card.setOnClickListener(v -> {
            dismissAlarmAndFinish();
            Intent openApp = new Intent(this, MainActivity.class);
            openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(openApp);
        });

        card.addView(textCol);
        card.addView(btnRow);
        rootLayout.addView(card);

        setContentView(rootLayout);
    }

    // 4. التقاط أزرار خفض ورفع الصوت وزر الطاقة لإيقاف الأذان فوراً
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN ||
                keyCode == KeyEvent.KEYCODE_VOLUME_UP ||
                keyCode == KeyEvent.KEYCODE_POWER) {
            dismissAlarmAndFinish();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    // 5. التقاط حركة قلب الهاتف على وجهه لإيقاف الأذان (Flip to Mute)
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float z = event.values[2];
            // إذا كان الهاتف مرفوعاً وشاشته للأعلى
            if (z > 5.0f) {
                isSensorArmed = true;
            }
            // إذا تم قلب الهاتف لتكون شاشته للأسفل على السطح
            if (isSensorArmed && z < -7.0f) {
                dismissAlarmAndFinish();
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private void dismissAlarmAndFinish() {
        // إيقاف خدمة الصوت نهائياً
        Intent stopService = new Intent(this, AdhanService.class);
        stopService.setAction("STOP_ADHAN");
        startService(stopService);

        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        finish();
    }

    @Override
    protected void onDestroy() {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        super.onDestroy();
    }
}
