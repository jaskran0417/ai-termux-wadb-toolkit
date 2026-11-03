# AI Termux WADB Toolkit v1.0.2

AI Termux WADB Toolkit connects a compatible AI assistant to an authorised Termux environment on Android. It gives the owner and the AI a consistent way to inspect status, run available Termux commands, manage Wireless ADB, use a separate Secure Local Shell, and configure optional Desktop Commander recovery.

It is an independent open-source project. It is not an AI model, a replacement for Termux, or an official Termux/Android/Desktop Commander product.

Just send this tool kit to ai like chat gpt,Claude or grock and ask how to setup the tool kit and tell ai to do the setup,Ai should give u instruction to setup initial desktop commander plugin or MCP and after the desktop commander is set the ai can install the tool kit by it self I'm termux or u can tell it to do so and then u only need to to initial wireless adb and bootstrap set which is automatically done by tool u just need to provide the pairing code to ai when it ask u to.If you face any problem ask ai to check the instructions and reference md or text files or u can ask here feel free.

## What it does

- **AI-to-phone connection:** works with Desktop Commander Remote MCP so a compatible AI client can use authorised terminal, filesystem, directory and process tools exposed from the phone.
- **Termux command execution:** the AI can use commands and packages installed in Termux, not only Toolkit commands.
- **ai-info Control Center:** human dashboard, interactive menu, structured state with `ai-info --json`, read-only diagnostics with `ai-info --doctor`, and the full command index with `ai-info --commands`.
- **Wireless ADB management:** typed mDNS discovery, trusted-key reconnect, pairing-state protection, Bridge readiness checks, and separate controls to disconnect one ADB transport or switch Wireless Debugging OFF.
- **WADB Bridge:** Android companion used for the protected Wireless Debugging setting workflow and Android-to-Termux recovery hand-off.
- **Secure Local Shell:** authenticated loopback-only Android shell route on `127.0.0.1:47173`, designed to remain usable after Wireless Debugging is off once it has been initialised.
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
   -> Wireless ADB or Secure Local Shell when Android shell access is needed
   -> Android
```

MCP, Wireless ADB and Secure Local Shell are separate connections. An active AI-to-Termux MCP connection does not require Wireless Debugging to remain ON. After the one-time authorised setup, WADB Bridge can switch the Wireless Debugging setting through its protected Android receiver without requiring an already-connected ADB transport for each later toggle. Turning the setting ON does not itself pair or connect ADB; the ADB trust flow is still required.

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

Just send this tool kit to ai like chat gpt,Claude or grock and ask how to setup the tool kit and tell ai to do the setup,Ai should give u instruction to setup initial desktop commander plugin or MCP and after the desktop commander is set the ai can install the tool kit by it self I'm termux or u can tell it to do so and then u only need to to initial wireless adb and bootstrap set which is automatically done by tool u just need to provide the pairing code to ai when it ask u to.If you face any problem ask ai to check the instructions and reference md or text files

**AI connection method:** follow `docs/AI_GUIDE.md` and `docs/REMOTE_MCP_AI_CONNECTION.md`. The AI checks its existing integrations first; ChatGPT uses the dedicated Remote Desktop Commander plugin. The numbered steps below are the manual setup path.

1. Install and open Termux. Run `termux-setup-storage` and approve the storage permission if the AI should work with shared folders such as Downloads.
2. Extract the official release ZIP in a Termux-accessible folder. Download the separate RELEASE-TRUST-VALUES.txt asset from the official release independently of the ZIP. Compare sha256sum install.sh security/verify-release.js with the installer and verifier hashes in that file, set the three independent WADB trust environment variables required by install.sh, and then run `bash install.sh`. The installer repeats the checks and verifies the signed package inventory before it writes any Toolkit files. Do not copy trust values only from inside the ZIP.
3. Start the separate Desktop Commander service from Termux using the command above. Complete browser/device verification and connect the AI app by following `docs/REMOTE_MCP_AI_CONNECTION.md` exactly for its Android-app setup path.
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

wadb-local-on                   # enable/repair Secure Local Shell
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

The full syntax, behaviour, side effects, checks and examples are in `docs/COMMAND_REFERENCE.md`. Start with `docs/USER_GUIDE.md`, follow `docs/AI_GUIDE.md` for AI operating rules, read `docs/REMOTE_MCP_AI_CONNECTION.md` for the tested ChatGPT, Claude and Grok Android-app connection instructions, and use `docs/TECHNICAL_REFERENCE.md` for architecture and security details. The installed copies are under `~/AI_WADB_DOCS/`.

## Important distinctions

- Disconnecting the current ADB transport leaves Wireless Debugging ON.
- Turning Wireless Debugging OFF through WADB Bridge ends Wireless ADB but does not stop Desktop Commander MCP or Secure Local Shell.
- `wadb-mcp-stop` stops the managed Desktop Commander process but does not delete its saved authorisation.
- `wadb-mcp-logout --confirm` removes saved Desktop Commander authorisation and may require browser verification again.
- `wadb-local-off --confirm` stops only Secure Local Shell.
- Secure Local Shell is loopback-only and runs as Android `uid=2000(shell)`, not root. Its steady-state connection is Wi-Fi-independent; reinitialising a missing helper may temporarily require Wi-Fi and authenticated Wireless ADB.
- Root is optional. On rooted devices, root operations still require the owner-authorised `su` path. On non-rooted devices, commands are limited to Termux and Android shell permissions.
- Android app sandboxing, storage permissions, background-process restrictions and AI-provider usage limits remain in force.

## Licence

The Toolkit's own source is licensed under **Apache License 2.0 (Apache-2.0)**. Third-party components retain their own licences and notices in `THIRD_PARTY_NOTICES.md` and the included SBOM.