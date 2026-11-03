# AI Termux WADB Toolkit v1.0.2

AI Termux WADB Toolkit connects a compatible AI assistant to an authorised Termux environment on Android. It gives the owner and the AI a consistent way to inspect status, run available Termux commands, manage Wireless ADB, use a separate no-debug Local Termux Shell, and configure optional Desktop Commander recovery.

It is an independent open-source project. It is not an AI model, a replacement for Termux, or an official Termux/Android/Desktop Commander product.

## Start here — copy this instruction to your AI

**For users:** Copy the short instruction below to your AI assistant, together with this repository link or the official release.

**For AI assistants:** If you find this repository while helping with Toolkit setup, use this instruction as the task brief. Do not ask the user to paste it again when you can already read it here.

```text
Set up my Android phone with the AI Termux WADB Toolkit from this repository.

Read this README's Initial setup section and follow Point 1 (AI-assisted setup). Read and obey docs/AI_GUIDE.md. First inspect whether Remote Desktop Commander is already connected; if not, follow docs/DESKTOP_COMMANDER_SETUP.md and establish the provider-supported connection before installing the Toolkit.

Before MCP works, ask me only for unavoidable owner actions documented in the setup guide, such as installing/opening Termux if it is absent, starting the phone-side agent, and completing browser/device authorization. Once connected, inspect the real Termux state, obtain the official release ZIP and the separate `RELEASE-TRUST-VALUES.txt` asset independently of the ZIP, perform the documented integrity checks, install/configure the Toolkit, and run the post-checks yourself through the connected tools.

Use docs/USER_GUIDE.md, docs/COMMAND_REFERENCE.md and docs/TECHNICAL_REFERENCE.md for exact procedures. Do not give me commands you can execute, bypass security checks, or claim unverified success. Ask only for actions that genuinely require my involvement, such as phone-side startup, browser/device authorization, Android permission prompts or ADB pairing. Configure only required or explicitly requested features. Use Point 2 manual setup only if I request it or Point 1 is genuinely unavailable after checking.
```

To set up the Toolkit, share this repository or the official release with your AI assistant and use the copy-ready instruction above. The linked guides contain the full setup procedure, provider-specific connection steps, commands and safety requirements.

## What problem does it solve?

An Android phone can hold an entire project, but a chat-only workflow often makes the owner move files and commands between apps: attach source files, copy a suggested command into a terminal, paste the output back into the chat, and repeat.

AI Termux WADB Toolkit is for people who want a compatible cloud AI assistant to work with the files and command-line environment available on their Android phone. After the required one-time connection and Android permission setup, the assistant can use the authorised Termux environment to inspect files, run installed tools, make requested project changes, and save results on the phone instead of requiring every project file to be attached to the chat.

The AI model stays with its provider. Termux provides the local working environment. Desktop Commander is a separate dependency that provides the Remote MCP connection. The Toolkit manages the Android-side setup and controls; it is not an AI model or the MCP server.

A PC or locally installed AI model is not required for the documented phone-only workflow. Android permissions, app sandboxing, connection availability, and the AI provider's normal context and usage limits still apply.

## Common use cases

- **Work on an existing Android project:** ask a compatible AI assistant to inspect a project folder, understand its structure, search source files, make requested edits, run available tests or build tools, and save the results on the phone.
- **Use AI with local files:** work with accessible source files, documents, logs, archives, images, and other formats supported by the tools installed in Termux.
- **Run phone-side development tools:** use installed Termux packages, scripts, compilers, Python, Node.js, Git, and other command-line utilities through the authorised environment.
- **Manage Android connectivity:** inspect and manage Wireless ADB, WADB Bridge, the separate Local Termux Shell, and the phone-side Desktop Commander lifecycle using the documented Toolkit controls.
- **Keep a phone-only workflow:** use the Android device as the working environment without requiring a PC or a locally installed AI model.

## What it does

- **AI-to-phone connection:** works with Desktop Commander Remote MCP so a compatible AI client can use authorised terminal, filesystem, directory and process tools exposed from the phone.
- **Termux command execution:** the AI can use commands and packages installed in Termux, not only Toolkit commands.
- **ai-info Control Center:** human dashboard, interactive menu, structured state with `ai-info --json`, read-only diagnostics with `ai-info --doctor`, and the full command index with `ai-info --commands`.
- **Wireless ADB management:** typed mDNS discovery, trusted-key reconnect, pairing-state protection, Bridge readiness checks, and separate controls to disconnect one ADB transport or switch Wireless Debugging OFF.
- **WADB Bridge:** Android companion used for the protected Wireless Debugging setting workflow and Android-to-Termux recovery hand-off.
- **Local Termux Shell:** authenticated loopback-only command bridge on `127.0.0.1:47173`, launched directly under the Termux app UID. It does not require USB debugging, Wireless Debugging, Wi-Fi or Android `adbd` to remain enabled.
- **Desktop Commander lifecycle:** start, stop, restart, status and log controls that preserve saved authorisation during normal lifecycle operations.
- **Optional recovery:** Termux watchdog, Android Bridge trigger and GitHub control-file recovery.
- **Optional notifications and device details:** Termux:API integration and Bridge recovery notifications.
- **Release and installation integrity:** signed package verification, preflight checks, installed-file integrity checks and rollback handling for ordinary caught installation failures.

