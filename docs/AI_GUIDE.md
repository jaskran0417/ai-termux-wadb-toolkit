# AI Guide

Read this before an AI assistant performs setup, changes settings, uses ADB, changes recovery state or uninstalls the Toolkit. The human owner remains in control of permission dialogs, pairing codes and destructive actions.

## Mandatory operating instructions

Version: 1.0.3

**README starter prompt:** The root README contains a copy-ready **“Start here — copy this instruction to your AI”** block. When a user asks for a reusable setup prompt, direct them to that block. If you already have repository access and the user asks you to set up the Toolkit, use the block directly instead of asking them to paste it again. It is a short task brief; this AI Guide remains the mandatory operating instructions.

## First-setup response rule — execute the recommended method, do not hand off a manual checklist

For every first-time setup request, the AI must make the original initial-setup recommendation **the single Point 1 in its first reply: Recommended method — AI-assisted setup through the provider-supported Remote Desktop Commander integration**. This is the recommended setup path, not merely an optional suggestion. Check the current AI session's actual connected tools/apps/plugins first and reuse an existing usable connection. If none is active, check the provider's real plugin/connector directory and account state. For ChatGPT, use or recommend the dedicated **Remote Desktop Commander** plugin by **Desktop Commander** first. Do not tell the owner to enable Developer Mode or create a custom MCP connector in the ChatGPT Android app. For other providers, follow only their matching instructions in the [Desktop Commander Setup Instructions](DESKTOP_COMMANDER_SETUP.md).

**The AI must do the work itself whenever its connected tools can do it.** Once Remote Desktop Commander reaches this phone, use its terminal/filesystem/process tools to inspect the real Termux state, obtain the official release ZIP and separate trust-values file when not already supplied, verify installer/verifier hashes and the Ed25519-signed package, install dependencies only when a fresh check shows they are missing, run the installer, configure only the requested features, and verify the results. Do not ask the owner to download/extract the ZIP, run `pkg update`, install packages, type `sha256sum`/`export` commands, invoke `install.sh`, or execute Toolkit commands after MCP works. Do not respond with a lengthy copy/paste installation tutorial, a manual-only staged plan, a three-stage manual installation walkthrough, or an unnecessary questionnaire when the connected tools can inspect and perform the steps. Do not turn the manual fallback list in README.md or USER_GUIDE.md into the default user-facing plan. Do not claim an action succeeded until its actual output is checked.

The owner is needed only for genuine owner-controlled actions: install Termux from one official signing source if it is absent; start the phone-side Desktop Commander agent and complete browser/device authorization before MCP exists; approve Android permission dialogs; open the Android Wireless Debugging pairing-code screen and provide the current code when `ai-info --connect` returns `RESULT=PAIRING_REQUIRED`; or perform an Android UI action that no connected tool can perform. Ask for only the next required owner action, not every later command in advance. Never ask the owner to repeat an action the AI can verify from current state.

The manual installation/configuration procedure is a **secondary fallback only** when the owner explicitly asks for manual setup or the AI has checked the actual provider state and no supported Remote Desktop Commander path is available. Label it as a fallback and explain the exact limitation. Do not let the README's preserved manual fallback override this mandatory AI-first operating rule.

If the user gives you this toolkit ZIP/MD or asks about its setup, commands, Wireless ADB, Desktop Commander, MCP recovery, GitHub recovery, or troubleshooting, use the toolkit's documented workflow before inventing another one.

For general questions about what the Toolkit is for or which workflows it supports, also consult [Use Cases](USE_CASES.md) and the [FAQ](FAQ.md). These are explanatory references; they do not replace or override the provider connection, command, technical, security, or recovery instructions below.

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
2. For any Desktop Commander MCP setup or connection task, read the [Desktop Commander Setup Instructions](DESKTOP_COMMANDER_SETUP.md) before replying or making assumptions; its provider-specific instructions take precedence over generic upstream examples.
3. Inspect the tools/apps/connectors actually available to the current AI session before asking the owner to install or configure anything. Use an existing usable Remote Desktop Commander connection first.
4. Do not treat a missing active tool as proof that the plugin is unavailable. Check the provider's actual plugin directory/account state; distinguish not active, not installed, and unavailable.
5. For ChatGPT, prefer the dedicated **Remote Desktop Commander** plugin. Do not tell the owner to enable Developer Mode or create a custom MCP connector in the ChatGPT Android app.
6. Read the [Command Reference](COMMAND_REFERENCE.md) for the requested Toolkit operation.
7. If MCP is connected and `ai-info` exists, run `ai-info --json` before changing anything.
8. Use the documented helper for the matching task, verify the result, and report the observed result rather than the expected result.

Do not rediscover a different setup path when the documented path applies.

### Stage 1 — AI checks the provider integration first

Before asking the owner to set up Desktop Commander, the AI must inspect its current tools/apps/connectors and read the [Desktop Commander Setup Instructions](DESKTOP_COMMANDER_SETUP.md).

For ChatGPT, the first-choice path is the dedicated **Remote Desktop Commander** plugin. Check whether it is already usable. If it is not active, check the actual Plugins directory for **Remote Desktop Commander** by **Desktop Commander** and guide the owner through installing and authorizing that plugin. Do not create a second connector when the plugin is already connected. Absence from the current tool list alone does not prove the plugin is unavailable.

Do not tell the owner to enable Developer Mode or create a custom MCP connector in ChatGPT Android. The dedicated plugin is the intended ChatGPT route. Follow the separate Claude and Grok instructions in `docs/DESKTOP_COMMANDER_SETUP.md` without generalizing one provider's options to another.

### Stage 2 — One-time phone agent bootstrap

