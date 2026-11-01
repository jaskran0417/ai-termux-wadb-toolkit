# AI Termux WADB Toolkit v1.7.5 — Read First

For a person, start with:

- [Start Here](docs/START_HERE.md)
- [Android and Toolkit Architecture](docs/ANDROID_ARCHITECTURE.md)
- [Features and Practical Workflows](docs/FEATURES_AND_BENEFITS.md)
- [Full Command Reference](docs/COMMAND_REFERENCE.md)

For an AI assistant, start with:

- [AI instructions](docs/READ_THIS_FIRST_AI.md)
- [AI rules](docs/AI_RULES.md)
- [AI prompts](docs/PROMPTS_FOR_AI.md)

The AI must read the included instructions before giving Toolkit setup commands or performing Toolkit changes.

> **HARDENED RELEASE — v1.7.5.** This build includes signed release and installed-file integrity checks, installer path preflight, rollback snapshots for ordinary failures, concurrent-installer locking, bounded authenticated local-bridge workers, permission-mode checks and independently supplied trust pins. HARDENED describes these release protections; it does not mean tamper-proof or independently security-certified. The Toolkit does not require root. On rooted phones, Termux may use an owner-authorized su mechanism for commands that need it. Wireless ADB and Secure Local Shell retain Android shell-user permissions.

## Why version 1.7.5 HARDENED?

1.7.5 is the existing Toolkit software version carried by its code and release metadata before its first public release. The public release keeps that real version instead of renumbering the same code as 1.0.

HARDENED describes the installer and release-integrity protections added for this distribution. It is a release designation, not a claim that a user-controlled Termux environment cannot be modified.

## Setup order

1. Install Termux and the Toolkit.
2. Set up Desktop Commander Remote MCP and connect a compatible AI client.
3. Configure Wireless ADB / WADB Bridge if Android ADB operations are needed.
4. Set up Secure Local Shell if the separate local Android-shell route is desired.
5. Enable optional local MCP recovery or GitHub recovery only when wanted.
6. Use the AI or operate the commands manually.

Desktop Commander is the external connection dependency for AI-controlled setup. Before MCP is connected, an AI can only guide manual bootstrap. After MCP is connected, the AI should execute supported Termux work itself and ask the owner only for actions that genuinely require human approval.

## Main interface

The `ai-info` Control Center provides the human dashboard and guided menu.

The machine-readable state view is `ai-info --json`.

The read-only diagnostic view is `ai-info --doctor`.

## Important distinctions

- MCP and ADB are separate.
- Desktop Commander itself is not owned by this Toolkit; uninstall preserves its package/process and saved login.
- The Termux ADB client key is separate state and is preserved by Toolkit uninstall.
- MCP can remain online while Wireless Debugging is off.
- Existing ADB trust is attempted before asking for first-time pairing.
- A pairing code is temporary and must be used for the current pairing session only.
- MCP stop/start/restart preserve its saved authorization; logout is a separate destructive operation.
- Secure Local Shell is separate from ADB and uses Android shell-user permissions.
- GitHub recovery is optional and has a narrow set of validated controls, not arbitrary command execution.
- Root is not required; optional su access on rooted devices requires owner authorization.
- Android storage access still depends on the permissions and folders granted to Termux.

## Recovery state model

The Toolkit separates automatic recovery from the desired Desktop Commander MCP state.

- `recovery_enabled=yes|no` controls whether the watchdog/Android recovery path is allowed to run.
- `mcp_desired=online|offline` records whether Desktop Commander should be running.
- `mcp_actual=online|offline` reports the observed process state.
- `mcp_process_count` reports matching Desktop Commander processes for the configured MCP home.

The local watchdog can attempt to restore MCP only when recovery is enabled and the desired state is online. An intentional offline state is preserved. Android background execution is subject to Android and manufacturer process-management policies; recovery is not guaranteed on every device.

## Notifications

Recovery notifications are local Android notifications; no Firebase/FCM or external push service is required.

Termux-side notifications require both the Termux API command package and its compatible Android companion app. WADB Bridge has a separate recovery notification channel. Denying notification permission suppresses notifications; it does not itself disable recovery.

## Termux:API is optional

The Termux:API pieces are separate:

1. the Termux command package;
2. the compatible Android companion app.

Installing one does not install the other. Core Toolkit and MCP functionality remains usable without this optional capability, but notifications and some device information may be limited.

## Secure Local Shell

Secure Local Shell is initialized through an already authorized Android shell. After setup, Termux uses a separate authenticated local-only connection to a helper running as Android's shell user. It is not the ADB wire protocol and is not root. Android process lifecycle or device restrictions may require it to be initialized again.

## Release integrity

Run the read-only integrity checker to verify the signed installed-file inventory. A clean result is INSTALLED_INTEGRITY=VERIFIED; a mismatch is INSTALLED_INTEGRITY=TAMPERED. Use an independently obtained release fingerprint, not a value copied only from the installed directory.

## Open-source licence

The project is licensed under Apache-2.0. The licence permits use, modification and redistribution under its terms, including commercial use. See LICENSE, NOTICE and THIRD_PARTY_NOTICES.md.
