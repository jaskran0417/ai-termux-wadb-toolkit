## Another AI only repeats command names

Plain ai-info v1.7 provides the human status dashboard and explained actions. The AI should use those descriptions before presenting choices. It should not guess command meaning from the name alone and should not open the full guide unless the user asks for it.

## Existing helpers fail

For Wireless Debugging, use the bundled proven helpers first. If one fails, diagnose the real error before substituting a different method. Only then use deeper shell/ADB capabilities, other authorized privileges, or web research as needed. Do not silently replace the working architecture just because another command exists.

## Pairing code disappears when switching apps

Keep **Pair device with pairing code** visible in Settings. On the same phone, use ChatGPT in floating window, split screen, or pop-up view. Send the 6-digit code from there and let the AI run `ai-info --pair CODE`. If Android closes the popup or changes the code, use the new code.

## Plain ai-info shows only three choices

This is intentional. Pairing is not offered until `ai-info --connect` has established that it is needed. Use lower-level commands only for troubleshooting.

## Start with the executable interface

Do not manually interpret the long guide first. For connection/recovery run:

```bash
ai-info --connect
```

If it returns `RESULT=PAIRING_REQUIRED`, open the Android pairing-code popup and then run:

```bash
ai-info --pair SIX_DIGIT_CODE
```

Do not run `ai-info --connect` again between those two steps. While pairing is pending, a second connect is intentionally blocked with `RESULT=PAIRING_CODE_REQUIRED` so the Android pairing session/port is not replaced before the current code is used. If the popup was closed or its code changed, run `ai-info --pair-reset`, then start a fresh `ai-info --connect` cycle.

Only use the lower-level commands below for troubleshooting.


## AI is unsure whether an open port is pairing or connection

Do not guess. Run:

```bash
adb-mdns-discover --type all
```

Interpret only typed results:

```text
CONNECT  -> _adb-tls-connect._tcp.local
PAIRING  -> _adb-tls-pairing._tcp.local
```

If `wireless-adb-connect` returns `PAIRING_REQUIRED`, the normal CONNECT endpoint was positively identified and the existing ADB key was not accepted. Ask the user only to open the pairing-code popup and send the 6-digit code.

If only untyped port-scan candidates exist, do not label them pairing ports and do not infer pairing from failure alone.

# Troubleshooting — AI Termux Wireless ADB Bundle

## Fresh setup / Bridge is not write-ready

Run:

```bash
ai-info --connect
```

The normal command first tries the existing trusted key. If the Bridge has not yet received its one-time secure-settings grant and Wireless Debugging is currently OFF, the command returns:

```text
RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE
```

Turn Android **Wireless debugging** ON manually once and rerun `ai-info --connect`. When ADB connects, the toolkit automatically finalizes both required secure-settings grants independently and verifies the Bridge with a no-op write.

Do not report setup complete until:

```text
RESULT=CONNECTED_AND_READY
bridge_write=ready
```

If pairing is genuinely required, `ai-info --connect` returns `RESULT=PAIRING_REQUIRED`; only then open **Pair device with pairing code** and use `ai-info --pair CODE`.

## `CURRENT_WIFI_IP_NOT_DETECTED`

Automatic IP detection uses Termux:API from a genuine Termux shell environment.

Check:

```bash
phone-capabilities --details
```

Make sure both are installed:

- Termux package: `termux-api`
- Android app: Termux:API from the same distribution/source as Termux

As a fallback, `wadb-bootstrap` accepts `--ip PHONE_IP`.

## `PAIRING_FAILED`

Possible causes:

- pairing code expired or changed,
- pairing-code screen was closed,
- discovered candidate was not the pairing endpoint,
- target phone IP changed,
- Android rejected the attempt.

Reopen **Pair device with pairing code** so a fresh code is visible and rerun.

If necessary use the exact endpoint shown by Android:

```bash
wadb-bootstrap --ip PHONE_IP --pair-port PAIRING_PORT --pair-code CODE
```

## Pairing succeeded but ADB connection did not verify

Pairing and normal connection ports are different.

Run:

```bash
wireless-adb-connect
```

It rediscovers the normal connection port on the current phone IP.

## ColorOS first setup: enable both Developer options before pairing

When first-time setup begins on ColorOS/OPPO/OnePlus/realme, enable these together:

```text
Wireless Debugging = ON
Disable permission monitoring = ON / blue
```

`ai-info --connect` prints `DISABLE_PERMISSION_MONITORING=on|off|unknown` when the ColorOS property is readable. If an AI forgot to mention the second option, follow the command output itself.

If it is left OFF/gray, pairing can still succeed but the later `pm grant` calls may fail with `GRANT_RUNTIME_PERMISSIONS`. Turning it ON/blue afterward does not require re-pairing; rerun `ai-info --connect`.

## ColorOS / OPPO / OnePlus: `GRANT_RUNTIME_PERMISSIONS` denial

Observed failure:

```text
SecurityException: grantRuntimePermission:
Neither user 2000 nor current process has android.permission.GRANT_RUNTIME_PERMISSIONS
```

On affected ColorOS/OxygenOS/realme UI builds, open:

```text
Developer options > Disable permission monitoring
```

Turn the switch **ON (blue)** and rerun:

```bash
ai-info --connect
```

