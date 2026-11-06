package com.jaskran.wadbbridge;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

/**
 * Narrow explicit-only alarm control channel.
 *
 * The manifest requires android.permission.WRITE_SECURE_SETTINGS from every
 * sender. The Toolkit's Termux app already holds that user-authorized grant.
 * Do not remove the manifest permission gate or add an intent filter.
 */
public final class RecoveryControlReceiver extends BroadcastReceiver {
    private static final String TAG = "WadbRecoveryControl";
    public static final String ACTION_SET_STATE =
            "com.jaskran.wadbbridge.SET_RECOVERY_ALARM_STATE";
    public static final String EXTRA_ENABLED = "enabled";
    public static final String EXTRA_OPERATION = "operation";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_SET_STATE.equals(intent.getAction())) {
            setResultCode(Activity.RESULT_CANCELED);
            return;
        }

        String operation = intent.getStringExtra(EXTRA_OPERATION);
        if (operation == null || operation.isEmpty()) {
            operation = intent.getBooleanExtra(EXTRA_ENABLED, false) ? "schedule" : "cancel";
        }

        try {
            switch (operation) {
                case "schedule":
                    McpRecoveryReceiver.scheduleNextCheck(context);
                    Log.i(TAG, "Accepted WRITE_SECURE_SETTINGS-authorized schedule request");
                    setResultCode(Activity.RESULT_OK);
                    return;
                case "cancel":
                    McpRecoveryReceiver.cancelNextCheck(context);
                    Log.i(TAG, "Accepted WRITE_SECURE_SETTINGS-authorized cancel request");
                    setResultCode(Activity.RESULT_OK);
                    return;
                case "query":
                    boolean scheduled = McpRecoveryReceiver.hasNextCheck(context);
                    Log.i(TAG, "Queried pending recovery check=" + scheduled);
                    setResultCode(scheduled ? Activity.RESULT_OK : Activity.RESULT_CANCELED);
                    return;
                case "permission":
                    boolean runGranted = context.checkSelfPermission(
                            "com.termux.permission.RUN_COMMAND") == PackageManager.PERMISSION_GRANTED;
                    Log.i(TAG, "Queried Termux RUN_COMMAND grant=" + runGranted);
                    setResultCode(runGranted ? Activity.RESULT_OK : Activity.RESULT_FIRST_USER);
                    return;
                case "notifications":
                    boolean notificationsGranted = Build.VERSION.SDK_INT < 33
                            || context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                            == PackageManager.PERMISSION_GRANTED;
                    Log.i(TAG, "Queried Bridge notification grant=" + notificationsGranted);
                    setResultCode(notificationsGranted ? Activity.RESULT_OK : Activity.RESULT_FIRST_USER);
                    return;
                default:
                    Log.w(TAG, "Rejected unknown recovery alarm operation");
                    setResultCode(Activity.RESULT_CANCELED);
                    return;
            }
        } catch (Throwable t) {
            Log.e(TAG, "Unable to update/query recovery alarm", t);
            setResultCode(Activity.RESULT_CANCELED);
        }
    }
}
