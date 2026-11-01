# AI Termux WADB Toolkit v1.7.5 RELEASE — Complete AI/User Instruction Pack

RELEASE edition. Version remains 1.7.5.

---

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

---

# Start Here — AI Termux WADB Toolkit v1.7.5

This toolkit combines:
- Remote Desktop Commander MCP access to Termux,
- Wireless ADB setup and reconnect helpers using Android's authorized debugging interface,
- WADB Bridge,
- optional automatic MCP restart/reboot recovery,
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

## 4. Optional: automatic MCP recovery

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

## 5. Optional: GitHub recovery

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

## 6. Optional owner label

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

---

# Remote MCP Connection for AI Access to This Phone

This document explains how to let an AI that supports MCP, connectors, or plugins access this Android phone through **Remote Desktop Commander running inside Termux**.

This does **not** install MCP into the AI from Termux. The Termux command starts the phone-side Remote Desktop Commander device. The AI then connects to the Desktop Commander Remote MCP service through its own MCP/connector/plugin support.

## Start reference

Read `READ_THIS_FIRST_AI.md` first. It defines the connection layers and the account-aware connector/plugin state model used by this bundle.

In short:

```text
Remote AI client -> Remote Desktop Commander / Remote MCP -> Termux -> ADB -> Android
```

MCP and ADB are separate connections. A missing active MCP connection means the AI-to-Termux path is not currently established; it does not by itself diagnose the ADB state inside Termux.

When the client can inspect its own Plugins/Apps/Connectors inventory, that account-aware inventory is the appropriate source for whether Remote Desktop Commander is available, installed, disconnected, or connected. A missing active tool is not the same state as an unavailable plugin.

The supported Wireless ADB helpers and the hardware-verified Developer-Options-off / different-Wi-Fi observations are documented in `READ_THIS_FIRST_AI.md`.

## 1. Prepare Termux

Install Node.js and npm:

```bash
pkg update
pkg install nodejs npm
```

Verify that Node.js, npm, and npx are available:

```bash
node -v
npm -v
npx -v
```

Optional, but useful while keeping the remote session running:

```bash
termux-wake-lock
```

## 2. Start Remote Desktop Commander on the phone

Run in Termux:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

On the first run, Remote Desktop Commander may show a verification URL/code or open a browser. Complete the browser sign-in/verification and authorize this phone.

A successful connection should eventually show messages similar to:

```text
Connected to Desktop Commander MCP
Connecting to Remote MCP https://mcp.desktopcommander.app/mcp
Connected to Remote MCP
Channel subscribed
Device marked as online
Device ready
```

The authorization/session can be persisted. On later runs, the same command may restore the saved session automatically.

Keep the Termux Remote Desktop Commander process running while an AI needs access to the phone.

## 3. Remote client connection

### Generic client with Custom MCP / Remote MCP support

The Remote MCP service endpoint is:

```text
https://mcp.desktopcommander.app/mcp
```

The client/connector may then present its normal authentication flow.

**Do not paste this Termux command into the Server URL field:**

```text
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

That command belongs only in Termux. The HTTPS address above is the Remote MCP server URL used by compatible AI clients.

### Grok or another AI with a Custom MCP Connector

Create a custom connector. The connector name can be anything, for example `Desktop Commander` or `Phone Termux`.

Use this as the Server URL:

```text
https://mcp.desktopcommander.app/mcp
```

After connection and authentication, Desktop Commander exposes tools such as process, file, directory, and configuration operations to the authorized client.

### Claude

If Claude offers **Remote Desktop Commander** in its connector directory, connect that connector and complete authentication. If the Claude client instead provides a generic Custom MCP option, use:

```text
https://mcp.desktopcommander.app/mcp
```

The Termux `remote` process must still be running on this phone.

### ChatGPT

**Connection state and availability are separate. An inactive connection does not establish that Remote Desktop Commander is unavailable; the account-aware Plugin/Apps directory is the authoritative place to check availability.**

Use this order:

1. ChatGPT's **Plugins/Apps directory** can be searched for **Remote Desktop Commander**. Account-aware plugin/app search is more authoritative than public web pages for account-specific availability.
2. **Found but not installed:** installation requires the user's explicit action/approval in ChatGPT.
3. **Installed but not connected/authorized:** the remaining step is the normal Connect/sign-in/authorization flow.
4. **Already installed and connected:** the existing Remote Desktop Commander tool connection is the active control path; a second MCP connection or another pasted MCP URL is unnecessary.
5. **Unavailable in the actual account/plugin-directory:** a generic Custom MCP configuration is the fallback when the client provides one; otherwise the connector is unavailable on that account/workspace/client surface.

**Important:** `not connected`, `not installed`, and `not available` are three different states. A missing active connection is not evidence that installation is impossible.

When the ChatGPT plugin manages the Remote MCP connection, there is normally no need to paste the MCP URL manually.

The preferred connection path is:

```text
ChatGPT -> Remote Desktop Commander plugin -> Remote MCP -> Desktop Commander process in Termux -> phone
```

If ChatGPT genuinely does not have the plugin available but does expose a generic Custom MCP configuration, use:

```text
https://mcp.desktopcommander.app/mcp
```

When account-aware Plugin/Apps search is available, its result is the relevant source for current account availability; public documentation or plan assumptions are secondary.

## 4. Verify that the AI really reaches Termux

After the connector is enabled, harmless checks through the Desktop Commander/MCP terminal include:

```bash
id
pwd
node -v
command -v ai-info
ai-info
```

A successful result should come from the phone's Termux environment. A Termux shell normally runs as the Termux application UID, not as root.

If this WADB bundle has already established Wireless ADB, the same authorized Termux connection can expose commands such as:

```bash
adb devices
adb shell id
```

An ADB shell normally has Android `uid=2000(shell)` privileges. This is different from root access.

## 5. Normal use after initial setup

For a phone that has already been authorized, the usual phone-side start sequence is simply:

```bash
termux-wake-lock
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

