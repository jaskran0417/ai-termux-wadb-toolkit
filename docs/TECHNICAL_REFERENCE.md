# Technical Reference

Architecture, Android permission boundaries, system behaviour, release verification, security limits and optional GitHub recovery. This reference describes the system; it does not grant permissions or bypass Android security.

## Android and Toolkit architecture

This document explains the working model at the component and Android-platform level. It is intentionally an architectural overview, not a copy of the implementation source.

### v1.0.2 release-integrity correction

The v1.0.1 release had a version-identity mismatch in its installed-file verifier: the signed inventory generator wrote version 1.0.1, while the installed verifier accepted only 1.0. The v1.0.1 installer therefore rejected its own signed inventory during post-install verification and rolled back. In v1.0.2, the verifier requires 1.0.2, the version recorded in the signed inventory. The CI workflow now asserts that VERSION, the generated inventory version and the verifier's expected version agree. This hotfix changes release identity validation only; it does not alter Wireless ADB, MCP, recovery, Secure Local Shell or Android Bridge behavior.

### Implementation map: which file performs each job

The v1.0.2 source is organised around these primary entry points and components:

| Source path / component | Function |
|---|---|
| scripts/ai-info | Human Control Center, structured JSON state, read-only diagnostics, connect/pair, local-shell, recovery and disconnect actions |
| scripts/wireless-adb-connect | ADB client bootstrap, trusted-key connection, typed endpoint discovery and authenticated reconnect |
| scripts/adb-mdns-discover | Discovers Android's typed pairing and connection mDNS services; it does not guess service role from a port number |
| scripts/wadb-bootstrap | Installs/updates the cached WADB Bridge APK and performs the one-time ADB permission-grant and Bridge-readiness checks |
| scripts/wireless-debug-status | Reads the Bridge setting and verifies the protected write path with a no-op write of the current value |
| scripts/wireless-debug-on and scripts/wireless-debug-off | Send the Bridge SET_WIRELESS_DEBUG request, then read back and verify adb_wifi_enabled |
| bridge-source/.../WirelessDebugReceiver.java | Android receiver that reads/writes Settings.Global adb_wifi_enabled and returns the actual value/write result |
| bridge-source/.../PermissionActivity.java | Requests the Android runtime permissions used for Termux RUN_COMMAND integration and optional notifications |
| bridge-source/.../McpRecoveryReceiver.java | Handles supported boot/package-replaced/recovery events, schedules the slower Android alarm and requests the fixed Termux recovery job |
| scripts/wadb-local-on/off/status/shell | Starts, inspects, stops and authenticates the Secure Local Shell route |
| native/wadb-local-bridge.c | Native Android-side shell helper; accepts authenticated loopback requests and executes them with the shell-user identity |
| scripts/mcp-recovery-common and scripts/wadb-mcp-* | Manage MCP desired/actual state, saved-session lifecycle, local watchdog and optional recovery configuration |
| scripts/wadb-mcp-github-* and scripts/github-control-fetch | Configure, read, validate and process the optional GitHub recovery control file |
| scripts/phone-capabilities | Reports installed command and Android capability state for diagnostics |
| install.sh / uninstall.sh | Preflight, package installation, documentation placement, rollback, and removal of Toolkit-owned components |

The key Android setting is Settings.Global key adb_wifi_enabled. During first setup, the authorised ADB shell grants WRITE_SECURE_SETTINGS to both the Termux package and WADB Bridge. The exported Bridge receiver is protected by that permission. After these grants are verified, wireless-debug-on and wireless-debug-off can call the Bridge directly and do not need an already-connected ADB transport for every later toggle. Turning the setting ON still does not pair the ADB key or establish a network transport; wireless-adb-connect handles that separate job.

The Secure Local Shell is not an ADB protocol listener. The Termux-side command uses the native C helper over an authenticated loopback connection on 127.0.0.1:47173. The helper runs as Android uid=2000(shell); the random token is stored privately under the Termux home directory. The ordinary steady state keeps classic adbd TCP exposure disabled.

External components remain distinct: Desktop Commander supplies the Remote MCP process/tool interface; Termux supplies the shell and package environment; Android supplies the protected APIs and permission model; the AI client supplies the model and user-facing interaction. The Toolkit orchestrates these components rather than replacing them.

### Platform API calls and component hand-offs

#### Wireless Debugging setting

The Java component at `bridge-source/app/src/main/java/com/jaskran/wadbbridge/WirelessDebugReceiver.java` uses Android's `Settings.Global` API with the `adb_wifi_enabled` key:

- `GET_WIRELESS_DEBUG` reads the current value with `Settings.Global.getInt(contentResolver, "adb_wifi_enabled", -1)`.
- `SET_WIRELESS_DEBUG` reads the Boolean enabled extra, writes 1 or 0 with `Settings.Global.putInt`, then reads the value back.
- The receiver reports the write result and observed setting value. A successful broadcast invocation alone is not treated as proof that the setting changed.
- The explicit actions are `com.jaskran.wadbbridge.GET_WIRELESS_DEBUG` and `com.jaskran.wadbbridge.SET_WIRELESS_DEBUG`.
- The Android manifest marks this receiver exported but protects it with `android.permission.WRITE_SECURE_SETTINGS`.

The Termux helpers send explicit broadcasts to `com.jaskran.wadbbridge/.WirelessDebugReceiver` through `/system/bin/am broadcast`. The ON/OFF helpers send `SET_WIRELESS_DEBUG` with enabled=true or enabled=false; the status helper reads the current value and checks the protected write path. The one-time authenticated ADB bootstrap installs/updates the Bridge and grants/verifies the required permissions. Later setting changes use the local Termux-to-Bridge broadcast path and do not require an already-connected ADB transport. Enabling the setting still does not perform ADB pairing or establish the network transport.

#### Wireless ADB discovery

`scripts/adb-mdns-discover` queries the Android DNS-SD/mDNS service types:

