# Start Here — AI Termux WADB Toolkit v1.7.5

This is the first stop for a person installing or using the Toolkit. For the
system-level explanation, see docs/ANDROID_ARCHITECTURE.md and
docs/FEATURES_AND_BENEFITS.md before proceeding.

This toolkit combines:
- Remote Desktop Commander MCP access to Termux,
- Wireless ADB setup and reconnect helpers using Android's authorized debugging interface,
- WADB Bridge,
- optional local and Android-triggered MCP recovery,
- optional GitHub remote recovery.

The normal order is intentionally simple.

## 1. First connect Desktop Commander MCP

If an AI does not yet have MCP access to this phone, start there. Read:

`docs/REMOTE_MCP_AI_CONNECTION.md`

Typical phone-side bootstrap:

```bash
pkg update
pkg install nodejs npm
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Complete the browser/device verification when asked.

After the AI confirms it can run Termux commands through Desktop Commander, the AI should perform the remaining supported shell steps itself instead of asking you to type them.

**Ownership boundary:** Desktop Commander is an external dependency/control path, not a WADB-toolkit component. Toolkit uninstall must not stop it, log it out, remove its saved device login, or delete Termux's `~/.android/adbkey`.

## 2. Install this toolkit

From the extracted bundle:

```bash
bash install.sh
```

or:

```bash
bash install.sh --yes
```

Then:

```bash
ai-info
```

`ai-info` is a colorful read-only dashboard. For a interactive Control Center use:

```bash
ai-info
```

For AI/machine use:

```bash
ai-info --json
```

## 3. Recommended: set up Wireless ADB

Run:

```bash
ai-info --connect
```

The toolkit tries an existing trusted ADB key first.

Only when it returns:

```text
RESULT=PAIRING_REQUIRED
```

open Android's **Pair device with pairing code**, keep the popup visible, and provide the current 6-digit code.

Then:

```bash
ai-info --pair CODE
```

Do **not** run `ai-info --connect` again after `PAIRING_REQUIRED` and before `--pair CODE`. The toolkit records a short-lived pending state and blocks a second connect so it cannot accidentally move to a different Android pairing session while the user is holding the previous code. If the popup/code is abandoned, run `ai-info --pair-reset` and start a fresh connect cycle.

After one successful pairing, later reconnects normally reuse the trusted key.

A fresh Bridge setup is complete only when:

```text
RESULT=CONNECTED_AND_READY
bridge_write=ready
```

`ai-info --connect` automatically finalizes and verifies the Bridge once an authenticated ADB shell is available. If first-time setup has not yet reached authenticated ADB, it may return:

```text
RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE
```

For normal Android, turn **Wireless Debugging ON** and rerun `ai-info --connect`.

### ColorOS / OPPO / OnePlus / realme first-time setup

On affected ColorOS-family phones, enable these two Developer options together before pairing:

```text
Wireless Debugging = ON
Disable permission monitoring = ON / blue
```

Then rerun `ai-info --connect`.

The toolkit reports `DISABLE_PERMISSION_MONITORING=on|off|unknown` when the ColorOS property is readable. If it says `off`, turn **Disable permission monitoring ON (blue)** before continuing to the pairing-code step. The switch does **not** grant `WRITE_SECURE_SETTINGS`; it only removes the OEM restriction so the authenticated ADB shell can perform and verify the real one-time grants.

## 4. Optional: secure Wi-Fi-independent local shell

After authenticated ADB has been established once, run:

```bash
wadb-local-on
```

Then inspect:

```bash
wadb-local-status
ai-info --local
```

A healthy result shows a token-authenticated bridge at `127.0.0.1:47173`, `uid=2000(shell)`, `LISTENER_SCOPE=loopback_only`, and `ADBD_TCP_EXPOSURE=none`.

Run Android shell commands with:

```bash
wadb-local-shell -c 'id'
```

The secure bridge replaces the earlier classic `127.0.0.1:5555` method. In secure mode, `service.adb.tcp.port=0`, so adbd itself is not reachable from the Wi-Fi/LAN. Wireless Debugging and Wi-Fi are only brought up temporarily by `wadb-local-on` if recovery/bootstrap is required, then returned to their previous OFF state when possible.

To stop the secure bridge:

```bash
wadb-local-off --confirm
```

A reboot or adbd restart may remove the bridge; persistence across reboot is not claimed. Rerun `wadb-local-on` when needed.

## 5. Optional: automatic MCP recovery

After Desktop Commander has authenticated successfully at least once:

```bash
wadb-mcp-recovery-setup
```

For normal single-session users the authenticated MCP HOME is detected automatically. With multiple isolated Desktop Commander HOMEs, setup uses the current authenticated HOME when possible and otherwise asks instead of guessing. Advanced/manual selection is:

```bash
wadb-mcp-recovery-setup --mcp-home /path/to/home --target NAME
```

Android may show a one-time permission dialog for WADB Bridge to run the Termux recovery command. Tap **Allow**.

Normal controls:

```bash
wadb-mcp-start
wadb-mcp-stop
wadb-mcp-restart
wadb-mcp-status
```

These preserve saved MCP authorization.

`wadb-mcp-logout --confirm` is deliberately separate because it removes authorization and can require browser verification again.

## 6. Optional: GitHub recovery

GitHub recovery lets an authorized AI change a small control file even when MCP is offline. The phone-side watchdog can then start MCP again.

This is optional. Read:

`docs/RECOVERY_GITHUB.md`

Recommended long-term design:
- a dedicated **private** control repository,
- branch `wadb-control`,
- file `wadb-control.json`,
- phone read credential restricted to that one repo with **Contents: Read-only**.

Two simpler alternatives also exist: use an existing Termux `gh` login with `--mode gh` (requires the `gh` package and authenticated repo read access; usually broader permissions), or use a dedicated public repo with `--mode public` (no phone GitHub account/token; uses ordinary git+curl). The AI's GitHub connector is the write path and is independent of MCP availability.

The AI-side GitHub account and phone-side GitHub account/token do not have to match. Configure the phone read path, run `wadb-mcp-github-test`, then establish the first-sync baseline before any STOP/START recovery action. A new control identity never executes the action already present on its first sync.

## 7. Optional owner label

Owner labels are only useful for distinguishing multiple MCP environments.

```bash
ai-info --owner-set CHATGPT_WADB
ai-info --owner-show
ai-info --owner-clear
```

Skipping this does not reduce normal functionality.

## User prompts for an AI

Ready-made prompts are in:

`docs/PROMPTS_FOR_AI.md`

The simplest first prompt is:

> Read `READ_THIS_FIRST_AI.md` and the toolkit instructions before giving setup commands. First help me establish Desktop Commander MCP. Once MCP is connected, use it to perform the supported toolkit setup yourself, verify every step, and use `ai-info --json` instead of inventing another setup path.

## Security and rollback

For the exact security boundaries and v1.7.5 hardening changes, read:

```text
docs/SECURITY_AND_ROLLBACK.md
```

A clean uninstall helper is included as `wadb-toolkit-uninstall`. Recovery disable now restores the previous `allow-external-apps` state unless `--keep-external-apps` is explicitly requested.


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