The authorized client can then use Desktop Commander. Existing saved authorization remains valid until it is removed or the service requests verification again; a normal reconnect does not inherently require reinstallation or re-authorization.

## Remote connection state reference

An already-authorized Desktop Commander Remote MCP connection is the existing control path to Termux; a second MCP implementation is unnecessary.

For ChatGPT, the current account's Plugins/Apps directory can distinguish `available but not installed`, `installed but not connected`, `connected`, and `unavailable`. An inactive connection alone does not establish that the plugin is absent.

If the phone-side Desktop Commander device is offline, the phone-side start command is:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

First-time authorization can require browser verification by the user. Once the phone is online, harmless terminal checks can confirm that the connection reaches Termux.

## Security and privilege limits

Remote MCP exposes only the tools and permissions provided by Desktop Commander and the Termux environment. It does not automatically grant Android root access. Desktop Commander may also block selected commands. Wireless ADB, when connected, adds Android shell-level access but still does not equal root.

Authentication tokens, saved credentials, and session secrets are sensitive data and are not part of the bundle documentation or normal diagnostic output.

---

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

---

# Command Reference — Authoritative v1.7 Interface

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

**Note:** Default stop is delayed briefly so a remote AI can receive the command result before its own MCP disappears.

## `wadb-mcp-restart`

**Use case:** Clean MCP restart.

**Keeps saved login:** Yes.

**Does not:** Require browser verification when saved authorization remains valid.

## `wadb-mcp-status`

**Use case:** Compact recovery/MCP state.

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

---

# Optional GitHub Remote MCP Recovery

Version: 1.7.5

GitHub recovery is an **independent control path** for restoring Remote Desktop Commander when Desktop Commander MCP itself is offline.

This document describes the GitHub recovery behavior implemented by this toolkit and the required setup and failure-handling rules.

## 1. Architecture and trust boundary

```text
AI / ChatGPT
├─ Desktop Commander connector → normal phone control while MCP is online
└─ GitHub connector            → writes recovery control while MCP may be offline

GitHub repository / branch / wadb-control.json
                  ↓
phone-side WADB watchdog
                  ↓
START_MCP / STOP_MCP / RESTART_MCP / STATUS
                  ↓
Desktop Commander starts with its already-saved device authorization
```

The phone does **not** need the AI's GitHub connector credential.

The AI-side GitHub identity and phone-side GitHub identity do **not** have to be the same account.

Required access is directional:

```text
AI-side GitHub connector/account
  needs WRITE access to the recovery control file.

Phone-side read method
  needs READ access to the same repository / branch / file.

public mode
  needs no phone GitHub account at all.
```

The GitHub recovery channel deliberately does **not** accept `LOGOUT_MCP`.

## 2. Requirements that apply to every mode

Before GitHub recovery is configured:

1. Desktop Commander must have authenticated successfully at least once.
2. `wadb-mcp-recovery-setup` must have been run.
3. `wadb-mcp-status` should show `credentials=yes`.
4. The local watchdog must be running.
5. The phone needs network access to GitHub.
6. The AI's GitHub connector/account must be able to write the chosen control repository.
7. The repository, branch, and control file must exist before the phone can read them.

The toolkit installer guarantees the shared command dependencies, including Python, curl, and git. GitHub CLI `gh` is mode-specific and is only required for `gh` mode.

Normal recovery setup:

```bash
wadb-mcp-recovery-setup
wadb-mcp-status
```

Do not continue to a destructive STOP/START test until saved Desktop Commander credentials and the watchdog are both confirmed.

## 3. Control file format