~~~text
_adb-tls-pairing._tcp.local
_adb-tls-connect._tcp.local
~~~

The first identifies the temporary pairing endpoint; the second identifies the normal TLS connection endpoint. The discovery code parses PTR, SRV and A records and keeps the pairing and connection roles separate. It does not infer the role from a port number. The advertised address and port can change, so the Toolkit rediscovers the endpoint before connecting.

#### Android-to-Termux recovery hand-off

`McpRecoveryReceiver` is declared exported=false. The manifest registers it for `android.intent.action.BOOT_COMPLETED` and `android.intent.action.MY_PACKAGE_REPLACED`; the implementation also handles its internal `CHECK_MCP` and `START_MCP_RECOVERY` actions.

On each receiver invocation, it requests the fixed Termux recovery job and schedules an inexact elapsed-realtime wakeup check. The first trigger is based on `SystemClock.elapsedRealtime()` plus two minutes; `AlarmManager.setInexactRepeating()` then uses `AlarmManager.ELAPSED_REALTIME_WAKEUP` and `AlarmManager.INTERVAL_FIFTEEN_MINUTES`. The receiver starts `com.termux.app.RunCommandService` with the `com.termux.RUN_COMMAND` action and a fixed path to:

~~~text
/data/data/com.termux/files/usr/bin/wadb-mcp-job
~~~

It marks that job as a background command and sets the Termux home directory as its working directory. The receiver does not accept an arbitrary shell command from an external caller. Its non-exported manifest declaration is an important part of that boundary.

`PermissionActivity` only requests the supported `com.termux.permission.RUN_COMMAND` permission and, on Android 13/API 33 or later, the optional `POST_NOTIFICATIONS` permission when either is missing. It is a permission-request activity, not a caller-controlled command executor.

The Android Bridge alarm and the Termux watchdog are separate mechanisms. The Termux watchdog uses the configured `WATCHDOG_INTERVAL` (15 seconds by default in the current recovery configuration); the Android alarm is the slower fallback. Neither mechanism should be described as a guarantee that Android will keep every background process alive.

#### Secure Local Shell binding and authentication

`native/wadb-local-bridge.c` creates an IPv4 TCP socket and binds it to `INADDR_LOOPBACK`; its default port is 47173. It checks that accepted peers are loopback connections and authenticates each client using the 64-character hexadecimal token supplied to the helper at startup. The helper then executes the accepted command through `/system/bin/sh -c` under the Android shell-user identity (`uid=2000` in the supported setup).

This is a local authenticated command bridge, not an ADB server or a listener exposed on the Wi-Fi interface. The Toolkit stores the token in its private Termux state area. In the normal steady state, classic adbd TCP exposure remains disabled. The initial deployment or repair can still require an authenticated Wireless ADB session.

#### Desktop Commander and Termux:API are external interfaces

Desktop Commander is the external Remote MCP service. Depending on the connected client and Desktop Commander version, its exposed tool interface includes terminal/process operations such as `start_process`, `read_process_output` and `interact_with_process`, plus filesystem/directory operations such as `read_file`, `write_file`, `read_multiple_files` and `list_directory`. These are Desktop Commander tool names, not AI Termux WADB Toolkit CLI commands. The Toolkit supplies its own Android-specific command suite and operating instructions; it does not implement Desktop Commander's general-purpose MCP tools.

Termux:API is optional and has two separate pieces: the Termux `termux-api` command package and its compatible Android companion app. The current Toolkit uses commands such as `termux-wifi-connectioninfo` for Wi-Fi connection details and `termux-notification` for optional Termux-side notifications. WADB Bridge has a separate Android notification channel for its recovery events. Missing Termux:API notifications do not disable the core Toolkit workflow.

### 1. The whole system at a glance

The toolkit connects an AI assistant to a real Termux environment on an Android device. The AI client, Remote MCP service, Termux environment, Android Debug Bridge and WADB Bridge are separate components. They work together, but none of them is a substitute for the others.

```text
Person
  |
  | describes a task in ordinary language
  v
Compatible AI assistant / AI client
  |
  | Remote MCP connection (tool calls)
  v
Desktop Commander Remote MCP service
  |  runs on the Android device
  v
Termux shell and installed command-line tools
  |
  +---- AI Termux WADB Toolkit
  |       |
  |       +---- ai-info Control Center and diagnostics
  |       +---- Wireless ADB connection manager
  |       +---- Secure Local Shell manager
  |       +---- MCP lifecycle and recovery helpers
  |       +---- notifications and integrity checks
  |
  +---- normal Termux programs, scripts, compilers and utilities
  |
  +---- files and folders Termux is permitted to access

Separate Android shell routes:
  Termux ADB client <---- authenticated Wireless ADB ----> Android adbd
  Termux local client <---- authenticated loopback ----> Secure Local Shell helper
                                                               |
                                                               v
                                                    Android shell user (uid 2000)

WADB Bridge is a small Android companion used for the supported Wireless
Debugging setting and Android-side recovery integration. It is not the AI
client, the MCP server, or a general-purpose remote-control application.
```

### 2. What MCP does—and what it does not do

MCP is the connection layer between an AI client and tools that the client is allowed to call. In this project, Desktop Commander provides the remote tool interface and runs on the Android/Termux side.

Once the owner has connected a compatible AI client and completed its authorization, the assistant can ask the connected tool service to run commands, inspect results and work with accessible files. The assistant can therefore do more than explain which command a person should type: it can execute the command through the connected environment and inspect the returned result.

The Toolkit does not contain an AI model, ChatGPT, another AI app, or the Desktop Commander service. Desktop Commander is installed separately. Uploading a ZIP, README or AI-instructions file into a chat does not establish MCP access. The actual connection and authorization are required.

The Toolkit does not limit the assistant to commands whose names start with `wadb-`. The assistant can invoke other commands, scripts and programs installed in Termux, provided the connected tool exposes command execution and the process has the required permissions. The owner can open Termux and run the same commands manually at any time.

