package com.alhayat.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import java.io.File;

public class AdhanService extends Service {
    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private static final String CHANNEL_ID = "alhayat_adhan_native_channel";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String prayerName = intent != null ? intent.getStringExtra("prayerName") : "الصلاة";
        String customPath = intent != null ? intent.getStringExtra("customAudioPath") : null;

        // 1. إيقاظ شاشة الهاتف وهي مقفلة
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "AlHayat:AdhanWakeLock");
            wakeLock.acquire(3 * 60 * 1000L); // إبقاء الشاشة مضاءة لـ 3 دقائق
        }

        // 2. إنشاء قناة الإشعار في الأندرويد
        createNotificationChannel();

        // 3. توجيه نافذة المنبه المنبثقة مباشرة فوق شاشة القفل (AdhanActivity)
        Intent alarmWindowIntent = new Intent(this, AdhanActivity.class);
        alarmWindowIntent.putExtra("prayerName", prayerName);
        alarmWindowIntent.putExtra("customAudioPath", customPath);
        alarmWindowIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingAlarmWindow = PendingIntent.getActivity(this, 0, alarmWindowIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, AdhanService.class);
        stopIntent.setAction("STOP_ADHAN");
        PendingIntent pendingStop = PendingIntent.getService(this, 1, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        if ("STOP_ADHAN".equals(intent != null ? intent.getAction() : null)) {
            stopAdhan();
            return START_NOT_STICKY;
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("حان الآن أذان " + prayerName + " 🕌")
                .setContentText("الله أكبر، الله أكبر..")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingAlarmWindow, true) // ينبثق كشاشة منبه فورية
                .setContentIntent(pendingAlarmWindow)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف ✕", pendingStop)
                .setOngoing(true)
                .build();

        startForeground(1001, notification);

        // 4. تشغيل صوت الأذان بمسار المنبه الحقيقي (USAGE_ALARM)
        playAdhanAudio(customPath);

        return START_NOT_STICKY;
    }

    private void playAdhanAudio(String customPath) {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
            }

            mediaPlayer = new MediaPlayer();
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM) // مسار صوت المنبه ليرن حتى في الصامت
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);

            // فحص هل اختار المستخدم صوتاً تم تنزيله في الهاتف أم نستخدم الصوت المدمج
            boolean fileLoaded = false;
            if (customPath != null && !customPath.isEmpty()) {
                File audioFile = new File(customPath);
                if (audioFile.exists()) {
                    mediaPlayer.setDataSource(this, Uri.fromFile(audioFile));
                    fileLoaded = true;
                }
            }

            if (!fileLoaded) {
                // الصوت المدمج الاحتياطي في res/raw/adhan.mp3
                Uri defaultUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.adhan);
                mediaPlayer.setDataSource(this, defaultUri);
            }

            mediaPlayer.prepare();
            mediaPlayer.start();
            mediaPlayer.setOnCompletionListener(mp -> stopAdhan());

        } catch (Exception e) {
            stopAdhan();
        }
    }

    private void stopAdhan() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        stopForeground(true);
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "منبه أذان الصلوات الأصلي",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("منبه عالي الأولوية يصدح بصوت الأذان");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        stopAdhan();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}