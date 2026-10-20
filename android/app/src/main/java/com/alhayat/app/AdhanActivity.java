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

        // 2. تفعيل حساس قلب الهاتف لكتم الصوت (Flip to Mute)
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (accelerometer != null) {
                sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
            }
        }

        String incomingPrayerName = getIntent().getStringExtra("prayerName");
        final String prayerName = (incomingPrayerName != null && !incomingPrayerName.isEmpty()) ? incomingPrayerName : "المنبه";
        final String customAudioPath = getIntent().getStringExtra("customAudioPath");
        final boolean isGeneralAlarm = getIntent().getBooleanExtra("isGeneralAlarm", false);

        // 3. بناء شاشة منبه ملكية كاملة ملء الشاشة (إنهاء الشاشة البيضاء نهائياً)
        LinearLayout rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setGravity(Gravity.CENTER);
        rootLayout.setPadding(60, 80, 60, 60);

        // خلفية كحلية ملكية متدرجة تملأ كامل شاشة الهاتف
        GradientDrawable fullBg = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{Color.parseColor("#09203F"), Color.parseColor("#113F67")}
        );
        rootLayout.setBackground(fullBg);

        // الساعة الرقمية الكبيرة الحية في المركز
        java.text.SimpleDateFormat timeFmt = new java.text.SimpleDateFormat("hh:mm", java.util.Locale.getDefault());
        java.text.SimpleDateFormat amPmFmt = new java.text.SimpleDateFormat("a", new java.util.Locale("ar"));
        String currentTimeStr = timeFmt.format(new java.util.Date());
        String currentAmPmStr = amPmFmt.format(new java.util.Date());

        TextView timeText = new TextView(this);
        timeText.setText(currentTimeStr + " " + currentAmPmStr);
        timeText.setTextColor(Color.parseColor("#FDE68A")); // ذهبي وهاج
        timeText.setTextSize(48f);
        timeText.setTypeface(null, android.graphics.Typeface.BOLD);
        timeText.setGravity(Gravity.CENTER);

        // اسم المنبه أو الصلاة بخط واضح وكبير
        TextView titleText = new TextView(this);
        titleText.setText(isGeneralAlarm ? ("⏰ " + prayerName) : ("🕌 حان الآن أذان " + prayerName));
        titleText.setTextColor(Color.WHITE);
        titleText.setTextSize(22f);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);
        titleText.setGravity(Gravity.CENTER);
        titleText.setPadding(0, 16, 0, 40);

        // نص تذكيري بالهاتف
        TextView subText = new TextView(this);
        subText.setText("اقلب الهاتف على وجهه أو اضغط زر الصوت للإسكات");
        subText.setTextColor(Color.parseColor("#94A3B8"));
        subText.setTextSize(12f);
        subText.setGravity(Gravity.CENTER);
        subText.setPadding(0, 0, 0, 50);

        // حاوية أزرار الإجراءات السفلية العريضة
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.VERTICAL);
        btnRow.setGravity(Gravity.CENTER);

        // زر الغفوة (5 دقائق) يظهر للمنبهات العامة ويحتفظ بنفس الصوت المختار
        if (isGeneralAlarm) {
            Button snoozeBtn = new Button(this);
            snoozeBtn.setText("💤 غفوة (تأجيل 5 دقائق)");
            snoozeBtn.setTextColor(Color.parseColor("#09203F"));
            snoozeBtn.setTextSize(16f);
            snoozeBtn.setTypeface(null, android.graphics.Typeface.BOLD);

            GradientDrawable snoozeBg = new GradientDrawable();
            snoozeBg.setColor(Color.parseColor("#FCD34D")); // ذهبي المنبه
            snoozeBg.setCornerRadius(30f);
            snoozeBtn.setBackground(snoozeBg);
            snoozeBtn.setPadding(40, 22, 40, 22);

            LinearLayout.LayoutParams snzParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            snzParams.setMargins(0, 0, 0, 18);
            snoozeBtn.setLayoutParams(snzParams);

            snoozeBtn.setOnClickListener(v -> {
                // جدولة غفوة بعد 5 دقائق مع الاحتفاظ بنفس مسار الصوت الأصلي بالضبط
                long snoozeTime = System.currentTimeMillis() + (5 * 60 * 1000L);
                NativeAlarmBridge bridge = new NativeAlarmBridge(this);
                bridge.scheduleGeneralAlarm(
                        "snooze_" + System.currentTimeMillis(),
                        snoozeTime,
                        prayerName,
                        customAudioPath != null ? customAudioPath : "", // الاحتفاظ بنفس صوت التنبيه
                        true
                );

                // إرسال أمر للخدمة لإظهار إشعار الغفوة الثابت في شريط الهاتف
                Intent snoozeNotifIntent = new Intent(this, AdhanService.class);
                snoozeNotifIntent.setAction("SHOW_SNOOZE_NOTIFICATION");
                snoozeNotifIntent.putExtra("prayerName", prayerName);
                snoozeNotifIntent.putExtra("snoozeTimeMillis", snoozeTime);
                startService(snoozeNotifIntent);

                if (sensorManager != null) sensorManager.unregisterListener(this);
                finish();
            });
            btnRow.addView(snoozeBtn);
        }

        // زر إيقاف المنبه الأحمر الكبير
        Button stopBtn = new Button(this);
        stopBtn.setText("⏹ إيقاف المنبه");
        stopBtn.setTextColor(Color.WHITE);
        stopBtn.setTextSize(16f);
        stopBtn.setTypeface(null, android.graphics.Typeface.BOLD);

        GradientDrawable stopBtnBg = new GradientDrawable();
        stopBtnBg.setColor(Color.parseColor("#DC2626")); // أحمر المنبه
        stopBtnBg.setCornerRadius(30f);
        stopBtn.setBackground(stopBtnBg);
        stopBtn.setPadding(40, 22, 40, 22);

        LinearLayout.LayoutParams stopParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        stopBtn.setLayoutParams(stopParams);
        stopBtn.setOnClickListener(v -> dismissAlarmAndFinish());
        btnRow.addView(stopBtn);

        rootLayout.addView(timeText);
        rootLayout.addView(titleText);
        rootLayout.addView(subText);
        rootLayout.addView(btnRow);

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
