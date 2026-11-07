# AI Termux WADB Toolkit v1.0.4

Release date: 2026-11-07

## Highlights

- Adds two independent authenticated loopback shells: Local Termux Shell under the Termux app UID on port 47173, and Local Android Shell under Android shell UID 2000 on port 47174.
- `ai-info --connect` creates or repairs the Android shell after checking the authenticated ADB target and WADB Bridge; no separate shell-bootstrap command is required.
- Both services use separate private tokens and bind only to device loopback. The Termux shell does not require ADB or Android debugging. The Android shell survives an ADB transport disconnect while Android `adbd` remains running.
- Reports the actual Android-shell UID and runtime dependencies separately from Wireless ADB transport state. Turning off the last debugging mode stops `adbd` and the Android shell helper; USB debugging is not enabled automatically.
- Corrects the recovery setup permission hand-off so the Bridge permission screen is launched through the authenticated Android shell UID when owner approval is required.
- Retains the v1.0.3 one-shot Android recovery alarm, recovery master switch, Bridge-side permission checks and 15-second watchdog configuration.

## Security and compatibility

- The release package uses an Ed25519-signed SHA-256 manifest and an independently supplied release-key fingerprint.
- The installer validates the package inventory and installation paths before writing, captures a rollback snapshot, and verifies the installed-file inventory after installation.
- The Bridge recovery control receiver is protected by Android's `WRITE_SECURE_SETTINGS` sender permission.
- Both local shell listeners are loopback-only and token-authenticated; their execution identities are deliberately separate. The Android shell uses UID 2000, not root.
- USB debugging and Wireless Debugging remain separate settings. The Toolkit does not require USB debugging for normal Local Termux Shell operation and does not enable it automatically.
- Android Bridge notifications are optional; they are not a prerequisite for automatic recovery.

## Release verification

Download the ZIP together with `SHA256SUMS.txt`, `RELEASE-TRUST-VALUES.txt` and `SBOM.cdx.json`. Obtain the trust-values file separately from the ZIP and use its independently published key fingerprint, installer hash and verifier hash before installation.

The included SBOM is a component inventory. It is not represented as a complete or independently certified SBOM.

License: Apache-2.0.
