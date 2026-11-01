# Optional GitHub Remote MCP Recovery

Version: 1.7.5

GitHub recovery is an **independent control path** for restoring Remote Desktop Commander when Desktop Commander MCP itself is offline.

This document describes the GitHub recovery behavior implemented by this toolkit and the required setup and failure-handling rules.

## 1. Architecture and trust boundary

```text
AI / ChatGPT
├─ Desktop Commander connector → normal phone control while MCP is online
└─ GitHub connector            → writes recovery control while MCP may be offline

GitHub repository / branch / wadb-control.json
                  ↓
phone-side WADB watchdog
                  ↓
START_MCP / STOP_MCP / RESTART_MCP / STATUS
                  ↓
Desktop Commander starts with its already-saved device authorization
```

The phone does **not** need the AI's GitHub connector credential.

The AI-side GitHub identity and phone-side GitHub identity do **not** have to be the same account.

Required access is directional:

```text
AI-side GitHub connector/account
  needs WRITE access to the recovery control file.

Phone-side read method
  needs READ access to the same repository / branch / file.

public mode
  needs no phone GitHub account at all.
```

The GitHub recovery channel deliberately does **not** accept `LOGOUT_MCP`.

## 2. Requirements that apply to every mode

Before GitHub recovery is configured:

1. Desktop Commander must have authenticated successfully at least once.
2. `wadb-mcp-recovery-setup` must have been run.
3. `wadb-mcp-status` should show `credentials=yes`.
4. The local watchdog must be running.
5. The phone needs network access to GitHub.
6. The AI's GitHub connector/account must be able to write the chosen control repository.
7. The repository, branch, and control file must exist before the phone can read them.

The toolkit installer guarantees the shared command dependencies, including Python, curl, and git. GitHub CLI `gh` is mode-specific and is only required for `gh` mode.

Normal recovery setup:

```bash
wadb-mcp-recovery-setup
wadb-mcp-status
```

Do not continue to a destructive STOP/START test until saved Desktop Commander credentials and the watchdog are both confirmed.

## 3. Control file format

The control file is JSON:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": 1,
  "action": "STATUS"
}
```

The phone validates all four control fields before executing anything:

- `schema` must be exactly `1`.
- `generation` must be a non-negative integer.
- `target` must exactly match the configured MCP target.
- `action` must be one of the allowed actions.

Allowed actions:

```text
START_MCP
STOP_MCP
RESTART_MCP
STATUS
```

Anything else is ignored/rejected.

### Generation rule

Every new command must use a generation greater than the last processed generation.

The normal writer flow is:

```text
read current control JSON
→ read current generation
→ increment generation
→ set the new action
→ update/commit the file
```

When a GitHub connector requires the current file/blob SHA for an update, the AI must fetch the current file first and use the current SHA. If another writer changes the file first, refetch and retry instead of overwriting from stale state.

## 4. Safe first-sync baseline

A control channel is identified by:

```text
owner/repo @ branch : file # target
```

When the phone sees a **new control identity** for the first time, it records the current generation as a baseline and does **not** execute the action already present in that file.

Example:

```text
new repo/file contains:
generation=20
action=STOP_MCP

first phone sync:
→ generation 20 becomes baseline
→ STOP_MCP is NOT executed

next GitHub command:
generation=21
action=STOP_MCP
→ executed
```

This prevents an old or pre-existing control file from unexpectedly stopping/restarting MCP during setup.

Changing only the phone read method (`gh` → `token`, for example) while keeping the same owner/repo/branch/file/target does not create a new control identity.

Changing the repository, branch, file, or target does.

`wadb-mcp-github-test` reports:

```text
BASELINE_ON_NEXT_SYNC=yes|no
ACTION_EXECUTED=no
```

The test command is read-only with respect to recovery actions.

## 5. Three phone-side read methods

The AI always writes through its own authorized GitHub connector. These modes only determine how the **phone reads** the control file.

### Method A — private repo + fine-grained read-only token

Use this when the recovery file should stay private and you want a narrow phone credential.

The token should be restricted to the recovery repository and provide only the repository-content read access required to read the control file.

Do not paste the token into AI chat.
Do not put it directly in a shell command.
Do not put it in the control JSON.

Store it privately from an interactive Termux session:

```bash
umask 077
mkdir -p ~/.ai-wadb/mcp-recovery
read -rsp "GitHub read-only token: " GH_READ_TOKEN
printf '%s' "$GH_READ_TOKEN" > ~/.ai-wadb/mcp-recovery/github-read-token
unset GH_READ_TOKEN
echo
chmod 600 ~/.ai-wadb/mcp-recovery/github-read-token
```

The toolkit accepts token-file mode `600` or read-only `400`; broader permissions are rejected.

Configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PRIVATE_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode token

wadb-mcp-github-test
```

