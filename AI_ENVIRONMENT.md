# AI Termux WADB Environment — v1.0.3

This file is the installed environment reference. The mandatory AI workflow is in:

`~/AI_WADB_DOCS/AI_GUIDE.md`

The human start guide is:

`~/AI_WADB_DOCS/USER_GUIDE.md`

The required provider-specific Remote MCP Android-app connection instructions are:

`~/AI_WADB_DOCS/DESKTOP_COMMANDER_SETUP.md`

## Initial setup — Point 1: recommended AI-assisted method

For every first-time setup conversation, present **1. Recommended method — AI-assisted setup through Remote Desktop Commander** as the first point in the Initial setup sequence, before any manual fallback. Give the official Toolkit release ZIP or AI instructions to a compatible assistant and ask it to follow the installed AI_GUIDE.md. The AI checks the actual provider integration first, reuses an existing connection when available, and for ChatGPT prefers the dedicated Remote Desktop Commander plugin by Desktop Commander. If no connection is active, it checks the provider plugin/connector directory and asks the owner only for the minimum unavoidable phone-agent/browser authorization action. **After MCP reaches Termux, the AI performs dependency checks, obtains and verifies the release, installs and configures the Toolkit, and runs post-checks itself. It must not ask the owner to download/extract release files, type package commands, copy hashes, set trust variables, run the installer, or paste Toolkit commands that the AI can execute.** The owner completes only device approvals and pairing actions that require owner input. The manual alternative remains available in the installed USER_GUIDE.md only as a secondary fallback.

## Where the Toolkit is installed

The Toolkit runs inside Termux; it is not a standalone Android launcher app.

- User commands: /data/data/com.termux/files/usr/bin/
- Shared helpers/native bridge/verifier: /data/data/com.termux/files/usr/libexec/ai-wadb/
- Installed guides: ~/AI_WADB_DOCS/
- Environment reference: ~/AI_ENVIRONMENT.md
- Private state, Bridge APK cache, recovery settings and local-shell token: ~/.ai-wadb/

Desktop Commander is a separate Node.js-based dependency, not bundled in the Toolkit. WADB Bridge is the Android companion package. Termux:API is optional and consists of a Termux command package plus its compatible Android companion app.

## Initial setup means

Initial setup establishes the AI Remote MCP connection and performs the one-time Android trust/permission grants. The owner enables Wireless Debugging, pairs the Termux ADB client when Android requires it, then the Toolkit uses the authenticated ADB shell to install/update WADB Bridge and grant/verify WRITE_SECURE_SETTINGS for Termux and the Bridge. A complete setup requires RESULT=CONNECTED_AND_READY and bridge_write=ready.

After that grant is verified, wireless-debug-on and wireless-debug-off call the protected WADB Bridge receiver directly. They do not need an already-connected ADB transport for each later toggle. Turning Wireless Debugging ON does not itself pair/connect ADB; ai-info --connect handles the separate ADB connection workflow.

## Primary interface

```bash
ai-info
ai-info
ai-info --json
ai-info --doctor
```

For an AI, `ai-info --json` is the preferred state check before a toolkit operation.

## Remote control layers

```text
AI
→ Remote Desktop Commander MCP
→ Termux
→ optional Wireless ADB
→ Android shell
```

Desktop Commander MCP and Wireless ADB are independent.

## Remote Desktop Commander

Initial phone-side start:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Remote MCP endpoint for clients that need it:

```text
https://mcp.desktopcommander.app/mcp
```

Before asking the owner to set up MCP, the AI must inspect its current tools/apps/connectors and read `~/AI_WADB_DOCS/DESKTOP_COMMANDER_SETUP.md`. For ChatGPT, check for and prefer the dedicated **Remote Desktop Commander** plugin by **Desktop Commander**. Do not direct the owner to Developer Mode or custom MCP setup in ChatGPT Android. Once MCP reaches the phone, the AI performs the remaining Toolkit setup.

After one successful authentication, normal start/stop/restart/reboot should preserve the saved authorization.

Managed commands:

```bash
wadb-mcp-start
wadb-mcp-stop
wadb-mcp-restart
wadb-mcp-status
```

Intentional logout only:

```bash
wadb-mcp-logout --confirm
```

## Wireless ADB

Normal interface:

```bash
ai-info --connect
```