The switch does not directly grant `WRITE_SECURE_SETTINGS`. It allows the ADB shell to execute the one-time package permission grants. Setup is complete only after both Termux and WADB Bridge report the grant and `bridge_write=ready` passes the Bridge no-op write verification.

## `TERMUX_BUILD_DOES_NOT_DECLARE_WRITE_SECURE_SETTINGS`

The protected WADB Bridge receiver requires the calling Termux app to hold `WRITE_SECURE_SETTINGS`.

The bootstrap deliberately refuses to weaken the bridge receiver.

Use a compatible Termux build that declares the permission, or redesign the bridge only after explaining that change and getting user approval.

## `cmd: Failure calling service activity: Failed transaction`

The bundled `wireless-debug-*` helpers already include the proven workaround:

```bash
</dev/null
```

plus up to three retries.

Do not remove it casually.

## Wi-Fi network changed

Do not re-pair immediately.

Run:

```bash
wireless-adb-connect
```

It should rediscover the new phone IP and dynamic connection port and try the existing ADB key first.

Only re-pair if Android actually rejects authentication.

## `ip neigh` or `/proc/net/arp` permission denied

Expected on many modern Android builds for ordinary app UIDs.

Do not treat this as proof the network is broken. Use Termux:API + the bundled current-IP/port discovery instead.

## WADB Bridge seems missing

With a working ADB shell:

```bash
adb shell pm list packages | grep com.jaskran.wadbbridge
```

If missing, run:

```bash
wadb-bootstrap --finalize
```

It uses the bundle's copy at `~/.ai-wadb/wadb-bridge.apk`.

## Permission grant lost

With ADB connected, run:

```bash
wadb-bootstrap --finalize
wireless-debug-status
```

The finalizer verifies Termux and WADB Bridge independently. An already-granted Termux permission is accepted and does not prevent the Bridge grant from being attempted.

Healthy verification:

```text
bridge_write=ready
```

For lower-level inspection:

```bash
adb shell dumpsys package com.termux
adb shell dumpsys package com.jaskran.wadbbridge
```

Both packages need User 0:

```text
android.permission.WRITE_SECURE_SETTINGS: granted=true
```


## Current MCP recovery state model

The toolkit keeps **automatic recovery** separate from the desired Desktop Commander MCP state.

- `recovery_enabled=yes|no` controls whether the watchdog/Android recovery path is allowed to run.
- `mcp_desired=online|offline` records whether Desktop Commander itself should be running.
- `mcp_actual=online|offline` reports the observed process state.
- `mcp_process_count` reports matching Desktop Commander processes for the configured MCP HOME.

`wadb-mcp-stop` changes only the MCP desired state to `offline` and stops Desktop Commander. It preserves saved authorization and does not disable recovery. When recovery is enabled, the watchdog remains available, continues its GitHub polling cycle, and can accept a later `START_MCP`.

`wadb-mcp-recovery-disable` is the separate master recovery-off operation. It stops the watchdog and marks recovery disabled, but it does not stop or log out an already-running Desktop Commander process and does not delete its saved authorization.

If the watcher dies while recovery is enabled and MCP is intentionally offline, `wadb-mcp-job` may restore the watcher while leaving MCP offline. This lets a later GitHub `START_MCP` work without incorrectly turning MCP on during watcher restoration.

The normal watchdog interval is 15 seconds. The WADB Bridge Android recovery alarm is a slower fallback and remains separate from the 15-second Termux watchdog.

### Notifications

Recovery notifications are local Android notifications; no Firebase/FCM or external notification cloud service is required.

When both the Termux `termux-api` command package and the compatible Termux:API Android companion app are available, Termux can notify on state transitions such as watchdog start, MCP start/stop/recovery, GitHub recovery, and recovery enable/disable. Successful 15-second heartbeat checks remain silent.

WADB Bridge v1.5 (versionCode 6) also has a native **WADB Recovery** notification channel for Android-side boot, package-replaced, and explicit recovery-check transitions. Recurring fifteen-minute alarm checks are silent. On Android 13 and later, notification permission may be requested; denying notification permission suppresses notifications but does not disable recovery.

### Termux:API is an optional capability

The two Termux:API pieces are separate:

1. Termux command package: `pkg install termux-api`
2. Android companion app: Termux:API from a compatible signing/source family with the installed Termux app

Installing the command package does not install the Android app, and installing the Android app does not automatically install the Termux command package. Core WADB/MCP functionality remains usable without this optional capability; automatic IP information and Termux-side notifications can be limited or use documented fallbacks.

With `install.sh --yes`, the installer may refresh package metadata and install missing toolkit packages, including the optional `termux-api` command package when absent. It does not perform a blanket `pkg upgrade`. The installer never downloads an arbitrary Termux:API Android APK.

### Foreground viewing versus another MCP

Managed Desktop Commander runs detached. To watch its live output without starting another MCP instance, use:

```bash
wadb-mcp-log --follow
```

Pressing Ctrl+C in this log viewer stops only the viewer. Manually running the raw Desktop Commander `npx ... remote` command is a separate foreground launch attempt and can create a second matching process. `ai-info` and `wadb-mcp-status` report matching process count so duplicates are visible.

Ordinary shell `exit` or removing Termux from Recents is not treated as `wadb-mcp-stop`; detached processes may continue running. Android force-stop or OEM process restrictions can still prevent scheduled recovery until Android permits the affected app/process to run again.