The control file is JSON:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": 1,
  "action": "STATUS"
}
```

The phone validates all four control fields before executing anything:

- `schema` must be exactly `1`.
- `generation` must be a non-negative integer.
- `target` must exactly match the configured MCP target.
- `action` must be one of the allowed actions.

Allowed actions:

```text
START_MCP
STOP_MCP
RESTART_MCP
STATUS
```

Anything else is ignored/rejected.

### Generation rule

Every new command must use a generation greater than the last processed generation.

The normal writer flow is:

```text
read current control JSON
→ read current generation
→ increment generation
→ set the new action
→ update/commit the file
```

When a GitHub connector requires the current file/blob SHA for an update, the AI must fetch the current file first and use the current SHA. If another writer changes the file first, refetch and retry instead of overwriting from stale state.

## 4. Safe first-sync baseline

A control channel is identified by:

```text
owner/repo @ branch : file # target
```

When the phone sees a **new control identity** for the first time, it records the current generation as a baseline and does **not** execute the action already present in that file.

Example:

```text
new repo/file contains:
generation=20
action=STOP_MCP

first phone sync:
→ generation 20 becomes baseline
→ STOP_MCP is NOT executed

next GitHub command:
generation=21
action=STOP_MCP
→ executed
```

This prevents an old or pre-existing control file from unexpectedly stopping/restarting MCP during setup.

Changing only the phone read method (`gh` → `token`, for example) while keeping the same owner/repo/branch/file/target does not create a new control identity.

Changing the repository, branch, file, or target does.

`wadb-mcp-github-test` reports:

```text
BASELINE_ON_NEXT_SYNC=yes|no
ACTION_EXECUTED=no
```

The test command is read-only with respect to recovery actions.

## 5. Three phone-side read methods

The AI always writes through its own authorized GitHub connector. These modes only determine how the **phone reads** the control file.

### Method A — private repo + fine-grained read-only token

Use this when the recovery file should stay private and you want a narrow phone credential.

The token should be restricted to the recovery repository and provide only the repository-content read access required to read the control file.

Do not paste the token into AI chat.
Do not put it directly in a shell command.
Do not put it in the control JSON.

Store it privately from an interactive Termux session:

```bash
umask 077
mkdir -p ~/.ai-wadb/mcp-recovery
read -rsp "GitHub read-only token: " GH_READ_TOKEN
printf '%s' "$GH_READ_TOKEN" > ~/.ai-wadb/mcp-recovery/github-read-token
unset GH_READ_TOKEN
echo
chmod 600 ~/.ai-wadb/mcp-recovery/github-read-token
```

The toolkit accepts token-file mode `600` or read-only `400`; broader permissions are rejected.

Configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PRIVATE_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode token

wadb-mcp-github-test
```

Phone requirements:

```text
curl        required
GitHub CLI  not required
gh login    not required
phone GitHub account login through gh  not required
local token file  required
```

The token's account does not have to match the AI connector account. It only needs GitHub-granted read access to the configured private repository.

### Method B — existing GitHub CLI login (`gh`)

Use this when Termux already has a GitHub CLI login and simplicity is more important than giving the phone the narrowest possible credential.

Install `gh` if needed:

```bash
pkg install gh
```

Authenticate in normal Termux HOME:

```bash
gh auth login
gh auth status
```

Browser/device authorization is a genuine user action when GitHub requests it.

Then configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PRIVATE_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode gh

wadb-mcp-github-test
```

Phone requirements:

```text
gh package   required
gh login     required
token file   not required
repo         may be private if this gh login can read it
```

The GitHub account logged into `gh` does not have to be the same account connected to the AI. It only needs read access to the configured repository.

The phone reads with `gh api`.

### Method C — public repository, anonymous phone read

Use this when you want zero GitHub credential on the phone.

Configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PUBLIC_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode public

wadb-mcp-github-test
```

Phone requirements:

```text
GitHub account/login on phone  not required
gh package                     not required
token file                     not required
git                            required
curl                           required
repository                     must be publicly readable
```

The public control file must contain no passwords, tokens, ADB keys, logs, device secrets, or personal data.

Anyone can read a public control repository, but only identities with repository write permission should be able to change the control file.

#### Public-mode freshness rule

The toolkit does **not** trust a raw branch URL directly for recovery control because branch-based raw content can briefly lag after a commit.

Public mode resolves the current branch head anonymously with:

```text
git ls-remote
```

with interactive prompting disabled and the Git credential helper disabled for that lookup. It then fetches the control file by that immutable commit SHA.

This is required both for reliable generation changes and to keep `public` mode independent from any GitHub credential that may exist elsewhere in Termux.

## 6. Auto mode

`--mode auto` tries in this order:

```text
1. public anonymous read
2. local token file
3. existing gh login
```

