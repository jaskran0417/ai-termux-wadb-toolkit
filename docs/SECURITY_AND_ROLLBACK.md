# Security, Recovery, and Rollback — v1.7.5

This file documents the security boundaries, recovery behavior, and rollback procedures of the toolkit.

## Trust boundaries

Desktop Commander Remote MCP is the component that gives the connected AI command/file access inside the Termux app's normal Android UID. The WADB toolkit does not turn that access into root.

Wireless ADB is a separate layer. When connected, Android's ADB shell normally runs as uid=2000(shell), still not root.

WADB Bridge is deliberately narrow:
- WirelessDebugReceiver only reads/writes Android's adb_wifi_enabled global setting.
- McpRecoveryReceiver launches one fixed Termux recovery job path.
- The Bridge APK declares no INTERNET permission.


## Secure localhost shell bridge

The maintained v1.7.5 local-control mode does not expose Android `adbd` on classic TCP port 5555. In the verified secure state:

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

## Recovery and permission boundaries

### Recovery receiver
McpRecoveryReceiver is now non-exported. External apps can no longer directly invoke the recovery receiver. Android system boot/package-replaced broadcasts and the app's own explicit PendingIntent alarm remain supported.

### Permission activity
PermissionActivity remains exported intentionally because the recovery setup may need Android to show the one-time com.termux.permission.RUN_COMMAND runtime-permission dialog on devices where ADB shell cannot grant that permission.

The activity:
- requests only com.termux.permission.RUN_COMMAND,
- does not accept a shell command,
- does not execute a command,
- immediately exits after the permission result.

Treat this as a permission-prompt surface, not a general command bridge.

### allow-external-apps rollback
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

### Recovery config quoting
Values written to the recovery shell config are now emitted with Bash shell escaping. CLI values can no longer inject additional shell syntax merely by being written into the config file.

GitHub owner/repo/branch/file/target values are also validated before being saved.

### ADB fallback scan
Typed mDNS remains the preferred path. The untyped fallback scan is now configurable:

```bash
WADB_SCAN_MIN=30000
WADB_SCAN_MAX=65535
wireless-adb-connect
```

The default fallback range is 30000–65535. Results remain explicitly marked UNVERIFIED_CANDIDATE; the toolkit never infers pairing-vs-connect role from a raw port number.

## Desktop Commander version behavior

The documented first-start command remains the upstream-recommended form:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

Recovery first prefers the already cached Desktop Commander dist/index.js. Only when the cached executable cannot be found does it fall back to the upstream @0.3.1 npx command.


## Uninstall / rollback

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

## Bridge APK cache and update model

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


### Runtime integrity and credentials

The toolkit installer verifies its bundle checksum manifest, records the SHA-256 of the bundled WADB Bridge APK, and checks the cached APK against that expected hash before `wadb-bootstrap` calls `adb install -r`. If the expected hash is absent or the cached APK differs, installation fails closed; reinstall the verified toolkit bundle to restore it. This protects against accidental cache replacement/corruption, not an attacker who can modify the toolkit and its expected hash under the same Termux UID.

ADB endpoint selection compares the Android manufacturer/model/device/product/brand/name/build fingerprint/SDK properties against the local phone before treating a network transport as this device. These checks reduce accidental mis-targeting; they are **not cryptographic device attestation**, because an adversarial ADB endpoint can imitate property output.

The GitHub control generation must be a decimal integer of at most 18 digits. If a persisted generation is malformed/oversized, recovery enters a reset-pending state and does not execute a command in that cycle; the next valid matching control is baselined without execution.

The Bridge signing keystore and signing-password files are private build material and are not part of either distribution ZIP. Do not send `WADB_Bridge_Signing_Details_PRIVATE.txt` or the contents of `~/.ai-wadb/signing-jaskran` with a toolkit release. Those files remain readable to code running under the same Termux app UID, even with mode 600; for stronger isolation keep a secure encrypted offline copy and remove the active signing material from routine runtime storage when no longer required for signing.