## How the pieces fit together

```text
AI app/client
   -> compatible MCP connection
   -> Desktop Commander on Android
   -> Termux shell
   -> AI Termux WADB Toolkit and installed Termux packages
   -> Wireless ADB for Android shell-UID tasks, or Local Termux Shell for Termux-app-UID tasks
   -> Android
```

MCP, Wireless ADB and Local Termux Shell are separate connections. An active AI-to-Termux MCP connection does not require Wireless Debugging to remain ON. After the one-time authorised setup, WADB Bridge can switch the Wireless Debugging setting through its protected Android receiver without requiring an already-connected ADB transport for each later toggle. Turning the setting ON does not itself pair or connect ADB; the ADB trust flow is still required.

## Apps, dependencies and installation location

The Toolkit is installed **inside the Termux app**; it is not a launcher app.

Main installed paths:

| Location | Purpose |
|---|---|
| `$PREFIX/bin/` (normally `/data/data/com.termux/files/usr/bin/`) | User-facing Toolkit commands |
| `$PREFIX/libexec/ai-wadb/` | Shared helpers, native local bridge and verifier |
| `~/AI_WADB_DOCS/` | Installed User, AI, Remote MCP Connection, Command and Technical guides |
| `~/AI_ENVIRONMENT.md` | Installed environment reference |
| `~/.ai-wadb/` | Private runtime state, cached Bridge APK, recovery config and local-shell token |

The installer checks/uses Termux packages such as Python, Android platform-tools (`adb`), core utilities, util-linux (`flock`), curl and Git. **Node.js/npm** are needed for Desktop Commander, which is installed/launched separately:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

**WADB Bridge** is the Android companion package `com.jaskran.wadbbridge`; it is not the AI or MCP server and has no normal app-drawer launcher screen. **Termux:API** consists of an optional Termux command package and a separate compatible Android companion app. They add device details and notifications; they are not required for the basic command workflow. GitHub CLI (`gh`) is optional and only used for one GitHub recovery read mode.

## Initial setup

“Initial setup” means establishing the AI connection and the Android trust/permission grants once:

1. **Recommended method — AI-assisted setup (default).** AI-assisted setup is the recommended method. Give the Toolkit to your AI and ask it to follow `docs/AI_GUIDE.md`. The AI must check its existing integrations first and use an existing Remote Desktop Commander connection if one is available. If a connection still needs to be set up, it should follow `docs/DESKTOP_COMMANDER_SETUP.md`; for ChatGPT, this means using the dedicated Remote Desktop Commander plugin. Once MCP connects to the phone, the AI performs the Toolkit installation, validation and supported configuration. You only need to complete the Android/browser prompts and one-time Wireless ADB pairing steps that require your approval, including providing the current pairing code when requested. The numbered instructions below are the manual setup alternative.

   **AI execution rule:** Once MCP connects to the phone, the AI must perform the supported dependency checks, obtain/locate the official release files, verify the independent trust values and signed package, install and configure the Toolkit, and run all post-checks itself through the connected tools. Do not ask the owner to download/extract the ZIP, type package-install commands, copy/paste Toolkit commands, run checksum/export commands, invoke `install.sh`, or type any Toolkit commands when the AI can do those actions. The owner only performs genuine owner-controlled actions: installing Termux if it is absent, starting the phone agent and completing browser/device authorization before MCP exists, approving Android permission prompts, and supplying the current ADB pairing code when the documented helper requests it.

