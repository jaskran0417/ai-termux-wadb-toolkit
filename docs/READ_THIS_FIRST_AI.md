# READ THIS FIRST — Mandatory AI Instructions

Version: 1.7.5

If the user gives you this toolkit ZIP/MD or asks about its setup, commands, Wireless ADB, Desktop Commander, MCP recovery, GitHub recovery, or troubleshooting, use the toolkit's documented workflow before inventing another one.

## ChatGPT — Think harder / Thinking

For ChatGPT, especially on Free accounts, **Think harder / Thinking is recommended for every message or task when the option is available**. This recommendation is not limited to this toolkit; it can also be used for ordinary daily questions and tasks when better reasoning, careful file reading, tool use, or multi-step work is useful.

On interfaces that provide these controls, either:
- tap **+ → Think harder** before sending the message, or
- invoke/select **`@Thinking`** for that message.

Treat this as a **per-message choice**. Selecting Think harder/Thinking for one reply must not be assumed to keep it enabled for later replies. Re-select it for each new message because the previous selection must not be assumed to stay active.

For toolkit work, Think harder/Thinking is strongly recommended for setup, troubleshooting, recovery, file inspection, Plugins/connectors, coding, audits, package rebuilding, and any other multi-step operation.

Think harder/Thinking does not itself grant access to a Plugin, connector, file, or permission. The AI must still use the available connected tools/files when the task depends on them, re-read the relevant toolkit instructions, obtain fresh state, and verify the result instead of relying only on chat history.

## Mandatory order before replying or acting

1. Read this file.
2. Read `docs/COMMAND_REFERENCE.md` for the requested operation.
3. Determine whether Desktop Commander MCP is already connected.
4. If MCP is connected and `ai-info` exists, run `ai-info --json` before changing anything.
5. Use the documented helper for the matching task.
6. Verify the result with the documented verification command.
7. Report the observed result, not the expected result.

Do not rediscover a different setup path when the documented path applies.

## Stage 1 — Desktop Commander MCP comes first for AI-controlled setup

Before MCP exists, the AI cannot operate Termux itself. Give the user only the minimum bootstrap steps in `docs/REMOTE_MCP_AI_CONNECTION.md`.

The phone-side command is:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

The Remote MCP endpoint for clients that require a URL is:

```text
https://mcp.desktopcommander.app/mcp
```

For ChatGPT, use the available Remote Desktop Commander plugin/connector when present; the user completes its normal Connect/auth flow. For clients with Custom MCP, use the Remote MCP URL according to the client instructions.

Once MCP is actually connected, stop asking the user to type shell commands that the AI can execute through Desktop Commander. User action is still appropriate for Android permission dialogs, browser authentication, or a temporary ADB pairing code.

## Stage 2 — Toolkit + Wireless ADB

After MCP is connected:

```bash
ai-info --json
```

If the toolkit is not installed, install it from the extracted bundle with:

```bash
bash install.sh
```

or, with user approval to install missing Termux packages:

```bash
bash install.sh --yes
```

Then run:

```bash
ai-info --json
ai-info --connect
```

Existing trusted ADB keys must be tried before requesting pairing. Ask for a 6-digit pairing code only when `ai-info --connect` returns `RESULT=PAIRING_REQUIRED`. On ColorOS-family phones, read the command's `DISABLE_PERMISSION_MONITORING` line before asking for the code; if it says `off`, ask the user to turn the option ON/blue first.

After `RESULT=PAIRING_REQUIRED`, **do not run `ai-info --connect` again before using the user's code**. The toolkit records `PAIRING_STATE=pending` and a second `--connect` is deliberately blocked with `RESULT=PAIRING_CODE_REQUIRED`. Immediately run `ai-info --pair CURRENT_CODE`. The toolkit never stores the code. If the Android pairing popup was closed/changed, run `ai-info --pair-reset` and then start a fresh `ai-info --connect` cycle.

For a fresh WADB Bridge setup, `ai-info --connect` is not complete merely because `adb shell id` works. After the first authenticated ADB shell it must automatically run/verify the documented bridge finalization when needed. Do not report the WADB setup complete until the command returns `RESULT=CONNECTED_AND_READY` and `ai-info --json` reports `"bridge_write":"ready"`.

If it returns `RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE`, first-time Wireless ADB bootstrap is incomplete. On normal Android, ask the user to turn Wireless Debugging ON. On ColorOS/OPPO/OnePlus/realme, ask for both **Wireless Debugging ON** and **Disable permission monitoring ON (blue)** in the same user action. The command itself reports `DISABLE_PERMISSION_MONITORING=on|off|unknown`, so do not omit this step merely because an AI forgot it. Then rerun `ai-info --connect`. Reuse the existing trusted key first; do not ask for a new pairing code unless Android actually rejects it.

