# AI Termux WADB Toolkit — Use Cases

AI Termux WADB Toolkit connects a compatible cloud AI assistant to an authorised Termux environment on an Android phone. The AI model remains with its provider; the Toolkit runs locally in Termux and manages the Android-side environment and controls.

## Recommended way to get started

AI-assisted setup is the recommended method. Share the official Toolkit release ZIP or its AI instructions with a compatible AI assistant and ask it to follow AI_GUIDE.md. The assistant checks the provider integration first, uses an existing Remote Desktop Commander connection when available, and performs the supported installation and configuration after it can reach Termux. The owner completes the one-time browser/device authorisation and Android actions that require approval. The manual alternative is documented in USER_GUIDE.md.

## Work with a project stored on Android

Use an existing project folder available to Termux instead of repeatedly attaching individual files to an AI chat. A connected assistant can:

- Inspect the project structure and list files.
- Read and search source files.
- Explain existing code and investigate errors.
- Edit or create project files.
- Run installed tests, scripts, compilers, and build tools.
- Save generated or modified files in an accessible phone folder.

The available work depends on the software installed in Termux and the directories Android allows Termux to access.

## Use AI with local files and documents

A connected assistant can work with accessible text files, source code, logs, archives, images, documents, and other formats supported by the installed tools. This can reduce repeated attachment and copy/paste steps. When file contents are returned to the AI model, the provider's normal context, usage, and rate limits still apply.

## Use Termux as a phone-side development environment

The assistant can use commands and packages already installed in Termux, including Python, Node.js, Git, compilers, archive utilities, and other command-line tools. The Toolkit does not restrict the assistant to commands whose names begin with wadb-.

## Manage Wireless ADB and Android settings

The Toolkit provides controls and diagnostics for Wireless ADB, trusted-key reconnect, typed mDNS discovery, WADB Bridge readiness, and the supported Wireless Debugging setting workflow. Wireless ADB is separate from the AI-to-Termux Remote MCP connection.

## Use the separate Local Termux Shell

The authenticated Local Termux Shell is a loopback-only route under the Termux app UID and needs no ADB or debugging. For Android shell-UID tasks, the Toolkit also provides a separate Local Android Shell bridge under UID 2000. ai-info --connect automatically creates or repairs it using the verified ADB session; after creation it can continue when the ADB network transport is disconnected while adbd remains running. Turning OFF the last debugging mode stops adbd and the UID-2000 service. Keeping Wireless Debugging OFF while preserving it requires USB debugging ON; the Toolkit does not enable that setting automatically. It is Android shell, not root.

## Manage the phone-side connection and recovery

The Toolkit includes controls to inspect, start, stop, restart, and diagnose the separate Desktop Commander process, plus optional local, Android-triggered, and GitHub recovery mechanisms.

## Keep the workflow on the phone

The documented workflow runs on Android. A PC and a locally installed AI model are not required. The owner still controls Android permission prompts, browser/device authorisation, and the Wireless ADB pairing code when requested.

## Architecture and permission boundaries

- The Toolkit is not an AI model.
- The Toolkit is not the MCP server. Desktop Commander is the separate Remote MCP dependency.
- Termux provides the local shell, packages, and filesystem environment.
- Wireless ADB, Local Termux Shell (Termux UID 10572), Local Android Shell (Android UID 2000), and Remote MCP are separate connections.
- Android application sandboxing and storage permissions remain in force.
- AI provider account, context, tool-call, and usage limits are not removed by the Toolkit.

## Further documentation

- README.md — project overview and feature summary.
- USER_GUIDE.md — recommended AI-assisted setup and manual alternative.
- AI_GUIDE.md — instructions for an AI assistant operating the Toolkit.
- DESKTOP_COMMANDER_SETUP.md — provider-specific connection instructions.
- FAQ.md — common questions.
- TECHNICAL_REFERENCE.md — architecture, Android APIs, security, and recovery.
- COMMAND_REFERENCE.md — command syntax, side effects, and verification.
