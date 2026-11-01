# Command Reference — Authoritative v1.7 Interface

## wadb-integrity-check

Use case: Verify the signed release identity and the installed WADB files covered by the signed installed-file inventory.

Changes system: No. Read-only.

Commands:
  wadb-integrity-check
  wadb-integrity-check --expected-fingerprint YOUR_TRUSTED_RELEASE_KEY_SHA256

Expected success includes SIGNATURE=VALID, FILES_FAILED=0, and INSTALLED_INTEGRITY=VERIFIED. A mismatch is reported as INSTALLED_INTEGRITY=TAMPERED; missing or malformed metadata is a verification failure.

The default trust pin is the fingerprint accepted by the installer and stored in ~/.ai-wadb/release-integrity/trusted-key-fingerprint.txt. For stronger assurance, pass the fingerprint published independently through the official project channel. A local stored pin can itself be changed by an actor who controls the Termux UID.

This is tamper detection, not an immutable boundary. A determined device owner can patch the checker or run a modified copy. See docs/INTEGRITY_VERIFICATION.md.

For a toolkit task, use these commands before substituting lower-level Android commands.

## `ai-info`

**Use case:** Human-friendly current status and available options.

**Changes system:** No.

**Example:**
```bash
ai-info
```

**Related:**
```bash
ai-info
ai-info --json
ai-info --doctor
```

## `ai-info --json`

**Use case:** Machine-readable preflight for an AI.

**Changes system:** No.

**AI rule:** Prefer this over parsing colored terminal output.

## `ai-info`

**Use case:** Guided human setup/menu.

**Changes system:** Only when the user chooses an action.

## `ai-info --connect`

**Use case:** Normal Wireless ADB connection/recovery.

**What it does:** Tries an existing authenticated ADB transport first, then discovers Android's typed CONNECT service and attempts the trusted key before asking the Bridge to enable Wireless Debugging. This lets a fresh phone that the user manually turned ON reach PAIRING_REQUIRED even before the Bridge has its one-time grant. Once ADB is authenticated, it automatically runs the Bridge finalizer if the Bridge is not ready **or** the cached Bridge APK has a higher versionCode than the installed Android Bridge.

**Success condition:** `RESULT=CONNECTED_AND_READY`.

**Fresh-setup one-time case:** `RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE` means the first Wireless ADB bootstrap is incomplete. On normal Android, turn Wireless Debugging ON. On ColorOS/OPPO/OnePlus/realme, turn **Wireless Debugging ON** and **Disable permission monitoring ON (blue)** together before pairing, then rerun this command.

The command prints `DISABLE_PERMISSION_MONITORING=on|off|unknown` on ColorOS-family devices. If it says `off`, correct that before opening the pairing-code popup. If the OEM property cannot be read, `unknown` is not treated as success; the later grant remains verified by Android.

**Do not:** Ask for a pairing code before this command reports `RESULT=PAIRING_REQUIRED`. Once it does, do not run `--connect` a second time: the pending guard returns `RESULT=PAIRING_CODE_REQUIRED`, `DO_NOT_RUN_CONNECT_AGAIN=yes`, and `NEXT_COMMAND=ai-info_--pair_CODE` without starting a new connection/pairing cycle.

**Verify:**
```bash
ai-info --json
adb devices
adb shell id
```

The JSON must show `"bridge_write":"ready"` before the AI reports the WADB setup complete.

## `ai-info --pair CODE`

**Use case:** First-time/fresh trust pairing after `PAIRING_REQUIRED`.

**Requires:** Android's current **Pair device with pairing code** popup must remain visible.

**Example:**
```bash
ai-info --pair 123456
```

**Do not:** Reuse expired codes or infer pairing ports by number. `--pair` requires a current pending state created by `RESULT=PAIRING_REQUIRED`; the 6-digit code itself is never stored. Any completed pairing attempt clears the pending marker. Use `ai-info --pair-reset` if the popup/code was abandoned or changed before pairing.

