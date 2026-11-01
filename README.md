# AI Termux WADB Toolkit

**Let a compatible AI assistant work with your Android phone through Termux.**

AI Termux WADB Toolkit connects an AI assistant to Termux using Desktop Commander Remote MCP and adds a maintained set of Android Wireless ADB, shell-access, diagnostics, recovery and file-work workflows.

It is an independent project. It is not an official Termux, Android, Google, OpenAI or Desktop Commander product.

## What it lets you do

After you authorize the MCP connection, a compatible AI assistant can use the tools available through Termux to:

- Run normal Termux commands, scripts and installed tools.
- Run ADB commands through an authorized ADB connection.
- Inspect, edit, create, organize and process files that Termux can access.
- Work with source-code projects, scripts, APKs, archives, documents and other file types supported by the tools installed on the phone.
- Run project checks, compilers, tests and build commands where the required toolchains are installed.
- Save generated or modified files directly to accessible phone storage.
- Diagnose Termux, MCP, ADB, Bridge and local-shell states.

The AI is not limited to the toolkit's own commands. It can run commands available in the connected Termux environment, subject to Android permissions, installed packages and any user authorization required by the command. The owner can also run every command manually.

File access happens through MCP tools; it does not require attaching every file through a chat upload interface. This does not bypass an AI provider's account, usage, tool-call, context or safety limits. The assistant can only access paths and permissions that the connected Termux environment actually exposes.

## Main features

| Component | Purpose |
|---|---|
| `ai-info` Control Center | Human dashboard, guided actions, JSON state and read-only diagnostics |
| Wireless ADB | mDNS service discovery, trusted-key reconnect, guarded first-time pairing and transport controls |
| WADB Bridge | Android-side Wireless Debugging control and permission verification |
| Secure Local Shell | Separate authenticated loopback shell route using Android shell-user permissions |
| MCP manager | Start, stop, restart, status and log controls for the external Desktop Commander process |
| Local recovery | Optional watchdog that can restore an MCP process when recovery is enabled and the desired state is online |
| GitHub recovery | Optional remote control-file fallback for MCP start, stop, restart and status |
| Notifications | Local state-change notifications with Termux:API support |
| Integrity and rollback | Signed package manifest, installed-file checks, installer preflight and rollback for ordinary failures |

## Rooted and non-rooted Android phones

Root is **not required**.

On a non-rooted device, commands run with the normal permissions available to Termux and Android's authorized shell interfaces.

On a rooted device, Termux may also run commands through an installed `su` mechanism when the owner explicitly approves the request in the root manager. The Wireless ADB and Secure Local Shell paths remain Android shell-user routes; they do not silently become root.

The toolkit does not bypass Android's permission model.

## How the connection works

1. Install Termux and the toolkit.
2. Start the external Desktop Commander Remote MCP service from Termux.
3. Connect a compatible AI client to the Remote MCP endpoint and complete its authorization flow.
4. Use `ai-info --connect` to configure or reconnect Wireless ADB when needed.
5. Grant the Android permissions requested by the supported setup flow.
6. Use the AI to run commands and work with files, or operate the same commands manually.

Uploading the toolkit's ZIP or instructions into an AI chat does not itself grant phone access. The MCP connection and Android authorization must actually be completed.

## Requirements

- Android device with Termux installed from a compatible, trusted distribution source.
- Node.js and npm in Termux for Desktop Commander.
- Desktop Commander package `@wonderwhy-er/desktop-commander@0.3.1`, installed separately.
- Required Termux packages: Python, Android tools, coreutils, util-linux, curl and Git. The installer checks for required commands.
- Android Developer Options and Wireless Debugging for initial Wireless ADB/Bridge setup.
- Optional Termux:API command package and compatible Android companion app for local notifications and some device information.

See [docs/START_HERE.md](docs/START_HERE.md), [docs/USER_SETUP.md](docs/USER_SETUP.md) and [docs/REMOTE_MCP_AI_CONNECTION.md](docs/REMOTE_MCP_AI_CONNECTION.md).

## Installation

Download the official **AI Termux WADB Toolkit v1.7.5 HARDENED** ZIP from the GitHub Releases page.

Before running the installer, obtain these three values from the independent release announcement:

- Ed25519 release-key SHA-256 fingerprint.
- SHA-256 of `security/verify-release.js`.
- SHA-256 of `install.sh`.

Compare the installer and verifier hashes manually. Then run the installer with the independently obtained values:

```bash
unzip AI-Termux-WADB-Toolkit-v1.7.5-HARDENED.zip
cd AI-Termux-WADB-Toolkit-v1.7.5
sha256sum install.sh security/verify-release.js

WADB_TRUSTED_RELEASE_KEY_SHA256=YOUR_TRUSTED_FINGERPRINT \
WADB_TRUSTED_VERIFIER_SHA256=YOUR_TRUSTED_VERIFIER_SHA256 \
WADB_TRUSTED_INSTALLER_SHA256=YOUR_TRUSTED_INSTALLER_SHA256 \
./install.sh --yes
```

Do not substitute values copied only from the same ZIP being verified. The official DEV.to release update and GitHub release notes will carry the independent trust values.

## Source and licence

The complete readable toolkit source is included in this repository, including Bash, Java and C sources, build configuration, documentation and release assets.

The project uses a **free personal and non-commercial source-available proprietary licence**. Users may inspect the source and install/run an unmodified official release for permitted non-commercial use. The licence does not grant general permission to modify, create derivative works, redistribute or commercially use the Toolkit. The owner may authorize selected contributors separately.

This is not an OSI open-source licence. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Security model and limits

- Release authenticity uses Ed25519 signatures and an independently published key fingerprint.
- The installer checks the installer and verifier hashes before executing the verifier.
- The installed-file inventory checks covered file hashes and permission modes.
- The installer snapshots affected paths and can roll back ordinary caught failures before commit.
- The Secure Local Shell path uses an authenticated loopback endpoint and Android shell-user identity.
- A user who controls the Termux account can patch local scripts, the verifier or local trust configuration. Integrity verification is tamper detection, not immutable execution.
- The toolkit is not independently security-certified. Do not treat an integrity check as a complete Android device security audit.

Read [docs/INTEGRITY_VERIFICATION.md](docs/INTEGRITY_VERIFICATION.md) and [docs/SECURITY_AND_ROLLBACK.md](docs/SECURITY_AND_ROLLBACK.md).

## Support

Use GitHub Issues for reproducible bugs and feature requests. Do not post ADB pairing codes, access tokens, private keys, device backups or sensitive logs in public issues.

For suspected security vulnerabilities, use the repository's private vulnerability reporting feature when available. See [SECURITY.md](SECURITY.md).

## Version

- Toolkit: **1.7.5**
- Edition: **HARDENED**
- Android companion: WADB Bridge **1.5** (package versionCode 6)