2. **Manual setup — fallback only.** Use the following procedure only if the owner explicitly requests manual setup or the AI has checked the provider's actual state and no supported Remote Desktop Commander path is available. Do not show this fallback as the default or use it instead of actions the AI can execute after MCP connects.

   1. Install and open Termux. Run `termux-setup-storage` and approve the storage permission if the AI should work with shared folders such as Downloads.
   2. Extract the official release ZIP in a Termux-accessible folder. Download the separate RELEASE-TRUST-VALUES.txt asset from the official release independently of the ZIP. Compare sha256sum install.sh security/verify-release.js with the installer and verifier hashes in that file, set the three independent WADB trust environment variables required by install.sh, and then run `bash install.sh`. The installer repeats the checks and verifies the signed package inventory before it writes any Toolkit files. Do not copy trust values only from inside the ZIP.
   3. Start the separate Desktop Commander service from Termux using the command above. Complete browser/device verification and connect the AI app by following `docs/DESKTOP_COMMANDER_SETUP.md` exactly for its Android-app setup path.
   4. Run `ai-info --connect`. On a fresh device, manually enable Developer Options → Wireless debugging, open Android's pairing-code screen when requested, and run `ai-info --pair CODE` using the current code. Some ColorOS/OPPO/OnePlus/realme builds also require **Disable permission monitoring** to be ON (blue).
   5. Once ADB is authenticated, the Toolkit installs/updates WADB Bridge and uses the ADB shell to grant and verify the required `WRITE_SECURE_SETTINGS` permissions to Termux and the Bridge. Completion requires `RESULT=CONNECTED_AND_READY` and `bridge_write=ready`.

The owner may need to approve Android dialogs, browser authorisation and pairing. Android controls those prompts. Uploading the ZIP or AI guide to a chat does not establish the MCP connection.

After this initial setup, the saved ADB trust and Bridge permissions can normally be reused. The AI can use the Bridge to switch Wireless Debugging ON/OFF without an active ADB transport, as long as the required permissions remain granted.

## Main controls

```bash
ai-info                         # human dashboard / Control Center
ai-info --json                  # machine-readable status
ai-info --doctor                # read-only diagnostics
ai-info --connect               # Wireless ADB connect/setup
wireless-debug-status           # Wireless Debugging + Bridge status
wireless-debug-on               # turn Wireless Debugging on via Bridge
wireless-debug-off              # turn Wireless Debugging off via Bridge
ai-info --disconnect            # choose transport disconnect or Wireless OFF
ai-info --disconnect-transport --confirm
ai-info --wireless-off --confirm

wadb-local-on                   # enable/repair no-debug Local Termux Shell
wadb-local-status
wadb-local-shell -c 'id'
wadb-local-off --confirm

wadb-mcp-status
wadb-mcp-start
wadb-mcp-stop
wadb-mcp-restart
wadb-mcp-log --follow
wadb-mcp-recovery-setup         # optional local recovery
wadb-mcp-recovery-disable
wadb-mcp-github-config          # optional GitHub recovery setup
wadb-mcp-github-test
wadb-mcp-github-sync
wadb-toolkit-uninstall --all --dry-run
```

The full syntax, behaviour, side effects, checks and examples are in the [Command Reference](docs/COMMAND_REFERENCE.md). Start with the [User Guide](docs/USER_GUIDE.md), follow the [AI Guide](docs/AI_GUIDE.md) for AI operating rules, and read the [Desktop Commander Setup Instructions](docs/DESKTOP_COMMANDER_SETUP.md) for the tested ChatGPT, Claude and Grok Android-app instructions and permission settings. Use the [Technical Reference](docs/TECHNICAL_REFERENCE.md) for architecture/security, [Use Cases](docs/USE_CASES.md) for practical workflows, and the [FAQ](docs/FAQ.md) for common questions. The installed copies are under `~/AI_WADB_DOCS/`.

## Important distinctions

- Disconnecting the current ADB transport leaves Wireless Debugging ON.
- Turning Wireless Debugging OFF through WADB Bridge ends Wireless ADB but does not stop Desktop Commander MCP or Local Termux Shell.
- `wadb-mcp-stop` stops the managed Desktop Commander process but does not delete its saved authorisation.
- `wadb-mcp-logout --confirm` removes saved Desktop Commander authorisation and may require browser verification again.
- `wadb-local-off --confirm` stops only Local Termux Shell.
- Local Termux Shell is loopback-only and runs as the Termux app UID, not Android `uid=2000(shell)` and not root. It starts without ADB and remains usable with USB debugging, Wireless Debugging and `adbd` OFF. Android shell-UID-only operations still require a separately authorised Wireless ADB session.
- Root is optional. On rooted devices, root operations still require the owner-authorised `su` path. - The Local Termux Shell uses Termux app permissions. Commands that require Android shell UID or protected system privileges must use the separately authorised Android/Bridge path.
- Android app sandboxing, storage permissions, background-process restrictions and AI-provider usage limits remain in force.

## Licence

The Toolkit's own source is licensed under **Apache License 2.0 (Apache-2.0)**. Third-party components retain their own licences and notices in `THIRD_PARTY_NOTICES.md` and the included SBOM.