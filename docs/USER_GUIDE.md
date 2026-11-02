# User Guide

This guide brings installation, first-time setup, AI connection, manual operation, troubleshooting and optional recovery into one place. Start with the setup sequence, then use the troubleshooting and prompt sections when needed.

## What is installed, where it lives, and which app does what

The Toolkit is installed **inside the Termux app**. It is not a separate Android launcher app and it does not contain an AI model.

| Component | What it does |
|---|---|
| Termux | Android terminal, shell, package manager and filesystem home where the Toolkit commands run |
| Desktop Commander | Separate Node.js-based Remote MCP service that exposes authorised terminal, filesystem, directory and process tools to the AI client |
| AI client (ChatGPT, Claude, or another compatible client) | The interface where the owner describes the work; it must support the required MCP/connector integration |
| AI Termux WADB Toolkit | Bash command suite, dashboard, Android connection helpers, diagnostics, local-shell controls and optional recovery |
| WADB Bridge | Separate Android companion package for protected Wireless Debugging setting operations and Android-to-Termux recovery hand-off; it has no normal launcher screen |
| Termux:API | Optional Termux command package plus a separate compatible Android companion app for notifications and extra device information |

The normal Termux installation paths are:

~~~text
/data/data/com.termux/files/usr/bin/
    User-facing commands such as ai-info, wireless-debug-on,
    wireless-debug-off, wadb-local-on and wadb-mcp-start

/data/data/com.termux/files/usr/libexec/ai-wadb/
    Shared shell helpers, the native local bridge and integrity verifier

/data/data/com.termux/files/home/AI_WADB_DOCS/
    Installed USER_GUIDE.md, AI_GUIDE.md, REMOTE_MCP_AI_CONNECTION.md,
    COMMAND_REFERENCE.md, TECHNICAL_REFERENCE.md and toolkit manifest

/data/data/com.termux/files/home/AI_ENVIRONMENT.md
    Installed environment reference

/data/data/com.termux/files/home/.ai-wadb/
    Private toolkit state, cached Bridge APK, recovery settings
    and the Secure Local Shell authentication token
~~~

Shared user files are reached only after the owner grants Termux storage access. Run termux-setup-storage in Termux and approve Android's prompt if Downloads or shared storage should be accessible. The usual shortcut is ~/storage/downloads; Android app-private data remains isolated.

### What “initial setup” means

Initial setup means connecting the AI client to the phone and creating the Android trust/permission state the Toolkit needs. It is a one-time bootstrap, not a step to repeat for every command:

**Recommended: AI-assisted setup.** Give the Toolkit ZIP or instruction file to your AI and ask it to follow `docs/AI_GUIDE.md`. Before asking you to set up Desktop Commander, the AI must first check whether Remote Desktop Commander is already available and connected in its current plugins/tools. For ChatGPT, it must look for the dedicated **Remote Desktop Commander** plugin by **Desktop Commander**; it must not send you to Developer Mode or ask you to create a custom connector in the Android app. The AI should guide only the one-time plugin authorization and phone-side Desktop Commander bootstrap. After the AI can reach Termux, it performs the Toolkit installation, validation, Wireless ADB setup and remaining supported configuration itself. You should not have to run Toolkit commands manually; Android approvals and the current ADB pairing code are the owner actions when requested.

The AI-assisted path is the recommended way to use this Toolkit. The manual path below is an alternative for owners who choose to perform setup themselves:

1. Install Termux and grant it shared-storage access if required.
2. Extract the official Toolkit release in a Termux-accessible folder, complete the published release-verification steps, and run bash install.sh from the extracted folder.
3. Start the separate Desktop Commander service from Termux with npx @wonderwhy-er/desktop-commander@0.3.1 remote, complete the browser/device verification and connect the AI client through its supported MCP integration.
4. Run ai-info --connect. For a fresh phone, enable Developer Options > Wireless debugging manually, open Android's pairing-code screen when requested, and use ai-info --pair CODE with the current six-digit code.
5. Once ADB is authenticated, the Toolkit installs/updates WADB Bridge and grants/verifies the required WRITE_SECURE_SETTINGS permission for both Termux and the Bridge. Setup is complete only when the output includes RESULT=CONNECTED_AND_READY and bridge_write=ready.

