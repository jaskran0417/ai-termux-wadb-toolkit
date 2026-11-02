# Remote MCP Connection — ChatGPT, Claude and Grok (Android)

This document is the dedicated reference for connecting the phone-side Desktop Commander service to an AI client. The provider steps below are the Android-app setup paths tested by the toolkit owner. Follow the app-specific instructions here; do not substitute a guessed menu path or a different platform's instructions.

## 1. On the phone — Termux

Install Node.js and npm if they are not already installed:

```bash
pkg update
pkg install nodejs npm
```

Check that Node.js, npm and npx are available:

```bash
node -v
npm -v
npx -v
```

Start Desktop Commander in Termux and keep the terminal/process open while the AI needs phone access:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

On first run, it may open a browser page or display a verification code. Complete the sign-in/verification and authorize the phone.

## 2. Remote MCP server URL

Use this as the Remote MCP server URL in an AI app that exposes the required connector/custom MCP setup:

```text
https://mcp.desktopcommander.app/mcp
```

The Termux command in section 1 starts the phone-side Desktop Commander process. It is not the server URL and must not be pasted into the AI app's URL field.

## 3. ChatGPT Android app

Use the following path in the ChatGPT Android app:

1. Open **Settings**.
2. Open **Apps & Connectors**.
3. Open **Advanced settings**.
4. Enable **Developer mode** if that option is available.
5. Choose **Create a new connector**.
6. Paste the Remote MCP server URL from section 2.
7. Complete the sign-in/authorization flow using the same account used when authorizing the phone.

## 4. Claude Android app

Use the following path in the Claude Android app:

1. Open **Settings**.
2. Open **Connectors**.
3. Choose **Add custom connector**.
4. Paste the Remote MCP server URL from section 2.
5. Complete the sign-in/authorization flow.

Keep the Termux Desktop Commander process running on the phone.

## 5. Grok Android app

The tested Grok Android app does not expose the public custom MCP/connector setup path used in the ChatGPT and Claude app steps above.

Do not invent a Grok menu path, tell the user to create a custom connector in that app, or claim that the phone can be controlled through this Desktop Commander Remote MCP route from the tested Grok Android app when the required connector interface is not present.

This finding is scoped to the tested Grok Android app interface. Do not turn it into a universal claim about every Grok product, web/desktop surface, account, or future app version.

## 6. Check that the AI reaches the phone

After the AI app reports that the connector is connected, use harmless checks through its Desktop Commander terminal:

```bash
id
pwd
node -v
command -v ai-info
ai-info
```

The output must come from the phone's Termux environment. A normal Termux shell runs as the Termux app UID; this connection does not itself grant Android root access.

## 7. Keep the connection available

Keep the Termux process started in section 1 running while the AI needs access. For a phone that has already been authorized, the phone-side command remains:

```bash
npx @wonderwhy-er/desktop-commander@0.3.1 remote
```

The existing authorization may be reused. Complete browser verification again only when the Desktop Commander sign-in flow requests it.

## Connection boundaries

- The Termux command runs on the phone.
- The HTTPS URL is entered in the AI app's connector/server URL field.
- ChatGPT and Claude use their respective Android-app paths in this document.
- Do not offer an unverified Grok Android connector path.
- Desktop Commander MCP and Wireless ADB are separate connections. MCP is the AI-to-Termux connection; Wireless ADB is a separate Android debugging transport.
- Once MCP is connected, follow `docs/AI_GUIDE.md` and `docs/COMMAND_REFERENCE.md` for toolkit operations and verification.
