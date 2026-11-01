# Dependency inventory

See SBOM.cdx.json for the machine-readable CycloneDX 1.6 inventory.

## Included runtime components

- WADB Bridge Android application: package com.jaskran.wadbbridge, versionName 1.5, versionCode 6.
- Kotlin Standard Library 2.2.10 is present in the bundled APK DEX output and is distributed under Apache License 2.0.
- The Bridge releaseRuntimeClasspath also resolves JetBrains Annotations 13.0, but the annotation classes are not present in the APK DEX output; it is not listed as a bundled runtime library.

## Build environment

- Android Gradle Plugin 9.3.1
- Gradle 9.8.0
- Java 21.0.12
- Android compileSdk 36
- The SBOM records the resolved build-time Maven dependency graph and marks those components as excluded from the shipped runtime.

## External user-installed dependencies

- Termux
- Node.js and npm
- @wonderwhy-er/desktop-commander@0.3.1
- Python, android-tools, coreutils, util-linux, curl and Git
- Optional termux-api command package and Termux:API Android companion app

Termux repository package versions are selected at installation time and are not vendored or pinned in this distribution.
