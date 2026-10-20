package com.alhayat.app;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class FloatingTasbeehService extends Service {
    private static boolean isRunning = false;
    private WindowManager windowManager;
    private View floatingWidgetView;
    private WindowManager.LayoutParams params;

    private String dhikrText = "سُبْحَانَ اللَّهِ";
    private int currentCount = 0;
    private int targetCount = 33;

    private TextView tvDhikr;
    private TextView tvCount;
    private TextView tvProgress;
    private TextView closeBtn;
    private Vibrator vibrator;

    // الإعدادات القابلة للتخصيص
    private float scaleFactor = 0.75f; // أصغر بنسبة 25% افتراضياً
    private boolean showCloseBtn = false; // مخفي افتراضياً
    private boolean longPressToOpen = true; // مفعّل افتراضياً
    private boolean preventEdgeOverlap = true; // مفعّل افتراضياً

    private final Handler longPressHandler = new Handler(Looper.getMainLooper());
    private Runnable longPressRunnable;
    private boolean isLongPressTriggered = false;

    public static boolean isServiceRunning() {
        return isRunning;
    }

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        isRunning = true;
        loadSettings();

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        floatingWidgetView = buildFloatingWidgetView();

        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = dp(20);
        params.y = dp(160);

        try {
            windowManager.addView(floatingWidgetView, params);
        } catch (Exception ignored) {}
    }

    private void loadSettings() {
        SharedPreferences sp = getSharedPreferences("AlHayatTasbeehPrefs", MODE_PRIVATE);
        int scalePercent = sp.getInt("scalePercent", 75);
        scaleFactor = Math.max(0.45f, Math.min(1.4f, scalePercent / 100.0f));
        showCloseBtn = sp.getBoolean("showCloseBtn", false);
        longPressToOpen = sp.getBoolean("longPressToOpen", true);
        preventEdgeOverlap = sp.getBoolean("preventEdgeOverlap", true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String txt = intent.getStringExtra("dhikrText");
            if (txt != null && !txt.isEmpty()) dhikrText = txt;
            currentCount = intent.getIntExtra("currentCount", currentCount);
            targetCount = intent.getIntExtra("targetCount", targetCount);
            loadSettings();
            updateUI();
        }
        return START_STICKY;
    }

    private View buildFloatingWidgetView() {
        FrameLayout root = new FrameLayout(this);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);

        // حساب الأبعاد المحسوبة بالنسبة المطلوبة
        int padH = dp(28 * scaleFactor);
        int padV = dp(18 * scaleFactor);
        card.setPadding(padH, padV, padH, padV);
        card.setMinimumWidth(dp(160 * scaleFactor));

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#09203F")); // الكحلي الملكي
        bg.setCornerRadius(dp(30 * scaleFactor));
        bg.setStroke(dp(2.8f * Math.max(0.7f, scaleFactor)), Color.parseColor("#D4AF37")); // الإطار الذهبي
        card.setBackground(bg);

        // 1. نص الذكر
        tvDhikr = new TextView(this);
        tvDhikr.setText(dhikrText);
        tvDhikr.setTextColor(Color.parseColor("#FDE68A"));
        tvDhikr.setTextSize(17f * scaleFactor);
        tvDhikr.setTypeface(null, android.graphics.Typeface.BOLD);
        tvDhikr.setGravity(Gravity.CENTER);

        // 2. العداد الكبير
        tvCount = new TextView(this);
        tvCount.setText(String.valueOf(currentCount));
        tvCount.setTextColor(Color.WHITE);
        tvCount.setTextSize(50f * scaleFactor);
        tvCount.setTypeface(null, android.graphics.Typeface.BOLD);
        tvCount.setGravity(Gravity.CENTER);

        // 3. الهدف والتقدم
        tvProgress = new TextView(this);
        tvProgress.setText(currentCount + " / " + targetCount);
        tvProgress.setTextColor(Color.parseColor("#86EFAC"));
        tvProgress.setTextSize(14f * scaleFactor);
        tvProgress.setTypeface(null, android.graphics.Typeface.BOLD);
        tvProgress.setGravity(Gravity.CENTER);

        card.addView(tvDhikr);
        card.addView(tvCount);
        card.addView(tvProgress);

        // زر إغلاق (✕) مخفي افتراضياً ويظهر عند تفعيله في الإعدادات
        closeBtn = new TextView(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.parseColor("#FCD34D"));
        closeBtn.setTextSize(13f * scaleFactor);
        closeBtn.setTypeface(null, android.graphics.Typeface.BOLD);
        closeBtn.setPadding(dp(12), dp(6), dp(12), dp(6));
        closeBtn.setVisibility(showCloseBtn ? View.VISIBLE : View.GONE);
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.END
        );
        closeBtn.setLayoutParams(closeParams);
        closeBtn.setOnClickListener(v -> stopSelf());

        root.addView(card);
        root.addView(closeBtn);

        // معالجة اللمس: العدّ + السحب مع حماية الحواف + الضغط المطول 3 ثوانٍ
        card.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private long touchStartTime;
            private boolean isMoving = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = System.currentTimeMillis();
                        isMoving = false;
                        isLongPressTriggered = false;

                        // بدء عداد الـ 3 ثوانٍ لفتح التطبيق
                        if (longPressToOpen) {
                            longPressRunnable = () -> {
                                isLongPressTriggered = true;
                                vibratePulse(true);
                                openAppAndDismiss();
                            };
                            longPressHandler.postDelayed(longPressRunnable, 3000);
                        }
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        float diffXMove = Math.abs(event.getRawX() - initialTouchX);
                        float diffYMove = Math.abs(event.getRawY() - initialTouchY);

                        if (diffXMove > dp(10) || diffYMove > dp(10)) {
                            isMoving = true;
                            // إلغاء مؤقت الضغط المطول عند السحب
                            longPressHandler.removeCallbacks(longPressRunnable);
                        }

                        int newX = initialX + (int) (event.getRawX() - initialTouchX);
                        int newY = initialY + (int) (event.getRawY() - initialTouchY);

                        // تطبيق الحدود الرياضية لمنع خروج أو تداخل المسبحة مع حواف الشاشة
                        if (preventEdgeOverlap && windowManager != null) {
                            Point screenSize = new Point();
                            windowManager.getDefaultDisplay().getSize(screenSize);
                            int cardW = (floatingWidgetView != null && floatingWidgetView.getWidth() > 0)
                                    ? floatingWidgetView.getWidth() : dp(160 * scaleFactor);
                            int cardH = (floatingWidgetView != null && floatingWidgetView.getHeight() > 0)
                                    ? floatingWidgetView.getHeight() : dp(140 * scaleFactor);

                            int margin = dp(10);
                            newX = Math.max(margin, Math.min(newX, screenSize.x - cardW - margin));
                            newY = Math.max(dp(25), Math.min(newY, screenSize.y - cardH - dp(35)));
                        }

                        params.x = newX;
                        params.y = newY;
                        try {
                            windowManager.updateViewLayout(floatingWidgetView, params);
                        } catch (Exception ignored) {}
                        return true;

                    case MotionEvent.ACTION_UP:
                        longPressHandler.removeCallbacks(longPressRunnable);

                        if (isLongPressTriggered) {
                            return true;
                        }

                        long duration = System.currentTimeMillis() - touchStartTime;
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);

                        // نقرة سريعة دون سحب -> زيادة العداد
                        if (!isMoving && duration < 350 && diffX < dp(12) && diffY < dp(12)) {
                            onWidgetTapped();
                        }
                        return true;

                    case MotionEvent.ACTION_CANCEL:
                        longPressHandler.removeCallbacks(longPressRunnable);
                        return true;
                }
                return false;
            }
        });

        return root;
    }

    private void openAppAndDismiss() {
        try {
            Intent openAppIntent = new Intent(this, MainActivity.class);
            openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openAppIntent.putExtra("navigateToScreen", "tasbeeh");
            startActivity(openAppIntent);
        } catch (Exception ignored) {}
        stopSelf();
    }

    private void onWidgetTapped() {
        currentCount++;
        if (targetCount > 0 && currentCount >= targetCount) {
            currentCount = 0;
            vibratePulse(true);
        } else {
            vibratePulse(false);
        }

        updateUI();
        saveCountLocally();
    }

    private void updateUI() {
        if (tvDhikr != null) {
            String shortTxt = dhikrText.length() > 22 ? dhikrText.substring(0, 20) + ".." : dhikrText;
            tvDhikr.setText(shortTxt);
        }
        if (tvCount != null) tvCount.setText(String.valueOf(currentCount));
        if (tvProgress != null) {
            String targetStr = targetCount > 0 ? String.valueOf(targetCount) : "∞";
            tvProgress.setText(currentCount + " / " + targetStr);
        }
        if (closeBtn != null) {
            closeBtn.setVisibility(showCloseBtn ? View.VISIBLE : View.GONE);
        }
    }

    private void vibratePulse(boolean isComplete) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (isComplete) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 80, 50, 100}, -1));
                } else {
                    vibrator.vibrate(VibrationEffect.createOneShot(26, VibrationEffect.DEFAULT_AMPLITUDE));
                }
            } else {
                vibrator.vibrate(isComplete ? 120 : 26);
            }
        } catch (Exception ignored) {}
    }

    private void saveCountLocally() {
        SharedPreferences sp = getSharedPreferences("AlHayatTasbeeh", MODE_PRIVATE);
        sp.edit().putInt("floating_count", currentCount).apply();
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        longPressHandler.removeCallbacksAndMessages(null);
        if (floatingWidgetView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingWidgetView);
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
