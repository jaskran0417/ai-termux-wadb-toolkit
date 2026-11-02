# AI Termux WADB Toolkit v1.0

A Termux toolkit for managing Wireless ADB, the WADB Bridge Android companion, a separate authenticated local shell route, and Desktop Commander Remote MCP lifecycle and recovery on Android.

It is designed for rooted and non-rooted devices. Root is optional; normal Toolkit operation uses Termux permissions, while the ADB and Secure Local Shell routes use Android's shell identity where applicable.

## What it does

- Provides an ai-info control center, machine-readable status (ai-info --json) and diagnostics (ai-info --doctor).
- Discovers and connects Wireless ADB using Android's supported pairing and debugging workflow.
- Integrates the WADB Bridge companion for the supported Android settings and recovery handoff.
- Provides an authenticated loopback Secure Local Shell route as a separate option from Wireless ADB.
- Manages Desktop Commander MCP start, stop, restart, status and logs without treating logout as an ordinary restart.
- Offers optional local watchdog, Android-side and GitHub-based recovery paths.
- Includes signed release metadata and an installed-file integrity check.
- Keeps source code, Android Bridge source and documentation in this repository.

## How the system fits together

The AI client connects to Desktop Commander Remote MCP. Desktop Commander exposes authorized command and file operations in Termux. The Toolkit supplies Android/ADB helpers, status, recovery and integrity checks. Android still enforces app sandboxing, scoped storage, ADB authorization and permission boundaries.

The Toolkit is not an AI model, does not create an MCP connection by itself, and does not grant access to another app's private data. AI access depends on a supported MCP client, an authenticated Desktop Commander connection and the permissions available to Termux.

## Start here

1. Read the User Guide at docs/USER_GUIDE.md.
2. Read the AI Guide at docs/AI_GUIDE.md before asking an AI to perform setup or system changes.
3. Use docs/COMMAND_REFERENCE.md for exact commands and behaviour.
4. Use docs/TECHNICAL_REFERENCE.md for architecture, security and recovery details.
5. Read AI_ENVIRONMENT.md for the installed Termux environment reference.

## Requirements

- Android with a compatible Termux installation.
- Node.js and npm in Termux for Desktop Commander.
- Desktop Commander Remote MCP installed separately.
- The Termux packages checked by the installer, including Python, Android tools, coreutils, util-linux, curl and Git.
- Developer Options and Wireless Debugging for initial Wireless ADB setup.
- Optional Termux:API command package and compatible Android companion app for notifications and some device information.
- Storage permissions for shared folders that Termux should access.

## Installation and verification

Download the official AI Termux WADB Toolkit v1.0 release from GitHub Releases:
https://github.com/jaskran0417/ai-termux-wadb-toolkit/releases

Before installing, verify the archive and installer against the SHA-256 values and release-key fingerprint published separately with the release. Do not trust verification values copied only from inside the archive.

Follow docs/USER_GUIDE.md for setup. After installation, ai-info --doctor provides read-only diagnostics and wadb-integrity-check checks the signed installed-file inventory.

## Security boundaries

- Android permissions and app sandboxing remain in force.
- ADB and Secure Local Shell operate as Android's shell user, not root.
- Root commands require a rooted device and owner-approved su.
- Integrity checks detect changes to covered files; they do not make Termux immutable.
- Rollback covers ordinary caught failures before the installer commits; it cannot guarantee recovery from power loss or forced process termination.
- Android background recovery is subject to OS and manufacturer process-management rules.

## Project and licensing

The Toolkit's own source is licensed under **Apache License 2.0 (Apache-2.0)**. It may be used, modified, redistributed and included in commercial products subject to the licence conditions, including its attribution, notice and patent terms. Third-party components retain their own licences and notices in THIRD_PARTY_NOTICES.md and SBOM.cdx.json.

Contributions and security reports: see CONTRIBUTING.md and SECURITY.md.

## Release identity

- Toolkit version: 1.0
- Android companion: WADB Bridge 1.5 (versionCode 6)
- Source: this repository