MCP access is not the same as Android system access. A command executed by the Termux process has Termux's Android app identity and permissions unless it deliberately uses a separately authorized route.

### 3. The Termux execution environment

Termux is an Android terminal application and Linux-like user environment. Its package manager installs command-line tools into Termux's private application environment. The Toolkit adds its own commands, shared helpers, Android companion package and documentation to that environment.

Normal commands run as the Termux application user. This is not Android's root user. A command can only do what the installed program, the Termux UID and Android permissions allow.

On a rooted device, the owner may authorize an installed `su` mechanism for a command that genuinely needs elevated privileges. The Toolkit does not silently grant root or convert every command into root execution. A root manager may show an approval prompt and can deny the request. Wireless ADB and Secure Local Shell remain their own Android shell-user routes; they do not automatically become root because the device is rooted.

This makes the Toolkit usable on both rooted and non-rooted devices without presenting root as a requirement.

### 4. Phone storage and file work

A connected AI assistant can work with files through the Termux environment instead of requiring every file to be selected and uploaded through the chat application's attachment picker.

The practical workflow is:

1. The owner grants Termux the relevant Android storage access.
2. Termux exposes the shared folders that Android allows it to access.
3. The AI uses the connected Termux tools to list, inspect, search, transform or build from accessible files.
4. The assistant can save output into an accessible folder on the phone.
5. The owner can open the result using the normal Android apps or continue working in Termux.

This is useful for source trees, text, logs, archives, APKs, documents, images and other formats for which the necessary command-line tools or parsers are installed. For example, an assistant can inspect a repository, run tests, compare files, invoke a build tool, inspect an APK with an installed utility, or create a report beside the project.

**Android's storage model still applies.** Termux does not automatically see every other app's private data, protected system directories or every file on every volume. Android uses app-specific storage, shared storage and scoped-access rules. The owner must grant access to shared storage where needed, and some folders remain private to their owning applications. Root can change some boundaries, but the Toolkit does not bypass them.

Termux's storage setup creates convenient paths to user-accessible shared folders after the owner grants permission. The Android Storage Access Framework and system permission flows remain the authority for locations that require user selection or special access.

#### About chat upload limits

Using the phone as the working file store can avoid the need to upload every source file or archive as a chat attachment. This can be especially useful where an AI service has a limited attachment allowance.

It does **not** promise unlimited AI use or remove provider limits. Tool availability, account plan, model context, tool-call quotas, rate limits and safety rules still belong to the AI provider. When file contents are sent back to the model through MCP, the provider's normal context and usage limits still apply. Large files can often be inspected or processed locally with Termux tools so that only relevant results need to be returned.

The Toolkit does not grant Google Drive access or change an AI provider's subscription. Its file workflow uses the Android device's own Termux-accessible storage.

### 5. Wireless ADB: Android's authenticated debugging route

Android Debug Bridge (ADB) is an Android platform-tools interface for communicating with the device's `adbd` daemon. ADB can provide a shell and supported device-management operations after the owner enables debugging and authorizes the client.

On supported Android versions, Wireless Debugging has a pairing step and a later connection step. Pairing establishes trust between the ADB client and the device. Once paired, the saved ADB key can normally be reused until the owner revokes or forgets that authorization.

The Toolkit makes this less fragile by:

- discovering the typed Android ADB pairing and connection services instead of guessing which discovered network endpoint has which role;
- attempting an existing trusted ADB key before asking the owner to pair again;
- asking for a current pairing code only when the Android connection reports that pairing is genuinely required;
- preventing an accidental second connection attempt from replacing a pairing session while the owner is holding the current code;
- rediscovering the normal connection endpoint after pairing, because the connection details can change;
- checking the connected device's reported identity properties to reduce the chance of sending commands to the wrong endpoint.

This is ordinary Android Wireless Debugging, not an exploit or permission bypass. The owner must enable Developer Options/Wireless Debugging, keep the device and client on a suitable network for pairing/connection, and approve the pairing flow.

An authenticated ADB shell normally runs as Android's `shell` user (UID 2000), not root. It can perform the operations Android permits to that shell identity; it does not automatically gain access to every private app directory.

The Toolkit keeps several actions separate:
- disconnecting the current ADB network transport does not necessarily turn Wireless Debugging off;
- turning Wireless Debugging off is a separate Android setting action;
- stopping the MCP process is separate again;
- stopping Secure Local Shell is also a separate action.

That separation prevents one connection toggle from unexpectedly shutting down unrelated services.

### 6. WADB Bridge: the Android companion

WADB Bridge is a small Android package included with the Toolkit. It supports the Toolkit's Wireless Debugging setting workflow and Android-side recovery integration.

For Wireless Debugging control, the companion interacts with Android's protected global setting used by the Wireless Debugging control. It reports the resulting value so the Toolkit can verify the state rather than merely assuming that a requested change succeeded.

Android protects secure/global settings. The required permission is not an ordinary public app permission that any application can grant itself. The supported setup uses an already authorized ADB shell and the documented Android permission flow. The owner must approve the setup; the Toolkit does not silently grant itself protected privileges.

The companion also contains the supported Termux command-integration permission and notification capability used for the recovery handoff. Its recovery component can request that Termux run the Toolkit's recovery job after Android broadcasts the relevant system/package events and on its scheduled checks. Actual background execution remains subject to Android and device-manufacturer scheduling rules.

WADB Bridge is deliberately narrow:
- it is not a chat client or AI model;
- it is not a general-purpose screen-control app;
- it does not make the phone rooted;
- it does not replace ADB or Desktop Commander;
- it does not grant the assistant unrestricted access to Android's private app data.

### 7. Secure Local Shell: a second Android shell route

Wireless ADB is useful for first setup and for ADB-specific actions. Secure Local Shell is a separate route for Android shell commands after it has been initialized.

