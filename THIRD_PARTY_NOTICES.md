# Third-Party Notices

AI Termux WADB Toolkit v1.0.1

This file identifies third-party components included in the distributed package.
It distinguishes bundled components from tools installed separately by the user.

## Bundled Android Bridge runtime library

The WADB Bridge Android application (com.jaskran.wadbbridge) includes the Kotlin
Standard Library (org.jetbrains.kotlin:kotlin-stdlib) version 2.2.10. Kotlin classes
were confirmed in the distributed APK DEX output. The Kotlin Standard Library is
distributed under the Apache License 2.0.

The full Apache License 2.0 text is included at third_party/licenses/Apache-2.0.txt.
The upstream licence is also available at https://www.apache.org/licenses/LICENSE-2.0.txt.

The Bridge releaseRuntimeClasspath resolves JetBrains Annotations 13.0, but the
annotation classes are not present in the distributed APK DEX output. It is therefore
listed in the SBOM as a resolved, non-bundled dependency rather than as a redistributed
runtime library.

The Bridge source uses Android platform APIs. Android OS framework libraries are
supplied by the device and are not bundled in this toolkit.

## Build-time dependencies (not included as runtime libraries)

The Bridge build uses Android Gradle Plugin 9.3.1, Gradle 9.8.0, Java 21 and Android
SDK/Build Tools (compileSdk 36). The resolved Gradle buildEnvironment dependency
graph is documented in SBOM.cdx.json as build-time components. These build tools
and their transitive libraries are not copied into the toolkit runtime package.
Their presence in the SBOM does not mean they are shipped to end users.

## External user-installed tools (not bundled)

The following tools are installed or used separately from the toolkit distribution:

- Termux and its configured package repositories.
- Node.js and npm.
- @wonderwhy-er/desktop-commander version 0.3.1, installed through npm/npx.
- Termux packages used by the installer: Python, Android tools, coreutils, util-linux,
  curl and Git.
- Optional Termux:API command package and compatible Android companion application.

These remain separate products and are governed by their respective licences.
The toolkit does not relicense them and does not bundle their package payloads.

## Original Toolkit components

The original Bash scripts, Java source, C source and documentation are distributed
under the project licence in LICENSE, except for third-party components identified
above.

This notice is based on the checked-in Bridge Gradle configuration, the resolved
Bridge runtime/build dependency reports and inspection of the distributed APK DEX.
Build-time component coordinates and versions are recorded in SBOM.cdx.json.
