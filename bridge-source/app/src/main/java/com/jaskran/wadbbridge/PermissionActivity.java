package com.jaskran.wadbbridge;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import java.util.ArrayList;
import java.util.List;

public final class PermissionActivity extends Activity {
    private static final String RUN_COMMAND = "com.termux.permission.RUN_COMMAND";
    private static final int REQUEST = 42117;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        List<String> missing = new ArrayList<>();
        if (checkSelfPermission(RUN_COMMAND) != PackageManager.PERMISSION_GRANTED) {
            missing.add(RUN_COMMAND);
        }
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            missing.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (missing.isEmpty()) {
            finish();
            return;
        }
        requestPermissions(missing.toArray(new String[0]), REQUEST);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        finish();
    }
}
