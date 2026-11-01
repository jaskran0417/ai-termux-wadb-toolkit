# Ready-made Prompts for Any AI

## A. User gives the ZIP/MD before MCP exists

> I am giving you the AI Termux WADB Toolkit. Read `READ_THIS_FIRST_AI.md` and the included instructions before replying. Do not invent another setup path. First guide me through the minimum steps to connect Desktop Commander Remote MCP to this AI. Until MCP is connected, only give me the manual actions that are truly required. Once MCP is connected, use MCP to run supported setup commands yourself and verify each result.

## B. MCP is connected

> Desktop Commander MCP is connected. Continue the WADB toolkit setup using the included instructions. Run `ai-info --json` first, use the documented helpers, and do the shell work yourself instead of asking me to type commands. Ask me only for genuine user actions such as a permission dialog or temporary pairing code.

## C. Full recommended setup

> Set up the toolkit in the recommended order: verify MCP, install/update the toolkit, configure Wireless ADB using the existing trusted key first, verify WADB Bridge, then offer automatic MCP recovery. Do not configure GitHub recovery unless I choose it. Verify every stage.

## D. Automatic MCP recovery

> Set up automatic Desktop Commander recovery using the toolkit instructions. Preserve the saved MCP login. Do not use logout. Configure local watchdog/boot recovery, handle the one-time WADB Bridge RUN_COMMAND permission if needed, and verify recovery status.

## E. GitHub recovery — AI-assisted

> Set up optional GitHub MCP recovery using the toolkit instructions. Use my connected GitHub connector if available; its account may differ from the phone-side GitHub account/token as long as the AI can write and the phone can read the same control file. Prefer a private control repository with a one-repo Contents: Read-only phone token for least privilege; if I want zero new credential setup, offer the existing Termux gh login; also explain the public no-phone-credential option. Never ask me to paste a GitHub token into AI chat. If the connector cannot create a repository, ask me only to create/select it, then continue yourself. Run wadb-mcp-github-test, establish the first-sync baseline, and verify a newer-generation STATUS command before performing STOP through GitHub followed by START through GitHub. Confirm the same saved MCP authorization returns. Never put LOGOUT_MCP in the GitHub control channel.

## F. GitHub recovery — manual

> Give me the manual GitHub MCP recovery procedure from the toolkit. Do not change GitHub yourself. Show the exact repository/branch/file, JSON format, generation rule, phone configuration command, verification procedure, and rollback.

## G. Diagnostics only

> Run the toolkit read-only diagnostics. Read the instructions first, run `ai-info --json` and `ai-info --doctor`, and do not change settings or install anything.