On OPPO/ColorOS, OnePlus and realme builds affected by the OEM restriction, Developer options > **Disable permission monitoring** may also need to be ON (blue) before the secure-settings grants. Android/browser prompts and pairing still require the owner's approval.

After this initial grant is complete, WADB Bridge can be used to switch Wireless Debugging ON or OFF without an already-connected ADB transport for every toggle. This is the key difference between the first bootstrap and normal operation. Turning Wireless Debugging ON does not itself pair or connect ADB; a trusted ADB key and normal Android pairing are still required for an ADB connection.

## Quick start and recommended setup order

This is the first stop for a person installing or using the Toolkit. For the
system-level explanation, see docs/TECHNICAL_REFERENCE.md before proceeding.

This toolkit combines:
- Remote Desktop Commander MCP access to Termux,
- Wireless ADB setup and reconnect helpers using Android's authorized debugging interface,
- WADB Bridge,
- optional local and Android-triggered MCP recovery,
- optional GitHub remote recovery.

The normal order is intentionally simple.

### 1. AI checks the Remote Desktop Commander integration first

Before asking you to install or configure anything, the AI must inspect its current connected tools/apps and read `docs/REMOTE_MCP_AI_CONNECTION.md`. If Remote Desktop Commander is already connected, it should use that connection. If it is not active, it must check the provider's actual plugin directory/account state. For ChatGPT, the first choice is the dedicated **Remote Desktop Commander** plugin by **Desktop Commander**; the AI must not tell you to enable Developer Mode or create a custom connector in the Android app.

### 2. Complete the one-time phone-side bootstrap

Only before MCP can reach the phone, you need to start the phone-side Desktop Commander agent. The AI should give you this short bootstrap and guide the browser/device authorization:

