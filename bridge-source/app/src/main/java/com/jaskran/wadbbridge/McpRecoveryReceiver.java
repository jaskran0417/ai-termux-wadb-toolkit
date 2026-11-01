package com.jaskran.wadbbridge;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;

public final class McpRecoveryReceiver extends BroadcastReceiver {
    private static final String TAG = "WadbMcpRecovery";
    public static final String ACTION_CHECK = "com.jaskran.wadbbridge.CHECK_MCP";
    public static final String ACTION_START = "com.jaskran.wadbbridge.START_MCP_RECOVERY";
    private static final int REQUEST_CODE = 42117;
    private static final int NOTIFICATION_ID = 42117;
    private static final String CHANNEL_ID = "wadb_recovery";
    private static final String TERMUX_PACKAGE = "com.termux";
    private static final String TERMUX_SERVICE = "com.termux.app.RunCommandService";
    private static final String JOB_SCRIPT =
            "/data/data/com.termux/files/usr/bin/wadb-mcp-job";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        Log.i(TAG, "Received action=" + action);
        schedulePeriodicCheck(context);
        postTransitionNotification(context, action);
        runRecoveryJob(context);
    }

    private static void schedulePeriodicCheck(Context context) {
        try {
            AlarmManager alarmManager =
                    (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent check = new Intent(context, McpRecoveryReceiver.class);
            check.setAction(ACTION_CHECK);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    REQUEST_CODE,
                    check,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            long first = SystemClock.elapsedRealtime() + 2 * 60 * 1000L;
            alarmManager.setInexactRepeating(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    first,
                    AlarmManager.INTERVAL_FIFTEEN_MINUTES,
                    pendingIntent);
        } catch (Throwable t) {
            Log.e(TAG, "Unable to schedule recovery alarm", t);
        }
    }

    private static void postTransitionNotification(Context context, String action) {
        if (ACTION_CHECK.equals(action)) return;
        if (Build.VERSION.SDK_INT >= 33
                && context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        String text;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            text = "Recovery check requested after reboot";
        } else if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            text = "WADB Bridge updated • recovery check requested";
        } else if (ACTION_START.equals(action)) {
            text = "Recovery check requested";
        } else {
            return;
        }

        try {
            NotificationManager nm =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "WADB Recovery", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Desktop Commander and WADB recovery state changes");
            nm.createNotificationChannel(channel);
            Notification.Builder b = new Notification.Builder(context, CHANNEL_ID);
            b.setSmallIcon(android.R.drawable.stat_notify_sync)
                    .setContentTitle("WADB Recovery")
                    .setContentText(text)
                    .setAutoCancel(true);
            nm.notify(NOTIFICATION_ID, b.build());
        } catch (Throwable t) {
            Log.e(TAG, "Unable to post recovery notification", t);
        }
    }

    private static void runRecoveryJob(Context context) {
        try {
            Intent run = new Intent();
            run.setClassName(TERMUX_PACKAGE, TERMUX_SERVICE);
            run.setAction("com.termux.RUN_COMMAND");
            run.putExtra("com.termux.RUN_COMMAND_PATH", JOB_SCRIPT);
            run.putExtra(
                    "com.termux.RUN_COMMAND_WORKDIR",
                    "/data/data/com.termux/files/home");
            run.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
            run.putExtra("com.termux.RUN_COMMAND_LABEL", "WADB MCP Recovery");
            run.putExtra(
                    "com.termux.RUN_COMMAND_DESCRIPTION",
                    "Start or repair the configured Desktop Commander recovery session.");
            context.startService(run);
            Log.i(TAG, "Requested Termux recovery job");
        } catch (Throwable t) {
            Log.e(TAG, "Unable to start Termux recovery job", t);
        }
    }
}
