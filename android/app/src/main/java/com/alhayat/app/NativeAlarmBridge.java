package com.alhayat.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class NativeAlarmBridge {
    private final Context context;

    public NativeAlarmBridge(Context context) {
        this.context = context;
    }

    // 1. فحص هل الهاتف صامت (مطلوب في تطبيقك مسبقاً)
    @JavascriptInterface
    public boolean isDeviceSilent() {
        AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        return am.getRingerMode() == AudioManager.RINGER_MODE_SILENT ||
                am.getRingerMode() == AudioManager.RINGER_MODE_VIBRATE;
    }

    // 2. جدولة منبه الصلاة الأصلي في الأندرويد بدقة
    @JavascriptInterface
    public void scheduleAlarm(long triggerTimeMillis, String prayerKey, String prayerName, String customAudioPath) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("prayerKey", prayerKey);
        intent.putExtra("prayerName", prayerName);
        intent.putExtra("customAudioPath", customAudioPath);

        // توليد معرّف فريد يعتمد على وقت الصلاة لمنع حذف منبه اليوم
        int requestCode = (int) ((triggerTimeMillis / 60000) % Integer.MAX_VALUE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMillis, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMillis, pendingIntent);
        }
    }

    // 3. تنزيل مقطع صوتي مباشرة وحفظه داخل ذاكرة التطبيق بدون أي مشاكل CORS
    @JavascriptInterface
    public String downloadAdhanAudio(String audioUrl, String fileName) {
        try {
            File adhanDir = new File(context.getFilesDir(), "adhans");
            if (!adhanDir.exists()) adhanDir.mkdirs();

            File targetFile = new File(adhanDir, fileName);
            if (targetFile.exists()) return targetFile.getAbsolutePath();

            URL url = new URL(audioUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.connect();

            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return "";

            InputStream input = connection.getInputStream();
            FileOutputStream output = new FileOutputStream(targetFile);

            byte[] data = new byte[4096];
            int count;
            while ((count = input.read(data)) != -1) {
                output.write(data, 0, count);
            }

            output.flush();
            output.close();
            input.close();

            return targetFile.getAbsolutePath();
        } catch (Exception e) {
            return "";
        }
    }

    // 4. إيقاف الأذان الجاري
    @JavascriptInterface
    public void stopAdhan() {
        Intent stopIntent = new Intent(context, AdhanService.class);
        stopIntent.setAction("STOP_ADHAN");
        context.startService(stopIntent);
    }

    // 5. فحص حقيقي لصلاحية الموقع الجغرافي من نظام أندرويد مباشرة
    @JavascriptInterface
    public boolean isLocationGranted() {
        return androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    // 6. فتح صفحة أذونات التطبيق في إعدادات الهاتف فوراً
    @JavascriptInterface
    public void openAppSettings() {
        Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(android.net.Uri.fromParts("package", context.getPackageName(), null));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    // 7. فحص هل مفتاح الـ GPS وخدمات الموقع مفعّلة في عتاد الهاتف
    @JavascriptInterface
    public boolean isLocationServiceEnabled() {
        try {
            android.location.LocationManager lm = (android.location.LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) return false;
            return lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) ||
                   lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER);
        } catch (Exception e) {
            return false;
        }
    }

    // 8. فتح صفحة تفعيل مفتاح الـ GPS في إعدادات النظام مباشرة
    @JavascriptInterface
    public void openLocationSettings() {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            // كإجراء احتياطي في حال اختلاف واجهة النظام
            openAppSettings();
        }
    }
}
