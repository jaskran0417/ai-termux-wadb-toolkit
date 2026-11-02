# AI Guide

Read this before an AI assistant performs setup, changes settings, uses ADB, changes recovery state or uninstalls the Toolkit. The human owner remains in control of permission dialogs, pairing codes and destructive actions.

## Mandatory operating instructions

Version: 1.0.1

If the user gives you this toolkit ZIP/MD or asks about its setup, commands, Wireless ADB, Desktop Commander, MCP recovery, GitHub recovery, or troubleshooting, use the toolkit's documented workflow before inventing another one.

### ChatGPT — Think harder / Thinking

For ChatGPT, especially on Free accounts, **Think harder / Thinking is recommended for every message or task when the option is available**. This recommendation is not limited to this toolkit; it can also be used for ordinary daily questions and tasks when better reasoning, careful file reading, tool use, or multi-step work is useful.

On interfaces that provide these controls, either:
- tap **+ → Think harder** before sending the message, or
- invoke/select **`@Thinking`** for that message.

Treat this as a **per-message choice**. Selecting Think harder/Thinking for one reply must not be assumed to keep it enabled for later replies. Re-select it for each new message because the previous selection must not be assumed to stay active.

For toolkit work, Think harder/Thinking is strongly recommended for setup, troubleshooting, recovery, file inspection, Plugins/connectors, coding, audits, package rebuilding, and any other multi-step operation.

Think harder/Thinking does not itself grant access to a Plugin, connector, file, or permission. The AI must still use the available connected tools/files when the task depends on them, re-read the relevant toolkit instructions, obtain fresh state, and verify the result instead of relying only on chat history.

### Mandatory order before replying or acting

1. Read this file.
2. Read `docs/COMMAND_REFERENCE.md` for the requested operation.
3. Determine whether Desktop Commander MCP is already connected.
4. If MCP is connected and `ai-info` exists, run `ai-info --json` before changing anything.
5. Use the documented helper for the matching task.
6. Verify the result with the documented verification command.
7. Report the observed result, not the expected result.

Do not rediscover a different setup path when the documented path applies.

### Stage 1 — Desktop Commander MCP comes first for AI-controlled setup

Before MCP exists, the AI cannot operate Termux itself. Give the user only the minimum bootstrap steps in `docs/USER_GUIDE.md`.

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

### Stage 2 — Toolkit + Wireless ADB

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

### Stage 3 — Optional MCP recovery

Only configure recovery after Desktop Commander has authenticated at least once so saved credentials exist.

Local recovery:

```bash
wadb-mcp-recovery-setup
wadb-mcp-status
```

The setup command must bind recovery to the authenticated Desktop Commander HOME. It prefers the current authenticated MCP HOME, then a previously saved valid recovery HOME, then the normal Termux HOME. If several other authenticated HOMEs exist and the correct one is ambiguous, do not guess: use `wadb-mcp-recovery-setup --mcp-home PATH --target NAME` or let the interactive chooser ask the user. Owner labels remain optional.

`STOP`, `START`, and `RESTART` preserve authentication. `LOGOUT` is different: it removes the saved Remote Desktop Commander authorization and can require browser verification again.

Never use logout as normal restart/recovery.

### Stage 4 — Optional GitHub recovery

GitHub provides an independent cloud control path when MCP itself is offline. It is optional and is not part of the first MCP connection.

If the AI has an authorized GitHub connector, GitHub writes are independent of Desktop Commander: the AI may update the recovery control file even while MCP is offline. The AI must inspect which GitHub connector actions are actually available. If repository creation is unavailable, ask the user only to create/select the repository once, then continue with the connector and MCP.

The AI-side GitHub account and the phone-side GitHub account/token do **not** have to be the same identity. The AI side needs write access to the control file; the phone side needs only read access. Supported phone read modes are: private repo + fine-grained one-repo read-only token, existing Termux `gh` login, or public repo with no phone GitHub credential. Public mode requires ordinary `git` + `curl`; `gh` mode requires the `gh` package and an authenticated `gh` session; token mode requires a private local token file and must never ask the user to paste that token into AI chat.

Run `wadb-mcp-github-test` before any action test. A new owner/repo/branch/file/target identity is baselined on first sync: the current generation is recorded and its existing action is **not** executed. Only a later higher generation can execute. `STATUS` only refreshes local phone status; it does not upload a response to GitHub.

Read `docs/TECHNICAL_REFERENCE.md` before configuring or using GitHub recovery.

Allowed remote actions are only:

```text
START_MCP
STOP_MCP
RESTART_MCP
STATUS
```

`LOGOUT_MCP` is deliberately not accepted from GitHub.

