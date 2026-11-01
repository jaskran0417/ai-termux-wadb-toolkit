# Contributing

Thank you for considering a contribution to AI Termux WADB Toolkit.

## Before opening a pull request

1. Check existing issues and pull requests to avoid duplicate work.
2. Describe the problem and the Android/Termux context.
3. Keep changes focused and explain user-visible behavior.
4. Do not include credentials, private signing material, ADB keys, device backups, pairing codes or personal logs.
5. Update the relevant documentation and tests when behavior changes.

## Development expectations

- Preserve the separation between MCP, normal Termux execution, Wireless ADB and Secure Local Shell.
- Do not silently increase privilege or bypass Android permissions.
- Keep destructive operations explicit and verify their results.
- Preserve external Desktop Commander authorization and Termux ADB keys during Toolkit uninstall.
- Keep release signing keys out of source control and CI logs.
- Update the command reference and architecture documentation when user-visible behavior changes.

## Checks

Before submitting, run the available shell, Python and JavaScript syntax checks. Validate JSON metadata and test the affected workflow in an isolated environment where possible. Installer changes should be tested for clean install, upgrade, rollback and uninstall behavior.

## Licence

The project is licensed under Apache-2.0. By submitting a contribution, you agree that your contribution is provided under the same licence. You retain copyright in your contribution while granting the rights described by Apache-2.0.

The project currently does not require a separate Contributor License Agreement.


## Android Bridge forks

The official WADB Bridge APK is signed with the project's private release certificate, which is not part of the repository. Forks should use their own signing keys and should document their package identity/update path. Android does not normally accept an APK with a different signing identity as an in-place update to an already-installed package. Do not request or publish the original maintainer's private signing credentials.