Phone requirements:

```text
curl        required
GitHub CLI  not required
gh login    not required
phone GitHub account login through gh  not required
local token file  required
```

The token's account does not have to match the AI connector account. It only needs GitHub-granted read access to the configured private repository.

### Method B — existing GitHub CLI login (`gh`)

Use this when Termux already has a GitHub CLI login and simplicity is more important than giving the phone the narrowest possible credential.

Install `gh` if needed:

```bash
pkg install gh
```

Authenticate in normal Termux HOME:

```bash
gh auth login
gh auth status
```

Browser/device authorization is a genuine user action when GitHub requests it.

Then configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PRIVATE_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode gh

wadb-mcp-github-test
```

Phone requirements:

```text
gh package   required
gh login     required
token file   not required
repo         may be private if this gh login can read it
```

The GitHub account logged into `gh` does not have to be the same account connected to the AI. It only needs read access to the configured repository.

The phone reads with `gh api`.

### Method C — public repository, anonymous phone read

Use this when you want zero GitHub credential on the phone.

Configure:

```bash
wadb-mcp-github-config \
  --owner YOUR_REPO_OWNER \
  --repo YOUR_PUBLIC_REPO \
  --branch wadb-control \
  --file wadb-control.json \
  --target DEFAULT \
  --mode public

wadb-mcp-github-test
```

Phone requirements:

```text
GitHub account/login on phone  not required
gh package                     not required
token file                     not required
git                            required
curl                           required
repository                     must be publicly readable
```

The public control file must contain no passwords, tokens, ADB keys, logs, device secrets, or personal data.

Anyone can read a public control repository, but only identities with repository write permission should be able to change the control file.

#### Public-mode freshness rule

The toolkit does **not** trust a raw branch URL directly for recovery control because branch-based raw content can briefly lag after a commit.

Public mode resolves the current branch head anonymously with:

```text
git ls-remote
```

with interactive prompting disabled and the Git credential helper disabled for that lookup. It then fetches the control file by that immutable commit SHA.

This is required both for reliable generation changes and to keep `public` mode independent from any GitHub credential that may exist elsewhere in Termux.

## 6. Auto mode

`--mode auto` tries in this order:

```text
1. public anonymous read
2. local token file
3. existing gh login
```

Use explicit `public`, `token`, or `gh` for production recovery so the active trust model is obvious.

`wadb-mcp-github-test` reports both:

```text
MODE_REQUESTED=
MODE_USED=
```

## 7. Configure the GitHub side before the phone side

The AI's GitHub connector should prepare a recovery channel while MCP is still online.

Recommended initial control file:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": 1,
  "action": "STATUS"
}
```

Use `STATUS` as the initial action because it is non-destructive.

If the GitHub connector can create the repository/branch/file, the AI can do that work. If connector capabilities do not support repository creation, the user may need to create/select the repository once; after that the AI can manage the control file when its connector has write permission.

After configuring the phone read method:

```bash
wadb-mcp-github-test
wadb-mcp-github-sync
wadb-mcp-status
```

The first sync of a new control identity baselines the current generation without executing its current action.

## 8. What each action actually does

### `START_MCP`

The phone sets desired MCP state to online and starts/reuses Desktop Commander with the configured MCP HOME.

Saved `.desktop-commander-device/device.json` authorization is preserved and reused.

### `STOP_MCP`

