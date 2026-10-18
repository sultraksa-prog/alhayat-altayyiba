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
            openAppSettings();
        }
    }

    // 9. فحص حقيقي ودقيق للاتصال بالإنترنت من نظام أندرويد مباشرة (مطابق للـ PWA)
    @JavascriptInterface
    public boolean isNetworkConnected() {
        try {
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                android.net.Network net = cm.getActiveNetwork();
                if (net == null) return false;
                android.net.NetworkCapabilities cap = cm.getNetworkCapabilities(net);
                return cap != null && (
                    cap.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) ||
                    cap.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    cap.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)
                );
            } else {
                android.net.NetworkInfo info = cm.getActiveNetworkInfo();
                return info != null && info.isConnected();
            }
        } catch (Exception e) {
            return false;
        }
    }

    // 10. فتح إعدادات الـ Wi-Fi وشبكة الإنترنت في الهاتف بنقرة واحدة
    @JavascriptInterface
    public void openWifiSettings() {
        try {
            // في أندرويد 10 وما بعده: فتح لوحة الاتصال السريعة بالإنترنت (Wi-Fi وبيانات الهاتف)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                Intent intent = new Intent(android.provider.Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } else {
                Intent intent = new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            try {
                // كإجراء احتياطي للأجهزة التي تختلف فيها واجهة النظام
                Intent intent = new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception ex) {
                openAppSettings();
            }
        }
    }

    // 11. فحص هل صلاحية النافذة العائمة (الظهور فوق التطبيقات) ممنوحة
    @JavascriptInterface
    public boolean hasOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            return android.provider.Settings.canDrawOverlays(context);
        }
        return true;
    }

    // 12. طلب إذن الظهور فوق التطبيقات مباشرة
    @JavascriptInterface
    public void requestOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(
                        android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        android.net.Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                openAppSettings();
            }
        }
    }

    // 13. تشغيل كرت المسبحة العائم فوق الشاشة الرئيسية
    @JavascriptInterface
    public void showFloatingTasbeeh(String dhikrText, int currentCount, int targetCount) {
        if (!hasOverlayPermission()) {
            requestOverlayPermission();
            return;
        }
        try {
            Intent intent = new Intent(context, FloatingTasbeehService.class);
            intent.putExtra("dhikrText", dhikrText);
            intent.putExtra("currentCount", currentCount);
            intent.putExtra("targetCount", targetCount);
            context.startService(intent);
        } catch (Exception ignored) {}
    }

    // 14. إغلاق المسبحة العائمة
    @JavascriptInterface
    public void closeFloatingTasbeeh() {
        try {
            Intent intent = new Intent(context, FloatingTasbeehService.class);
            context.stopService(intent);
        } catch (Exception ignored) {}
    }

    // 15. إغلاق وإنهاء تطبيق الأندرويد نهائياً من الذاكرة
    @JavascriptInterface
    public void exitApp() {
        if (context instanceof android.app.Activity) {
            ((android.app.Activity) context).runOnUiThread(() -> {
                ((android.app.Activity) context).finishAffinity();
            });
        }
    }
}