Use explicit `public`, `token`, or `gh` for production recovery so the active trust model is obvious.

`wadb-mcp-github-test` reports both:

```text
MODE_REQUESTED=
MODE_USED=
```

## 7. Configure the GitHub side before the phone side

The AI's GitHub connector should prepare a recovery channel while MCP is still online.

Recommended initial control file:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": 1,
  "action": "STATUS"
}
```

Use `STATUS` as the initial action because it is non-destructive.

If the GitHub connector can create the repository/branch/file, the AI can do that work. If connector capabilities do not support repository creation, the user may need to create/select the repository once; after that the AI can manage the control file when its connector has write permission.

After configuring the phone read method:

```bash
wadb-mcp-github-test
wadb-mcp-github-sync
wadb-mcp-status
```

The first sync of a new control identity baselines the current generation without executing its current action.

## 8. What each action actually does

### `START_MCP`

The phone sets desired MCP state to online and starts/reuses Desktop Commander with the configured MCP HOME.

Saved `.desktop-commander-device/device.json` authorization is preserved and reused.

### `STOP_MCP`

The phone sets desired MCP state to offline and stops the matching Desktop Commander process.

The **WADB recovery watchdog remains running** and continues checking GitHub. This is why a later GitHub `START_MCP` can recover Desktop Commander while MCP itself is offline.

### `RESTART_MCP`

The phone stops the matching Desktop Commander process, waits briefly, then starts it again and returns desired state to online.

### `STATUS`

`STATUS` refreshes the phone's local recovery status file.

It does **not** upload a response to GitHub.

The phone-side design is intentionally read-only, so an AI whose only surviving channel is GitHub cannot query live phone status from the `STATUS` action alone. After MCP returns, use:

```bash
wadb-mcp-status
ai-info --recovery
```

## 9. Verify repository read

Run:

```bash
wadb-mcp-github-test
```

A healthy result contains values similar to:

```text
GITHUB_READ=PASS
MODE_REQUESTED=gh
MODE_USED=gh
SCHEMA=1
GENERATION=...
ACTION=...
TARGET=DEFAULT
EXPECTED_TARGET=DEFAULT
GITHUB_CONTROL_VALID=PASS
ACTION_EXECUTED=no
```

If `BASELINE_ON_NEXT_SYNC=yes`, that is not a failure. It means the current generation will be recorded without executing the current action on the next sync.

## 10. Verify command processing

After baseline is established, have the GitHub writer advance the file to a newer generation with:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": NEXT_GENERATION,
  "action": "STATUS"
}
```

Then either wait for the watchdog or run while MCP is online:

```bash
wadb-mcp-github-sync
```

Verify:

```bash
tail ~/.ai-wadb/mcp-recovery/events.log
wadb-mcp-status
```

The event log should contain:

```text
GITHUB action=STATUS generation=...
```

## 11. Verify offline recovery

Do this only after repository read and newer-generation STATUS verification succeed.

1. Fetch the current control JSON through the AI's GitHub connector.
2. Write a newer generation with `STOP_MCP`.
3. Wait for the watchdog. Desktop Commander should go offline.
4. Do **not** use Desktop Commander for the next step; it is intentionally offline.
5. Through the independent GitHub connector, fetch the current file again.
6. Write another newer generation with `START_MCP`.
7. Wait for the phone watchdog.
8. Confirm the same Desktop Commander device comes back with saved authorization.
9. Verify the phone event log after MCP returns.

Expected event sequence:

```text
GITHUB action=STOP_MCP generation=N
STOP_MCP

GITHUB action=START_MCP generation=N+1
START_MCP pid=...
```

Never use `remote --logout` or `wadb-mcp-logout` for recovery verification. Logout deletes authorization and is intentionally different from stop/restart.

## 12. Watchdog timing

The default watchdog interval is approximately 15 seconds.

A newly committed GitHub command therefore may take roughly one polling interval before the phone processes it, plus the time Desktop Commander itself needs to reconnect.

The watcher reloads its recovery configuration on every loop, so safe toolkit/config updates do not require a reboot.

## 13. Failure interpretation

`GITHUB_READ=FAIL` means the phone could not obtain the configured control file.

Common toolkit error states:

```text
public_read_failed
  public repo/branch/file unreachable, or anonymous git/curl read failed

gh_read_failed
  gh is missing/not authenticated, repo is inaccessible, or gh API read failed

token_read_failed
  token file/credential is invalid, expired, insufficient, or repo is inaccessible

invalid_control_json
  fetched content is not valid JSON

unsupported_schema
  schema is not 1

invalid_generation
  generation is not an integer

invalid_action
  action is outside the four-command whitelist

target_mismatch
  wadb-mcp-github-test reports this when the file targets another MCP environment
```