The phone sets desired MCP state to offline and stops the matching Desktop Commander process.

The **WADB recovery watchdog remains running** and continues checking GitHub. This is why a later GitHub `START_MCP` can recover Desktop Commander while MCP itself is offline.

### `RESTART_MCP`

The phone stops the matching Desktop Commander process, waits briefly, then starts it again and returns desired state to online.

### `STATUS`

`STATUS` refreshes the phone's local recovery status file.

It does **not** upload a response to GitHub.

The phone-side design is intentionally read-only, so an AI whose only surviving channel is GitHub cannot query live phone status from the `STATUS` action alone. After MCP returns, use:

```bash
wadb-mcp-status
ai-info --recovery
```

## 9. Verify repository read

Run:

```bash
wadb-mcp-github-test
```

A healthy result contains values similar to:

```text
GITHUB_READ=PASS
MODE_REQUESTED=gh
MODE_USED=gh
SCHEMA=1
GENERATION=...
ACTION=...
TARGET=DEFAULT
EXPECTED_TARGET=DEFAULT
GITHUB_CONTROL_VALID=PASS
ACTION_EXECUTED=no
```

If `BASELINE_ON_NEXT_SYNC=yes`, that is not a failure. It means the current generation will be recorded without executing the current action on the next sync.

## 10. Verify command processing

After baseline is established, have the GitHub writer advance the file to a newer generation with:

```json
{
  "schema": 1,
  "target": "DEFAULT",
  "generation": NEXT_GENERATION,
  "action": "STATUS"
}
```

Then either wait for the watchdog or run while MCP is online:

```bash
wadb-mcp-github-sync
```

Verify:

```bash
tail ~/.ai-wadb/mcp-recovery/events.log
wadb-mcp-status
```

The event log should contain:

```text
GITHUB action=STATUS generation=...
```

## 11. Verify offline recovery

Do this only after repository read and newer-generation STATUS verification succeed.

1. Fetch the current control JSON through the AI's GitHub connector.
2. Write a newer generation with `STOP_MCP`.
3. Wait for the watchdog. Desktop Commander should go offline.
4. Do **not** use Desktop Commander for the next step; it is intentionally offline.
5. Through the independent GitHub connector, fetch the current file again.
6. Write another newer generation with `START_MCP`.
7. Wait for the phone watchdog.
8. Confirm the same Desktop Commander device comes back with saved authorization.
9. Verify the phone event log after MCP returns.

Expected event sequence:

```text
GITHUB action=STOP_MCP generation=N
STOP_MCP

GITHUB action=START_MCP generation=N+1
START_MCP pid=...
```

Never use `remote --logout` or `wadb-mcp-logout` for recovery verification. Logout deletes authorization and is intentionally different from stop/restart.

## 12. Watchdog timing

The default watchdog interval is approximately 15 seconds.

A newly committed GitHub command therefore may take roughly one polling interval before the phone processes it, plus the time Desktop Commander itself needs to reconnect.

The watcher reloads its recovery configuration on every loop, so safe toolkit/config updates do not require a reboot.

## 13. Failure interpretation

`GITHUB_READ=FAIL` means the phone could not obtain the configured control file.

Common toolkit error states:

```text
public_read_failed
  public repo/branch/file unreachable, or anonymous git/curl read failed

gh_read_failed
  gh is missing/not authenticated, repo is inaccessible, or gh API read failed

token_read_failed
  token file/credential is invalid, expired, insufficient, or repo is inaccessible

invalid_control_json
  fetched content is not valid JSON

unsupported_schema
  schema is not 1

invalid_generation
  generation is not an integer

invalid_action
  action is outside the four-command whitelist

target_mismatch
  wadb-mcp-github-test reports this when the file targets another MCP environment
```

Mode-specific setup commands perform local prerequisite checks before changing the recovery configuration.

For token mode, a missing token file is rejected and the existing config is left unchanged.

## 14. Security rules

Prefer a private repository with a one-repository read-only phone token when least privilege matters most.

`gh` mode is convenient but its logged-in account may have broader GitHub permissions than recovery needs.

Public mode carries no phone GitHub credential but exposes the control file publicly.