If pairing succeeds but ColorOS blocks the later WRITE_SECURE_SETTINGS grants, the command reports PAIRING_STATUS=succeeded, PERMISSION_SETUP=blocked_by_coloros, ACTION=enable_disable_permission_monitoring, and RESULT=PAIRED_PERMISSION_SETUP_REQUIRED.

Turn Developer options > Disable permission monitoring > ON (blue), then rerun ai-info --connect. Do not pair again.

## `ai-info --pair-reset`

**Use case:** The Android pairing popup was closed, its code changed, or a pending pairing cycle was intentionally abandoned before `--pair CODE` was run.

```bash
ai-info --pair-reset
```

This clears only the toolkit's pairing-pending marker; it does not delete the ADB key or change Android settings. Then run `ai-info --connect` to start a fresh pairing cycle if needed.

### Bridge APK update synchronization

The toolkit uses three distinct Bridge APK stages:

1. **Bundled release APK** — `apk/wadb-bridge.apk` inside the toolkit release.
2. **Termux cached installer APK** — `~/.ai-wadb/wadb-bridge.apk`.
3. **Installed Android Bridge** — package `com.jaskran.wadbbridge`.

Running a newer toolkit `install.sh` backs up the old cached APK and replaces stage 2 with the APK shipped by the new release. It does **not** silently uninstall the Android app.

On the next authenticated `ai-info --connect`, the toolkit compares cached and installed Bridge versionCode values. `bridge_sync=install_required` or `bridge_sync=upgrade_required` triggers `adb install -r` from the cached APK, then the installed version is rechecked before ready is reported. `bridge_sync=installed_newer` is never automatically downgraded.

Users should not manually copy a replacement APK into the cache; updating the toolkit updates the authoritative cached installer automatically.

## Secure localhost shell bridge

The maintained v1.7.5 local-control path no longer exposes Android adbd on classic TCP port 5555.

The local-control architecture is:

```text
Remote MCP / Termux
        |
        v
127.0.0.1:47173
authenticated loopback bridge
        |
        v
Android shell user
```

The bridge is restricted to loopback and is separate from the ADB wire protocol.

This bridge is **not the ADB wire protocol**. It is a toolkit-owned, authenticated local shell transport launched from an already-authenticated ADB shell. Normal secure operation uses `wadb-local-shell`, not `adb -s 127.0.0.1:5555 shell`.

### `wadb-local-status` / `ai-info --local`

Read-only status:

```bash
wadb-local-status
ai-info --local
```

Healthy secure state includes:

```text
LOCAL_ADB_STATE=ready
LOCAL_ADB_MODE=secure_shell_bridge
LOCAL_ADB_ENDPOINT=127.0.0.1:47173
LISTENER_SCOPE=loopback_only
ADB_ENABLED=1
ADBD_STATE=running
TCP_PORT=0
ADBD_TCP_EXPOSURE=none
SECURITY_STATE=loopback_bridge_no_adbd_tcp
```

### `wadb-local-shell`

Run Android shell commands through the local authenticated bridge:

```bash
wadb-local-shell --ping
wadb-local-shell -c 'id'
wadb-local-shell -c 'getprop init.svc.adbd'
wadb-local-shell -c 'svc wifi enable'
wadb-local-shell -c 'svc wifi disable'
```

The bridge runs as Android `uid=2000(shell)`. It binds only `127.0.0.1` and requires a random 256-bit token stored in Termux as `~/.ai-wadb/local-bridge.token` with mode 600. The staged token is consumed and unlinked by the Android-side bridge.

### `wadb-local-on` / `ai-info --local-on`

Enables or repairs secure local control.

If the secure bridge is already healthy and adbd has no network TCP listener, the command is idempotent.

