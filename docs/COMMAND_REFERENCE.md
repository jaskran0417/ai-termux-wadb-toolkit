# Command Reference

## Connection layers at a glance

- Desktop Commander MCP connects the AI client to Termux. It is managed with wadb-mcp-start/stop/restart/status/log.
- Wireless ADB is Android's authenticated debugging transport. It is managed with ai-info --connect, wireless-adb-connect, adb-mdns-discover and the wireless-debug-* helpers.
- WADB Bridge changes Android's Wireless Debugging setting through its protected receiver. After the one-time ADB permission setup, wireless-debug-on/off do not need an already-connected ADB transport for each later toggle.
- Local Termux Shell is an authenticated loopback command route running under the Termux app UID. It is managed with wadb-local-on/status/shell/off and does not require ADB or Android adbd to stay enabled.

A transport-only disconnect leaves Wireless Debugging ON. Switching Wireless Debugging OFF ends the ADB wireless route but does not stop MCP or Local Termux Shell. Always choose the exact layer the owner asked to change.


### wadb-integrity-check

Use case: Verify the signed release identity and the installed WADB files covered by the signed installed-file inventory.

Changes system: No. Read-only.

Commands:
  wadb-integrity-check
  wadb-integrity-check --expected-fingerprint YOUR_TRUSTED_RELEASE_KEY_SHA256

Expected success includes SIGNATURE=VALID, FILES_FAILED=0, and INSTALLED_INTEGRITY=VERIFIED. A mismatch is reported as INSTALLED_INTEGRITY=TAMPERED; missing or malformed metadata is a verification failure.

The default trust pin is the fingerprint accepted by the installer and stored in ~/.ai-wadb/release-integrity/trusted-key-fingerprint.txt. For stronger assurance, pass the fingerprint published independently through the official project channel. A local stored pin can itself be changed by an actor who controls the Termux UID.

This is tamper detection, not an immutable boundary. A determined device owner can patch the checker or run a modified copy. See docs/TECHNICAL_REFERENCE.md.

For a toolkit task, use these commands before substituting lower-level Android commands.

### `ai-info`

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

### `ai-info --json`

**Use case:** Machine-readable preflight for an AI.

**Changes system:** No.

**AI rule:** Prefer this over parsing colored terminal output.

### `ai-info`

**Use case:** Guided human setup/menu.

**Changes system:** Only when the user chooses an action.

### `ai-info --connect`

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

### `ai-info --pair CODE`

**Use case:** First-time/fresh trust pairing after `PAIRING_REQUIRED`.

**Requires:** Android's current **Pair device with pairing code** popup must remain visible.

**Example:**
```bash
ai-info --pair 123456
```

**Do not:** Reuse expired codes or infer pairing ports by number. `--pair` requires a current pending state created by `RESULT=PAIRING_REQUIRED`; the 6-digit code itself is never stored. Any completed pairing attempt clears the pending marker. Use `ai-info --pair-reset` if the popup/code was abandoned or changed before pairing.

If pairing succeeds but ColorOS blocks the later WRITE_SECURE_SETTINGS grants, the command reports PAIRING_STATUS=succeeded, PERMISSION_SETUP=blocked_by_coloros, ACTION=enable_disable_permission_monitoring, and RESULT=PAIRED_PERMISSION_SETUP_REQUIRED.

Turn Developer options > Disable permission monitoring > ON (blue), then rerun ai-info --connect. Do not pair again.

### `ai-info --pair-reset`

**Use case:** The Android pairing popup was closed, its code changed, or a pending pairing cycle was intentionally abandoned before `--pair CODE` was run.

```bash
ai-info --pair-reset
```

This clears only the toolkit's pairing-pending marker; it does not delete the ADB key or change Android settings. Then run `ai-info --connect` to start a fresh pairing cycle if needed.

#### Bridge APK update synchronization

The toolkit uses three distinct Bridge APK stages:

1. **Bundled release APK** — `apk/wadb-bridge.apk` inside the toolkit release.
2. **Termux cached installer APK** — `~/.ai-wadb/wadb-bridge.apk`.
3. **Installed Android Bridge** — package `com.jaskran.wadbbridge`.

Running a newer toolkit `install.sh` backs up the old cached APK and replaces stage 2 with the APK shipped by the new release. It does **not** silently uninstall the Android app.

On the next authenticated `ai-info --connect`, the toolkit compares cached and installed Bridge versionCode values. `bridge_sync=install_required` or `bridge_sync=upgrade_required` triggers `adb install -r` from the cached APK, then the installed version is rechecked before ready is reported. `bridge_sync=installed_newer` is never automatically downgraded.

