package com.alhayat.app;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
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
    private WindowManager windowManager;
    private View floatingWidgetView;
    private WindowManager.LayoutParams params;

    private String dhikrText = "سُبْحَانَ اللَّهِ";
    private int currentCount = 0;
    private int targetCount = 33;

    private TextView tvDhikr;
    private TextView tvCount;
    private TextView tvProgress;
    private Vibrator vibrator;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String txt = intent.getStringExtra("dhikrText");
            if (txt != null && !txt.isEmpty()) dhikrText = txt;
            currentCount = intent.getIntExtra("currentCount", 0);
            targetCount = intent.getIntExtra("targetCount", 33);
            updateUI();
        }
        return START_STICKY;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        // إنشاء وتصميم الكرت العائم برمجياً مطابقاً تماماً لصورة تطبيق منار
        floatingWidgetView = buildFloatingWidgetView();

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 40;
        params.y = 500;

        try {
            windowManager.addView(floatingWidgetView, params);
        } catch (Exception ignored) {}
    }

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private View buildFloatingWidgetView() {
        FrameLayout root = new FrameLayout(this);

        // الكرت الملكي المكبر (3 أضعاف الحجم السابق)
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        card.setPadding(dp(28), dp(20), dp(28), dp(20));
        card.setMinimumWidth(dp(170)); // عرض كبير وفسيح ومريح للمس

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#09203F")); // الكحلي الملكي لهوية التطبيق
        bg.setCornerRadius(dp(32));
        bg.setStroke(dp(3f), Color.parseColor("#D4AF37")); // إطار ذهبي مذهب بارز
        card.setBackground(bg);

        // 1. نص الذكر (مكبر باللون الذهبي الفاتح)
        tvDhikr = new TextView(this);
        tvDhikr.setText(dhikrText);
        tvDhikr.setTextColor(Color.parseColor("#FDE68A"));
        tvDhikr.setTextSize(18f);
        tvDhikr.setTypeface(null, android.graphics.Typeface.BOLD);
        tvDhikr.setGravity(Gravity.CENTER);

        // 2. العداد العملاق (واضح جداً من مسافة بعيدة)
        tvCount = new TextView(this);
        tvCount.setText(String.valueOf(currentCount));
        tvCount.setTextColor(Color.WHITE);
        tvCount.setTextSize(54f);
        tvCount.setTypeface(null, android.graphics.Typeface.BOLD);
        tvCount.setGravity(Gravity.CENTER);

        // 3. الهدف والتقدم (بالأخضر الزمردي المشرق)
        tvProgress = new TextView(this);
        tvProgress.setText(currentCount + " / " + targetCount);
        tvProgress.setTextColor(Color.parseColor("#86EFAC"));
        tvProgress.setTextSize(15f);
        tvProgress.setTypeface(null, android.graphics.Typeface.BOLD);
        tvProgress.setGravity(Gravity.CENTER);

        card.addView(tvDhikr);
        card.addView(tvCount);
        card.addView(tvProgress);

        // زر إغلاق أنيق في الزاوية
        TextView closeBtn = new TextView(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.parseColor("#FCD34D"));
        closeBtn.setTextSize(14f);
        closeBtn.setTypeface(null, android.graphics.Typeface.BOLD);
        closeBtn.setPadding(dp(14), dp(8), dp(14), dp(8));
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.END
        );
        closeBtn.setLayoutParams(closeParams);
        closeBtn.setOnClickListener(v -> stopSelf());

        root.addView(card);
        root.addView(closeBtn);

        // معالج اللمس: التفريق بين النقر للعدّ والسحب للتحريك
        card.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        touchStartTime = System.currentTimeMillis();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        try {
                            windowManager.updateViewLayout(floatingWidgetView, params);
                        } catch (Exception ignored) {}
                        return true;

                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);

                        // إذا كانت نقرة وليست حركة سحب
                        if (duration < 250 && diffX < 15 && diffY < 15) {
                            onWidgetTapped();
                        }
                        return true;
                }
                return false;
            }
        });

        return root;
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
    }

    private void vibratePulse(boolean isComplete) {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (isComplete) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 80, 50, 100}, -1));
                } else {
                    vibrator.vibrate(VibrationEffect.createOneShot(28, VibrationEffect.DEFAULT_AMPLITUDE));
                }
            } else {
                vibrator.vibrate(isComplete ? 120 : 28);
            }
        } catch (Exception ignored) {}
    }

    private void saveCountLocally() {
        SharedPreferences sp = getSharedPreferences("AlHayatTasbeeh", MODE_PRIVATE);
        sp.edit().putInt("floating_count", currentCount).apply();
    }

    @Override
    public void onDestroy() {
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