`WRITE_SECURE_SETTINGS` remains a broad permission in this release. The exported Wireless Debug receiver also uses this permission to gate callers, so simply revoking Termux's grant would break the current control path. Moving to a token-authenticated receiver that removes Termux's broad grant requires an Android Bridge code change, a rebuild, and a separately verified installation; it is not claimed to be completed by the Termux-script fixes.

## Package integrity

MANIFEST.sha256 covers the toolkit files. It detects accidental or unauthorized changes relative to the package manifest, but a checksum manifest by itself is not publisher identity.

## Signed release and installed-file integrity (HARDENED v1.7.5)

This release adds an Ed25519 signature over MANIFEST.sha256. The verifier requires an independently published public-key fingerprint, checks the detached signature, checks every hash, rejects symlinks and unsafe paths, and rejects missing or unlisted files. The installer performs this verification before package installation, backup creation, or toolkit file changes.

The production installer has no candidate-only override. It requires independent trust pins for the release key, the installer and the verifier before making any toolkit changes.

wadb-integrity-check verifies a signed inventory of installed commands, shared helpers, selected documentation, and the cached Bridge APK. It is read-only. The inventory does not directly measure the installed Android Bridge APK, the operating system, third-party tools, mutable user configuration, or running process memory.

The first-time key fingerprint must be published independently of the bundle. A fingerprint contained only in the same ZIP is not a trust anchor. GitHub build attestations, immutable releases, a complete SBOM, and a final legal licence are not yet implemented in this candidate.

A user controlling the Termux UID can replace the verifier, alter the local pin, or execute a modified copy. This design authenticates a release when its key pin is independently trusted and detects local file changes; it does not make Termux immutable or make modification impossible.




## Maintenance-audit residuals (v1.7.5)

The current maintenance update fixes the false-ready Wireless Debugging diagnostic, synchronizes both MCP desired-state files during logout, adds cached-APK SHA-256 verification, adds a multi-property same-phone guard, pins Desktop Commander fallback commands to the installed `0.3.1` package, and bounds GitHub generation values. These changes do not change the toolkit version.

Two important limits remain explicit:

- The Android Bridge APK was not redesigned in this maintenance pass. Termux still needs its existing `WRITE_SECURE_SETTINGS` grant because the exported Wireless Debug receiver requires that permission from callers. Removing this broad Termux grant needs a token-authenticated receiver redesign, a signed APK build, and live installation/permission regression tests; simply revoking the permission would break the current control path. Android documents `WRITE_SECURE_SETTINGS` as not for use by ordinary third-party apps.
- The boot/package-replaced receiver's `startService()` recovery path has not been verified by a cold-boot test on Android 16. It logs failures. Do not treat reboot recovery as proven solely from source inspection.

GitHub recovery and its polling are currently disabled in the inspected device configuration (`recovery_enabled=0`, `GITHUB_ENABLED=0`), so the 15-second watcher interval is not producing GitHub polls in that state. The installer uses `pkg update` only when required packages or Termux:API CLI are missing; it does not execute `pkg upgrade` or partially upgrade installed packages. A user who changes repository mirrors should follow Termux's documented package-upgrade guidance as a separate maintenance operation.

## Current MCP recovery state model

The toolkit keeps **automatic recovery** separate from the desired Desktop Commander MCP state.

- `recovery_enabled=yes|no` controls whether the watchdog/Android recovery path is allowed to run.
- `mcp_desired=online|offline` records whether Desktop Commander itself should be running.
- `mcp_actual=online|offline` reports the observed process state.
- `mcp_process_count` reports matching Desktop Commander processes for the configured MCP HOME.

`wadb-mcp-stop` changes only the MCP desired state to `offline` and stops Desktop Commander. It preserves saved authorization and does not disable recovery. When recovery is enabled, the watchdog remains available, continues its GitHub polling cycle, and can accept a later `START_MCP`.

`wadb-mcp-recovery-disable` is the separate master recovery-off operation. It stops the watchdog and marks recovery disabled, but it does not stop or log out an already-running Desktop Commander process and does not delete its saved authorization.

If the watcher dies while recovery is enabled and MCP is intentionally offline, `wadb-mcp-job` may restore the watcher while leaving MCP offline. This lets a later GitHub `START_MCP` work without incorrectly turning MCP on during watcher restoration.