Only when it returns `RESULT=PAIRING_REQUIRED`:

```bash
ai-info --pair CODE
```

At that point the toolkit records `PAIRING_STATE=pending`. Do not run `ai-info --connect` again before `--pair CODE`; a second connect returns `RESULT=PAIRING_CODE_REQUIRED` without starting another pairing cycle. `ai-info --pair-reset` clears an abandoned/changed popup before a fresh connect cycle. The 6-digit code is never stored.

Proven helpers:

```bash
wireless-debug-status
wireless-debug-on
wireless-debug-off
wireless-adb-connect
adb-mdns-discover
phone-capabilities --details
```

Typed endpoints:

```text
_adb-tls-connect._tcp.local = normal connection
_adb-tls-pairing._tcp.local = temporary pairing
```

Do not infer endpoint role from the port number.

## Local Termux shell / no-debug loopback control

The v1.0.2 local command bridge runs directly under the Termux app UID. It does **not** start or depend on Android `adbd`, USB debugging, Wireless Debugging or Wi-Fi.

```text
Desktop Commander / Termux
  -> authenticated loopback client
  -> 127.0.0.1:47173
  -> native token-authenticated bridge
  -> Termux app UID (not uid=2000 shell)
```

Commands:

```bash
wadb-local-status
wadb-local-on
wadb-local-shell -c 'id'
wadb-local-off --confirm

ai-info --local
ai-info --local-on
ai-info --local-off --confirm
```

The native bridge binds only to IPv4 loopback, authenticates every request with a random 256-bit token stored mode 600 in Termux, and launches requested commands under the Termux app identity. The local server remains separate from ADB and the Wireless Debugging transport.

The lower-privilege identity is intentional. Commands that require Android shell UID 2000, such as privileged global Settings operations or other shell-only Android operations, are not available through this route. Use WADB Bridge for its specifically permissioned operations; use Wireless ADB only when an Android shell-UID operation is actually required and the owner explicitly enables it.

The bridge is an app-owned process, not a guaranteed Android system service. Android may stop it during process reclamation, force-stop, reboot or OEM background restriction. Rerun `wadb-local-on` to start it; this will not enable debugging.

The local bridge does not expose an ADB protocol listener or classic adbd TCP port 5555.
## MCP recovery

Local recovery:

```bash
wadb-mcp-recovery-setup
ai-info --recovery
```

GitHub remote recovery is optional. Configure the phone read path, then verify it before any STOP/START recovery action:

```bash
wadb-mcp-github-config --help
wadb-mcp-github-test
```

Supported phone read modes are `token`, `gh`, `public`, and `auto`. The AI-side GitHub account and phone-side credential do not have to be the same account: the AI writer needs write access and the phone reader needs only read access. `public` requires no phone GitHub credential and uses anonymous git+curl; `gh` requires an authenticated Termux GitHub CLI session; `token` uses a private local read token file.

A new owner/repo/branch/file/target identity is baselined on first sync, so the action already present is not executed during setup. Only a later higher generation executes. `STATUS` refreshes local phone status only; it does not send a status response back through GitHub.

Read:

`~/AI_WADB_DOCS/TECHNICAL_REFERENCE.md`

## Optional owner label

```bash
ai-info --owner-show
ai-info --owner-set NAME
ai-info --owner-clear
```

This is only an identification guard; it does not change authentication.

## Privilege boundary

The normal Termux shell runs as the Termux app UID. Wireless ADB, when connected, normally provides Android `uid=2000(shell)`. Neither equals root.

## AI behavior

For documented toolkit functions:
1. read the instruction,
2. run `ai-info --json`,
3. use the matching helper,
4. verify,
5. report the observed result.

Do not replace a known-working helper with a random alternative unless the documented path genuinely fails and has been diagnosed.

## v1.0.1 first-setup and Bridge update rules

On ColorOS/OPPO/OnePlus/realme first setup, enable **Wireless Debugging** and **Disable permission monitoring (ON/blue)** together before pairing. `ai-info --connect` exposes `DISABLE_PERMISSION_MONITORING=on|off|unknown`, and `ai-info --json` exposes the same state as `wireless_adb.disable_permission_monitoring`.

The authoritative install source for WADB Bridge is `~/.ai-wadb/wadb-bridge.apk`, populated from the release's `apk/wadb-bridge.apk` by `install.sh`. A newer toolkit replaces that cache automatically. On the next authenticated ADB connection, `ai-info --connect` compares cached and installed Bridge versionCode values and installs the cached APK when the installed Bridge is missing or older.