Users should not manually copy a replacement APK into the cache; updating the toolkit updates the authoritative cached installer automatically.

### Local Termux Shell bridge

The v1.0.2 Local Termux Shell is a native, token-authenticated loopback service that runs directly under the Termux app UID. It is independent of Android `adbd`, USB debugging, Wireless Debugging and Wi-Fi.

```text
Termux client -> 127.0.0.1:47173 -> native bridge -> Termux app UID
```

The native helper binds only to `127.0.0.1`, validates the loopback peer and authenticates each request using a random 256-bit token. The Termux-side token is stored at `~/.ai-wadb/local-bridge.token` with mode 600. The helper executes commands through `/system/bin/sh -c` under the Termux app identity, not Android `uid=2000(shell)` and not root.

#### `wadb-local-status`

Read-only status. A healthy result includes:

```text
LOCAL_ADB_STATE=ready
LOCAL_ADB_MODE=termux_loopback_shell
LOCAL_ADB_RUNTIME_UID=<Termux app UID>
PROTOCOL=authenticated_termux_loopback_v1
BRIDGE_AUTH=token
LISTENER_SCOPE=loopback_only
ADB_ENABLED=not_required
ADBD_TCP_EXPOSURE=none
SECURITY_STATE=termux_loopback_shell_no_adb_dependency
```

#### `wadb-local-on` / `ai-info --local-on`

Start or repair the loopback bridge directly under the Termux app UID. It creates a fresh random token, launches the native helper locally, and verifies the authenticated ping and loopback-only status.

The command must not:
- enable `adb_enabled` or USB debugging;
- enable Wireless Debugging;
- turn Wi-Fi on for bootstrap;
- connect, pair or scan for an ADB endpoint;
- start or require Android `adbd`.

Success reports `USB_DEBUGGING_REQUIRED=no`, `WIRELESS_DEBUGGING_REQUIRED=no`, `WIFI_REQUIRED=no` and `ADBD_REQUIRED=no`.

If the port is occupied by an unrecognised process, the helper fails closed rather than killing it or turning debugging on.

#### `wadb-local-shell`

Run commands as the Termux app UID:

```bash
wadb-local-shell --ping
wadb-local-shell -c 'id'
wadb-local-shell -c 'pwd'
```

**Permission boundary:** the app UID is deliberately less privileged than Android shell UID 2000. Protected global Settings operations and other shell-only commands can return `SecurityException`. Use WADB Bridge for its explicitly permissioned settings operations. Use Wireless ADB only when an Android shell-UID capability is specifically required and the owner explicitly authorises debugging.

#### `wadb-local-off --confirm`

Stops only the authenticated local bridge and removes its Termux-side token. It does not change USB debugging, Wireless Debugging, Wi-Fi or Android adbd state.

```bash
wadb-local-off --confirm
```

The bridge is an app-owned process and Android may reclaim it during force-stop, reboot or background restrictions. Run `wadb-local-on` again when necessary. This is not a persistent system service.

### `wireless-debug-status`

**Use case:** Read Wireless Debugging and `adbd` state and verify that WADB Bridge can write the setting.

**Changes system:** It performs only a no-op write of the current Wireless Debugging value to verify permission; it does not change ON/OFF state.

**Healthy result includes:**
```text
bridge_write=ready
```

`bridge_write=denied` means the Bridge still needs its one-time secure-settings grant.

### `wireless-debug-on`

**Use case:** Enable Wireless Debugging through WADB Bridge.

**Requires:** WADB Bridge + required permission bootstrap.

**Verify:**
```bash
wireless-debug-status
```

### `wireless-debug-off`

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

### `wireless-adb-connect`

**Use case:** Lower-level Wireless ADB reconnect/diagnostic path.

Use `ai-info --connect` for normal operation.

### `adb-mdns-discover`

**Use case:** Typed Android mDNS endpoint discovery.

```text
_adb-tls-connect._tcp.local = normal connection
_adb-tls-pairing._tcp.local = temporary pairing
```

Do not infer role from port number.

### `phone-capabilities --details`

**Use case:** Read-only capability report.

### `wadb-mcp-recovery-setup`

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

### `wadb-mcp-start`

**Use case:** Start/ensure Remote Desktop Commander online.

**Keeps saved login:** Yes.

**Verify:**
```bash
wadb-mcp-status
```

### `wadb-mcp-stop`

**Use case:** Intentionally stop this managed MCP process.

