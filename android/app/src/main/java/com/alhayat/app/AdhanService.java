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
        boolean isGeneralAlarm = intent != null && intent.getBooleanExtra("isGeneralAlarm", false);
        boolean vibrate = intent == null || intent.getBooleanExtra("vibrate", true);

        String notifTitle = isGeneralAlarm ? ("⏰ حان موعد: " + prayerName) : ("حان الآن أذان " + prayerName + " 🕌");
        String notifText = isGeneralAlarm ? "اضغط لإيقاف المنبه أو تأجيله" : "الله أكبر، الله أكبر..";

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
        alarmWindowIntent.putExtra("isGeneralAlarm", isGeneralAlarm);
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
                .setContentTitle(notifTitle)
                .setContentText(notifText)
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
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);

            boolean fileLoaded = false;

            // 1. فحص هل هو ملف محلي مخزن في ذاكرة الجهاز
            if (customPath != null && !customPath.isEmpty()) {
                if (customPath.startsWith("http://") || customPath.startsWith("https://")) {
                    try {
                        mediaPlayer.setDataSource(this, Uri.parse(customPath));
                        fileLoaded = true;
                    } catch (Exception ignored) {}
                } else {
                    File audioFile = new File(customPath);
                    if (audioFile.exists()) {
                        mediaPlayer.setDataSource(this, Uri.fromFile(audioFile));
                        fileLoaded = true;
                    }
                }
            }

            // 2. إذا لم يكن ملفاً مخصصاً، محاولة تشغيل الصوت المدمج
            if (!fileLoaded) {
                try {
                    Uri defaultUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.adhan);
                    mediaPlayer.setDataSource(this, defaultUri);
                    fileLoaded = true;
                } catch (Exception ignored) {}
            }

            // 3. كحل أمان حتمي لا يخذل أبداً: استخدام نغمة المنبه الافتراضية لنظام أندرويد نفسه
            if (!fileLoaded) {
                Uri systemAlarmUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);
                if (systemAlarmUri == null) {
                    systemAlarmUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
                }
                mediaPlayer.setDataSource(this, systemAlarmUri);
            }

            mediaPlayer.prepare();
            mediaPlayer.start();
            mediaPlayer.setOnCompletionListener(mp -> stopAdhan());

        } catch (Exception e) {
            // في حال حدوث أي خطأ في تشغيل ملف الوسائط، يتم اللجوء لمنبه النظام الافتراضي فوراً بدلاً من إغلاق المنبه
            try {
                Uri fallbackUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);
                mediaPlayer = MediaPlayer.create(this, fallbackUri);
                if (mediaPlayer != null) {
                    mediaPlayer.start();
                    mediaPlayer.setOnCompletionListener(mp -> stopAdhan());
                }
            } catch (Exception ignored) {}
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
