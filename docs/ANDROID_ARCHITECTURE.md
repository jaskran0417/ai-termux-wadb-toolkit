# Android and Toolkit Architecture

This document explains the working model at the component and Android-platform level. It is intentionally an architectural overview, not a copy of the implementation source.

## 1. The whole system at a glance

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

## 2. What MCP does—and what it does not do

MCP is the connection layer between an AI client and tools that the client is allowed to call. In this project, Desktop Commander provides the remote tool interface and runs on the Android/Termux side.

Once the owner has connected a compatible AI client and completed its authorization, the assistant can ask the connected tool service to run commands, inspect results and work with accessible files. The assistant can therefore do more than explain which command a person should type: it can execute the command through the connected environment and inspect the returned result.

The Toolkit does not contain an AI model, ChatGPT, another AI app, or the Desktop Commander service. Desktop Commander is installed separately. Uploading a ZIP, README or AI-instructions file into a chat does not establish MCP access. The actual connection and authorization are required.

The Toolkit does not limit the assistant to commands whose names start with `wadb-`. The assistant can invoke other commands, scripts and programs installed in Termux, provided the connected tool exposes command execution and the process has the required permissions. The owner can open Termux and run the same commands manually at any time.

MCP access is not the same as Android system access. A command executed by the Termux process has Termux's Android app identity and permissions unless it deliberately uses a separately authorized route.

## 3. The Termux execution environment

Termux is an Android terminal application and Linux-like user environment. Its package manager installs command-line tools into Termux's private application environment. The Toolkit adds its own commands, shared helpers, Android companion package and documentation to that environment.

Normal commands run as the Termux application user. This is not Android's root user. A command can only do what the installed program, the Termux UID and Android permissions allow.

On a rooted device, the owner may authorize an installed `su` mechanism for a command that genuinely needs elevated privileges. The Toolkit does not silently grant root or convert every command into root execution. A root manager may show an approval prompt and can deny the request. Wireless ADB and Secure Local Shell remain their own Android shell-user routes; they do not automatically become root because the device is rooted.

This makes the Toolkit usable on both rooted and non-rooted devices without presenting root as a requirement.

## 4. Phone storage and file work

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

### About chat upload limits

Using the phone as the working file store can avoid the need to upload every source file or archive as a chat attachment. This can be especially useful where an AI service has a limited attachment allowance.

It does **not** promise unlimited AI use or remove provider limits. Tool availability, account plan, model context, tool-call quotas, rate limits and safety rules still belong to the AI provider. When file contents are sent back to the model through MCP, the provider's normal context and usage limits still apply. Large files can often be inspected or processed locally with Termux tools so that only relevant results need to be returned.

The Toolkit does not grant Google Drive access or change an AI provider's subscription. Its file workflow uses the Android device's own Termux-accessible storage.

## 5. Wireless ADB: Android's authenticated debugging route

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

## 6. WADB Bridge: the Android companion

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

## 7. Secure Local Shell: a second Android shell route

Wireless ADB is useful for first setup and for ADB-specific actions. Secure Local Shell is a separate route for Android shell commands after it has been initialized.

The owner first establishes an authorized ADB shell. The setup uses that authorized shell to prepare and launch the Toolkit's Android-side helper. The helper runs under Android's shell identity, not as root. Termux then connects to the helper over an authenticated local-only channel.

The important architectural difference is that the steady-state connection is local to the phone. It is not a second ADB network listener and it does not require the normal Wireless Debugging transport to stay active after setup. The design keeps classic ADB-over-network TCP disabled and binds the helper to loopback rather than exposing it on the phone's Wi-Fi network.

This can be useful when the AI still needs supported Android shell commands but the owner has turned Wireless Debugging off. It does not provide all ADB features, nor does it grant more privilege than Android's shell identity.

The local helper is not a guaranteed persistent Android system service. Android process lifecycle rules, force-stop, reboot, OEM background restrictions or an explicit stop can require the owner to initialize it again.

## 8. MCP process management

The Toolkit manages the external Desktop Commander process without claiming ownership of the Desktop Commander package or its saved authorization.

The management layer separates:
- **desired state** — whether the owner wants MCP online or offline;
- **actual state** — whether the process is observed running;
- **recovery state** — whether automatic recovery is enabled.

Normal start, stop and restart operations preserve the saved Desktop Commander authorization. Logout is a separate destructive action. The status and log commands help the owner or AI diagnose a missing process, duplicate process or startup failure.