The owner first establishes an authorized ADB shell. The setup uses that authorized shell to prepare and launch the Toolkit's Android-side helper. The helper runs under Android's shell identity, not as root. Termux then connects to the helper over an authenticated local-only channel.

The important architectural difference is that the steady-state connection is local to the phone. It is not a second ADB network listener and it does not require the normal Wireless Debugging transport to stay active after setup. The design keeps classic ADB-over-network TCP disabled and binds the helper to loopback rather than exposing it on the phone's Wi-Fi network.

This can be useful when the AI still needs supported Android shell commands but the owner has turned Wireless Debugging off. It does not provide all ADB features, nor does it grant more privilege than Android's shell identity.

The local helper is not a guaranteed persistent Android system service. Android process lifecycle rules, force-stop, reboot, OEM background restrictions or an explicit stop can require the owner to initialize it again.

### 8. MCP process management

The Toolkit manages the external Desktop Commander process without claiming ownership of the Desktop Commander package or its saved authorization.

The management layer separates:
- **desired state** — whether the owner wants MCP online or offline;
- **actual state** — whether the process is observed running;
- **recovery state** — whether automatic recovery is enabled.

Normal start, stop and restart operations preserve the saved Desktop Commander authorization. Logout is a separate destructive action. The status and log commands help the owner or AI diagnose a missing process, duplicate process or startup failure.

The toolkit uninstaller removes Toolkit-owned commands and state. It is designed to preserve the external Desktop Commander service/login and the Termux ADB client keys.

### 9. Recovery options

Recovery is optional and must be enabled by the owner.

#### Local Termux watchdog

The local watchdog checks the desired and actual MCP state. If recovery is enabled and the desired state is online, it can attempt to restore the configured Desktop Commander process when it is missing. If the owner deliberately sets the desired state offline, the watchdog does not simply turn MCP back on.

#### Android-side Bridge trigger

WADB Bridge has a recovery receiver that responds to supported Android system/package events and schedules a slower periodic check. It hands a narrowly defined recovery job back to Termux using the Termux command-integration permission.

Android may delay or stop background work. Manufacturer battery management and Android lifecycle policies vary. The Toolkit therefore does not promise that every recovery event will execute on every device.

#### Optional GitHub control fallback

GitHub recovery is an independent control path. The AI-side writer places a validated command in a control file; the phone-side watcher reads and validates it. The two sides may use different GitHub credentials. The phone reader can be configured for a public control file or an authenticated read path.

The control channel supports a small set of validated actions such as start, stop, restart and status. A first-time identity/generation baseline is required so an old control value is not accidentally replayed as a new instruction. This is not a general remote shell or a mechanism for sending arbitrary commands through GitHub.

### 10. Notifications and diagnostics

Notifications are local Android notifications, not a cloud push service. Termux-side notifications require both the Termux:API command package and its compatible Android companion app. WADB Bridge has its own recovery notification channel. Denying notification permission suppresses the notification; it does not itself disable the underlying workflow.

The Toolkit provides:
- a human-readable `ai-info` Control Center;
- a structured JSON state view for AI clients and scripts;
- read-only diagnostics for the current Termux, MCP, ADB, Bridge, shell and recovery state;
- capability checks that show which optional tools and permissions are present;
- a command reference and troubleshooting documentation.

The purpose is to let the AI inspect the current state before acting and verify the resulting state afterward.

### 11. Release integrity and security boundaries

The release uses a signed package manifest and a separate signed installed-file inventory. The installer verifies package authenticity using a public-key fingerprint obtained independently from the archive. The installed-file check compares covered files and permission modes. The installer also preflights managed paths, takes rollback snapshots before replacing managed files and restores the previous state after ordinary caught failures before the install transaction commits.

These controls make release substitution and accidental modification easier to detect. They are not a security boundary against the device owner. A person or process controlling the Termux app UID can modify local scripts, replace the verifier or execute a modified copy. The Toolkit is not independently security-certified and does not claim to make Android or Termux immutable.

### 12. What this architecture does not promise

- It does not provide root on a non-rooted phone.
- It does not bypass Android permissions, app sandboxing or storage access rules.
- It does not grant access to every other app's private files.
- It does not bundle an AI model or give every AI account Remote MCP features.
- It does not remove the AI provider's plan, context, rate or tool-call limits.
- It does not turn GitHub recovery into a general-purpose arbitrary command channel.
- It does not guarantee that Android will keep background processes alive indefinitely.
- It does not claim that local integrity checks make user-controlled software unmodifiable.

### Platform references

