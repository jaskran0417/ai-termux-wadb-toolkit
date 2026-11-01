# Detailed User Setup

## ChatGPT Free/daily-use recommendation

If ChatGPT shows **Think harder / Thinking**, use it for each message or task when the option is available. You can normally select **+ → Think harder** or use **`@Thinking`** for that message. Do not treat one selection as permanently enabling it for all later replies; select it again for each new message.

This recommendation applies to normal daily ChatGPT use as well as this toolkit. It is particularly useful for files, Plugins/connectors, troubleshooting, coding, research, comparisons, and multi-step tasks.

## Path A — AI-assisted (recommended)

1. Install/open Termux.
2. Give the toolkit ZIP or standalone AI instruction MD to your AI.
3. Tell the AI to read `READ_THIS_FIRST_AI.md`.
4. Follow only the initial Desktop Commander bootstrap steps until MCP is connected.
5. Complete browser/device verification.
6. Connect Remote Desktop Commander to the AI using the client's plugin/connector/Custom MCP flow.
7. Tell the AI: **"MCP is connected. Continue according to the toolkit instructions."**
8. From that point the AI should run supported Termux commands itself.
9. On ColorOS/OPPO/OnePlus/realme first setup, turn **Wireless Debugging ON** and **Disable permission monitoring ON (blue)** together when the toolkit requests Wireless ADB setup.
10. If first ADB trust is required, keep the pairing popup visible and send the current 6-digit code. After the toolkit says `PAIRING_REQUIRED`, the AI must use `ai-info --pair CODE` next and must not run `ai-info --connect` again first.

Recommended order after MCP:
```text
toolkit install/check
→ ai-info --json
→ Wireless ADB
→ on ColorOS/OPPO/OnePlus/realme first setup: Wireless Debugging ON + Disable permission monitoring ON/blue
→ pairing only if RESULT=PAIRING_REQUIRED
→ automatic WADB Bridge install/finalization
→ verify bridge_write=ready
→ optional local MCP recovery
→ optional GitHub recovery
```

## Path B — manual

1. Prepare Termux and connect Desktop Commander using `docs/REMOTE_MCP_AI_CONNECTION.md` if you want remote AI access.
2. Extract the bundle.
3. Run:
```bash
bash install.sh
```
4. Run:
```bash
ai-info
```
5. Follow the interactive Control Center.
6. For GitHub recovery, read `docs/RECOVERY_GITHUB.md`. Choose one phone read method (`token`, `gh`, or `public`), run `wadb-mcp-github-test`, establish the safe first-sync baseline, then verify a newer-generation `STATUS` command before any STOP/START recovery action.

## Important

The first Desktop Commander login must succeed before automatic MCP recovery can reuse it.

Normal MCP stop/restart/reboot should keep authorization. Do not use logout unless you intentionally want to require a new authorization.


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