The toolkit uninstaller removes Toolkit-owned commands and state. It is designed to preserve the external Desktop Commander service/login and the Termux ADB client keys.

## 9. Recovery options

Recovery is optional and must be enabled by the owner.

### Local Termux watchdog

The local watchdog checks the desired and actual MCP state. If recovery is enabled and the desired state is online, it can attempt to restore the configured Desktop Commander process when it is missing. If the owner deliberately sets the desired state offline, the watchdog does not simply turn MCP back on.

### Android-side Bridge trigger

WADB Bridge has a recovery receiver that responds to supported Android system/package events and schedules a slower periodic check. It hands a narrowly defined recovery job back to Termux using the Termux command-integration permission.

Android may delay or stop background work. Manufacturer battery management and Android lifecycle policies vary. The Toolkit therefore does not promise that every recovery event will execute on every device.

### Optional GitHub control fallback

GitHub recovery is an independent control path. The AI-side writer places a validated command in a control file; the phone-side watcher reads and validates it. The two sides may use different GitHub credentials. The phone reader can be configured for a public control file or an authenticated read path.

The control channel supports a small set of validated actions such as start, stop, restart and status. A first-time identity/generation baseline is required so an old control value is not accidentally replayed as a new instruction. This is not a general remote shell or a mechanism for sending arbitrary commands through GitHub.

## 10. Notifications and diagnostics

Notifications are local Android notifications, not a cloud push service. Termux-side notifications require both the Termux:API command package and its compatible Android companion app. WADB Bridge has its own recovery notification channel. Denying notification permission suppresses the notification; it does not itself disable the underlying workflow.

The Toolkit provides:
- a human-readable `ai-info` Control Center;
- a structured JSON state view for AI clients and scripts;
- read-only diagnostics for the current Termux, MCP, ADB, Bridge, shell and recovery state;
- capability checks that show which optional tools and permissions are present;
- a command reference and troubleshooting documentation.

The purpose is to let the AI inspect the current state before acting and verify the resulting state afterward.

## 11. Release integrity and security boundaries

The HARDENED release uses a signed package manifest and a separate signed installed-file inventory. The installer verifies package authenticity using a public-key fingerprint obtained independently from the archive. The installed-file check compares covered files and permission modes. The installer also preflights managed paths, takes rollback snapshots before replacing managed files and restores the previous state after ordinary caught failures before the install transaction commits.

These controls make release substitution and accidental modification easier to detect. They are not a security boundary against the device owner. A person or process controlling the Termux app UID can modify local scripts, replace the verifier or execute a modified copy. The Toolkit is not independently security-certified and does not claim to make Android or Termux immutable.

## 12. What this architecture does not promise

- It does not provide root on a non-rooted phone.
- It does not bypass Android permissions, app sandboxing or storage access rules.
- It does not grant access to every other app's private files.
- It does not bundle an AI model or give every AI account Remote MCP features.
- It does not remove the AI provider's plan, context, rate or tool-call limits.
- It does not turn GitHub recovery into a general-purpose arbitrary command channel.
- It does not guarantee that Android will keep background processes alive indefinitely.
- It does not claim that local integrity checks make user-controlled software unmodifiable.

## Platform references

- [Android Debug Bridge and Wireless Debugging](https://developer.android.com/tools/adb)
- [Android data and file storage overview](https://developer.android.com/training/data-storage)
- [Android scoped storage model](https://source.android.com/docs/core/storage/scoped)
- [Android permission reference](https://developer.android.com/reference/android/Manifest.permission)
- [Termux application and package environment](https://github.com/termux/termux-app)
- [Termux RUN_COMMAND permission and integration](https://github.com/termux/termux-app/wiki/RUN_COMMAND-Intent)
- [Termux shared-storage setup](https://github.com/termux/termux-tools/blob/master/doc/termux.1.md.in)


## Android app-signing and fork considerations

The official WADB Bridge APK is signed by the project's Android release certificate. Android Package Manager uses signing identity when deciding whether an APK can update an already-installed package. A fork can modify and rebuild the Bridge source, but a fork signed with a different key cannot transparently replace the official installed package as an ordinary update. A fork maintainer should plan a deliberate package-ID/signing-key migration and clearly explain the user impact. The project's private signing material is not part of the source release and must never be shared.
