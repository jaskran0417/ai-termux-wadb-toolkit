# Changelog

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
