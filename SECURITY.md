# Security Policy

## Supported release

Security reports should identify the exact AI Termux WADB Toolkit version, edition and Android/Termux context. This project is independently maintained and is not an official Android, Termux or Desktop Commander security channel.

## Reporting a vulnerability

Use GitHub's **Report a vulnerability** / private vulnerability reporting feature for this repository. Do not open a public issue for an unpatched vulnerability.

Include:
- A concise description of the issue and its impact.
- The affected version, file or command.
- Reproduction steps that do not expose real credentials or personal data.
- A proposed mitigation, if known.

Do not include pairing codes, ADB keys, MCP tokens, GitHub tokens, signing keys, passwords, personal backups or unrestricted device logs.

## Scope and limitations

The Toolkit provides release integrity checks, not an immutable security boundary. A person or process controlling the same Termux application UID can modify local scripts or bypass local checks. The Toolkit does not bypass Android permissions and does not claim to be independently security-certified.

The project is licensed under Apache-2.0. Security fixes and improvements may be contributed through the public repository, but sensitive vulnerability details should be sent through private reporting.

Reports concerning Android, Termux, Desktop Commander or other third-party dependencies should be directed to their respective maintainers as well.