```bash
pkg update
pkg install nodejs npm
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Complete the browser/device verification when asked.

After the AI confirms it can run Termux commands through Desktop Commander, the AI should perform the remaining supported shell steps itself instead of asking you to type them.

**Ownership boundary:** Desktop Commander is an external dependency/control path, not a WADB-toolkit component. Toolkit uninstall must not stop it, log it out, remove its saved device login, or delete Termux's `~/.android/adbkey`.

### 2. Install this toolkit

Before running the installer, download the separate RELEASE-TRUST-VALUES.txt asset from the official release independently of the ZIP. Compare sha256sum install.sh security/verify-release.js with the installer and verifier values in that file, then set the three independent WADB trust environment variables required by install.sh. The README and Technical Reference explain why those values must be obtained separately. The installer repeats the checks before changing Toolkit files.

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

### 3. Recommended: set up Wireless ADB

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

#### ColorOS / OPPO / OnePlus / realme first-time setup

On affected ColorOS-family phones, enable these two Developer options together before pairing:

```text
Wireless Debugging = ON
Disable permission monitoring = ON / blue
```

Then rerun `ai-info --connect`.

The toolkit reports `DISABLE_PERMISSION_MONITORING=on|off|unknown` when the ColorOS property is readable. If it says `off`, turn **Disable permission monitoring ON (blue)** before continuing to the pairing-code step. The switch does **not** grant `WRITE_SECURE_SETTINGS`; it only removes the OEM restriction so the authenticated ADB shell can perform and verify the real one-time grants.

### After initial setup: toggle Wireless Debugging without an active ADB transport

Once both Termux and WADB Bridge have the required WRITE_SECURE_SETTINGS grants, the Toolkit can use the protected WADB Bridge receiver to change Android's Wireless Debugging setting. These commands do not require an already-connected ADB transport for each later ON/OFF toggle:

~~~bash
wireless-debug-status
wireless-debug-on
wireless-debug-off
~~~

wireless-debug-status reads the state and performs a no-op write of the same value to verify that the permission path is still ready. wireless-debug-on and wireless-debug-off change the setting and verify the returned value.

The interactive ai-info Control Center > Disconnect Wireless ADB menu keeps two choices separate:
- disconnect only the exact currently verified network ADB transport (Wireless Debugging stays ON);
- turn Android Wireless Debugging OFF through WADB Bridge.

The headless forms are ai-info --disconnect-transport --confirm and ai-info --wireless-off --confirm. Neither action stops Desktop Commander MCP or Secure Local Shell. Turning Wireless Debugging back ON does not pair ADB by itself; ai-info --connect performs the connection/pairing workflow when Android requires it.

### 4. Optional: secure Wi-Fi-independent local shell

After authenticated ADB has been established once, run:

```bash
wadb-local-on
```

Then inspect:

```bash
wadb-local-status
ai-info --local
```

A healthy result shows a token-authenticated bridge at `127.0.0.1:47173`, `uid=2000(shell)`, `LISTENER_SCOPE=loopback_only`, and `ADBD_TCP_EXPOSURE=none`.

Run Android shell commands with:

```bash
wadb-local-shell -c 'id'
```

The secure bridge replaces the earlier classic `127.0.0.1:5555` method. In secure mode, `service.adb.tcp.port=0`, so adbd itself is not reachable from the Wi-Fi/LAN. Wireless Debugging and Wi-Fi are only brought up temporarily by `wadb-local-on` if recovery/bootstrap is required, then returned to their previous OFF state when possible.

To stop the secure bridge:

```bash
wadb-local-off --confirm
```

A reboot or adbd restart may remove the bridge; persistence across reboot is not claimed. Rerun `wadb-local-on` when needed.

### 5. Optional: automatic MCP recovery

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

### 6. Optional: GitHub recovery

GitHub recovery lets an authorized AI change a small control file even when MCP is offline. The phone-side watchdog can then start MCP again.

This is optional. Read:

`docs/TECHNICAL_REFERENCE.md`

Recommended long-term design:
- a dedicated **private** control repository,
- branch `wadb-control`,
- file `wadb-control.json`,
- phone read credential restricted to that one repo with **Contents: Read-only**.

Two simpler alternatives also exist: use an existing Termux `gh` login with `--mode gh` (requires the `gh` package and authenticated repo read access; usually broader permissions), or use a dedicated public repo with `--mode public` (no phone GitHub account/token; uses ordinary git+curl). The AI's GitHub connector is the write path and is independent of MCP availability.

The AI-side GitHub account and phone-side GitHub account/token do not have to match. Configure the phone read path, run `wadb-mcp-github-test`, then establish the first-sync baseline before any STOP/START recovery action. A new control identity never executes the action already present on its first sync.

### 7. Optional owner label

Owner labels are only useful for distinguishing multiple MCP environments.

```bash
ai-info --owner-set CHATGPT_WADB
ai-info --owner-show
ai-info --owner-clear
```

Skipping this does not reduce normal functionality.

### User prompts for an AI

Ready-made prompts are in:

`docs/USER_GUIDE.md`

The simplest first prompt is:

> Read `AI_GUIDE.md` and the toolkit instructions before giving setup commands. First help me establish Desktop Commander MCP. Once MCP is connected, use it to perform the supported toolkit setup yourself, verify every step, and use `ai-info --json` instead of inventing another setup path.

### Security and rollback

For the exact security boundaries and v1.0.2 security and rollback protections, read:

```text
docs/TECHNICAL_REFERENCE.md
```

A clean uninstall helper is included as `wadb-toolkit-uninstall`. Recovery disable now restores the previous `allow-external-apps` state unless `--keep-external-apps` is explicitly requested.

## Connect an AI client through Remote Desktop Commander

This document explains how to let an AI that supports MCP, connectors, or plugins access this Android phone through **Remote Desktop Commander running inside Termux**.

This does **not** install MCP into the AI from Termux. The Termux command starts the phone-side Remote Desktop Commander device. The AI then connects to the Desktop Commander Remote MCP service through its own MCP/connector/plugin support.

### Start reference

Read `AI_GUIDE.md` first. For the Android app connection steps for ChatGPT, Claude and Grok, also read `REMOTE_MCP_AI_CONNECTION.md` and follow its provider-specific instructions.

In short:

```text
Remote AI client -> Remote Desktop Commander / Remote MCP -> Termux -> ADB -> Android
```

MCP and ADB are separate connections. A missing active MCP connection means the AI-to-Termux path is not currently established; it does not by itself diagnose the ADB state inside Termux.

For provider-specific Android-app connection steps, use `REMOTE_MCP_AI_CONNECTION.md`. Do not infer the Android connector path from another provider or a different app surface.

The supported Wireless ADB helpers and the hardware-verified Developer-Options-off / different-Wi-Fi observations are documented in `AI_GUIDE.md`.

### 1. Prepare Termux

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

### 2. Start Remote Desktop Commander on the phone

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

### 3. Connect the AI client

Follow `docs/REMOTE_MCP_AI_CONNECTION.md` for the provider-specific Android app steps for ChatGPT, Claude and Grok. Read that document before choosing or describing a provider connection path; do not replace its tested app instructions with a generic or guessed connector workflow.

The Remote MCP server URL is:

```text
https://mcp.desktopcommander.app/mcp
```

The Termux command from section 2 belongs only in Termux. Do not paste that command into the AI app's Server URL field. Complete the sign-in/authorization flow shown by the supported AI app.

### 4. Verify that the AI really reaches Termux

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

### 5. Normal use after initial setup

For a phone that has already been authorized, the usual phone-side start sequence is simply:

```bash
termux-wake-lock
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

