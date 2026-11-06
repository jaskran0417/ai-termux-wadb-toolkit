# Changelog

## 1.0.3 — recovery, connectivity and status improvements (2026-11-06)

- Replaced the repeating Android recovery alarm with a one-shot check that is re-armed only after the Termux recovery job confirms recovery remains enabled.
- Added an explicit-only Bridge alarm-control receiver protected by Android's `WRITE_SECURE_SETTINGS` sender permission.
- Added live pending-alarm state queries so MCP status and AI Info report the Bridge's actual pending alarm state.
- Recovery disable now cancels the Android Bridge alarm as well as stopping the local watchdog.
- Added a recovery master-switch check immediately before alarm re-arming to prevent a concurrent disable from being undone.
- Recovery setup verifies the Bridge's `com.termux.permission.RUN_COMMAND` grant before enabling recovery or changing Termux external-command access.
- Recovery setup restores the previous Termux external-command setting if Bridge alarm scheduling fails.
- Bridge notification permission remains optional and separate from the required Termux command-integration permission.
- Increased the Termux:API notification helper timeout to accommodate slower notification responses after boot while retaining a finite limit.
- Replaced raw Wireless Debugging broadcast output with readable status, permission and verification summaries, with separate machine-readable modes.
- Corrected bootstrap reporting so Wireless Debugging state is distinct from ADB transport connectivity and Bridge errors are not silently suppressed.
- Added a Package Manager fallback for detecting the installed Bridge version when ADB is disconnected.
- Improved human-readable MCP, Local Termux Shell, pairing, connection and installed-integrity status while retaining JSON and machine interfaces.
- Updated the WADB Bridge to version 1.6 (versionCode 7) and aligned its recovery control implementation, documentation and package metadata.
- Preserved the existing USB/Wireless debugging separation, trusted ADB-key handling, Desktop Commander authorization and local-shell security boundaries.

## 1.0.2 — installed-integrity version hotfix (2026-11-02)

- Fixed the installed-file verifier's release identity check: it now requires the same 1.0.2 version written into the signed installed inventory.
- Fixed the v1.0.1 installer failure where the generated inventory identified itself as 1.0.1 but the verifier accepted only 1.0, causing the transactional installer to roll back.
- Added a CI assertion that the package VERSION, generated installed inventory and installed verifier all agree.
- No Wireless ADB, MCP, recovery, Secure Local Shell or Android Bridge behavior changed.

## Unreleased — technical documentation parity (2026-11-02)

- Added source-verified Android Settings.Global calls and explicit WADB Bridge broadcast actions.
- Documented the separate Wireless ADB pairing/connection mDNS service identifiers.
- Expanded the Android recovery receiver, alarm schedule, fixed Termux RUN_COMMAND hand-off, and permission-activity boundaries.
- Clarified Secure Local Shell loopback binding/token authentication and separated Desktop Commander MCP tool names from Toolkit commands.
- Documented the optional Termux:API commands and the distinct Bridge notification channel.

## 1.0.1 — documentation and setup clarity update (2026-11-02)

- Expanded the user guide with Termux installation paths, the role of each app/component, and a clear first-time setup definition.
- Documented post-bootstrap Wireless Debugging ON/OFF through WADB Bridge without an active ADB transport for each toggle.
- Explained the difference between ADB transport disconnect, Wireless Debugging OFF, MCP stop/logout and Secure Local Shell stop.
- Added an implementation map for the Bash entry points, Android Bridge classes, native C helper and recovery components.
- Removed stale candidate-era and old dashboard-version wording.
- Updated release metadata and maintained documentation to version 1.0.1.

## 1.0 — consolidated public release (2026-11-02)

- Set the public product and package version to 1.0.
- Removed the separate release-edition branding.
- Retained signed package verification, installed-file integrity checks, installer preflight, locking and rollback protections.
- Consolidated the user, AI, command and technical documentation into four maintained guides.
- Removed duplicated documentation bundles and redundant package summary files.
- Continued to include the full Toolkit source and WADB Bridge source.
