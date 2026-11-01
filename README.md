# AI Termux WADB Toolkit

**Make your Android phone a working command-line environment for a compatible AI assistant.**

AI Termux WADB Toolkit connects an AI assistant to Termux through Desktop Commander Remote MCP. Once the owner has authorized the connection, the assistant can run normal Termux commands, use installed programs, work with accessible phone files and call the Toolkit's Android-management workflows. The same commands remain available to the owner manually.

This is an independent project, not an official Android, Termux, Google, OpenAI or Desktop Commander product.

## Why use it?

Instead of repeatedly copying commands into a terminal, pasting output back into a chat and uploading every file separately, a compatible AI assistant can work through the connected Termux environment.

That opens up a practical phone-based workflow:

- Ask the AI to run commands and scripts that are already available in Termux—not just the Toolkit's own commands.
- Ask it to inspect a source-code project, search files, run tests or invoke installed build tools.
- Work with APKs, logs, archives, documents and other accessible files using appropriate installed utilities.
- Ask it to create or edit a working copy and save the result directly to shared phone storage that Termux is allowed to access.
- Run authorized ADB commands when the Wireless ADB connection is ready.
- Use a separate Secure Local Shell route for supported Android shell commands after it has been initialized.
- Ask it to inspect diagnostics, troubleshoot connection problems and verify the state after a change.
- Keep using Termux manually whenever you prefer.

The AI is not restricted to the Toolkit's command catalogue. If a command or program is installed and the connected execution tool can invoke it, the AI can use it subject to the current user and Android permissions.

## The working model

```text
AI app / compatible assistant
        |
        | Remote MCP tool connection
        v
Desktop Commander on the Android phone
        |
        v
Termux command environment
        |
        +---- normal Termux programs and files
        +---- AI Termux WADB Toolkit
        |
        +---- Wireless ADB route ---- Android adbd
        |
        +---- Secure Local Shell ---- Android shell user

WADB Bridge is the Android companion for the supported
Wireless Debugging setting workflow and recovery integration.
```

MCP is the route that lets the AI call tools. Termux is where ordinary shell commands and file work happen. ADB and Secure Local Shell are separate Android-shell routes. WADB Bridge is a narrow Android companion; it is not the MCP server or an AI app.

Uploading the Toolkit ZIP or its AI instructions to a chat does not itself connect the AI to the phone. The Remote MCP connection and Android permissions must be completed.

For a full explanation of the Android system layers and how the components cooperate, read [Android and Toolkit Architecture](docs/ANDROID_ARCHITECTURE.md).

## What is included

| Feature | What it does | Why it is useful |
|---|---|---|
| **AI command execution** | Lets the assistant run commands available in Termux through MCP | The assistant can carry out the work, inspect output and retry after diagnosis instead of only suggesting commands |
| **Phone file workflows** | Uses Termux-accessible storage for listing, reading, searching, processing and saving files | Reduces the need to attach every file through a chat upload form |
| **Project inspection and builds** | Uses installed Git, Python, compilers, Gradle/Android tools and other utilities where available | Supports code review, debugging, tests and builds on the phone |
| **ai-info Control Center** | Human-friendly dashboard and guided menu | The owner can inspect and manage the Toolkit without memorizing every command |
| **AI-readable state** | Structured status output for MCP, ADB, Bridge, local shell and recovery | The assistant can check the real state before choosing an action |
| **Read-only diagnostics** | System checks and capability reporting | Makes it easier to identify missing permissions, packages or connections |
| **Wireless ADB management** | Typed service discovery, trusted-key reconnect, guarded first pairing and separate disconnect controls | Avoids guessing network endpoints and unnecessary repeated pairing |
| **WADB Bridge** | Android companion for supported Wireless Debugging setting control and verification | Provides a permission-gated Android-side helper |
| **Secure Local Shell** | Separate authenticated local route for supported Android shell commands | Allows supported shell work without keeping Wireless Debugging active after setup |
| **MCP manager** | Start, stop, restart, status and log controls for Desktop Commander | Separates the AI tool service's lifecycle from Wireless ADB |
| **Local recovery** | Optional Termux watchdog and Bridge-side recovery trigger | Can repair a missing MCP process when recovery is enabled and Android permits it to run |
| **GitHub recovery** | Optional remote control-file fallback | Gives the phone a separate, narrow recovery channel when MCP is unavailable |
| **Notifications** | Local state-transition notifications through Termux:API and WADB Bridge | Shows important recovery and process changes without a cloud push service |
| **Release integrity** | Ed25519 package signature, signed installed-file inventory and permission-mode checks | Helps users verify the official package and detect covered file changes |
| **Installer rollback** | Path checks, backup snapshots and rollback for ordinary caught failures before commit | Reduces the chance that an unsuccessful upgrade leaves a partial Toolkit installation |
| **Manual operation** | Interactive commands and full reference remain available | AI is an optional operator, not a requirement |

See [Features and Practical Workflows](docs/FEATURES_AND_BENEFITS.md) for examples and [Command Reference](docs/COMMAND_REFERENCE.md) for the actual commands.

## Phone files and AI attachment limits

The phone can act as the AI's working file store. If Termux has permission to access a folder, the connected assistant can use Termux tools to inspect or process files there and save results back to the phone.

This can avoid uploading every file as a chat attachment. It is useful when an AI service has a limited attachment allowance or when a project contains many files.