If recovery/bootstrap is required, the command can temporarily:
1. turn Wi-Fi on,
2. enable Wireless Debugging,
3. connect an authenticated ADB transport to this same phone,
4. verify `adb_enabled=1`,
5. switch adbd to USB mode if classic TCP is active,
6. stage and launch the loopback-only bridge,
7. verify the bridge is `uid=2000(shell)`,
8. disable Wireless Debugging again,
9. restore Wi-Fi to OFF when it was initially OFF.

Temporary Wi-Fi is therefore only a bootstrap/recovery path. The steady-state local bridge itself does not use Wi-Fi.

### `wadb-local-off --confirm`

Stops the secure local bridge:

```bash
wadb-local-off --confirm
```

It does not set `adb_enabled=0` and does not re-enable classic adbd TCP.

### Connection security model

The secure local bridge is authenticated and restricted to the phone's loopback interface. It runs with Android shell-user permissions. It is separate from the ADB network transport and does not grant root access.

The toolkit uses the supported Android permission and ADB authorization flows. On rooted devices, additional commands may be run from Termux through an owner-authorized su route when one is available; this does not change the permissions of Wireless ADB or Secure Local Shell.

### Integrity and device-target checks

Before `wadb-bootstrap` installs the cached WADB Bridge APK, it now compares its SHA-256 with the expected hash recorded by the verified toolkit installer. A missing or mismatched cache fails closed; rerun the official toolkit installer to restore the bundled APK and expected hash.

The ADB connection selector now checks multiple local/remote properties (manufacturer, model, device, product, brand, product name, build fingerprint, and SDK) before treating an ADB endpoint as this phone. This guards against accidental mis-targeting; it is not a cryptographic remote-device attestation, because ordinary ADB properties can be imitated by a malicious endpoint.

The GitHub generation counter is limited to 18 decimal digits. If a previously stored counter is malformed or oversized, the toolkit resets to a safe baseline and deliberately does not execute the control action in that recovery cycle; the next valid matching control is baselined before later actions are accepted.

## `wireless-debug-status`

**Use case:** Read Wireless Debugging and `adbd` state and verify that WADB Bridge can write the setting.

**Changes system:** It performs only a no-op write of the current Wireless Debugging value to verify permission; it does not change ON/OFF state.

**Healthy result includes:**
```text
bridge_write=ready
```

`bridge_write=denied` means the Bridge still needs its one-time secure-settings grant.

## `wireless-debug-on`

**Use case:** Enable Wireless Debugging through WADB Bridge.

**Requires:** WADB Bridge + required permission bootstrap.

**Verify:**
```bash
wireless-debug-status
```

## `wireless-debug-off`

**Use case:** Disable Wireless ADB while leaving Desktop Commander MCP independent.

**Verify:**
```bash
wireless-debug-status
```

**Expected:**
```text
adb_wifi_enabled=0
adbd=stopped
```

## `wireless-adb-connect`

**Use case:** Lower-level Wireless ADB reconnect/diagnostic path.

Use `ai-info --connect` for normal operation.

## `adb-mdns-discover`

**Use case:** Typed Android mDNS endpoint discovery.

```text
_adb-tls-connect._tcp.local = normal connection
_adb-tls-pairing._tcp.local = temporary pairing
```

Do not infer role from port number.

## `phone-capabilities --details`

**Use case:** Read-only capability report.

## `wadb-mcp-recovery-setup`

**Use case:** Enable local automatic Desktop Commander recovery after the first MCP login.

**What it changes:**
- creates recovery state/config under `~/.ai-wadb/mcp-recovery`,
- enables Termux `allow-external-apps=true`,
- starts the local watchdog,
- requests the WADB Bridge `RUN_COMMAND` permission activity when available.

**MCP HOME selection:**
- default single-session users normally resolve to the standard Termux HOME,
- when setup is run through an authenticated custom MCP HOME, that current HOME is preferred,
- an existing valid recovery HOME is preserved on repeat setup,
- if several other authenticated MCP HOMEs are found, interactive setup asks which one to protect,
- non-interactive ambiguous setup stops instead of guessing.

**Explicit selection:**
```bash
wadb-mcp-recovery-setup --mcp-home /path/to/authenticated/home --target NAME
```