Mode-specific setup commands perform local prerequisite checks before changing the recovery configuration.

For token mode, a missing token file is rejected and the existing config is left unchanged.

## 14. Security rules

Prefer a private repository with a one-repository read-only phone token when least privilege matters most.

`gh` mode is convenient but its logged-in account may have broader GitHub permissions than recovery needs.

Public mode carries no phone GitHub credential but exposes the control file publicly.

Never:

- put the AI connector credential on the phone,
- paste a phone token into AI chat,
- store a token in the control JSON,
- use a public repository for secrets/logs/personal data,
- add `LOGOUT_MCP` to the GitHub action set,
- reduce generation to replay an old command.

If repository write access is suspected compromised, disable GitHub recovery and secure the repository/account.

## 15. Disable GitHub polling

```bash
wadb-mcp-github-config --off
```

This disables GitHub polling but does not delete:

```text
local MCP watchdog
Desktop Commander saved authorization
ADB keys
WADB Bridge permissions
```

## 16. Verification commands

```bash
wadb-mcp-github-test
wadb-mcp-status
ai-info --recovery
```

For a full recovery proof, also inspect:

```bash
tail ~/.ai-wadb/mcp-recovery/events.log
```

---

# Ready-made Prompts for Any AI

## A. User gives the ZIP/MD before MCP exists

> I am giving you the AI Termux WADB Toolkit. Read `READ_THIS_FIRST_AI.md` and the included instructions before replying. Do not invent another setup path. First guide me through the minimum steps to connect Desktop Commander Remote MCP to this AI. Until MCP is connected, only give me the manual actions that are truly required. Once MCP is connected, use MCP to run supported setup commands yourself and verify each result.

## B. MCP is connected

> Desktop Commander MCP is connected. Continue the WADB toolkit setup using the included instructions. Run `ai-info --json` first, use the documented helpers, and do the shell work yourself instead of asking me to type commands. Ask me only for genuine user actions such as a permission dialog or temporary pairing code.

## C. Full recommended setup

> Set up the toolkit in the recommended order: verify MCP, install/update the toolkit, configure Wireless ADB using the existing trusted key first, verify WADB Bridge, then offer automatic MCP recovery. Do not configure GitHub recovery unless I choose it. Verify every stage.

## D. Automatic MCP recovery

> Set up automatic Desktop Commander recovery using the toolkit instructions. Preserve the saved MCP login. Do not use logout. Configure local watchdog/boot recovery, handle the one-time WADB Bridge RUN_COMMAND permission if needed, and verify recovery status.

## E. GitHub recovery — AI-assisted

> Set up optional GitHub MCP recovery using the toolkit instructions. Use my connected GitHub connector if available; its account may differ from the phone-side GitHub account/token as long as the AI can write and the phone can read the same control file. Prefer a private control repository with a one-repo Contents: Read-only phone token for least privilege; if I want zero new credential setup, offer the existing Termux gh login; also explain the public no-phone-credential option. Never ask me to paste a GitHub token into AI chat. If the connector cannot create a repository, ask me only to create/select it, then continue yourself. Run wadb-mcp-github-test, establish the first-sync baseline, and verify a newer-generation STATUS command before performing STOP through GitHub followed by START through GitHub. Confirm the same saved MCP authorization returns. Never put LOGOUT_MCP in the GitHub control channel.

## F. GitHub recovery — manual

> Give me the manual GitHub MCP recovery procedure from the toolkit. Do not change GitHub yourself. Show the exact repository/branch/file, JSON format, generation rule, phone configuration command, verification procedure, and rollback.

## G. Diagnostics only

> Run the toolkit read-only diagnostics. Read the instructions first, run `ai-info --json` and `ai-info --doctor`, and do not change settings or install anything.

---

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

---

## Another AI only repeats command names

Plain ai-info v1.7 provides the human status dashboard and explained actions. The AI should use those descriptions before presenting choices. It should not guess command meaning from the name alone and should not open the full guide unless the user asks for it.

## Existing helpers fail

For Wireless Debugging, use the bundled proven helpers first. If one fails, diagnose the real error before substituting a different method. Only then use deeper shell/ADB capabilities, other authorized privileges, or web research as needed. Do not silently replace the working architecture just because another command exists.

## Pairing code disappears when switching apps

Keep **Pair device with pairing code** visible in Settings. On the same phone, use ChatGPT in floating window, split screen, or pop-up view. Send the 6-digit code from there and let the AI run `ai-info --pair CODE`. If Android closes the popup or changes the code, use the new code.

## Plain ai-info shows only three choices

This is intentional. Pairing is not offered until `ai-info --connect` has established that it is needed. Use lower-level commands only for troubleshooting.

## Start with the executable interface

Do not manually interpret the long guide first. For connection/recovery run:

```bash
ai-info --connect
```

