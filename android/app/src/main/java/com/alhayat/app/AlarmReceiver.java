package com.alhayat.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName = intent != null ? intent.getStringExtra("prayerName") : "الصلاة";
        String customAudioPath = intent != null ? intent.getStringExtra("customAudioPath") : null;

        // إطلاق خدمة المنبه الفورية التي تتولى إضاءة الشاشة وانبثاق AdhanActivity
        Intent serviceIntent = new Intent(context, AdhanService.class);
        serviceIntent.putExtra("prayerName", prayerName);
        serviceIntent.putExtra("customAudioPath", customAudioPath);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}