# AI Termux WADB Toolkit v1.0.3

Release date: 2026-11-06

## Highlights

- Clearer human-readable output and stable machine-readable status for Wireless Debugging, ADB transport, pairing, Bridge, MCP, Local Termux Shell, bootstrap and installed-file integrity.
- Wireless Debugging state is reported separately from the active ADB connection. Bridge state and permission checks remain available after the ADB transport disconnects.
- WADB Bridge 1.6 (versionCode 7) adds a protected recovery-alarm control channel and one-shot Android recovery checks.
- The Android alarm is re-armed only by the Termux recovery job after it verifies that automatic recovery is still enabled. Disabling recovery cancels the alarm.
- Recovery setup verifies the Bridge's Termux `RUN_COMMAND` permission before enabling recovery or changing Termux external-command access. Bridge notification permission is optional.
- The notification helper allows a longer bounded response window for Termux:API after boot.
- Existing trusted ADB keys and Desktop Commander saved authorization are preserved by the documented update and recovery paths.

## Security and compatibility

- The release package uses an Ed25519-signed SHA-256 manifest and an independently supplied release-key fingerprint.
- The installer validates the package inventory and installation paths before writing, captures a rollback snapshot, and verifies the installed-file inventory after installation.
- The Bridge recovery control receiver is protected by Android's `WRITE_SECURE_SETTINGS` sender permission.
- The Local Termux Shell remains loopback-only and runs with the Termux app identity. It does not require USB debugging, Wireless Debugging, Wi-Fi or Android adbd after initial setup.
- USB debugging and Wireless Debugging remain separate settings. The Toolkit does not require USB debugging for its normal operation.
- Android Bridge notifications are optional; they are not a prerequisite for automatic recovery.

## Release verification

Download the ZIP together with `SHA256SUMS.txt`, `RELEASE-TRUST-VALUES.txt` and `SBOM.cdx.json`. Obtain the trust-values file separately from the ZIP and use its independently published key fingerprint, installer hash and verifier hash before installation.

The included SBOM is a component inventory. It is not represented as a complete or independently certified SBOM.

License: Apache-2.0.
