package com.jaskran.wadbbridge;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
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
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                && !ACTION_CHECK.equals(action)
                && !ACTION_START.equals(action)) {
            Log.w(TAG, "Ignoring unsupported action=" + action);
            return;
        }

        Log.i(TAG, "Received action=" + action);
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || ACTION_CHECK.equals(action)
                || ACTION_START.equals(action)) {
            setPendingCheck(context, false);
        }
        postTransitionNotification(context, action);
        runRecoveryJob(context);
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
            run.putExtra("com.termux.RUN_COMMAND_WORKDIR",
                    "/data/data/com.termux/files/home");
            run.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
            run.putExtra("com.termux.RUN_COMMAND_LABEL", "WADB MCP Recovery");
            run.putExtra("com.termux.RUN_COMMAND_DESCRIPTION",
                    "Check the owner-configured Desktop Commander recovery state.");
            context.startService(run);
            Log.i(TAG, "Requested Termux recovery job");
        } catch (Throwable t) {
            Log.e(TAG, "Unable to start Termux recovery job", t);
        }
    }

    static PendingIntent checkPendingIntent(Context context, int flags) {
        Intent check = new Intent(context, McpRecoveryReceiver.class);
        check.setAction(ACTION_CHECK);
        return PendingIntent.getBroadcast(
                context, REQUEST_CODE, check, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static SharedPreferences recoveryPreferences(Context context) {
        return context.getSharedPreferences("wadb_recovery_state", Context.MODE_PRIVATE);
    }

    private static void setPendingCheck(Context context, boolean pending) {
        boolean saved = recoveryPreferences(context).edit()
                .putBoolean("alarm_pending", pending).commit();
        if (!saved) {
            throw new IllegalStateException("Unable to persist recovery alarm state");
        }
    }

    static boolean hasNextCheck(Context context) {
        // A PendingIntent remains registered after its one-shot alarm fires.
        // The receiver clears this persisted flag when the alarm is delivered.
        return recoveryPreferences(context).getBoolean("alarm_pending", false);
    }

    static void scheduleNextCheck(Context context) {
        AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) throw new IllegalStateException("AlarmManager unavailable");

        PendingIntent pendingIntent = checkPendingIntent(
                context, PendingIntent.FLAG_UPDATE_CURRENT);
        long triggerAt = android.os.SystemClock.elapsedRealtime()
                + AlarmManager.INTERVAL_FIFTEEN_MINUTES;
        // A one-shot is re-armed only after the Termux job verifies recovery is enabled.
        // If RUN_COMMAND fails or recovery is disabled, no further wakeup is scheduled.
        alarmManager.setAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
        setPendingCheck(context, true);
    }

    static void cancelNextCheck(Context context) {
        AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pendingIntent = checkPendingIntent(
                context, PendingIntent.FLAG_NO_CREATE);
        if (pendingIntent != null) {
            if (alarmManager != null) alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        setPendingCheck(context, false);
    }
}