The normal watchdog interval is 15 seconds. The WADB Bridge Android recovery alarm is a slower fallback and remains separate from the 15-second Termux watchdog.

### Notifications

Recovery notifications are local Android notifications; no Firebase/FCM or external notification cloud service is required.

When both the Termux `termux-api` command package and the compatible Termux:API Android companion app are available, Termux can notify on state transitions such as watchdog start, MCP start/stop/recovery, GitHub recovery, and recovery enable/disable. Successful 15-second heartbeat checks remain silent.

WADB Bridge v1.5 (versionCode 6) also has a native **WADB Recovery** notification channel for Android-side boot, package-replaced, and explicit recovery-check transitions. Recurring fifteen-minute alarm checks are silent. On Android 13 and later, notification permission may be requested; denying notification permission suppresses notifications but does not disable recovery.

### Termux:API is an optional capability

The two Termux:API pieces are separate:

1. Termux command package: `pkg install termux-api`
2. Android companion app: Termux:API from a compatible signing/source family with the installed Termux app

Installing the command package does not install the Android app, and installing the Android app does not automatically install the Termux command package. Core WADB/MCP functionality remains usable without this optional capability; automatic IP information and Termux-side notifications can be limited or use documented fallbacks.

With `install.sh --yes`, the installer may refresh package metadata and install missing toolkit packages, including the optional `termux-api` command package when absent. It does not perform a blanket `pkg upgrade`. The installer never downloads an arbitrary Termux:API Android APK.

### Foreground viewing versus another MCP

Managed Desktop Commander runs detached. To watch its live output without starting another MCP instance, use:

```bash
wadb-mcp-log --follow
```

Pressing Ctrl+C in this log viewer stops only the viewer. Manually running the raw Desktop Commander `npx ... remote` command is a separate foreground launch attempt and can create a second matching process. `ai-info` and `wadb-mcp-status` report matching process count so duplicates are visible.

Ordinary shell `exit` or removing Termux from Recents is not treated as `wadb-mcp-stop`; detached processes may continue running. Android force-stop or OEM process restrictions can still prevent scheduled recovery until Android permits the affected app/process to run again.


## Fixed-candidate security maintenance — 2026-11-01

This fixed candidate adds the following controls over the 2026-10-31 candidate:

- Before package installation or toolkit writes, a Node.js preflight walks every existing component of the Termux PREFIX/HOME directory chains with lstat, rejecting symlinked or non-directory components. It checks all managed command/helper destinations and the documentation files that will be replaced. AI_READ_ME_FIRST.md is accepted only when it is a symlink to the expected AI_ENVIRONMENT.md file. A private HOME-level flock lock file serializes concurrent installer runs without needing to create the toolkit state directory first.
- The installer uses the persistent private lock file ~/.ai-wadb.install.lock (mode 600) under Termux HOME; it is intentionally left in place so concurrent installers can serialize on the same inode.
- Immediately before the first managed write, the installer repeats the path preflight and captures a rollback snapshot of all managed command files, the complete WADB libexec directory, the complete WADB documentation directory, environment/read-me files, .bashrc, the cached Bridge APK, release-integrity metadata, and pairing-pending state. If a later install step fails or exits before commit, an EXIT/INT/TERM handler restores the previous state and removes paths that did not previously exist. The snapshot remains under ~/.ai-wadb/backups/<timestamp>/rollback/ for manual recovery.
- The native bridge uses bounded per-client workers (maximum eight), a two-second authentication-token deadline, bounded request-frame reads, bounded response writes, and a two-minute shell-command deadline. A slow unauthenticated client no longer blocks other authenticated clients. The listener remains bound to 127.0.0.1, and the 256-bit token is still required.
- The signed installed-file inventory now records POSIX permission modes as well as content hashes. wadb-integrity-check rejects a mode-only change.
- Every installed-integrity invocation requires an independently supplied release-key fingerprint. The local pin is consistency metadata only and is no longer used as a fallback trust anchor.

Rollback handles ordinary command failures and caught process termination signals. It cannot guarantee recovery from power loss, kernel termination, storage failure, or SIGKILL during the narrow period of file replacement; retain the timestamped backup and do not interrupt an installation.
