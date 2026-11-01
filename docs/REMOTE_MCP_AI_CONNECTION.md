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