### Owner labels are optional

The owner marker is a safety label only. It is useful when several Desktop Commander sessions or AIs use the same Termux installation.

Commands:

```bash
ai-info --owner-show
ai-info --owner-set CHATGPT_WADB
ai-info --owner-clear
```

No owner label should ever be treated as a setup failure.

If an owner label exists, verify it before changing a sensitive multi-session setup.

### Do not mix these concepts

The AI must treat MCP, Wireless ADB and Secure Local Shell as separate connections. Desktop Commander MCP is the AI-to-Termux path. Wireless ADB is the authenticated Android debugging transport. Secure Local Shell is a separate authenticated loopback route. WADB Bridge is the Android companion used for protected Wireless Debugging setting changes and Android-side recovery.

After the initial ADB-authorised setup grants and verifies WRITE_SECURE_SETTINGS for both Termux and WADB Bridge, wireless-debug-on and wireless-debug-off use the Bridge receiver directly. They do not require an already-connected ADB transport for each later toggle. Enabling the setting does not pair/connect ADB; run ai-info --connect for that separate operation. The AI must check wireless-debug-status before and after a toggle and report the observed result.

The disconnect menu has two different actions: disconnect only the exact current network ADB transport (Wireless Debugging remains ON), or switch Wireless Debugging OFF through WADB Bridge. Neither action stops Desktop Commander MCP or Secure Local Shell. wadb-mcp-stop, wadb-local-off --confirm and wadb-mcp-logout --confirm each affect different layers and must never be presented as synonyms.


- Desktop Commander MCP and Wireless ADB are separate connections.
- MCP can remain online while ADB is off.
- Existing trusted ADB reconnect is not first-time pairing.
- MCP stop/restart is not MCP logout.
- Owner label is not authentication.
- GitHub recovery is not required for normal MCP.
- WADB Bridge is not root and ADB shell is not root.

### Hard rules

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

### AI response discipline

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

### v1.0.1 security/rollback rule

Before enabling recovery or discussing security behavior, read `TECHNICAL_REFERENCE.md`.

Key changes in v1.0.1:
- non-exported MCP recovery receiver,
- recovery disable restores the previous `allow-external-apps` state by default,
- recovery config values are shell-escaped and GitHub identifiers validated,
- configurable ADB fallback scan range,
- WADB Bridge v1.5,
- explicit uninstall command.

Do not describe `PermissionActivity` as an arbitrary command surface. It only requests the fixed Termux RUN_COMMAND runtime permission and does not execute caller-supplied commands.

## Preflight, verification and response rules

These rules apply to AIs operating this toolkit through Desktop Commander or another authorized shell connector.

### ChatGPT reasoning mode

When ChatGPT offers **Think harder / Thinking**, prefer it for every message or task, including toolkit operations and ordinary daily use. On interfaces that support it, use **+ → Think harder** or **`@Thinking`** for the current message. Do not assume it remains enabled for later messages; re-select it for each new message when available.

This is also a useful daily-use recommendation, especially for Free users who want more careful reasoning. It does not replace Plugins/connectors, file access, or state checks: use the actual available tools and current files/device state whenever correctness depends on them.

### Source priority

For a toolkit task, use this order:
1. `AI_GUIDE.md`
2. `docs/COMMAND_REFERENCE.md`
3. `ai-info --json`
4. matching bundled helper
5. troubleshooting document
6. lower-level diagnostics only when the helper actually fails.

The AI may use broader legitimate Termux/Android capabilities for unrelated tasks, but should not replace an established WADB mechanism without a reason.

### Required preflight

Before a setup/change command:

```bash
ai-info --json
```

When multiple Remote Desktop Commander sessions are visible, identify the intended one. If an optional owner label exists, use it as a guard. Absence of an owner label is not an error.

### Required post-check

Every state-changing helper has a verification command in `COMMAND_REFERENCE.md`. Run it before telling the user the change succeeded.

Desktop Commander itself and Termux's `~/.android/adbkey` are not toolkit-owned. Never stop/logout Desktop Commander or delete its saved device login/ADB key as part of toolkit uninstall. `wadb-toolkit-uninstall --all` removes only toolkit-owned recovery/runtime state.

### User interaction

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

### Destructive distinction

Normal:
- `wadb-mcp-stop`
- `wadb-mcp-start`
- `wadb-mcp-restart`

These keep saved MCP credentials.

Destructive to saved authorization:
- `wadb-mcp-logout --confirm`

Never use logout as routine recovery.

### Output

Use concise results for users. Use `ai-info --json` for automation. Raw Android broadcast output belongs in diagnostics, not normal explanations.