Never:

- put the AI connector credential on the phone,
- paste a phone token into AI chat,
- store a token in the control JSON,
- use a public repository for secrets/logs/personal data,
- add `LOGOUT_MCP` to the GitHub action set,
- reduce generation to replay an old command.

If repository write access is suspected compromised, disable GitHub recovery and secure the repository/account.

## 15. Disable GitHub polling

```bash
wadb-mcp-github-config --off
```

This disables GitHub polling but does not delete:

```text
local MCP watchdog
Desktop Commander saved authorization
ADB keys
WADB Bridge permissions
```

## 16. Verification commands

```bash
wadb-mcp-github-test
wadb-mcp-status
ai-info --recovery
```

For a full recovery proof, also inspect:

```bash
tail ~/.ai-wadb/mcp-recovery/events.log
```


## Current MCP recovery state model

The toolkit keeps **automatic recovery** separate from the desired Desktop Commander MCP state.

- `recovery_enabled=yes|no` controls whether the watchdog/Android recovery path is allowed to run.
- `mcp_desired=online|offline` records whether Desktop Commander itself should be running.
- `mcp_actual=online|offline` reports the observed process state.
- `mcp_process_count` reports matching Desktop Commander processes for the configured MCP HOME.

`wadb-mcp-stop` changes only the MCP desired state to `offline` and stops Desktop Commander. It preserves saved authorization and does not disable recovery. When recovery is enabled, the watchdog remains available, continues its GitHub polling cycle, and can accept a later `START_MCP`.

`wadb-mcp-recovery-disable` is the separate master recovery-off operation. It stops the watchdog and marks recovery disabled, but it does not stop or log out an already-running Desktop Commander process and does not delete its saved authorization.

If the watcher dies while recovery is enabled and MCP is intentionally offline, `wadb-mcp-job` may restore the watcher while leaving MCP offline. This lets a later GitHub `START_MCP` work without incorrectly turning MCP on during watcher restoration.

The normal watchdog interval is 15 seconds. The WADB Bridge Android recovery alarm is a slower fallback and remains separate from the 15-second Termux watchdog.

### Notifications

Recovery notifications are local Android notifications; no Firebase/FCM or external notification cloud service is required.

When both the Termux `termux-api` command package and the compatible Termux:API Android companion app are available, Termux can notify on state transitions such as watchdog start, MCP start/stop/recovery, GitHub recovery, and recovery enable/disable. Successful 15-second heartbeat checks remain silent.

WADB Bridge v1.5 (versionCode 6) also has a native **WADB Recovery** notification channel for Android-side boot, package-replaced, and explicit recovery-check transitions. Recurring fifteen-minute alarm checks are silent. On Android 13 and later, notification permission may be requested; denying notification permission suppresses notifications but does not disable recovery.

### Termux:API is an optional capability

The two Termux:API pieces are separate:

1. Termux command package: `pkg install termux-api`
2. Android companion app: Termux:API from a compatible signing/source family with the installed Termux app

Installing the command package does not install the Android app, and installing the Android app does not automatically install the Termux command package. Core WADB/MCP functionality remains usable without this optional capability; automatic IP information and Termux-side notifications can be limited or use documented fallbacks.

With `install.sh --yes`, the installer may refresh package metadata and install missing toolkit packages, including the optional `termux-api` command package when absent. It does not perform a blanket `pkg upgrade`. The installer never downloads an arbitrary Termux:API Android APK.

### Foreground viewing versus another MCP

Managed Desktop Commander runs detached. To watch its live output without starting another MCP instance, use:

```bash
wadb-mcp-log --follow
```

Pressing Ctrl+C in this log viewer stops only the viewer. Manually running the raw Desktop Commander `npx ... remote` command is a separate foreground launch attempt and can create a second matching process. `ai-info` and `wadb-mcp-status` report matching process count so duplicates are visible.

Ordinary shell `exit` or removing Termux from Recents is not treated as `wadb-mcp-stop`; detached processes may continue running. Android force-stop or OEM process restrictions can still prevent scheduled recovery until Android permits the affected app/process to run again.
