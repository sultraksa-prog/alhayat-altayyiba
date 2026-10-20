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

    // 15. فحص هل المسبحة العائمة تعمل حالياً على الشاشة
    @JavascriptInterface
    public boolean isFloatingTasbeehRunning() {
        return FloatingTasbeehService.isServiceRunning();
    }

    // 16. حفظ إعدادات تخصيص المسبحة العائمة في نظام الأندرويد
    @JavascriptInterface
    public void saveFloatingTasbeehSettings(int scalePercent, boolean showCloseBtn, boolean longPressToOpen, boolean preventEdgeOverlap, boolean autoOpenOnLaunch) {
        android.content.SharedPreferences sp = context.getSharedPreferences("AlHayatTasbeehPrefs", Context.MODE_PRIVATE);
        sp.edit()
                .putInt("scalePercent", scalePercent)
                .putBoolean("showCloseBtn", showCloseBtn)
                .putBoolean("longPressToOpen", longPressToOpen)
                .putBoolean("preventEdgeOverlap", preventEdgeOverlap)
                .putBoolean("autoOpenOnLaunch", autoOpenOnLaunch)
                .apply();
    }

    // 17. استخراج بيانات المزامنة من المسبحة العائمة
    @JavascriptInterface
    public String getFloatingTasbeehSyncData() {
        android.content.SharedPreferences sp = context.getSharedPreferences("AlHayatTasbeehPrefs", Context.MODE_PRIVATE);
        boolean hasData = sp.getBoolean("floating_has_unsynced_data", false);
        if (!hasData) return "";
        int count = sp.getInt("floating_current_count", 0);
        int addedTaps = sp.getInt("floating_added_taps", 0);
        int addedRounds = sp.getInt("floating_added_rounds", 0);
        return "{\"count\":" + count + ",\"addedTaps\":" + addedTaps + ",\"addedRounds\":" + addedRounds + "}";
    }

    // 18. تصفير علم المزامنة بعد استلامها بنجاح داخل التطبيق
    @JavascriptInterface
    public void clearFloatingTasbeehSyncData() {
        android.content.SharedPreferences sp = context.getSharedPreferences("AlHayatTasbeehPrefs", Context.MODE_PRIVATE);
        sp.edit()
                .putInt("floating_added_taps", 0)
                .putInt("floating_added_rounds", 0)
                .putBoolean("floating_has_unsynced_data", false)
                .apply();
    }

    // 19. تحديث كرت المسبحة العائمة لحظياً عند التسبيح من داخل التطبيق
    @JavascriptInterface
    public void updateFloatingTasbeeh(String dhikrText, int currentCount, int targetCount) {
        if (FloatingTasbeehService.isServiceRunning()) {
            Intent intent = new Intent(context, FloatingTasbeehService.class);
            intent.putExtra("dhikrText", dhikrText);
            intent.putExtra("currentCount", currentCount);
            intent.putExtra("targetCount", targetCount);
            context.startService(intent);
        }
    }

    // 20. جدولة منبه عام حقيقي في عتاد الأندرويد (نظام AlarmClock الرسمي المعتمد)
    @JavascriptInterface
    public boolean scheduleGeneralAlarm(String alarmId, long triggerTimeMillis, String title, String customAudioPath, boolean vibrate) {
        try {
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return false;

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("isGeneralAlarm", true);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("prayerName", title);
            intent.putExtra("customAudioPath", customAudioPath);
            intent.putExtra("vibrate", vibrate);

            int requestCode = Math.abs(alarmId.hashCode());
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // تفعيل نظام المنبه الأصلي لنظام أندرويد (يظهر رمز ⏰ في شريط الهاتف ويتجاوز كل قيود توفير الطاقة)
            Intent showIntent = new Intent(context, MainActivity.class);
            PendingIntent showPendingIntent = PendingIntent.getActivity(
                    context,
                    requestCode,
                    showIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            android.app.AlarmManager.AlarmClockInfo clockInfo = new android.app.AlarmManager.AlarmClockInfo(triggerTimeMillis, showPendingIntent);
            alarmManager.setAlarmClock(clockInfo, pendingIntent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 21. إلغاء منبه عام محدد من نظام الأندرويد
    @JavascriptInterface
    public boolean cancelGeneralAlarm(String alarmId) {
        try {
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return false;

            Intent intent = new Intent(context, AlarmReceiver.class);
            int requestCode = Math.abs(alarmId.hashCode());
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pendingIntent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 22. إغلاق وإنهاء تطبيق الأندرويد نهائياً من الذاكرة
    @JavascriptInterface
    public void exitApp() {
        if (context instanceof android.app.Activity) {
            ((android.app.Activity) context).runOnUiThread(() -> {
                ((android.app.Activity) context).finishAffinity();
            });
        }
    }
}
