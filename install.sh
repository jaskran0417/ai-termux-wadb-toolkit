#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PREFIX=/data/data/com.termux/files/usr
TERMUX_HOME=/data/data/com.termux/files/home
YES=0

usage() {
  cat <<'TXT'
AI Termux WADB Toolkit v1.0.2 installer

Usage:
  ./install.sh [--yes] [--help]

Options:
  --yes    Non-interactive package installation when dependencies are missing.
  --help   Show this help without changing anything.

Security:
  - requires Node.js to verify the signed release before any changes,
  - requires independently published hashes for this installer and the verifier, plus the release signing-key fingerprint,
  - requires independent trust pins for the release key, installer, and verifier.

Set these environment variables from the separately distributed RELEASE-TRUST-VALUES.txt asset:
  WADB_TRUSTED_RELEASE_KEY_SHA256
  WADB_TRUSTED_INSTALLER_SHA256
  WADB_TRUSTED_VERIFIER_SHA256

Update behavior:
  - backs up the current toolkit and cached Bridge APK,
  - installs the new toolkit commands/docs,
  - replaces ~/.ai-wadb/wadb-bridge.apk with the APK shipped by this release,
  - does not uninstall the Android Bridge app,
  - on the next authenticated ai-info --connect, a newer cached Bridge is
    automatically installed over the older Android Bridge.
TXT
}

while [ $# -gt 0 ]; do
  case "$1" in
    --yes) YES=1; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 2 ;;
  esac
done

COLOR=1
[ -n "${NO_COLOR:-}" ] && COLOR=0
[ ! -t 1 ] && COLOR=0
if [ "$COLOR" -eq 1 ]; then
  R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'
  C=$'\033[36m'; M=$'\033[35m'; B=$'\033[1m'; X=$'\033[0m'
else
  R=""; G=""; Y=""; C=""; M=""; B=""; X=""
fi

title() {
  printf '%s╭────────────────────────────────────────────────────────────╮%s\n' "$M" "$X"
  printf '%s│%s%s      AI TERMUX WADB v1.0.2           %s%s│%s\n' "$M" "$X" "$B" "$X" "$M" "$X"
  printf '%s╰────────────────────────────────────────────────────────────╯%s\n' "$M" "$X"
}

ok(){ printf '%s✓%s %s\n' "$G" "$X" "$*"; }
warn(){ printf '%s!%s %s\n' "$Y" "$X" "$*"; }
die(){ printf '%s✗%s %s\n' "$R" "$X" "$*"; exit 1; }
step(){ printf '\n%s%s%s\n' "$C" "$*" "$X"; printf '%s\n' '────────────────────────────────────────────────────────────'; }

title

[ -d "$PREFIX/bin" ] || die "This installer must run inside Termux."
[ -d "$TERMUX_HOME" ] || die "Termux HOME was not found."
command -v node >/dev/null 2>&1 || die "Node.js is required to verify the signed release. Install it with: pkg install nodejs"
TRUST_PIN="${WADB_TRUSTED_RELEASE_KEY_SHA256:-}"
VERIFIER_PIN="${WADB_TRUSTED_VERIFIER_SHA256:-}"
INSTALLER_PIN="${WADB_TRUSTED_INSTALLER_SHA256:-}"
[[ "$TRUST_PIN" =~ ^[0-9a-fA-F]{64}$ ]] || die "Set WADB_TRUSTED_RELEASE_KEY_SHA256 from an independent official project channel."
[[ "$VERIFIER_PIN" =~ ^[0-9a-fA-F]{64}$ ]] || die "Set WADB_TRUSTED_VERIFIER_SHA256 from an independent official project channel."
[[ "$INSTALLER_PIN" =~ ^[0-9a-fA-F]{64}$ ]] || die "Set WADB_TRUSTED_INSTALLER_SHA256 from an independent official project channel."
actual_verifier_pin="$(sha256sum "$ROOT/security/verify-release.js" | awk '{print $1}')"
actual_installer_pin="$(sha256sum "$ROOT/install.sh" | awk '{print $1}')"
[ "$actual_verifier_pin" = "$VERIFIER_PIN" ] || die "Bootstrap verifier hash does not match the independently published value."
[ "$actual_installer_pin" = "$INSTALLER_PIN" ] || die "Installer hash does not match the independently published value."
node "$ROOT/security/verify-release.js" --root "$ROOT" --expected-fingerprint "$TRUST_PIN" || die "Signed release verification failed. No installation changes were made."
ok "Ed25519 signature, independent key pin, and complete package inventory verified."
node "$ROOT/security/install-path-preflight.js" --root "$ROOT" --prefix "$PREFIX" --home "$TERMUX_HOME" || die "Unsafe installation path detected. No installation changes were made."

