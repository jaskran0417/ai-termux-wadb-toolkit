# Release Authenticity and Installed Integrity

Applies to the AI Termux WADB Toolkit 1.7.5 HARDENED release. Authenticate the release using the independent trust pins published in the official release announcement.

## What is checked

The release uses an Ed25519 detached signature over MANIFEST.sha256. The signed manifest lists SHA-256 digests for every regular file in the package except the manifest itself and its detached signature. The verifier also rejects symbolic links, unsafe paths, duplicate entries, missing files, and unlisted extra files.

The installer verifies the release signature and complete file inventory before package installation, backup creation, or toolkit file changes. It fails closed if Node.js, the supplied trust pin, the public key, signature, or manifest is missing or invalid.

After installation, wadb-integrity-check verifies a separately signed installed-file inventory. The inventory covers installed WADB commands, shared helpers, selected documentation, the cached Bridge APK, the generated Bridge APK hash file, and the installed verifier. Each entry includes both SHA-256 content and the expected POSIX permission mode; a chmod-only change is reported as tampering.

The installed checker requires an independently obtained release-key fingerprint on every invocation. It does not fall back to the fingerprint stored beside the installed inventory. The local fingerprint file is checked only for consistency with the independently supplied value; it is not treated as a trust anchor.

## First-time trust bootstrap

A signature is only useful when the public key is trusted. Do not trust a fingerprint merely because it is printed inside the ZIP being checked.

Before public distribution, publish these values through an independently controlled official project channel:
- release public-key SHA-256 fingerprint,
- SHA-256 digest of security/verify-release.js,
- SHA-256 digest of install.sh.

Do not rely only on values printed inside the ZIP. The install script and the verifier are themselves part of the package. A bundled verifier cannot authenticate its own first execution, and a bundled installer could be modified to skip the check.

Before running install.sh, manually compare:

  sha256sum install.sh security/verify-release.js

against all three values published on the independent official channel. Then provide the independently obtained values to the installer:

  WADB_TRUSTED_RELEASE_KEY_SHA256=YOUR_TRUSTED_FINGERPRINT \
  WADB_TRUSTED_VERIFIER_SHA256=YOUR_TRUSTED_VERIFIER_SHA256 \
  WADB_TRUSTED_INSTALLER_SHA256=YOUR_TRUSTED_INSTALLER_SHA256 \
  ./install.sh --yes

The installer repeats both file-hash checks before it executes the Node verifier, then verifies the detached Ed25519 signature and exact package inventory. The production release does not require a candidate-only override; the independent trust pins remain mandatory.

Compare the fingerprint published by that channel with:

  trust/RELEASE_KEY_FINGERPRINT.txt

The release's fingerprint and file hashes must be published in the official DEV.to release update and mirrored in the GitHub release notes. Do not rely only on values printed inside the package.

## Installed checks

After installation, provide the independently recorded fingerprint:

  wadb-integrity-check --expected-fingerprint YOUR_TRUSTED_FINGERPRINT

Alternatively, set WADB_TRUSTED_RELEASE_KEY_SHA256 from an independently controlled source in the current shell and run wadb-integrity-check. Do not treat a value copied from the same installed metadata directory, release ZIP, or mutable shell startup file as an independent trust anchor.

Expected success includes:

  SIGNATURE=VALID
  FILES_FAILED=0
  INSTALLED_INTEGRITY=VERIFIED

A content or permission mismatch produces INSTALLED_INTEGRITY=TAMPERED and identifies the affected target. Missing or invalid metadata, or omission of the independent pin, is a verification failure—not a clean result.

## Limits and threat model

This design provides authenticated release integrity when the public-key fingerprint is independently trusted, plus local tamper detection for the files in the installed inventory.

It does not make Termux immutable. The device owner can change file permissions, replace scripts, patch Node.js or the verifier, alter the local trust pin, or run a modified copy. Legal terms may restrict unauthorised copying, modification, and redistribution, but those terms do not technically prevent a device owner from patching their local copy. A determined attacker with control of the same user account can bypass local checks. This checker is evidence and tamper detection, not a security boundary against the device owner.

The inventory does not attest to the Android OS, Termux package database, other installed apps, external Desktop Commander software, mutable user configuration, the running process memory, or every private state file. The Android-installed Bridge app is not measured directly by this Termux inventory; its APK release signing identity and update path remain separately governed by Android package signing and existing WADB checks.

The release includes an SBOM and third-party notices for the distributed components. The build-time dependency inventory is separately identified; it is not a claim of independent security certification or GitHub build-provenance attestation.

## Signing-key handling

The release-signing private key is not included in the bundle. It is separate from the existing WADB Bridge APK signing identity. Keep it private, mode 600 at minimum, and preferably offline in an encrypted backup. Never place it in Downloads, a public repository, an archive, a support report, or an AI conversation.

Loss or compromise of this private key requires a controlled key-rotation plan and publication of a new trusted fingerprint. Do not silently replace the key.