It does **not** remove the AI provider's limits. The provider still decides whether Remote MCP is supported on the account, how much context and tool use is allowed, and any rate or usage limits. Large files can often be filtered, searched, hashed, parsed or summarized locally so the model receives only the relevant results.

The Toolkit does not grant Google Drive access, unlock a paid AI plan or provide unrestricted access to Android storage.

## Rooted and non-rooted devices

Root is **not required**.

- On a non-rooted phone, normal commands run with Termux's available permissions; Wireless ADB and Secure Local Shell use Android's shell-user permissions.
- On a rooted phone, the owner may approve a command through an installed `su` mechanism when it requires elevated privileges.
- Root does not silently change the privilege level of Wireless ADB or Secure Local Shell.

The Toolkit does not bypass Android's permission model.

## Android storage boundaries

Android separates app-private storage from shared user storage and applies scoped-access rules. Termux must be granted the relevant storage access before it can work in shared folders. It does not automatically see every other app's private files or protected system data.

See [Android storage documentation](https://developer.android.com/training/data-storage) and the [Termux storage guide](https://github.com/termux/termux-tools/blob/master/doc/termux.1.md.in).

## How the components work together

1. **AI client:** the owner uses an AI app or client that supports the required Remote MCP integration.
2. **Desktop Commander:** the phone-side Remote MCP service exposes the authorized command and file tools.
3. **Termux:** commands execute inside the installed Termux environment with its permissions and packages.
4. **Toolkit:** `ai-info` and its helper commands coordinate status, Wireless ADB, WADB Bridge, Secure Local Shell, MCP lifecycle, recovery and integrity.
5. **Android:** ADB and the local shell helper provide distinct Android-shell routes. WADB Bridge handles the supported setting and recovery integration.
6. **Verification:** the assistant checks the resulting state and reports the observed outcome.

## Requirements

- Android with Termux installed from a compatible, trusted distribution source.
- Node.js and npm in Termux for Desktop Commander.
- Desktop Commander Remote MCP installed separately (the Toolkit's documented package version is 0.3.1).
- Required Termux utilities checked by the installer, including Python, Android tools, coreutils, util-linux, curl and Git.
- Developer Options and Wireless Debugging for initial Wireless ADB setup.
- Optional Termux:API command package and compatible Android companion app for notifications and some device information.
- Storage permissions for any shared folders the owner wants Termux to access.

## Installation

Download the official **AI Termux WADB Toolkit v1.7.5 HARDENED** ZIP from [GitHub Releases](https://github.com/jaskran0417/ai-termux-wadb-toolkit/releases/tag/v1.7.5).

Before running the installer, compare its SHA-256 and the release verifier SHA-256 against the values published independently in the release notes and [DEV.to announcement](https://dev.to/jaskran0417/wireless-adb-on-android-with-termux-a-non-root-workflow-ce6). Then provide the independently obtained release-key fingerprint, installer hash and verifier hash to the installer. Do not trust values copied only from the ZIP being verified.

Start with [Start Here](docs/START_HERE.md), then follow [User Setup](docs/USER_SETUP.md) and [Remote MCP Connection](docs/REMOTE_MCP_AI_CONNECTION.md).

## Why the release is called 1.7.5 HARDENED

**1.7.5 is the Toolkit's existing software version.** This was the first public release, but the project already had versioned code and release metadata at 1.7.5. The public release kept that real version rather than renumbering the same code as 1.0 and creating conflicting metadata.

**HARDENED describes the release build's additional integrity and installer protections.** The release includes signed package metadata, independent trust-pin checks, a signed inventory of installed files and their permission modes, managed-path preflight checks, installer locking and rollback snapshots for ordinary caught failures before the install transaction commits.

"HARDENED" is a release designation, not a claim that the software is tamper-proof, independently certified or immune to a person who controls the Termux account. The owner can still modify locally controlled files, and Android's permissions remain the security boundary.

## Open-source licence

The Toolkit is now released under the **Apache License 2.0 (Apache-2.0)**. This is an OSI-approved open-source licence. It permits use, modification and redistribution, including commercial use, subject to its conditions, attribution, notice and patent provisions.

The source is included in this repository. Contributions are welcome under the same project licence; see [CONTRIBUTING.md](CONTRIBUTING.md). Third-party components remain subject to their own notices and licences.

- [LICENSE](LICENSE)
- [NOTICE](NOTICE)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Dependency inventory / SBOM](SBOM.cdx.json)

## Security and limitations

- Android permissions and app sandboxing still apply.
- ADB and Secure Local Shell run as Android's shell user, not root.
- Root execution requires a rooted phone and owner-approved `su`.
- Integrity checks detect changes to covered files; they do not make Termux immutable.
- Installer rollback covers ordinary caught failures before commit, not power loss or forced kernel termination.
- Background recovery depends on Android process scheduling and device-manufacturer restrictions.
- The Toolkit is not independently security-certified.

For security issues use GitHub's private vulnerability reporting feature. Do not publish ADB pairing codes, access tokens, private keys, passwords or personal backups in issues.

## Project status

- Toolkit version: **1.7.5**
- Release designation: **HARDENED**
- Android companion: **WADB Bridge 1.5** (versionCode 6)
- Licence: **Apache-2.0**
- Distribution: complete source plus official release ZIP
