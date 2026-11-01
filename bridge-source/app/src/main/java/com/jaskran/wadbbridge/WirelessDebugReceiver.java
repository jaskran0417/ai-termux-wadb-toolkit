package com.jaskran.wadbbridge;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

public final class WirelessDebugReceiver extends BroadcastReceiver {
    private static final String KEY = "adb_wifi_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            if ("com.jaskran.wadbbridge.SET_WIRELESS_DEBUG".equals(action)) {
                boolean enabled = intent.getBooleanExtra("enabled", false);
                boolean ok = Settings.Global.putInt(
                        context.getContentResolver(), KEY, enabled ? 1 : 0);
                int actual = Settings.Global.getInt(
                        context.getContentResolver(), KEY, -1);
                setResultCode(ok ? Activity.RESULT_OK : Activity.RESULT_CANCELED);
                setResultData("adb_wifi_enabled=" + actual + "; write=" + ok);
            } else if ("com.jaskran.wadbbridge.GET_WIRELESS_DEBUG".equals(action)) {
                int actual = Settings.Global.getInt(
                        context.getContentResolver(), KEY, -1);
                setResultCode(Activity.RESULT_OK);
                setResultData("adb_wifi_enabled=" + actual);
            } else {
                setResultCode(Activity.RESULT_CANCELED);
                setResultData("unsupported action");
            }
        } catch (Throwable t) {
            setResultCode(Activity.RESULT_CANCELED);
            setResultData(t.getClass().getSimpleName() + ": " + t.getMessage());
        }
    }
}