The authorized client can then use Desktop Commander. Existing saved authorization remains valid until it is removed or the service requests verification again; a normal reconnect does not inherently require reinstallation or re-authorization.

### Remote connection state reference

An already-authorized Desktop Commander Remote MCP connection is the existing control path to Termux; a second MCP implementation is unnecessary.

For provider-specific Android app connection steps, use `docs/REMOTE_MCP_AI_CONNECTION.md`. Do not infer a provider's Android connector availability from another app surface or from memory.

If the phone-side Desktop Commander device is offline, the phone-side start command is:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

First-time authorization can require browser verification by the user. Once the phone is online, harmless terminal checks can confirm that the connection reaches Termux.

### Security and privilege limits

Remote MCP exposes only the tools and permissions provided by Desktop Commander and the Termux environment. It does not automatically grant Android root access. Desktop Commander may also block selected commands. Wireless ADB, when connected, adds Android shell-level access but still does not equal root.

Authentication tokens, saved credentials, and session secrets are sensitive data and are not part of the bundle documentation or normal diagnostic output.

## AI-assisted and manual setup paths

### ChatGPT Free/daily-use recommendation

If ChatGPT shows **Think harder / Thinking**, use it for each message or task when the option is available. You can normally select **+ → Think harder** or use **`@Thinking`** for that message. Do not treat one selection as permanently enabling it for all later replies; select it again for each new message.

This recommendation applies to normal daily ChatGPT use as well as this toolkit. It is particularly useful for files, Plugins/connectors, troubleshooting, coding, research, comparisons, and multi-step tasks.

### Path A — AI-assisted (recommended)

1. Install/open Termux.
2. Give the toolkit ZIP or standalone AI instruction MD to your AI.
3. Tell the AI to read `AI_GUIDE.md`.
4. Follow only the initial Desktop Commander bootstrap steps until MCP is connected.
5. Complete browser/device verification.
6. Connect Remote Desktop Commander to the AI using the provider-specific Android app steps in `docs/REMOTE_MCP_AI_CONNECTION.md`.
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

### Path B — manual

1. Prepare Termux and connect Desktop Commander using `docs/USER_GUIDE.md` if you want remote AI access.
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
6. For GitHub recovery, read `docs/TECHNICAL_REFERENCE.md`. Choose one phone read method (`token`, `gh`, or `public`), run `wadb-mcp-github-test`, establish the safe first-sync baseline, then verify a newer-generation `STATUS` command before any STOP/START recovery action.

### Important

The first Desktop Commander login must succeed before automatic MCP recovery can reuse it.

Normal MCP stop/restart/reboot should keep authorization. Do not use logout unless you intentionally want to require a new authorization.

## Wireless ADB and Toolkit troubleshooting

### Another AI only repeats command names

The v1.0.2 ai-info Control Center provides the human status dashboard and explained actions. The AI should use those descriptions before presenting choices. It should not guess command meaning from the name alone and should not open the full guide unless the user asks for it.