If it returns `RESULT=PAIRING_REQUIRED`, open the Android pairing-code popup and then run:

```bash
ai-info --pair SIX_DIGIT_CODE
```

Do not run `ai-info --connect` again between those two steps. While pairing is pending, a second connect is intentionally blocked with `RESULT=PAIRING_CODE_REQUIRED` so the Android pairing session/port is not replaced before the current code is used. If the popup was closed or its code changed, run `ai-info --pair-reset`, then start a fresh `ai-info --connect` cycle.

Only use the lower-level commands below for troubleshooting.


## AI is unsure whether an open port is pairing or connection

Do not guess. Run:

```bash
adb-mdns-discover --type all
```

Interpret only typed results:

```text
CONNECT  -> _adb-tls-connect._tcp.local
PAIRING  -> _adb-tls-pairing._tcp.local
```

If `wireless-adb-connect` returns `PAIRING_REQUIRED`, the normal CONNECT endpoint was positively identified and the existing ADB key was not accepted. Ask the user only to open the pairing-code popup and send the 6-digit code.

If only untyped port-scan candidates exist, do not label them pairing ports and do not infer pairing from failure alone.

# Troubleshooting — AI Termux Wireless ADB Bundle

## Fresh setup / Bridge is not write-ready

Run:

```bash
ai-info --connect
```

The normal command first tries the existing trusted key. If the Bridge has not yet received its one-time secure-settings grant and Wireless Debugging is currently OFF, the command returns:

```text
RESULT=MANUAL_WIRELESS_DEBUG_ON_REQUIRED_ONCE
```

Turn Android **Wireless debugging** ON manually once and rerun `ai-info --connect`. When ADB connects, the toolkit automatically finalizes both required secure-settings grants independently and verifies the Bridge with a no-op write.

Do not report setup complete until:

```text
RESULT=CONNECTED_AND_READY
bridge_write=ready
```

If pairing is genuinely required, `ai-info --connect` returns `RESULT=PAIRING_REQUIRED`; only then open **Pair device with pairing code** and use `ai-info --pair CODE`.

## `CURRENT_WIFI_IP_NOT_DETECTED`

Automatic IP detection uses Termux:API from a genuine Termux shell environment.

Check:

```bash
phone-capabilities --details
```

Make sure both are installed:

- Termux package: `termux-api`
- Android app: Termux:API from the same distribution/source as Termux

As a fallback, `wadb-bootstrap` accepts `--ip PHONE_IP`.

## `PAIRING_FAILED`

Possible causes:

- pairing code expired or changed,
- pairing-code screen was closed,
- discovered candidate was not the pairing endpoint,
- target phone IP changed,
- Android rejected the attempt.

Reopen **Pair device with pairing code** so a fresh code is visible and rerun.

If necessary use the exact endpoint shown by Android:

```bash
wadb-bootstrap --ip PHONE_IP --pair-port PAIRING_PORT --pair-code CODE
```

## Pairing succeeded but ADB connection did not verify

Pairing and normal connection ports are different.

Run:

```bash
wireless-adb-connect
```

It rediscovers the normal connection port on the current phone IP.

## ColorOS first setup: enable both Developer options before pairing

When first-time setup begins on ColorOS/OPPO/OnePlus/realme, enable these together:

```text
Wireless Debugging = ON
Disable permission monitoring = ON / blue
```

`ai-info --connect` prints `DISABLE_PERMISSION_MONITORING=on|off|unknown` when the ColorOS property is readable. If an AI forgot to mention the second option, follow the command output itself.

If it is left OFF/gray, pairing can still succeed but the later `pm grant` calls may fail with `GRANT_RUNTIME_PERMISSIONS`. Turning it ON/blue afterward does not require re-pairing; rerun `ai-info --connect`.

## ColorOS / OPPO / OnePlus: `GRANT_RUNTIME_PERMISSIONS` denial

Observed failure:

```text
SecurityException: grantRuntimePermission:
Neither user 2000 nor current process has android.permission.GRANT_RUNTIME_PERMISSIONS
```

On affected ColorOS/OxygenOS/realme UI builds, open:

```text
Developer options > Disable permission monitoring
```

Turn the switch **ON (blue)** and rerun:

```bash
ai-info --connect
```

The switch does not directly grant `WRITE_SECURE_SETTINGS`. It allows the ADB shell to execute the one-time package permission grants. Setup is complete only after both Termux and WADB Bridge report the grant and `bridge_write=ready` passes the Bridge no-op write verification.

## `TERMUX_BUILD_DOES_NOT_DECLARE_WRITE_SECURE_SETTINGS`

The protected WADB Bridge receiver requires the calling Termux app to hold `WRITE_SECURE_SETTINGS`.

The bootstrap deliberately refuses to weaken the bridge receiver.