**Keeps saved login:** Yes.

**Recovery behavior:** This changes only `mcp_desired` to `offline`. It does not disable the recovery watchdog. When recovery is enabled, the watcher continues polling and a later GitHub `START_MCP` can bring Desktop Commander back.

**Note:** Default stop is delayed briefly so a remote AI can receive the command result before its own MCP disappears.

### `wadb-mcp-restart`

**Use case:** Clean MCP restart.

**Keeps saved login:** Yes.

**Does not:** Require browser verification when saved authorization remains valid.

### `wadb-mcp-status`

**Use case:** Compact recovery/MCP state, including `recovery_enabled`, `mcp_desired`, `mcp_actual`, process count, watchdog state/interval, and GitHub state.

**JSON:**
```bash
wadb-mcp-status --json
```

### `wadb-mcp-logout --confirm`

**Use case:** Intentionally remove/clear Remote Desktop Commander authorization.

**Warning:** This is not normal stop/restart/recovery. The next start may require browser verification.

Never use it as a recovery shortcut.

### `wadb-mcp-github-config`

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

### `wadb-mcp-github-test`

**Use case:** Read-only verification that the phone can fetch and validate the configured control JSON, including schema, generation, action, and target.

**Changes system state:** No recovery action is executed. The command also reports whether the next real sync will baseline the current generation (`BASELINE_ON_NEXT_SYNC=yes|no`).

**Example:**
```bash
wadb-mcp-github-test
```

### `wadb-mcp-github-sync`

**Use case:** Force an immediate read **and processing** of a configured GitHub control generation.

For a newly selected control identity, the first sync only establishes the baseline and does not execute the action already present. For an established identity, only a generation greater than the last processed generation executes. Normally the watchdog performs this automatically.

`STATUS` refreshes only the phone's local status; the read-only phone path does not publish a status response back to GitHub.

### `wadb-mcp-recovery-disable`

**Use case:** Disable local watchdog/recovery without deleting saved MCP authorization.

**Does not:** stop or log out an already-running Desktop Commander process. This is the recovery master switch; `wadb-mcp-stop` is the separate MCP process stop.

### `wadb-mcp-log`

**Use case:** View the managed Desktop Commander log without starting a second MCP process.

```bash
wadb-mcp-log
wadb-mcp-log --follow
wadb-mcp-log --events 40
```

Ctrl+C while `--follow` is active stops only the log viewer.

### Owner commands

Owner labels are optional identification guards.

```bash
ai-info --owner-show
ai-info --owner-set NAME
ai-info --owner-clear
```

They do not change authentication, ADB trust, GitHub authorization, or MCP device identity.

### `wadb-toolkit-uninstall`

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

### Recovery rollback behavior

```bash
wadb-mcp-recovery-disable
```

restores the `allow-external-apps` property that existed before recovery setup.

Use `--keep-external-apps` only when the user deliberately wants to leave that Termux capability enabled.

### Fallback ADB scan bounds

Typed mDNS is always preferred. The untyped fallback can be adjusted without editing the script:

```bash
WADB_SCAN_MIN=30000 WADB_SCAN_MAX=65535 wireless-adb-connect
```


### `ai-info --disconnect`

**Use case:** Open the explicit Wireless ADB disconnect submenu.

**Choices:**
1. Disconnect only the current verified network ADB transport. This uses the exact discovered host-and-port serial; it does not run a broad `adb disconnect` and leaves Android Wireless Debugging ON.
2. Turn Android Wireless Debugging OFF through the WADB Bridge. This ends Wireless ADB but does not stop Desktop Commander MCP or the independent Local Termux Shell.
3. Cancel without changing anything.

**Non-interactive explicit forms:**
```bash
ai-info --disconnect-transport --confirm
ai-info --wireless-off --confirm
```

Both forms require `--confirm`. The transport-only form refuses USB, loopback and emulator serials and refuses to act when the target cannot be verified.

**Important separation:** Wireless ADB disconnect, secure local-shell shutdown (`wadb-local-off --confirm`), and Desktop Commander stop (`wadb-mcp-stop`) are different actions. This submenu changes only the selected Wireless ADB layer.

### `ai-info --commands`

**Use case:** Show the complete command catalogue and this Toolkit's detailed `COMMAND_REFERENCE.md`.

The interactive Control Center also includes **All commands & usage**. It first shows the command index, then opens the full reference in `less`/`more` when available, or prints it directly. The document contains each command's purpose, examples, side effects, verification and important safety/recovery notes.

**Changes system:** No. Read-only.