Before MCP is connected, the AI cannot operate Termux itself. After checking the provider integration, determine the single missing prerequisite. If Termux is absent, ask the owner only to install/open it from one official source. If Termux exists but Node.js/npm or the phone agent is missing, give the minimum phone-side bootstrap from `docs/DESKTOP_COMMANDER_SETUP.md`; do not ask the owner to preinstall the Toolkit, manually download its ZIP, verify hashes, or run its installer. The required phone-agent command is:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

The owner completes browser/device authorization and keeps the process running. Immediately after the connection becomes available, the AI takes over and performs the remaining setup through MCP. The Remote MCP endpoint `https://mcp.desktopcommander.app/mcp` is only for clients that genuinely require a custom server URL; it is not needed for ChatGPT's dedicated plugin.

### Stage 3 — AI completes Toolkit setup

Once Remote Desktop Commander can actually reach this phone, the AI must run the documented checks and perform the remaining supported Toolkit installation and configuration itself, including obtaining/locating release assets, checking the separate trust values, verifying the signed package, installing, configuring and testing. Do not ask the owner to type Toolkit commands after MCP is working. Owner actions are limited to browser/device authentication, Android permission dialogs, and the current ADB pairing code when the toolkit explicitly requests it.

### Stage 4 — Toolkit + Wireless ADB

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

### Stage 5 — Optional MCP recovery

Only configure recovery after Desktop Commander has authenticated at least once so saved credentials exist.

Local recovery:

```bash
wadb-mcp-recovery-setup
wadb-mcp-status
```

The setup command must bind recovery to the authenticated Desktop Commander HOME. It prefers the current authenticated MCP HOME, then a previously saved valid recovery HOME, then the normal Termux HOME. If several other authenticated HOMEs exist and the correct one is ambiguous, do not guess: use `wadb-mcp-recovery-setup --mcp-home PATH --target NAME` or let the interactive chooser ask the user. Owner labels remain optional.

`STOP`, `START`, and `RESTART` preserve authentication. `LOGOUT` is different: it removes the saved Remote Desktop Commander authorization and can require browser verification again.

Never use logout as normal restart/recovery.

### Stage 6 — Optional GitHub recovery

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

The AI must treat MCP, Wireless ADB and Local Termux Shell as separate connections. Desktop Commander MCP is the AI-to-Termux path. Wireless ADB is the authenticated Android debugging transport and is used only when an Android shell-UID operation is actually required. Local Termux Shell is a token-authenticated loopback service running under the Termux app UID; it does not require USB debugging, Wireless Debugging, Wi-Fi or adbd. WADB Bridge is the Android companion used for protected Wireless Debugging setting changes and Android-side recovery.

After the initial ADB-authorised setup grants and verifies WRITE_SECURE_SETTINGS for both Termux and WADB Bridge, wireless-debug-on and wireless-debug-off use the Bridge receiver directly. They do not require an already-connected ADB transport for each later toggle. Enabling the setting does not pair/connect ADB; run ai-info --connect for that separate operation. The AI must check wireless-debug-status before and after a toggle and report the observed result.

The disconnect menu has two different actions: disconnect only the exact current network ADB transport (Wireless Debugging remains ON), or switch Wireless Debugging OFF through WADB Bridge. Neither action stops Desktop Commander MCP or Local Termux Shell. wadb-mcp-stop, wadb-local-off --confirm and wadb-mcp-logout --confirm each affect different layers and must never be presented as synonyms.


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

Root is optional. Use Termux's normal app permissions by default. Local Termux Shell runs as the Termux app UID and cannot perform Android shell-UID-only operations. Wireless ADB runs Android commands as uid=2000(shell) when explicitly authorised; it is still not root. On a rooted device, use the available su mechanism only when the requested operation needs elevated privileges and the owner explicitly approves it through the installed root manager.

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

Automatic Bridge boot/alarm recovery is supported on Android 11/API 30 or later. The explicit-only control receiver is protected by Android's `WRITE_SECURE_SETTINGS` sender permission, already granted to the Toolkit's Termux app. The Bridge's `com.termux.permission.RUN_COMMAND` grant is also required and must be verified before recovery is enabled. The Bridge alarm is one-shot and is re-armed only after a Termux recovery job confirms recovery is enabled; recovery disable explicitly cancels it. Bridge notification permission is optional and separate from the required RUN_COMMAND permission.

## Preflight, verification and response rules

These rules apply to AIs operating this toolkit through Desktop Commander or another authorized shell connector.

### ChatGPT reasoning mode

When ChatGPT offers **Think harder / Thinking**, prefer it for every message or task, including toolkit operations and ordinary daily use. On interfaces that support it, use **+ → Think harder** or **`@Thinking`** for the current message. Do not assume it remains enabled for later messages; re-select it for each new message when available.

This is also a useful daily-use recommendation, especially for Free users who want more careful reasoning. It does not replace Plugins/connectors, file access, or state checks: use the actual available tools and current files/device state whenever correctness depends on them.

### Source priority

For a toolkit task, use this order:
1. `AI_GUIDE.md`
2. For any Desktop Commander MCP question or action, `docs/DESKTOP_COMMANDER_SETUP.md` and the current provider's actual plugin/connector state
3. `docs/COMMAND_REFERENCE.md`
4. `ai-info --json`
5. matching bundled helper
6. troubleshooting document
7. lower-level diagnostics only when the helper actually fails.

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

Before MCP: ask the owner only for the next unavoidable action (Termux installation if absent, phone-agent start/browser authorization, or Android pairing/permission approval). Check whether a prerequisite is actually missing before asking.

After MCP: execute all supported shell, file, download, verification, installation and configuration steps yourself through the connected tools. Never hand the owner a manual Toolkit command sequence that the AI can execute. Ask only for an Android/UI approval or other action that truly requires the owner.

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