Use a compatible Termux build that declares the permission, or redesign the bridge only after explaining that change and getting user approval.

## `cmd: Failure calling service activity: Failed transaction`

The bundled `wireless-debug-*` helpers already include the proven workaround:

```bash
</dev/null
```

plus up to three retries.

Do not remove it casually.

## Wi-Fi network changed

Do not re-pair immediately.

Run:

```bash
wireless-adb-connect
```

It should rediscover the new phone IP and dynamic connection port and try the existing ADB key first.

Only re-pair if Android actually rejects authentication.

## `ip neigh` or `/proc/net/arp` permission denied

Expected on many modern Android builds for ordinary app UIDs.

Do not treat this as proof the network is broken. Use Termux:API + the bundled current-IP/port discovery instead.

## WADB Bridge seems missing

With a working ADB shell:

```bash
adb shell pm list packages | grep com.jaskran.wadbbridge
```

If missing, run:

```bash
wadb-bootstrap --finalize
```

It uses the bundle's copy at `~/.ai-wadb/wadb-bridge.apk`.

## Permission grant lost

With ADB connected, run:

```bash
wadb-bootstrap --finalize
wireless-debug-status
```

The finalizer verifies Termux and WADB Bridge independently. An already-granted Termux permission is accepted and does not prevent the Bridge grant from being attempted.

Healthy verification:

```text
bridge_write=ready
```

For lower-level inspection:

```bash
adb shell dumpsys package com.termux
adb shell dumpsys package com.jaskran.wadbbridge
```

Both packages need User 0:

```text
android.permission.WRITE_SECURE_SETTINGS: granted=true
```

---

# Security, Recovery, and Rollback — v1.7.5

This file documents the security boundaries, recovery behavior, and rollback procedures of the toolkit.

## Trust boundaries

Desktop Commander Remote MCP is the component that gives the connected AI command/file access inside the Termux app's normal Android UID. The WADB toolkit does not turn that access into root.

Wireless ADB is a separate layer. When connected, Android's ADB shell normally runs as uid=2000(shell), still not root.

WADB Bridge is deliberately narrow:
- WirelessDebugReceiver only reads/writes Android's adb_wifi_enabled global setting.
- McpRecoveryReceiver launches one fixed Termux recovery job path.
- The Bridge APK declares no INTERNET permission.

## Recovery and permission boundaries

### Recovery receiver
McpRecoveryReceiver is now non-exported. External apps can no longer directly invoke the recovery receiver. Android system boot/package-replaced broadcasts and the app's own explicit PendingIntent alarm remain supported.

### Permission activity
PermissionActivity remains exported intentionally because the recovery setup may need Android to show the one-time com.termux.permission.RUN_COMMAND runtime-permission dialog on devices where ADB shell cannot grant that permission.

The activity:
- requests only com.termux.permission.RUN_COMMAND,
- does not accept a shell command,
- does not execute a command,
- immediately exits after the permission result.

Treat this as a permission-prompt surface, not a general command bridge.

### allow-external-apps rollback
wadb-mcp-recovery-setup records the previous allow-external-apps property state before enabling recovery.

By default:

```bash
wadb-mcp-recovery-disable
```

restores that previous state.

To deliberately leave it enabled:

```bash
wadb-mcp-recovery-disable --keep-external-apps
```

### Recovery config quoting
Values written to the recovery shell config are now emitted with Bash shell escaping. CLI values can no longer inject additional shell syntax merely by being written into the config file.

GitHub owner/repo/branch/file/target values are also validated before being saved.

### ADB fallback scan
Typed mDNS remains the preferred path. The untyped fallback scan is now configurable:

```bash
WADB_SCAN_MIN=30000
WADB_SCAN_MAX=65535
wireless-adb-connect
```

The default fallback range is 30000–65535. Results remain explicitly marked UNVERIFIED_CANDIDATE; the toolkit never infers pairing-vs-connect role from a raw port number.

## Desktop Commander version behavior

The documented first-start command remains the upstream-recommended form:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Recovery first prefers the already cached Desktop Commander dist/index.js. Only when the cached executable cannot be found does it fall back to the upstream @0.3.1 npx command.


## Uninstall / rollback

Desktop Commander itself is **not owned by the WADB toolkit**. The Termux ADB client key (`~/.android/adbkey`) is also not toolkit-owned. Toolkit uninstall never logs out Desktop Commander, never stops its current process, and never deletes the ADB key.

Full toolkit-owned cleanup:

```bash
wadb-toolkit-uninstall --all
```

This removes the WADB runtime, docs/environment, cached Bridge APK, toolkit backups/logs, and the toolkit MCP-recovery setup. Removing recovery stops only the recovery watchdog and restores the previous `allow-external-apps` setting; it does not stop or log out Desktop Commander.