## v1.0.1 uninstall ownership rule

Desktop Commander itself is external to the WADB toolkit. Toolkit uninstall must never stop it, log it out, remove its saved device login, or delete Termux's ~/.android/adbkey.

Use wadb-toolkit-uninstall --all for full toolkit-owned cleanup. Use --keep-recovery when the minimum Bridge + MCP recovery runtime must remain. Use --dry-run to preview. If authenticated ADB is unavailable, WADB Bridge cannot be removed automatically; instruct the user to open Android Settings > Apps > WADB Bridge > Uninstall. WADB Bridge has no app-drawer icon.



## Current MCP recovery state model

The toolkit keeps **automatic recovery** separate from the desired Desktop Commander MCP state.

- `recovery_enabled=yes|no` controls whether the watchdog/Android recovery path is allowed to run.
- `mcp_desired=online|offline` records whether Desktop Commander itself should be running.
- `mcp_actual=online|offline` reports the observed process state.
- `mcp_process_count` reports matching Desktop Commander processes for the configured MCP HOME.

`wadb-mcp-stop` changes only the MCP desired state to `offline` and stops Desktop Commander. It preserves saved authorization and does not disable recovery. When recovery is enabled, the watchdog remains available, continues its GitHub polling cycle, and can accept a later `START_MCP`.

`wadb-mcp-recovery-disable` is the separate master recovery-off operation. It stops the watchdog and marks recovery disabled, but it does not stop or log out an already-running Desktop Commander process and does not delete its saved authorization.

If the watcher dies while recovery is enabled and MCP is intentionally offline, `wadb-mcp-job` may restore the watcher while leaving MCP offline. This lets a later GitHub `START_MCP` work without incorrectly turning MCP on during watcher restoration.

The normal watchdog interval is 15 seconds. The WADB Bridge Android recovery alarm is a one-shot fallback scheduled for about fifteen minutes later and re-armed only after the Termux recovery job confirms that recovery is enabled. Disable cancels the alarm. The explicit-only Bridge control channel is protected by Android's WRITE_SECURE_SETTINGS sender permission (already granted to the Toolkit's Termux app); the Bridge's Termux RUN_COMMAND permission is separately required for recovery jobs.

### Notifications

Recovery notifications are local Android notifications; no Firebase/FCM or external notification cloud service is required.

When both the Termux `termux-api` command package and the compatible Termux:API Android companion app are available, Termux can notify on state transitions such as watchdog start, MCP start/stop/recovery, GitHub recovery, and recovery enable/disable. Successful 15-second heartbeat checks remain silent.

WADB Bridge v1.6 (versionCode 7) also has a native **WADB Recovery** notification channel for Android-side boot, package-replaced, and explicit recovery-check transitions. The one-shot alarm check is silent. On Android 13 and later, notification permission may be requested; denying notification permission suppresses notifications but does not disable recovery.

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


## Release integrity check

Run wadb-integrity-check to verify the signed installed-file inventory. It is read-only. A clean result is INSTALLED_INTEGRITY=VERIFIED; a mismatch is INSTALLED_INTEGRITY=TAMPERED. For verification against a separately published official key pin, pass --expected-fingerprint. This is tamper detection, not tamper-proofing. The v1.0.2 release uses an independently supplied public-key fingerprint; see AI_WADB_DOCS/TECHNICAL_REFERENCE.md.


## Control Center — disconnect and command catalogue (v1.0.1 R2)

Run `ai-info` in an interactive Termux terminal. Choose **Disconnect Wireless ADB** to select either:
- disconnect only the exact verified network ADB transport (Wireless Debugging stays ON), or
- turn Android Wireless Debugging OFF through WADB Bridge.

The action asks for confirmation. It does not stop the MCP host or the Local Termux Shell. Those remain separate:
- MCP process: `wadb-mcp-stop` / `wadb-mcp-start`
- Local Termux Shell: `wadb-local-off --confirm` / `wadb-local-on`

Choose **All commands & usage** or run `ai-info --commands` to open the current full command reference. For headless use, the explicit safe forms are `ai-info --disconnect-transport --confirm` and `ai-info --wireless-off --confirm`.
