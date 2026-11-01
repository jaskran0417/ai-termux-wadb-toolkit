# AI Execution Rules

These rules apply to AIs operating this toolkit through Desktop Commander or another authorized shell connector.

## ChatGPT reasoning mode

When ChatGPT offers **Think harder / Thinking**, prefer it for every message or task, including toolkit operations and ordinary daily use. On interfaces that support it, use **+ → Think harder** or **`@Thinking`** for the current message. Do not assume it remains enabled for later messages; re-select it for each new message when available.

This is also a useful daily-use recommendation, especially for Free users who want more careful reasoning. It does not replace Plugins/connectors, file access, or state checks: use the actual available tools and current files/device state whenever correctness depends on them.

## Source priority

For a toolkit task, use this order:
1. `READ_THIS_FIRST_AI.md`
2. `docs/COMMAND_REFERENCE.md`
3. `ai-info --json`
4. matching bundled helper
5. troubleshooting document
6. lower-level diagnostics only when the helper actually fails.

The AI may use broader legitimate Termux/Android capabilities for unrelated tasks, but should not replace an established WADB mechanism without a reason.

## Required preflight

Before a setup/change command:

```bash
ai-info --json
```

When multiple Remote Desktop Commander sessions are visible, identify the intended one. If an optional owner label exists, use it as a guard. Absence of an owner label is not an error.

## Required post-check

Every state-changing helper has a verification command in `COMMAND_REFERENCE.md`. Run it before telling the user the change succeeded.

Desktop Commander itself and Termux's `~/.android/adbkey` are not toolkit-owned. Never stop/logout Desktop Commander or delete its saved device login/ADB key as part of toolkit uninstall. `wadb-toolkit-uninstall --all` removes only toolkit-owned recovery/runtime state.

## User interaction

Before MCP: give the user the minimum manual bootstrap steps.

After MCP: execute supported shell commands yourself. Do not tell the user to copy/paste commands into Termux when the connected AI can run them.

Ask the user only when a genuine human action is needed, such as:
- browser/device authentication,
- Android permission approval,
- when first-time setup returns `RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE`, turning Wireless Debugging ON and, on ColorOS/OPPO/OnePlus/realme, turning **Disable permission monitoring ON (blue)** in the same user action,
- opening the temporary Wireless ADB pairing popup only after `RESULT=PAIRING_REQUIRED`,
- providing a current six-digit pairing code,
- after `PAIRING_REQUIRED`, immediately using `ai-info --pair CODE`; never run another `--connect` first. The toolkit's pending guard is authoritative if it returns `RESULT=PAIRING_CODE_REQUIRED`,
- creating a GitHub repository when the AI's connector cannot create one.

Never report Wireless ADB setup complete merely because ADB connected. Require `RESULT=CONNECTED_AND_READY` and `bridge_write=ready`.

## Destructive distinction

Normal:
- `wadb-mcp-stop`
- `wadb-mcp-start`
- `wadb-mcp-restart`

These keep saved MCP credentials.

Destructive to saved authorization:
- `wadb-mcp-logout --confirm`

Never use logout as routine recovery.

## Output

Use concise results for users. Use `ai-info --json` for automation. Raw Android broadcast output belongs in diagnostics, not normal explanations.


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