### Existing helpers fail

For Wireless Debugging, use the bundled proven helpers first. If one fails, diagnose the real error before substituting a different method. Only then use deeper shell/ADB capabilities, other authorized privileges, or web research as needed. Do not silently replace the working architecture just because another command exists.

### Pairing code disappears when switching apps

Keep **Pair device with pairing code** visible in Settings. On the same phone, use ChatGPT in floating window, split screen, or pop-up view. Send the 6-digit code from there and let the AI run `ai-info --pair CODE`. If Android closes the popup or changes the code, use the new code.

### Plain ai-info shows only three choices

This is intentional. Pairing is not offered until `ai-info --connect` has established that it is needed. Use lower-level commands only for troubleshooting.

### Start with the executable interface

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


### AI is unsure whether an open port is pairing or connection

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

## Troubleshooting — AI Termux Wireless ADB Bundle

### Fresh setup / Bridge is not write-ready

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

### `CURRENT_WIFI_IP_NOT_DETECTED`

Automatic IP detection uses Termux:API from a genuine Termux shell environment.

Check:

```bash
phone-capabilities --details
```

Make sure both are installed:

- Termux package: `termux-api`
- Android app: Termux:API from the same distribution/source as Termux

As a fallback, `wadb-bootstrap` accepts `--ip PHONE_IP`.

### `PAIRING_FAILED`

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

### Pairing succeeded but ADB connection did not verify

Pairing and normal connection ports are different.

Run:

```bash
wireless-adb-connect
```

It rediscovers the normal connection port on the current phone IP.

### ColorOS first setup: enable both Developer options before pairing

When first-time setup begins on ColorOS/OPPO/OnePlus/realme, enable these together:

```text
Wireless Debugging = ON
Disable permission monitoring = ON / blue
```

`ai-info --connect` prints `DISABLE_PERMISSION_MONITORING=on|off|unknown` when the ColorOS property is readable. If an AI forgot to mention the second option, follow the command output itself.

If it is left OFF/gray, pairing can still succeed but the later `pm grant` calls may fail with `GRANT_RUNTIME_PERMISSIONS`. Turning it ON/blue afterward does not require re-pairing; rerun `ai-info --connect`.

### ColorOS / OPPO / OnePlus: `GRANT_RUNTIME_PERMISSIONS` denial

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

### `TERMUX_BUILD_DOES_NOT_DECLARE_WRITE_SECURE_SETTINGS`

The protected WADB Bridge receiver requires the calling Termux app to hold `WRITE_SECURE_SETTINGS`.

The bootstrap deliberately refuses to weaken the bridge receiver.

Use a compatible Termux build that declares the permission, or redesign the bridge only after explaining that change and getting user approval.

### `cmd: Failure calling service activity: Failed transaction`

The bundled `wireless-debug-*` helpers already include the proven workaround:

```bash
</dev/null
```

plus up to three retries.

Do not remove it casually.

### Wi-Fi network changed

Do not re-pair immediately.

Run:

```bash
wireless-adb-connect
```

It should rediscover the new phone IP and dynamic connection port and try the existing ADB key first.

Only re-pair if Android actually rejects authentication.

### `ip neigh` or `/proc/net/arp` permission denied

Expected on many modern Android builds for ordinary app UIDs.

Do not treat this as proof the network is broken. Use Termux:API + the bundled current-IP/port discovery instead.

### WADB Bridge seems missing

With a working ADB shell:

```bash
adb shell pm list packages | grep com.jaskran.wadbbridge
```

If missing, run:

```bash
wadb-bootstrap --finalize
```

It uses the bundle's copy at `~/.ai-wadb/wadb-bridge.apk`.

### Permission grant lost

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

## Desktop Commander recovery troubleshooting

### MCP is offline but credentials say `yes`

Run locally:
```bash
wadb-mcp-start
wadb-mcp-status
```

If GitHub recovery is configured and the AI has lost MCP, increment the GitHub control generation and set `START_MCP`.

### Reboot recovery does not start

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

### Desktop Commander asks for browser verification after every restart