If an authenticated Wireless ADB shell is available, `--all` also uninstalls Android package `com.jaskran.wadbbridge`. If ADB is unavailable, it reports manual removal:

```text
Settings > Apps > WADB Bridge > Uninstall
```

WADB Bridge has no launcher/app-drawer icon, so use Android Settings > Apps.

To remove the normal WADB interface while keeping the minimum Bridge + MCP recovery runtime working:

```bash
wadb-toolkit-uninstall --keep-recovery
```

Preview either mode without changing anything:

```bash
wadb-toolkit-uninstall --all --dry-run
wadb-toolkit-uninstall --keep-recovery --dry-run
```

Always preserved by both modes: Desktop Commander package/process/login, `~/.android/adbkey*`, Downloads, and extracted/source bundle copies.

## Bridge APK cache and update model

There are three separate copies/stages:

```text
Toolkit release: apk/wadb-bridge.apk
        ↓ install.sh
Termux installer cache: ~/.ai-wadb/wadb-bridge.apk
        ↓ authenticated adb install -r when needed
Android-installed package: com.jaskran.wadbbridge
```

Deleting the Android app does not delete the Termux cached APK. Deleting only the cached APK does not uninstall the Android app.

On toolkit update, `install.sh` first backs up the old cached APK under `~/.ai-wadb/backups/<timestamp>/`, then replaces the cache with the APK shipped by the new toolkit. The next authenticated `ai-info --connect` compares versionCode values and automatically installs the cached APK when the Android Bridge is missing or older. It verifies the installed version afterward.

The toolkit does not automatically downgrade an Android Bridge whose versionCode is newer than the cache.

## Package integrity

MANIFEST.sha256 covers the toolkit files. It detects accidental or unauthorized changes relative to the package manifest, but a checksum manifest by itself is not publisher identity.

---

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

---

# AI Termux WADB Environment — v1.7.5

This file is the installed environment reference. The mandatory AI workflow is in:

`~/AI_WADB_DOCS/READ_THIS_FIRST_AI.md`

The human start guide is:

`~/AI_WADB_DOCS/START_HERE.md`

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

`~/AI_WADB_DOCS/RECOVERY_GITHUB.md`

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

## v1.7.5 first-setup and Bridge update rules

On ColorOS/OPPO/OnePlus/realme first setup, enable **Wireless Debugging** and **Disable permission monitoring (ON/blue)** together before pairing. `ai-info --connect` exposes `DISABLE_PERMISSION_MONITORING=on|off|unknown`, and `ai-info --json` exposes the same state as `wireless_adb.disable_permission_monitoring`.

The authoritative install source for WADB Bridge is `~/.ai-wadb/wadb-bridge.apk`, populated from the release's `apk/wadb-bridge.apk` by `install.sh`. A newer toolkit replaces that cache automatically. On the next authenticated ADB connection, `ai-info --connect` compares cached and installed Bridge versionCode values and installs the cached APK when the installed Bridge is missing or older.

## v1.7.5 uninstall ownership rule

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

## Secure local shell maintenance update (v1.7.5)

This maintained v1.7.5 build replaces the earlier classic localhost-adbd TCP design with a toolkit-owned authenticated loopback shell bridge.

```bash
wadb-local-status
wadb-local-on
wadb-local-off --confirm
wadb-local-shell -c 'COMMAND'

ai-info --local
ai-info --local-on
ai-info --local-off --confirm
```

Healthy steady state is `127.0.0.1:47173` only, `uid=2000(shell)`, `adb_enabled=1`, `adbd=running`, and `service.adb.tcp.port=0`. The bridge is not ADB wire protocol. Classic port 5555 is deliberately disabled.

Live Wi-Fi security validation confirmed `127.0.0.1:47173` remained reachable while both the phone LAN address on 47173 and LAN address on 5555 refused connections. Temporary Wi-Fi/Wireless Debugging is used only when `wadb-local-on` must bootstrap or recover the bridge.

Reboot persistence is not claimed; rerun `wadb-local-on` after any state that removes the bridge.


## v1.7.5 R2 — Control Center disconnect and command catalogue

The interactive `ai-info` Control Center has separate **Disconnect Wireless ADB** and **All commands & usage** entries. The disconnect submenu offers exact verified network transport disconnect or Bridge-mediated Wireless Debugging OFF, with confirmation. It never silently stops MCP or the secure local shell.

For scripts, use `ai-info --disconnect-transport --confirm` or `ai-info --wireless-off --confirm`. Run `ai-info --commands` for the full edition-specific command reference. Keep the meanings of these layers separate: `wireless-debug-off` controls Android Wireless Debugging, `wadb-local-off --confirm` stops the secure local shell bridge, and `wadb-mcp-stop` stops Desktop Commander.