The selected HOME must already contain Desktop Commander's saved `.desktop-commander-device/device.json`.

**It does not:** Log out Desktop Commander or delete saved credentials.

**Verify:**
```bash
wadb-mcp-status
ai-info --recovery
```

## `wadb-mcp-start`

**Use case:** Start/ensure Remote Desktop Commander online.

**Keeps saved login:** Yes.

**Verify:**
```bash
wadb-mcp-status
```

## `wadb-mcp-stop`

**Use case:** Intentionally stop this managed MCP process.

**Keeps saved login:** Yes.

**Recovery behavior:** This changes only `mcp_desired` to `offline`. It does not disable the recovery watchdog. When recovery is enabled, the watcher continues polling and a later GitHub `START_MCP` can bring Desktop Commander back.

**Note:** Default stop is delayed briefly so a remote AI can receive the command result before its own MCP disappears.

## `wadb-mcp-restart`

**Use case:** Clean MCP restart.

**Keeps saved login:** Yes.

**Does not:** Require browser verification when saved authorization remains valid.

## `wadb-mcp-status`

**Use case:** Compact recovery/MCP state, including `recovery_enabled`, `mcp_desired`, `mcp_actual`, process count, watchdog state/interval, and GitHub state.

**JSON:**
```bash
wadb-mcp-status --json
```

## `wadb-mcp-logout --confirm`

**Use case:** Intentionally remove/clear Remote Desktop Commander authorization.

**Warning:** This is not normal stop/restart/recovery. The next start may require browser verification.

Never use it as a recovery shortcut.

## `wadb-mcp-github-config`

**Use case:** Configure optional GitHub control.

**Examples:**

Private repo using existing Termux GitHub CLI login:
```bash
wadb-mcp-github-config \
  --owner USER \
  --repo ai-wadb-control \
  --branch wadb-control \
  --target DEFAULT \
  --mode gh
```

Private repo using a one-repo read-only token file:
```bash
wadb-mcp-github-config \
  --owner USER \
  --repo ai-wadb-control \
  --branch wadb-control \
  --target DEFAULT \
  --mode token
```

Public repo/no phone credential:
```bash
wadb-mcp-github-config --owner USER --repo ai-wadb-control --mode public
```

`--mode auto` tries public, then token file, then existing normal-Termux `gh` login.

Mode prerequisites and trust model:
- `public`: no phone GitHub login or token; requires `git` + `curl`; repository/file must be publicly readable. The toolkit resolves the current branch HEAD with anonymous `git ls-remote` and fetches the file by immutable commit SHA so recovery is not dependent on a briefly stale raw branch view.
- `gh`: requires `pkg install gh`, a successful `gh auth login`, and read access to the configured repository.
- `token`: requires `curl` and a local token file with mode `600` or `400`; broader token-file permissions are rejected. Do not put the token in AI chat or shell history.

The AI-side GitHub connector account and phone-side GitHub account/token may be different accounts. The AI side needs write access; the phone only needs read access.

When owner/repo/branch/file/target changes, the first valid sync records the current generation as a **baseline without executing its current action**. This prevents stale control files from unexpectedly stopping/restarting MCP during setup. A later higher generation is required to execute an action.

**Disable only GitHub polling:**
```bash
wadb-mcp-github-config --off
```

## `wadb-mcp-github-test`

**Use case:** Read-only verification that the phone can fetch and validate the configured control JSON, including schema, generation, action, and target.

**Changes system state:** No recovery action is executed. The command also reports whether the next real sync will baseline the current generation (`BASELINE_ON_NEXT_SYNC=yes|no`).

**Example:**
```bash
wadb-mcp-github-test
```

## `wadb-mcp-github-sync`

**Use case:** Force an immediate read **and processing** of a configured GitHub control generation.

For a newly selected control identity, the first sync only establishes the baseline and does not execute the action already present. For an established identity, only a generation greater than the last processed generation executes. Normally the watchdog performs this automatically.

