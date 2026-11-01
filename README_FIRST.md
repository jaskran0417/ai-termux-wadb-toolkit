# AI Termux WADB Toolkit v1.7.5 — Read First

For a human, start with:

`docs/START_HERE.md`

For an AI, start with:

`docs/READ_THIS_FIRST_AI.md`

The AI must read the included instructions before giving toolkit setup commands or performing toolkit changes.

> HARDENED RELEASE — v1.7.5. This package includes signed release and installed-file integrity checks, installer path preflight, rollback snapshots for ordinary failures, concurrent-installer locking, bounded authenticated local-bridge workers, permission-mode checks, and independently supplied trust pins. Verify the release-key fingerprint, installer hash and verifier hash through the project's independent official release announcement before running the installer. The toolkit does not require root; rooted Termux users may authorize su for commands that need it. Wireless ADB and Secure Local Shell retain Android shell-user permissions. See docs/INTEGRITY_VERIFICATION.md and docs/SECURITY_AND_ROLLBACK.md.

## Setup order

```text
1. Desktop Commander Remote MCP
2. Toolkit install/check
3. Wireless ADB / WADB Bridge
4. Optional local MCP recovery
5. Optional GitHub remote recovery
6. Optional owner label / advanced features
```

Desktop Commander is the first dependency for AI-controlled setup. Before MCP is connected, the AI can only guide the user through the manual bootstrap. After MCP is connected, the AI should execute supported Termux commands itself and only ask the user for actions that truly require a human.

## Main interface

```bash
ai-info
```

Human-friendly colorful dashboard.

```bash
ai-info
```

Guided menu.

```bash
ai-info --json
```

Machine-readable state for an AI.

## Important distinctions

- MCP and ADB are separate.
- Desktop Commander itself is not owned by this toolkit; uninstall never stops/logs it out or deletes its saved login.
- `~/.android/adbkey` is Termux/ADB client state and is always preserved by toolkit uninstall.
- MCP can remain online while Wireless ADB is off.
- Existing ADB trust should be tried before pairing.
- After `PAIRING_REQUIRED`, use `ai-info --pair CODE` next. A pending-state guard blocks an accidental second `--connect` so an older code is not used against a newly-created pairing session.
- On ColorOS-family first setup, Wireless Debugging and Disable permission monitoring should be enabled together before pairing.
- The toolkit release APK, the Termux cached APK, and the Android-installed Bridge are separate stages; toolkit updates replace the cache and synchronize a newer Bridge on the next authenticated ADB connection.
- MCP STOP/START/RESTART preserve saved authorization.
- MCP LOGOUT is separate/destructive to saved authorization.
- GitHub recovery is optional. Its AI-side writer and phone-side reader are independent: they may use different GitHub accounts/credentials. Always run the read/validation command and first-sync baseline before a STOP/START recovery action.
- Owner label is optional.
- Root is not required. The toolkit does not require root. Its normal commands run with the permissions available to Termux. On a rooted device, Termux may also run commands through the device's installed su mechanism when the owner explicitly authorizes access in the root manager. Wireless ADB and Secure Local Shell remain separate Android shell routes and do not silently become root.

## Ready-made AI prompts

Read:

`docs/PROMPTS_FOR_AI.md`

## Full command reference

Read:

`docs/COMMAND_REFERENCE.md`


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

## Secure local shell

`wadb-local-on` establishes the maintained v1.7.5 token-authenticated `uid=2000(shell)` bridge on `127.0.0.1:47173`. Android adbd remains in USB mode with classic TCP disabled (`service.adb.tcp.port=0`).

Use:

```bash
wadb-local-status
wadb-local-shell -c 'id'
```

See `docs/COMMAND_REFERENCE.md` for bootstrap, security, and recovery details. Reboot persistence is not guaranteed.


## v1.7.5 R2 — Control Center disconnect and command catalogue

The interactive `ai-info` Control Center has separate **Disconnect Wireless ADB** and **All commands & usage** entries. The disconnect submenu offers exact verified network transport disconnect or Bridge-mediated Wireless Debugging OFF, with confirmation. It never silently stops MCP or the secure local shell.

For scripts, use `ai-info --disconnect-transport --confirm` or `ai-info --wireless-off --confirm`. Run `ai-info --commands` for the full edition-specific command reference. Keep the meanings of these layers separate: `wireless-debug-off` controls Android Wireless Debugging, `wadb-local-off --confirm` stops the secure local shell bridge, and `wadb-mcp-stop` stops Desktop Commander.