## Stage 3 — Optional MCP recovery

Only configure recovery after Desktop Commander has authenticated at least once so saved credentials exist.

Local recovery:

```bash
wadb-mcp-recovery-setup
wadb-mcp-status
```

The setup command must bind recovery to the authenticated Desktop Commander HOME. It prefers the current authenticated MCP HOME, then a previously saved valid recovery HOME, then the normal Termux HOME. If several other authenticated HOMEs exist and the correct one is ambiguous, do not guess: use `wadb-mcp-recovery-setup --mcp-home PATH --target NAME` or let the interactive chooser ask the user. Owner labels remain optional.

`STOP`, `START`, and `RESTART` preserve authentication. `LOGOUT` is different: it removes the saved Remote Desktop Commander authorization and can require browser verification again.

Never use logout as normal restart/recovery.

## Stage 4 — Optional GitHub recovery

GitHub provides an independent cloud control path when MCP itself is offline. It is optional and is not part of the first MCP connection.

If the AI has an authorized GitHub connector, GitHub writes are independent of Desktop Commander: the AI may update the recovery control file even while MCP is offline. The AI must inspect which GitHub connector actions are actually available. If repository creation is unavailable, ask the user only to create/select the repository once, then continue with the connector and MCP.

The AI-side GitHub account and the phone-side GitHub account/token do **not** have to be the same identity. The AI side needs write access to the control file; the phone side needs only read access. Supported phone read modes are: private repo + fine-grained one-repo read-only token, existing Termux `gh` login, or public repo with no phone GitHub credential. Public mode requires ordinary `git` + `curl`; `gh` mode requires the `gh` package and an authenticated `gh` session; token mode requires a private local token file and must never ask the user to paste that token into AI chat.

Run `wadb-mcp-github-test` before any action test. A new owner/repo/branch/file/target identity is baselined on first sync: the current generation is recorded and its existing action is **not** executed. Only a later higher generation can execute. `STATUS` only refreshes local phone status; it does not upload a response to GitHub.

Read `docs/RECOVERY_GITHUB.md` before configuring or using GitHub recovery.

Allowed remote actions are only:

```text
START_MCP
STOP_MCP
RESTART_MCP
STATUS
```

`LOGOUT_MCP` is deliberately not accepted from GitHub.

## Owner labels are optional

The owner marker is a safety label only. It is useful when several Desktop Commander sessions or AIs use the same Termux installation.

Commands:

```bash
ai-info --owner-show
ai-info --owner-set CHATGPT_WADB
ai-info --owner-clear
```

No owner label should ever be treated as a setup failure.

If an owner label exists, verify it before changing a sensitive multi-session setup.

## Do not mix these concepts

- Desktop Commander MCP and Wireless ADB are separate connections.
- MCP can remain online while ADB is off.
- Existing trusted ADB reconnect is not first-time pairing.
- MCP stop/restart is not MCP logout.
- Owner label is not authentication.
- GitHub recovery is not required for normal MCP.
- WADB Bridge is not root and ADB shell is not root.

## Hard rules

For documented WADB functions, use the documented helpers first. Do not silently replace them with random `settings`, service, UI automation, port scanning, or a new privilege mechanism.

Do not:
- assume root,
- request root when the documented non-root path is enough,
- turn Developer Options on as the normal reconnect method,
- regenerate ADB keys without a reason,
- ask for pairing when the trusted key path has not been tried,
- delete `.desktop-commander-device/device.json` during normal recovery,
- expose authentication tokens or private keys,
- mix another MCP session without verifying which session the user asked about.

Root is optional. Use Termux's normal permissions by default. On a rooted device, use the available su mechanism only when the requested operation needs elevated privileges and the owner explicitly approves it through the installed root manager. Wireless ADB and Secure Local Shell still execute with their Android shell-user permissions; they do not silently become root.

For a persistent change not already part of this toolkit, explain the change, affected files/settings, side effects, and rollback before doing it.

## AI response discipline

For setup/command requests, follow:

```text
READ instruction
→ CHECK current state
→ SELECT documented command
→ EXECUTE
→ VERIFY
→ REPLY
```

Use `ai-info --json` for machine-readable state. Do not parse the colorful human dashboard when JSON is available.

## v1.7.5 security/rollback rule

Before enabling recovery or discussing security behavior, read `SECURITY_AND_ROLLBACK.md`.

Key changes in v1.7.5:
- non-exported MCP recovery receiver,
- recovery disable restores the previous `allow-external-apps` state by default,
- recovery config values are shell-escaped and GitHub identifiers validated,
- configurable ADB fallback scan range,
- WADB Bridge v1.5,
- explicit uninstall command.

Do not describe `PermissionActivity` as an arbitrary command surface. It only requests the fixed Termux RUN_COMMAND runtime permission and does not execute caller-supplied commands.


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