`STATUS` refreshes only the phone's local status; the read-only phone path does not publish a status response back to GitHub.

## `wadb-mcp-recovery-disable`

**Use case:** Disable local watchdog/recovery without deleting saved MCP authorization.

**Does not:** stop or log out an already-running Desktop Commander process. This is the recovery master switch; `wadb-mcp-stop` is the separate MCP process stop.

## `wadb-mcp-log`

**Use case:** View the managed Desktop Commander log without starting a second MCP process.

```bash
wadb-mcp-log
wadb-mcp-log --follow
wadb-mcp-log --events 40
```

Ctrl+C while `--follow` is active stops only the log viewer.

## Owner commands

Owner labels are optional identification guards.

```bash
ai-info --owner-show
ai-info --owner-set NAME
ai-info --owner-clear
```

They do not change authentication, ADB trust, GitHub authorization, or MCP device identity.

## `wadb-toolkit-uninstall`

**Use case:** Remove toolkit-owned components without treating Desktop Commander or Termux's ADB key as toolkit property.

Full toolkit cleanup:

```bash
wadb-toolkit-uninstall --all
```

Preserve the minimum working MCP-recovery module while removing the normal WADB interface:

```bash
wadb-toolkit-uninstall --keep-recovery
```

Preview either plan:

```bash
wadb-toolkit-uninstall --all --dry-run
wadb-toolkit-uninstall --keep-recovery --dry-run
```

`--all` removes only the toolkit recovery setup; it does **not** execute `wadb-mcp-stop` or `wadb-mcp-logout`, does not kill the Desktop Commander process, and does not delete its saved device login. `~/.android/adbkey` and `adbkey.pub` are always preserved.

When authenticated ADB is available, `--all` uninstalls `com.jaskran.wadbbridge`. Without Wireless Debugging/authenticated ADB it prints `ANDROID_BRIDGE=manual_remove_required` plus `Settings > Apps > WADB Bridge > Uninstall`; the Bridge has no app-drawer icon.

Downloads and extracted/source release bundles are user files and are not automatically deleted.

## Recovery rollback behavior

```bash
wadb-mcp-recovery-disable
```

restores the `allow-external-apps` property that existed before recovery setup.

Use `--keep-external-apps` only when the user deliberately wants to leave that Termux capability enabled.

## Fallback ADB scan bounds

Typed mDNS is always preferred. The untyped fallback can be adjusted without editing the script:

```bash
WADB_SCAN_MIN=30000 WADB_SCAN_MAX=65535 wireless-adb-connect
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


## `ai-info --disconnect`

**Use case:** Open the explicit Wireless ADB disconnect submenu.

**Choices:**
1. Disconnect only the current verified network ADB transport. This uses the exact discovered host-and-port serial; it does not run a broad `adb disconnect` and leaves Android Wireless Debugging ON.
2. Turn Android Wireless Debugging OFF through the WADB Bridge. This ends Wireless ADB but does not stop Desktop Commander MCP or the independent secure local shell.
3. Cancel without changing anything.

**Non-interactive explicit forms:**
```bash
ai-info --disconnect-transport --confirm
ai-info --wireless-off --confirm
```

Both forms require `--confirm`. The transport-only form refuses USB, loopback and emulator serials and refuses to act when the target cannot be verified.

**Important separation:** Wireless ADB disconnect, secure local-shell shutdown (`wadb-local-off --confirm`), and Desktop Commander stop (`wadb-mcp-stop`) are different actions. This submenu changes only the selected Wireless ADB layer.

## `ai-info --commands`

**Use case:** Show the complete command catalogue and this edition's detailed `COMMAND_REFERENCE.md`.

The interactive Control Center also includes **All commands & usage**. It first shows the command index, then opens the full reference in `less`/`more` when available, or prints it directly. The document contains each command's purpose, examples, side effects, verification and important safety/recovery notes.

**Changes system:** No. Read-only.