Check whether a logout command or credential deletion occurred. Normal `wadb-mcp-stop`, `wadb-mcp-start`, `wadb-mcp-restart`, phone reboot, and watchdog recovery must not delete:
```text
.desktop-commander-device/device.json
```

### GitHub command is ignored

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

### Owner label missing

This is not an error. Owner labels are optional. Set one only if it helps distinguish multiple MCP environments.

## Ready-made prompts for an AI assistant

### A. User gives the ZIP/MD before MCP exists

> I am giving you the AI Termux WADB Toolkit. Read `AI_GUIDE.md` and the included instructions before replying. Do not invent another setup path. First guide me through the minimum steps to connect Desktop Commander Remote MCP to this AI. Until MCP is connected, only give me the manual actions that are truly required. Once MCP is connected, use MCP to run supported setup commands yourself and verify each result.

### B. MCP is connected

> Desktop Commander MCP is connected. Continue the WADB toolkit setup using the included instructions. Run `ai-info --json` first, use the documented helpers, and do the shell work yourself instead of asking me to type commands. Ask me only for genuine user actions such as a permission dialog or temporary pairing code.

### C. Full recommended setup

> Set up the toolkit in the recommended order: verify MCP, install/update the toolkit, configure Wireless ADB using the existing trusted key first, verify WADB Bridge, then offer automatic MCP recovery. Do not configure GitHub recovery unless I choose it. Verify every stage.

### D. Automatic MCP recovery

> Set up automatic Desktop Commander recovery using the toolkit instructions. Preserve the saved MCP login. Do not use logout. Configure local watchdog/boot recovery, handle the one-time WADB Bridge RUN_COMMAND permission if needed, and verify recovery status.

### E. GitHub recovery — AI-assisted

> Set up optional GitHub MCP recovery using the toolkit instructions. Use my connected GitHub connector if available; its account may differ from the phone-side GitHub account/token as long as the AI can write and the phone can read the same control file. Prefer a private control repository with a one-repo Contents: Read-only phone token for least privilege; if I want zero new credential setup, offer the existing Termux gh login; also explain the public no-phone-credential option. Never ask me to paste a GitHub token into AI chat. If the connector cannot create a repository, ask me only to create/select it, then continue yourself. Run wadb-mcp-github-test, establish the first-sync baseline, and verify a newer-generation STATUS command before performing STOP through GitHub followed by START through GitHub. Confirm the same saved MCP authorization returns. Never put LOGOUT_MCP in the GitHub control channel.

### F. GitHub recovery — manual

> Give me the manual GitHub MCP recovery procedure from the toolkit. Do not change GitHub yourself. Show the exact repository/branch/file, JSON format, generation rule, phone configuration command, verification procedure, and rollback.

### G. Diagnostics only

> Run the toolkit read-only diagnostics. Read the instructions first, run `ai-info --json` and `ai-info --doctor`, and do not change settings or install anything.

## Legacy Shizuku alternative (not required)

This document is reference material only. The preferred portable method is WADB Bridge and does **not** require Shizuku.

An optional alternative uses:

- Shizuku 13.6,
- Shizuku's native starter launched from an already-connected ADB shell,
- `rish` and `rish_shizuku.dex`,
- an environment-aware `rish-remote`,
- `WRITE_SECURE_SETTINGS` granted to Shizuku.

The historical ADB starter pattern was conceptually:

```bash
PKG=$(pm path moe.shizuku.privileged.api | head -n1 | cut -d: -f2)
DIR=${PKG%/*}
"$DIR/lib/arm64/libshizuku.so"
```

When Shizuku was alive, `rish` could provide a privileged shell pathway and Shizuku's Android 13+ boot logic could manipulate ADB-related global settings.

Why it is optional here:

- the current WADB Bridge has already proven cold-start Wireless Debugging without Shizuku,
- Shizuku adds another app/service dependency,
- some users may prefer not to keep it installed.

This portable bundle intentionally does **not** include or install Shizuku, `rish`, or Shizuku APK files.

Do not install or activate this alternative unless the user explicitly asks for it.

[executed on device: localhost (9b7cb346-13dd-45be-92da-9fef4f14d985)]