# Remote MCP Connection — AI-First Setup for ChatGPT, Claude and Grok

This document defines what the AI must do first when this Toolkit is supplied. It is not a generic instruction to create a new MCP connector. The AI must inspect its existing integrations, prefer the dedicated **Remote Desktop Commander** plugin in ChatGPT, and guide only the initial actions that require the phone owner.

The connection has two parts:

```text
AI app / Remote Desktop Commander plugin
                 ↕ Remote MCP
Desktop Commander agent running in Termux on the phone
                 ↓
       Toolkit commands and Android access
```

## 1. Mandatory AI-first procedure

Before asking the owner to install anything, run commands, or create a connector, the AI must:

1. Inspect the tools/apps/connectors actually available in its current session for **Remote Desktop Commander**.
2. If Remote Desktop Commander is already connected and usable, use that existing connection. Do not ask the owner to install it again, create a second connector, or paste the server URL again.
3. If it is not active, distinguish between **not active in this conversation**, **not installed**, and **not available in the owner's account or app surface**. These are different states. Absence from the current tool list alone does not prove that the plugin is unavailable.
4. Check the provider's actual plugin/app directory or use the official listing below. Do not invent menu names, settings, availability, or a provider setup path.
5. Guide the owner through only the provider-side installation/authorization and the one-time phone-side agent bootstrap that cannot be performed before MCP access exists.
6. Once the AI can reach the phone, the AI must perform the remaining Toolkit installation, inspection, setup, and verification itself by following `docs/AI_GUIDE.md`. Do not make the owner copy and run a long sequence of Toolkit commands.

If the AI cannot inspect the owner's plugin directory or account availability, it must say that it cannot verify that account-specific state. It must not label the plugin unavailable based only on the absence of an active connection.

## 2. ChatGPT — use the dedicated Remote Desktop Commander plugin

**Do not create a custom MCP connector as the normal ChatGPT setup path.** ChatGPT has a dedicated plugin named **Remote Desktop Commander**, published by **Desktop Commander**.

The AI must check for this exact plugin first:

- Official ChatGPT plugin listing: https://chatgpt.com/plugins/plugin_asdk_app_6a057d268ebc81919918d37eec718425
- Official plugin information: https://openai.com/business/plugins/remote-desktop-commander/

In the ChatGPT Android app, use the plugin directory rather than creating a custom MCP server:

1. Open the ChatGPT side menu and open **Plugins**. If the app shows **Apps** instead, open **Apps**.
2. Search for **Remote Desktop Commander** and confirm the developer is **Desktop Commander**.
3. Open its listing and select **Install plugin**.
4. Complete the plugin's **Connect / sign-in / authorization** flow if ChatGPT prompts for it, using the same Remote Desktop Commander account that will authorize the phone.
5. In the conversation, select the installed plugin from the **+** menu / **Plugins** picker, or invoke it with **@Remote Desktop Commander** when that option is available.

The AI must then verify that Remote Desktop Commander tools are actually available in the current conversation and use them. If the plugin is installed but not selected for the conversation, ask the owner to select it there; do not ask them to reinstall it. If the listing is absent, check the account, workspace and app-surface availability before concluding it cannot be used.

**Do not tell the owner to enable Developer Mode, open Advanced settings, choose Create a new connector, or paste the MCP URL into ChatGPT Android.** Those are not the dedicated-plugin installation steps. Custom MCP server setup is a separate web-only route; it is not the Android app path for this Toolkit.

Installing the plugin does not by itself mean the phone is paired or online. Complete the phone-side agent setup in section 5, then verify that the plugin can reach this phone.

## 3. Claude

Use the Remote Desktop Commander connector when it is already available in the Claude client's connector list. If the Claude Android app presents the custom connector flow used for this setup, the owner can use:

1. Open **Settings**.
2. Open **Connectors**.
3. Choose **Add custom connector**.
4. Enter the Remote MCP server URL shown in section 5.
5. Complete the Remote Desktop Commander sign-in/authorization flow using the same account used to authorize the phone.

Do not claim that a connector is installed or connected until the actual Claude interface confirms it.

## 4. Grok Android app

The tested Grok Android app does not expose the custom MCP/connector setup surface used by this Toolkit.

Do not invent a Grok Android menu path, tell the owner to create a connector that is not present in that app, or claim that the phone is controllable through this Remote MCP route from the tested Grok Android app.

This finding applies to the tested Grok Android app interface only. Do not generalize it to every Grok product, web/desktop surface, account, or future app version.

## 5. One-time phone-side Desktop Commander setup (only before MCP exists)

This is the only normal shell bootstrap that may require the owner. Before MCP is connected, the AI cannot run commands inside the phone's Termux session. If Termux is absent, the owner must install/open it from one official signing source. If Termux is present, do not reinstall or upgrade it. Node.js/npm are prerequisites only if the phone agent is missing; do not ask the owner to run package updates or install packages blindly. After MCP is connected, the AI must perform all remaining package and Toolkit operations itself.

Check/install Node.js and npm only when actually required by the phone-side bootstrap:

```bash
node -v
npm -v
```

If either command is missing, the owner can install the missing Node.js/npm package using Termux's package manager before the phone agent is started. Do not ask the owner to run these checks or package commands after MCP is already available.

Start the phone-side agent:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

On first run, Desktop Commander may open a browser page or display a device-verification code. Complete the sign-in and device authorization. Use the same Remote Desktop Commander account that the AI plugin/connector will use. Keep the Termux process running while the phone must be reachable.

For a client that genuinely requires a custom Remote MCP server URL, the endpoint is:

```text
https://mcp.desktopcommander.app/mcp
```

This URL is not needed for the dedicated ChatGPT plugin. The Termux `npx ... remote` command runs only in Termux; it is not a server URL.

## 6. Verify the AI reaches this phone (AI performs these checks)

After the plugin/connector and phone agent are both connected, the AI must use its Remote Desktop Commander terminal to run harmless checks itself. Do not ask the owner to copy/paste these commands:

```bash
id
pwd
node -v
command -v ai-info
ai-info --json
```

The results must come from this phone's Termux environment. If the phone is not listed or the checks do not reach Termux, report the observed connection state and troubleshoot that state. Do not claim success merely because the plugin was installed.

## 7. Continue with the Toolkit — AI performs the setup

Once Remote Desktop Commander can reach Termux, the AI must read `docs/AI_GUIDE.md` and `docs/COMMAND_REFERENCE.md`, inspect the real environment and Toolkit state, obtain/locate the release assets, verify the independent trust values and signed package, install or repair the Toolkit, perform supported Wireless ADB bootstrap and WADB Bridge finalization, and verify each stage from actual command output. The AI does these actions through its connected tools. Ask the owner only for Android prompts, permission approvals, or the current pairing code when the documented command explicitly requires them. Do not ask the owner to manually download/extract the Toolkit, run package commands, verify hashes, execute the installer, or run Toolkit commands after the AI has a working Desktop Commander connection.

## Connection boundaries

- The dedicated ChatGPT **Remote Desktop Commander** plugin is the first-choice ChatGPT path.
- The ChatGPT Android plugin flow does not require Developer Mode or manual entry of a custom MCP URL.
- The phone-side Termux agent and the AI-side plugin/connector are separate parts of one connection; both must be online.
- MCP connects the AI to Termux. Wireless ADB is a separate Android debugging connection.
- A working MCP connection does not itself grant Android root access.
- Follow `docs/AI_GUIDE.md` for all subsequent Toolkit setup, commands, safety rules, and verification.