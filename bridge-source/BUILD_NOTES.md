# WADB Bridge v1.5

Package: `com.jaskran.wadbbridge`

The Bridge remains the privileged writer for `adb_wifi_enabled`. Its `WirelessDebugReceiver` is exported but protected by `android.permission.WRITE_SECURE_SETTINGS`. `McpRecoveryReceiver` remains non-exported and invokes only the fixed Termux recovery job.

Version:
- versionCode 6
- versionName 1.5
- minSdk 30
- targetSdk 36

## Recovery notifications
The Bridge now owns a local Android notification channel named **WADB Recovery**. It posts only transition/check notifications for boot, package replacement, or an explicit recovery request. The recurring fifteen-minute Android alarm remains silent. Actual watchdog/MCP success notifications are posted by the Termux recovery scripts only after the corresponding state transition occurs.

On Android 13+, `PermissionActivity` requests `POST_NOTIFICATIONS` together with the existing Termux `RUN_COMMAND` permission when either permission is missing. Notification permission is optional for recovery itself: denial suppresses notifications but does not disable recovery.

## Recovery-state separation
Termux now stores recovery enablement separately from the desired Desktop Commander state. An intentionally stopped MCP can remain offline while the watchdog stays recoverable and continues to accept a future GitHub `START_MCP`.

## Security and continuity
- The Bridge `WRITE_SECURE_SETTINGS` grant is still required.
- Termux still requires `WRITE_SECURE_SETTINGS` because it invokes the protected Bridge receiver.
- No Termux SettingsProvider fallback is used.
- Setup is ready only after the Bridge performs a verified no-op write.
- ON/OFF helpers keep retry/readback verification.
- The release signing identity remains the existing Jaskran Singh release certificate.

## Rebuild
A Gradle wrapper is not bundled. `build-termux.sh` discovers the Android SDK from `ANDROID_HOME` / `ANDROID_SDK_ROOT` (default `~/android-sdk`) and passes the local Termux `aapt2` override explicitly. `local.properties` is temporary and is not shipped.