- [Android Debug Bridge and Wireless Debugging](https://developer.android.com/tools/adb)
- [Android data and file storage overview](https://developer.android.com/training/data-storage)
- [Android scoped storage model](https://source.android.com/docs/core/storage/scoped)
- [Android permission reference](https://developer.android.com/reference/android/Manifest.permission)
- [Termux application and package environment](https://github.com/termux/termux-app)
- [Termux RUN_COMMAND permission and integration](https://github.com/termux/termux-app/wiki/RUN_COMMAND-Intent)
- [Termux shared-storage setup](https://github.com/termux/termux-tools/blob/master/doc/termux.1.md.in)


### Android app-signing and fork considerations

The official WADB Bridge APK is signed by the project's Android release certificate. Android Package Manager uses signing identity when deciding whether an APK can update an already-installed package. A fork can modify and rebuild the Bridge source, but a fork signed with a different key cannot transparently replace the official installed package as an ordinary update. A fork maintainer should plan a deliberate package-ID/signing-key migration and clearly explain the user impact. The project's private signing material is not part of the source release and must never be shared.

## Features, benefits and practical workflows

AI Termux WADB Toolkit is intended to make an Android phone a usable command-line workspace for a compatible AI assistant—not just to expose a few pre-written ADB shortcuts.

### Benefits at a glance

| User benefit | How the Toolkit supports it |
|---|---|
| Ask the AI to do the command-line work | The connected assistant can run commands available in the authorized Termux environment, not only Toolkit commands. |
| Stop copying commands and terminal output back and forth | MCP lets the assistant execute a command and inspect the returned result in the same workflow. |
| Use the phone as a working file store | Termux can access files within Android's granted storage boundaries; the assistant can inspect and save files through the connected tools. |
| Avoid attaching every file to a chat | Files can be read or processed through Termux tools rather than selected as chat attachments. Provider context and tool limits still apply. |
| Work with projects on the phone | The assistant can inspect source trees, run installed compilers/build tools, execute tests and save a working copy. |
| Use both normal shell tools and Android shell tools | Termux commands, Wireless ADB and Secure Local Shell are distinct routes with different permissions. |
| Keep the owner's manual workflow | Every Toolkit action remains available to the owner through the Termux terminal and Control Center. |
| Understand failures more quickly | Structured status, diagnostics, command references and logs show which component is unavailable. |
| Recover a missing MCP process | Optional local and GitHub recovery paths can restore a process when configured and permitted. |
| Keep connection trust separate from process lifecycle | Normal MCP restart does not intentionally erase saved authorization; Wireless Debugging and MCP stop are separate actions. |

### Examples of work an AI can perform

The examples below describe task categories, not a guarantee that every program is preinstalled. The required command-line package, parser, build tool or Android permission must be available.

#### Development and code work

- Inspect a project directory and explain its structure.
- Search source files for a symbol or configuration.
- Compare two versions of a file or project.
- Create a separate working copy before editing.
- Run scripts, tests, linters and compilers that are installed.
- Build an Android project when the required JDK, Gradle and Android SDK components are present.
- Read build output, diagnose errors and retry after a fix.
- Save changed files, reports or build artifacts directly to accessible phone storage.

#### APK and Android project investigation

- Inspect an APK's metadata and file structure with installed tools.
- Compare two APKs and report differences.
- Read Android manifests and project configuration.
- Inspect logs and command output.
- Run authorized ADB queries and supported package/device operations.
- Build or package a project where the full toolchain and permissions are available.

The Toolkit itself does not include every reverse-engineering or development utility. Those tools must be installed separately and used lawfully.

#### Documents and archives

- List and organize accessible folders.
- Search text and log files.
- Extract and create supported archives.
- Convert or process formats when the appropriate Termux utility is installed.
- Generate reports next to the input project.
- Batch-process files locally when returning every byte to the AI model would be inefficient.

#### Android maintenance and diagnostics

- Check whether Wireless Debugging is enabled and whether ADB is paired/connected.
- Inspect the active ADB transport and verify the target device identity.
- Check whether WADB Bridge is installed and ready.
- Inspect Termux and MCP state.
- Run supported Android shell commands using the authenticated ADB or Secure Local Shell route.
- Check MCP process state and logs.
- Enable or disable optional recovery after the owner requests it.

### Why local file access is useful for AI free accounts

Some AI services limit how many files a user can attach to a conversation or which file types can be uploaded. A Termux-connected assistant can often work with the phone's accessible files directly through MCP instead of using the chat application's attachment upload path.

That can avoid the attachment step for many workflows. It is **not** a way to obtain unlimited AI service. The provider still controls whether the account can connect to Remote MCP, how many tool calls are allowed, how much content can fit into the model context, and the account's rate/usage limits. A compatible feature must be available in the AI client and on the user's account.

For large files, the assistant can ask Termux to search, filter, inspect metadata, calculate hashes, run local parsers or summarize output before sending only the relevant information to the model. The file remains on the phone unless a particular tool or workflow explicitly transfers its contents elsewhere.

### How to choose the right route

| Need | Route | What it means |
|---|---|---|
| Run Python, Git, shell scripts, package tools or project builds | Normal Termux execution through MCP | Uses the Termux app identity and installed packages. |
| Connect to the Android ADB service or perform ADB-specific actions | Wireless ADB | Uses Android's authenticated debugging transport. |
| Run supported Android shell commands after Wireless ADB is turned off | Secure Local Shell | Uses a separate local authenticated connection initialized from an authorized ADB shell. |
| Toggle the supported Wireless Debugging setting and verify the result | WADB Bridge | Uses the companion's permission-gated Android setting control. |
| Restart or inspect the AI connection service | MCP manager | Manages Desktop Commander process state without confusing it with ADB state. |
| Restore an unexpectedly missing MCP process | Optional recovery | Uses the owner's configured desired state and recovery policy. |

### A realistic end-to-end workflow

1. The owner installs Termux and the Toolkit, then starts the external Desktop Commander Remote MCP service.
2. The owner connects an AI client that supports the required Remote MCP integration and completes its authorization.
3. The assistant reads the Toolkit's AI instructions and structured state instead of assuming the phone is already configured.
4. The assistant uses the normal Termux command environment for ordinary shell and file work.
5. When an Android shell action is needed, the assistant checks whether Wireless ADB or Secure Local Shell is the appropriate authorized route.
6. The assistant performs the requested action, checks the result and reports what actually changed.
7. The owner can review the files and continue manually in Termux or normal Android apps.

The owner remains in control of initial permissions, pairing codes, root approvals, destructive operations and any Android confirmation that the operating system requires.

### Root and permissions

The Toolkit works without root. On rooted devices, commands may use the device's installed `su` mechanism when the owner explicitly authorizes it. Normal Termux execution, Wireless ADB and Secure Local Shell must not be described as one universal privilege level.

- Normal Termux commands run with the Termux app's permissions.
- ADB shell commands normally run as Android's `shell` user.
- Secure Local Shell uses the Android shell-user identity.
- Root commands require an already-rooted device, an installed root manager/`su` path and explicit owner approval.
- Shared-storage access requires the relevant Android permission and Termux storage setup.
- App-private folders and protected Android data are not opened merely because MCP is connected.

### Manual operation

The AI is optional. A person can use the `ai-info` dashboard, guided Control Center and documented commands directly in Termux. The AI connection adds a natural-language operator; it does not replace the normal terminal.

### Related documentation

- [Android and Toolkit Architecture](TECHNICAL_REFERENCE.md)
- [Start Here](USER_GUIDE.md)
- [User Setup](USER_GUIDE.md)
- [Remote MCP and AI Connection](USER_GUIDE.md)
- [Command Reference](COMMAND_REFERENCE.md)
- [Integrity Verification](TECHNICAL_REFERENCE.md)

## Security, recovery, rollback and maintenance notes

This file documents the security boundaries, recovery behavior, and rollback procedures of the toolkit.

### Trust boundaries

Desktop Commander Remote MCP is the component that gives the connected AI command/file access inside the Termux app's normal Android UID. The WADB toolkit does not turn that access into root.

Wireless ADB is a separate layer. When connected, Android's ADB shell normally runs as uid=2000(shell), still not root.

WADB Bridge is deliberately narrow:
- WirelessDebugReceiver only reads/writes Android's adb_wifi_enabled global setting.
- McpRecoveryReceiver launches one fixed Termux recovery job path.
- The Bridge APK declares no INTERNET permission.


### Secure localhost shell bridge

The maintained v1.0.2 local-control mode does not expose Android `adbd` on classic TCP port 5555. In the verified secure state:

```text
adb_enabled=1
adbd=running
service.adb.tcp.port=0
127.0.0.1:47173 = toolkit secure shell bridge
```

The native bridge is launched by an authenticated ADB shell and therefore runs as Android `uid=2000(shell)`, not root. It binds explicitly to IPv4 loopback (`127.0.0.1`) and rejects a peer that is not loopback. Every request also requires a random 256-bit token. The Termux copy is stored at `~/.ai-wadb/local-bridge.token` with mode 600; the temporary Android-side token file is read and unlinked when the bridge starts.

The bridge is deliberately not an ADB wire-protocol listener. Use:

```bash
wadb-local-shell -c 'COMMAND'
```

instead of `adb -s 127.0.0.1:5555 shell`.

The bridge is designed to accept authenticated connections only through the phone's loopback interface. It is not an ADB listener exposed to the local network. It runs with Android shell-user permissions; this transport design is not a claim of root access or independent security certification.

Android may stop the helper as part of its service lifecycle or process management. When the helper is no longer available, use wadb-local-on to establish it again. The setup uses the existing authorized Android shell connection and the documented temporary Wireless ADB bootstrap when required.

Stopping the bridge with `wadb-local-off --confirm` does not set `adb_enabled=0` and does not re-enable classic adbd TCP.

### Recovery and permission boundaries

#### Recovery receiver
McpRecoveryReceiver is now non-exported. External apps can no longer directly invoke the recovery receiver. Android system boot/package-replaced broadcasts and the app's own explicit PendingIntent alarm remain supported.

#### Permission activity
PermissionActivity remains exported intentionally because the recovery setup may need Android to show the one-time com.termux.permission.RUN_COMMAND runtime-permission dialog on devices where ADB shell cannot grant that permission.

The activity:
- requests only com.termux.permission.RUN_COMMAND,
- does not accept a shell command,
- does not execute a command,
- immediately exits after the permission result.

Treat this as a permission-prompt surface, not a general command bridge.

#### allow-external-apps rollback
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

#### Recovery config quoting
Values written to the recovery shell config are now emitted with Bash shell escaping. CLI values can no longer inject additional shell syntax merely by being written into the config file.

GitHub owner/repo/branch/file/target values are also validated before being saved.

#### ADB fallback scan
Typed mDNS remains the preferred path. The untyped fallback scan is now configurable:

```bash
WADB_SCAN_MIN=30000
WADB_SCAN_MAX=65535
wireless-adb-connect
```

The default fallback range is 30000–65535. Results remain explicitly marked UNVERIFIED_CANDIDATE; the toolkit never infers pairing-vs-connect role from a raw port number.

### Desktop Commander version behavior

The documented first-start command remains the upstream-recommended form:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Recovery first prefers the already cached Desktop Commander dist/index.js. Only when the cached executable cannot be found does it fall back to the upstream @0.3.1 npx command.


### Uninstall / rollback

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

### Bridge APK cache and update model

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


#### Runtime integrity and credentials

The toolkit installer verifies its bundle checksum manifest, records the SHA-256 of the bundled WADB Bridge APK, and checks the cached APK against that expected hash before `wadb-bootstrap` calls `adb install -r`. If the expected hash is absent or the cached APK differs, installation fails closed; reinstall the verified toolkit bundle to restore it. This protects against accidental cache replacement/corruption, not an attacker who can modify the toolkit and its expected hash under the same Termux UID.

ADB endpoint selection compares the Android manufacturer/model/device/product/brand/name/build fingerprint/SDK properties against the local phone before treating a network transport as this device. These checks reduce accidental mis-targeting; they are **not cryptographic device attestation**, because an adversarial ADB endpoint can imitate property output.

The GitHub control generation must be a decimal integer of at most 18 digits. If a persisted generation is malformed/oversized, recovery enters a reset-pending state and does not execute a command in that cycle; the next valid matching control is baselined without execution.

The Bridge signing keystore and signing-password files are private build material and are not part of either distribution ZIP. Do not send `WADB_Bridge_Signing_Details_PRIVATE.txt` or the contents of `~/.ai-wadb/signing-jaskran` with a toolkit release. Those files remain readable to code running under the same Termux app UID, even with mode 600; for stronger isolation keep a secure encrypted offline copy and remove the active signing material from routine runtime storage when no longer required for signing.

`WRITE_SECURE_SETTINGS` remains a broad permission in this release. The exported Wireless Debug receiver also uses this permission to gate callers, so simply revoking Termux's grant would break the current control path. Moving to a token-authenticated receiver that removes Termux's broad grant requires an Android Bridge code change, a rebuild, and a separately verified installation; it is not claimed to be completed by the Termux-script fixes.

### Package integrity

MANIFEST.sha256 covers the toolkit files. It detects accidental or unauthorized changes relative to the package manifest, but a checksum manifest by itself is not publisher identity.

### Signed release and installed-file integrity

This release adds an Ed25519 signature over MANIFEST.sha256. The verifier requires an independently published public-key fingerprint, checks the detached signature, checks every hash, rejects symlinks and unsafe paths, and rejects missing or unlisted files. The installer performs this verification before package installation, backup creation, or toolkit file changes.

The installer has no verification-bypass option. It requires independent trust pins for the release key, the installer and the verifier before making any Toolkit changes.

wadb-integrity-check verifies a signed inventory of installed commands, shared helpers, selected documentation, and the cached Bridge APK. It is read-only. The inventory does not directly measure the installed Android Bridge APK, the operating system, third-party tools, mutable user configuration, or running process memory.

The first-time key fingerprint must be obtained independently of the bundle. A fingerprint contained only in the same ZIP is not a trust anchor. The release also includes a CycloneDX SBOM and third-party licence notices. The SBOM describes the dependency information collected for the release; it is not an independent security certification or a GitHub build-provenance attestation.

A user controlling the Termux UID can replace the verifier, alter the local pin, or execute a modified copy. This design authenticates a release when its key pin is independently trusted and detects local file changes; it does not make Termux immutable or make modification impossible.




### v1.0.2 safeguards, known limitations and verification scope

The v1.0.2 implementation includes the following safeguards:

- The installer checks the Termux PREFIX/HOME directory chains and managed destinations before writing, rejecting symlinked or unsafe path components.
- A private lock serialises concurrent installer runs so two upgrades cannot interleave their snapshots and writes.
- The installer captures a rollback snapshot before replacing managed commands, documentation, helper files and release-integrity metadata. Ordinary caught failures before commit restore the prior state; power loss, kernel termination, storage failure or SIGKILL during replacement cannot be guaranteed recoverable.
- The native local bridge uses bounded per-client workers, authentication deadlines, bounded request/response handling and a command timeout. It remains bound to 127.0.0.1 and requires its random token.
- The signed installed-file inventory checks both content and expected POSIX permission modes.
- Every installed-integrity invocation requires an independently supplied release-key fingerprint. The local copy is consistency metadata, not a trust anchor.

Two important limits remain explicit:

- Termux still needs its WRITE_SECURE_SETTINGS grant because the exported Wireless Debug receiver requires that permission from callers. Removing this broad Termux grant requires a token-authenticated receiver redesign, a rebuilt/signed Android companion and live installation/permission regression tests; simply revoking the permission would break the current control path. Android documents WRITE_SECURE_SETTINGS as not for use by ordinary third-party apps.
- The Bridge boot/package-replaced receiver requests the fixed Termux recovery job, but background execution is subject to Android and manufacturer rules. A source review does not prove that every device will execute recovery after every cold boot. Verify this behavior on the target phone before relying on it.

The installer runs pkg update only when required package metadata or missing packages need it; it does not run a blanket pkg upgrade or partially upgrade installed packages. Changing Termux repository mirrors or performing a full package upgrade is a separate owner maintenance task.

## Release authenticity and installed integrity

This document applies to AI Termux WADB Toolkit 1.0.2.

### What is checked

The release uses an Ed25519 detached signature over MANIFEST.sha256. The signed manifest lists SHA-256 digests for the regular package files other than the manifest and its detached signature. The verifier rejects symbolic links, unsafe paths, duplicate entries, missing files and unlisted extra files.

The installer verifies the release signature and complete file inventory before package installation, backup creation or Toolkit file changes. It fails closed if Node.js, the supplied trust pin, the public key, signature or manifest is missing or invalid.

After installation, wadb-integrity-check verifies a separately signed installed-file inventory. The inventory covers installed WADB commands, shared helpers, selected documentation, the cached Bridge APK, the generated Bridge APK hash file and the installed verifier. Each entry includes both SHA-256 content and the expected POSIX permission mode; a chmod-only change is reported.

The installed checker requires an independently obtained release-key fingerprint on every invocation. It does not fall back to the fingerprint stored beside the installed inventory. The local fingerprint file is checked only for consistency with the independently supplied value; it is not treated as a trust anchor.

### First-time trust bootstrap

A signature is useful only when the public key is trusted independently. Do not trust a fingerprint merely because it is printed inside the ZIP being checked.

The official release announcement publishes:
- the release public-key SHA-256 fingerprint;
- the SHA-256 digest of security/verify-release.js;
- the SHA-256 digest of install.sh.

Before running install.sh, manually compare the installer and verifier hashes with the independently published values. Then provide all three trust values to the installer. Use the release notes and README for the current values and installation procedure.

The installer repeats both file-hash checks before it executes the Node verifier, then verifies the detached Ed25519 signature and exact package inventory.

### Installed checks

After installation, provide the independently recorded fingerprint when running wadb-integrity-check, or set WADB_TRUSTED_RELEASE_KEY_SHA256 from an independently controlled source in the current shell.

Expected success includes:

- SIGNATURE=VALID
- FILES_FAILED=0
- INSTALLED_INTEGRITY=VERIFIED

A content or permission mismatch produces INSTALLED_INTEGRITY=TAMPERED and identifies the affected target. Missing or invalid metadata, or omission of the independent pin, is a verification failure—not a clean result.

### Limits and threat model

This design provides authenticated release integrity when the public-key fingerprint is independently trusted, plus local tamper detection for the files in the installed inventory.

The project is licensed under Apache-2.0. Recipients may modify and redistribute their own copies under the licence. A modified copy will not match the official release manifest and will not have an official release signature unless the project owner signs that release. The device owner can also replace local scripts, patch the verifier or alter local trust configuration; local integrity checks are evidence and tamper detection, not a security boundary against a person controlling the Termux account.

The inventory does not attest to the Android OS, Termux package database, other installed apps, external Desktop Commander software, mutable user configuration, the running process memory or every private state file. The Android-installed Bridge app is not measured directly by this Termux inventory; its APK release signing identity and Android package update path are separate checks.

The SBOM and third-party notices describe the dependency information collected for this release. They are not an independent security certification or a GitHub build-provenance attestation.

### Signing-key handling

The release-signing private key is not included in the bundle. It is separate from the existing WADB Bridge APK signing identity. Keep it private and preferably offline in an encrypted backup. Never place it in the public repository, release archive, support report or AI conversation.

Loss or compromise of this private key requires a controlled key-rotation plan and publication of a new trusted fingerprint. Do not silently replace the key.

## Optional GitHub remote MCP recovery

Version: 1.0

GitHub recovery is an **independent control path** for restoring Remote Desktop Commander when Desktop Commander MCP itself is offline.

This document describes the GitHub recovery behavior implemented by this toolkit and the required setup and failure-handling rules.

### 1. Architecture and trust boundary

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

### 2. Requirements that apply to every mode

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

### 3. Control file format

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

#### Generation rule

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

### 4. Safe first-sync baseline

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

### 5. Three phone-side read methods

The AI always writes through its own authorized GitHub connector. These modes only determine how the **phone reads** the control file.

#### Method A — private repo + fine-grained read-only token

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

#### Method B — existing GitHub CLI login (`gh`)

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

#### Method C — public repository, anonymous phone read

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

##### Public-mode freshness rule

The toolkit does **not** trust a raw branch URL directly for recovery control because branch-based raw content can briefly lag after a commit.

Public mode resolves the current branch head anonymously with:

```text
git ls-remote
```

with interactive prompting disabled and the Git credential helper disabled for that lookup. It then fetches the control file by that immutable commit SHA.

This is required both for reliable generation changes and to keep `public` mode independent from any GitHub credential that may exist elsewhere in Termux.

### 6. Auto mode

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

### 7. Configure the GitHub side before the phone side

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

### 8. What each action actually does

#### `START_MCP`

The phone sets desired MCP state to online and starts/reuses Desktop Commander with the configured MCP HOME.

Saved `.desktop-commander-device/device.json` authorization is preserved and reused.

#### `STOP_MCP`

The phone sets desired MCP state to offline and stops the matching Desktop Commander process.

The **WADB recovery watchdog remains running** and continues checking GitHub. This is why a later GitHub `START_MCP` can recover Desktop Commander while MCP itself is offline.

#### `RESTART_MCP`

The phone stops the matching Desktop Commander process, waits briefly, then starts it again and returns desired state to online.

#### `STATUS`

`STATUS` refreshes the phone's local recovery status file.

It does **not** upload a response to GitHub.

The phone-side design is intentionally read-only, so an AI whose only surviving channel is GitHub cannot query live phone status from the `STATUS` action alone. After MCP returns, use:

```bash
wadb-mcp-status
ai-info --recovery
```

### 9. Verify repository read

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

### 10. Verify command processing

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

### 11. Verify offline recovery

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

### 12. Watchdog timing

The default watchdog interval is approximately 15 seconds.

A newly committed GitHub command therefore may take roughly one polling interval before the phone processes it, plus the time Desktop Commander itself needs to reconnect.

The watcher reloads its recovery configuration on every loop, so safe toolkit/config updates do not require a reboot.

### 13. Failure interpretation

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

### 14. Security rules

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

### 15. Disable GitHub polling

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

### 16. Verification commands

```bash
wadb-mcp-github-test
wadb-mcp-status
ai-info --recovery
```

For a full recovery proof, also inspect:

```bash
tail ~/.ai-wadb/mcp-recovery/events.log
```

## WADB Bridge implementation and build notes

Package: `com.jaskran.wadbbridge`

The Bridge remains the privileged writer for `adb_wifi_enabled`. Its `WirelessDebugReceiver` is exported but protected by `android.permission.WRITE_SECURE_SETTINGS`. `McpRecoveryReceiver` remains non-exported and invokes only the fixed Termux recovery job.

Version:
- versionCode 6
- versionName 1.5
- minSdk 30
- targetSdk 36

## Recovery notifications
The Bridge now owns a local Android notification channel named **WADB Recovery**. It posts only transition/check notifications for boot, package replacement, or an explicit recovery request. The recurring fifteen-minute Android alarm remains silent. Actual watchdog/MCP success notifications are posted by the Termux recovery scripts only after the corresponding state transition occurs.

On Android 13+, `PermissionActivity` requests `POST_NOTIFICATIONS` together with the existing Termux `RUN_COMMAND` permission when either permission is missing. Notification permission is optional for recovery itself: denial suppresses notifications but does not disable recovery.

## Recovery-state separation
Termux now stores recovery enablement separately from the desired Desktop Commander state. An intentionally stopped MCP can remain offline while the watchdog stays recoverable and continues to accept a future GitHub `START_MCP`.

## Security and continuity
- The Bridge `WRITE_SECURE_SETTINGS` grant is still required.
- Termux still requires `WRITE_SECURE_SETTINGS` because it invokes the protected Bridge receiver.
- No Termux SettingsProvider fallback is used.
- Setup is ready only after the Bridge performs a verified no-op write.
- ON/OFF helpers keep retry/readback verification.
- The release signing identity remains the existing Jaskran Singh release certificate.

## Rebuild
A Gradle wrapper is not bundled. `build-termux.sh` discovers the Android SDK from `ANDROID_HOME` / `ANDROID_SDK_ROOT` (default `~/android-sdk`) and passes the local Termux `aapt2` override explicitly. `local.properties` is temporary and is not shipped.