step "1/5  Checking required Termux packages"
need=()
command -v python >/dev/null 2>&1 || need+=(python)
command -v adb >/dev/null 2>&1 || need+=(android-tools)
command -v timeout >/dev/null 2>&1 || need+=(coreutils)
command -v flock >/dev/null 2>&1 || need+=(util-linux)
command -v curl >/dev/null 2>&1 || need+=(curl)
command -v git >/dev/null 2>&1 || need+=(git)

API_CLI_MISSING=0
command -v termux-wifi-connectioninfo >/dev/null 2>&1 || API_CLI_MISSING=1

if [ ${#need[@]} -gt 0 ]; then
  warn "Missing required packages: ${need[*]}"
  if [ "$YES" -eq 1 ]; then
    pkg update -y
    pkg install -y "${need[@]}"
    ok "Required packages installed from the current repository candidate."
  else
    echo "Install them with:"
    echo "  pkg install ${need[*]}"
    echo
    read -r -p "Continue installing toolkit files anyway? [y/N] " ans
    case "$ans" in y|Y|yes|YES) ;; *) exit 2 ;; esac
  fi
else
  ok "Required packages are available."
fi

if [ "$API_CLI_MISSING" -eq 1 ]; then
  warn "Optional Termux:API command package is missing (automatic IP detection and Termux notifications will be limited)."
  if [ "$YES" -eq 1 ]; then
    [ ${#need[@]} -gt 0 ] || pkg update -y
    pkg install -y termux-api
    ok "Optional termux-api command package installed."
  else
    echo "Optional: pkg install termux-api"
  fi
else
  ok "Termux:API command package is available."
fi

if /system/bin/pm path com.termux.api >/dev/null 2>&1; then
  ok "Termux:API Android companion app detected."
else
  warn "Termux:API Android companion app is not installed. Core toolkit remains usable."
  warn "For automatic IP detection and notifications, install Termux:API from the same compatible source/signing family as Termux."
fi

[ -f "$ROOT/MANIFEST.sha256" ] || die "Signed SHA-256 manifest is missing."
(cd "$ROOT" && sha256sum -c MANIFEST.sha256 >/dev/null 2>&1) || die "Bundle SHA-256 recheck failed after signature verification."
ok "Signed bundle manifest recheck passed."

if command -v node >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
  ok "Node.js/npx available for Desktop Commander."
else
  warn "Node.js/npx not detected. Remote Desktop Commander requires: pkg install nodejs npm"
fi

# Serialize upgrades so concurrent installers cannot interleave snapshots and writes.
node "$ROOT/security/install-path-preflight.js" --root "$ROOT" --prefix "$PREFIX" --home "$TERMUX_HOME" || die "Installation paths changed before acquiring the installer lock."
lock_file="$TERMUX_HOME/.ai-wadb.install.lock"
(umask 077; : >> "$lock_file")
exec 9>>"$lock_file"
flock -n 9 || die "Another WADB installer is already running."

step "2/5  Backing up current toolkit"
stamp="$(date +%Y%m%d-%H%M%S)-$$"
backup="$TERMUX_HOME/.ai-wadb/backups/$stamp"
mkdir -p "$backup" "$TERMUX_HOME/.ai-wadb"

rollback_dir="$backup/rollback"
declare -a rollback_targets=()
declare -a rollback_states=()
transaction_active=0
install_committed=0

snapshot_target() {
  local target="$1"
  local index="${#rollback_targets[@]}"
  rollback_targets+=("$target")
  if [ -e "$target" ] || [ -L "$target" ]; then
    cp -a -- "$target" "$rollback_dir/$index"
    rollback_states+=(1)
  else
    rollback_states+=(0)
  fi
}

finish_exit() {
  local rc=$?
  trap - EXIT INT TERM
  if [ "$transaction_active" -eq 1 ] && [ "$install_committed" -eq 0 ]; then
    echo
    warn "Installation did not commit. Restoring the pre-install toolkit snapshot."
    local rollback_failed=0
    local i
    for ((i=${#rollback_targets[@]} - 1; i >= 0; i--)); do
      local target="${rollback_targets[$i]}"
      rm -rf -- "$target" || rollback_failed=1
      if [ "${rollback_states[$i]}" -eq 1 ]; then
        mkdir -p -- "$(dirname "$target")" || rollback_failed=1
        cp -a -- "$rollback_dir/$i" "$target" || rollback_failed=1
      fi
    done
    if [ "$rollback_failed" -eq 0 ]; then
      ok "Rollback completed; pre-install files and modes were restored."
    else
      echo "ROLLBACK=INCOMPLETE"
      echo "Recovery snapshot: $rollback_dir"
      rc=90
    fi
  fi
  exit "$rc"
}
trap finish_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

backup_one() {
  local p="$1"
  [ -e "$p" ] || [ -L "$p" ] || return 0
  cp -a "$p" "$backup/$(basename "$p")"
}

commands=(
  ai-info phone-capabilities wireless-debug-on wireless-debug-off
  wireless-debug-status adb-mdns-discover wireless-adb-connect wadb-bootstrap
  wadb-local-on wadb-local-status wadb-local-off wadb-local-shell
  wadb-integrity-check
  wadb-mcp-start wadb-mcp-stop wadb-mcp-restart wadb-mcp-status wadb-mcp-log
  wadb-mcp-logout wadb-mcp-watchdog wadb-mcp-watchdog-start wadb-mcp-job wadb-notify
  wadb-mcp-github-sync wadb-mcp-github-config wadb-mcp-github-test
  wadb-mcp-recovery-setup wadb-mcp-recovery-disable wadb-toolkit-uninstall
)
for f in "${commands[@]}"; do backup_one "$PREFIX/bin/$f"; done
backup_one "$PREFIX/libexec/ai-wadb/wadb-common"
backup_one "$PREFIX/libexec/ai-wadb/mcp-recovery-common"
backup_one "$PREFIX/libexec/ai-wadb/github-control-fetch"
backup_one "$PREFIX/libexec/ai-wadb/wadb-local-bridge"
backup_one "$PREFIX/libexec/ai-wadb/verify-installed.js"
backup_one "$PREFIX/libexec/ai-wadb/wadb-bridge.apk.sha256"
backup_one "$TERMUX_HOME/.ai-wadb/release-integrity"
backup_one "$TERMUX_HOME/AI_ENVIRONMENT.md"
backup_one "$TERMUX_HOME/AI_READ_ME_FIRST.md"
backup_one "$TERMUX_HOME/.bashrc"
backup_one "$TERMUX_HOME/.termux/termux.properties"
backup_one "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk"
ok "Backup: $backup"

# Snapshot every path that may be replaced or removed. The journal records
# absence as well as existing files, so rollback also removes newly created files.
mkdir -p "$rollback_dir"
node "$ROOT/security/install-path-preflight.js" --root "$ROOT" --prefix "$PREFIX" --home "$TERMUX_HOME" || die "Installation paths changed during preflight. No toolkit files were written."
for f in "${commands[@]}"; do snapshot_target "$PREFIX/bin/$f"; done
snapshot_target "$PREFIX/libexec/ai-wadb"
snapshot_target "$TERMUX_HOME/AI_WADB_DOCS"
snapshot_target "$TERMUX_HOME/AI_ENVIRONMENT.md"
snapshot_target "$TERMUX_HOME/AI_READ_ME_FIRST.md"
snapshot_target "$TERMUX_HOME/.bashrc"
snapshot_target "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk"
snapshot_target "$TERMUX_HOME/.ai-wadb/release-integrity"
snapshot_target "$TERMUX_HOME/.ai-wadb/pairing.pending"
transaction_active=1

mkdir -p "$TERMUX_HOME/AI_WADB_DOCS" "$PREFIX/libexec/ai-wadb"
# Remove documentation files shipped by earlier layouts while preserving any
# unrelated files the owner may have placed in this directory.
obsolete_docs=(
  README_FIRST.md
  REMOTE_MCP_AI_CONNECTION.md
  START_HERE.md
  USER_SETUP.md
  TROUBLESHOOTING.md
  RECOVERY_TROUBLESHOOTING.md
  PROMPTS_FOR_AI.md
  SHIZUKU_OPTIONAL.md
  READ_THIS_FIRST_AI.md
  AI_RULES.md
  ANDROID_ARCHITECTURE.md
  FEATURES_AND_BENEFITS.md
  SECURITY_AND_ROLLBACK.md
  INTEGRITY_VERIFICATION.md
  RECOVERY_GITHUB.md
)
for obsolete in "${obsolete_docs[@]}"; do
  rm -f "$TERMUX_HOME/AI_WADB_DOCS/$obsolete"
done
unset obsolete_docs
ok "Rollback snapshot captured before the first toolkit write."

step "3/5  Installing commands"
for f in "${commands[@]}"; do
  install -m 755 "$ROOT/scripts/$f" "$PREFIX/bin/$f"
done
install -m 755 "$ROOT/scripts/wadb-common" "$PREFIX/libexec/ai-wadb/wadb-common"
install -m 755 "$ROOT/scripts/mcp-recovery-common" "$PREFIX/libexec/ai-wadb/mcp-recovery-common"
install -m 755 "$ROOT/scripts/github-control-fetch" "$PREFIX/libexec/ai-wadb/github-control-fetch"
install -m 755 "$ROOT/native/wadb-local-bridge" "$PREFIX/libexec/ai-wadb/wadb-local-bridge"
install -m 755 "$ROOT/security/verify-installed.js" "$PREFIX/libexec/ai-wadb/verify-installed.js"
expected_apk_sha="$(sha256sum "$ROOT/apk/wadb-bridge.apk" | awk '{print $1}')"
printf '%s  wadb-bridge.apk\n' "$expected_apk_sha" > "$PREFIX/libexec/ai-wadb/wadb-bridge.apk.sha256"
chmod 644 "$PREFIX/libexec/ai-wadb/wadb-bridge.apk.sha256"
ok "Toolkit commands and secure local bridge installed."

step "4/5  Installing documentation and WADB Bridge"
install -m 644 "$ROOT/AI_ENVIRONMENT.md" "$TERMUX_HOME/AI_ENVIRONMENT.md"
rm -f "$TERMUX_HOME/AI_READ_ME_FIRST.md"
ln -s "$TERMUX_HOME/AI_ENVIRONMENT.md" "$TERMUX_HOME/AI_READ_ME_FIRST.md"

for f in "$ROOT"/docs/*.md; do
  install -m 644 "$f" "$TERMUX_HOME/AI_WADB_DOCS/$(basename "$f")"
done
install -m 644 "$ROOT/README.md" "$TERMUX_HOME/AI_WADB_DOCS/README.md"
install -m 644 "$ROOT/toolkit-manifest.json" "$TERMUX_HOME/AI_WADB_DOCS/toolkit-manifest.json"
cp "$ROOT/apk/wadb-bridge.apk" "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk"
chmod 600 "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk"
expected_cached_sha="$(awk 'NR==1 {print $1}' "$PREFIX/libexec/ai-wadb/wadb-bridge.apk.sha256")"
actual_cached_sha="$(sha256sum "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk" | awk '{print $1}')"
[ "$expected_cached_sha" = "$actual_cached_sha" ] || die "Cached WADB Bridge APK failed SHA-256 verification."

release_integrity="$TERMUX_HOME/.ai-wadb/release-integrity"
rm -rf "$release_integrity"
mkdir -p "$release_integrity"
cp "$ROOT/security/installed-files.json" "$release_integrity/installed-files.json"
cp "$ROOT/security/installed-files.json.sig" "$release_integrity/installed-files.json.sig"
cp "$ROOT/trust/release-ed25519-public.pem" "$release_integrity/release-ed25519-public.pem"
cp "$ROOT/MANIFEST.sha256" "$release_integrity/MANIFEST.sha256"
cp "$ROOT/MANIFEST.sha256.sig" "$release_integrity/MANIFEST.sha256.sig"
printf 'SHA256 %s\n' "$TRUST_PIN" > "$release_integrity/trusted-key-fingerprint.txt"
chmod 700 "$release_integrity"
chmod 600 "$release_integrity"/*
rm -f "$TERMUX_HOME/.ai-wadb/pairing.pending"
ok "Documentation and WADB Bridge v1.5 package installed."

BASHRC="$TERMUX_HOME/.bashrc"
touch "$BASHRC"
if ! grep -q '^# >>> AI_TERMUX_WADB_BUNDLE >>>$' "$BASHRC" 2>/dev/null; then
  cat >> "$BASHRC" <<'EOF'

# >>> AI_TERMUX_WADB_BUNDLE >>>
export AI_SHARED_ENVIRONMENT=1
export AI_INFO_CMD=ai-info
export AI_ENVIRONMENT_DOC="/data/data/com.termux/files/home/AI_ENVIRONMENT.md"
export PHONE_CAPABILITIES_CMD=phone-capabilities
export WADB_CONNECT_CMD=wireless-adb-connect
export WADB_BOOTSTRAP_CMD=wadb-bootstrap
# <<< AI_TERMUX_WADB_BUNDLE <<<
EOF
fi

step "5/5  Verifying installation"
for f in "$PREFIX/bin/ai-info" "$PREFIX/bin/phone-capabilities" \
         "$PREFIX/bin/wireless-debug-on" "$PREFIX/bin/wireless-debug-off" \
         "$PREFIX/bin/wireless-debug-status" "$PREFIX/bin/wireless-adb-connect" \
         "$PREFIX/bin/wadb-bootstrap" "$PREFIX/bin/wadb-local-on" \
         "$PREFIX/bin/wadb-local-status" "$PREFIX/bin/wadb-local-off" \
         "$PREFIX/bin/wadb-integrity-check" "$PREFIX/bin/wadb-mcp-start" \
         "$PREFIX/bin/wadb-mcp-stop" "$PREFIX/bin/wadb-mcp-restart" \
         "$PREFIX/bin/wadb-mcp-status" "$PREFIX/bin/wadb-mcp-log" "$PREFIX/bin/wadb-mcp-logout" \
         "$PREFIX/bin/wadb-mcp-watchdog" "$PREFIX/bin/wadb-mcp-watchdog-start" "$PREFIX/bin/wadb-notify" \
         "$PREFIX/bin/wadb-mcp-job" "$PREFIX/bin/wadb-mcp-github-config" \
         "$PREFIX/bin/wadb-mcp-github-test" "$PREFIX/bin/wadb-mcp-recovery-setup" \
         "$PREFIX/bin/wadb-toolkit-uninstall" \
         "$PREFIX/libexec/ai-wadb/wadb-common" \
         "$PREFIX/libexec/ai-wadb/mcp-recovery-common" \
         "$PREFIX/libexec/ai-wadb/github-control-fetch"; do
  bash -n "$f"
done
node --check "$ROOT/security/verify-release.js"
node --check "$PREFIX/libexec/ai-wadb/verify-installed.js"
python - "$PREFIX/bin/adb-mdns-discover" "$PREFIX/bin/wadb-local-shell" <<'PY'
import ast
from pathlib import Path
import sys
for name in sys.argv[1:]:
    ast.parse(Path(name).read_text(encoding="utf-8"), filename=name)
PY
[ -x "$PREFIX/libexec/ai-wadb/wadb-local-bridge" ] || die "Secure local bridge binary was not installed."
WADB_TRUSTED_RELEASE_KEY_SHA256="$TRUST_PIN" "$PREFIX/bin/wadb-integrity-check" || die "Installed-file integrity verification failed."
ok "Shell/Python/native and installed-integrity validation passed."
install_committed=1
transaction_active=0
ok "Install transaction committed. Rollback is no longer armed."

# Keep the five newest toolkit rollback snapshots; older toolkit-created
# backups are housekeeping data and are safe to prune after a verified install.
if [ -d "$TERMUX_HOME/.ai-wadb/backups" ]; then
  old_backups="$(find "$TERMUX_HOME/.ai-wadb/backups" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r | tail -n +6)"
  if [ -n "$old_backups" ]; then
    while IFS= read -r d; do
      [ -n "$d" ] && rm -rf "$TERMUX_HOME/.ai-wadb/backups/$d"
    done <<< "$old_backups"
    ok "Old toolkit backups pruned; newest five retained."
  fi
fi

printf '\n%s%sINSTALLATION COMPLETE%s\n' "$B" "$G" "$X"
printf '%s\n' '────────────────────────────────────────────────────────────'
echo "Human dashboard:   ai-info"
echo "Control Center:    ai-info"
echo "AI state:          ai-info --json"
echo "Local shell status: ai-info --local"
echo "Local shell exec:   wadb-local-shell -c 'id'"
echo "Read-only doctor:  ai-info --doctor"
echo
echo "Recommended order:"
echo "  1. Desktop Commander MCP (if not already connected)"
echo "  2. ai-info --connect"
echo "  3. optional: wadb-mcp-recovery-setup"
echo "  4. optional: GitHub recovery"
echo
warn "Owner labels are optional."
warn "Do not use MCP logout for normal restart/recovery."
