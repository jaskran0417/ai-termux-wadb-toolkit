# Release Authenticity and Installed Integrity

This document applies to AI Termux WADB Toolkit 1.7.5 HARDENED.

## What is checked

The release uses an Ed25519 detached signature over MANIFEST.sha256. The signed manifest lists SHA-256 digests for the regular package files other than the manifest and its detached signature. The verifier rejects symbolic links, unsafe paths, duplicate entries, missing files and unlisted extra files.

The installer verifies the release signature and complete file inventory before package installation, backup creation or Toolkit file changes. It fails closed if Node.js, the supplied trust pin, the public key, signature or manifest is missing or invalid.

After installation, wadb-integrity-check verifies a separately signed installed-file inventory. The inventory covers installed WADB commands, shared helpers, selected documentation, the cached Bridge APK, the generated Bridge APK hash file and the installed verifier. Each entry includes both SHA-256 content and the expected POSIX permission mode; a chmod-only change is reported.

The installed checker requires an independently obtained release-key fingerprint on every invocation. It does not fall back to the fingerprint stored beside the installed inventory. The local fingerprint file is checked only for consistency with the independently supplied value; it is not treated as a trust anchor.

## First-time trust bootstrap

A signature is useful only when the public key is trusted independently. Do not trust a fingerprint merely because it is printed inside the ZIP being checked.

The official release announcement publishes:
- the release public-key SHA-256 fingerprint;
- the SHA-256 digest of security/verify-release.js;
- the SHA-256 digest of install.sh.

Before running install.sh, manually compare the installer and verifier hashes with the independently published values. Then provide all three trust values to the installer. Use the release notes and README for the current values and installation procedure.

The installer repeats both file-hash checks before it executes the Node verifier, then verifies the detached Ed25519 signature and exact package inventory.

## Installed checks

After installation, provide the independently recorded fingerprint when running wadb-integrity-check, or set WADB_TRUSTED_RELEASE_KEY_SHA256 from an independently controlled source in the current shell.

Expected success includes:

- SIGNATURE=VALID
- FILES_FAILED=0
- INSTALLED_INTEGRITY=VERIFIED

A content or permission mismatch produces INSTALLED_INTEGRITY=TAMPERED and identifies the affected target. Missing or invalid metadata, or omission of the independent pin, is a verification failure—not a clean result.

## Limits and threat model

This design provides authenticated release integrity when the public-key fingerprint is independently trusted, plus local tamper detection for the files in the installed inventory.

The project is licensed under Apache-2.0. Recipients may modify and redistribute their own copies under the licence. A modified copy will not match the official release manifest and will not have an official release signature unless the project owner signs that release. The device owner can also replace local scripts, patch the verifier or alter local trust configuration; local integrity checks are evidence and tamper detection, not a security boundary against a person controlling the Termux account.

The inventory does not attest to the Android OS, Termux package database, other installed apps, external Desktop Commander software, mutable user configuration, the running process memory or every private state file. The Android-installed Bridge app is not measured directly by this Termux inventory; its APK release signing identity and Android package update path are separate checks.

The SBOM and third-party notices describe the dependency information collected for this release. They are not an independent security certification or a GitHub build-provenance attestation.

## Signing-key handling

The release-signing private key is not included in the bundle. It is separate from the existing WADB Bridge APK signing identity. Keep it private and preferably offline in an encrypted backup. Never place it in the public repository, release archive, support report or AI conversation.

Loss or compromise of this private key requires a controlled key-rotation plan and publication of a new trusted fingerprint. Do not silently replace the key.
