# MCP Recovery Troubleshooting

## MCP is offline but credentials say `yes`

Run locally:
```bash
wadb-mcp-start
wadb-mcp-status
```

If GitHub recovery is configured and the AI has lost MCP, increment the GitHub control generation and set `START_MCP`.

## Reboot recovery does not start

Check:
```bash
ai-info --recovery
grep allow-external-apps ~/.termux/termux.properties
```

WADB Bridge needs its one-time `com.termux.permission.RUN_COMMAND` grant. Rerun:
```bash
wadb-mcp-recovery-setup
```
and approve the Android permission dialog if shown.

## Desktop Commander asks for browser verification after every restart

Check whether a logout command or credential deletion occurred. Normal `wadb-mcp-stop`, `wadb-mcp-start`, `wadb-mcp-restart`, phone reboot, and watchdog recovery must not delete:
```text
.desktop-commander-device/device.json
```

## GitHub command is ignored

Check:
- repository is readable by the phone,
- configured owner/repo/branch/file are correct,
- `target` matches,
- `generation` is a larger integer than the previous command,
- action is one of the four allowed actions.

Force a check:
```bash
wadb-mcp-github-sync
ai-info --recovery
```

## Owner label missing

This is not an error. Owner labels are optional. Set one only if it helps distinguish multiple MCP environments.


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
