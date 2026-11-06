#!/data/data/com.termux/files/usr/bin/bash
set -u
PREFIX=/data/data/com.termux/files/usr
TERMUX_HOME=/data/data/com.termux/files/home
STATE="$TERMUX_HOME/.ai-wadb/mcp-recovery"
MODE=""
DRY_RUN=0

usage() {
  cat <<'TXT'
wadb-toolkit-uninstall --all|--keep-recovery [--dry-run]

Modes:
  --all
      Remove all installed/runtime state owned by the WADB toolkit,
      including the toolkit MCP recovery setup.
      Desktop Commander itself stays running/logged in.

  --keep-recovery
      Remove the normal WADB toolkit interface but preserve the minimum
      Bridge + MCP recovery runtime needed for automatic MCP recovery.

Options:
  --dry-run   Print the removal plan without changing anything.
  --help      Show this help.
TXT
}

cat_safety() {
  cat <<'TXT'

Always preserved:
- Termux ADB client key: ~/.android/adbkey and adbkey.pub
- Desktop Commander process/package and saved device login
- user files in /storage/emulated/0/Download
- extracted/source toolkit bundles in Termux HOME
TXT
}

while [ $# -gt 0 ]; do
  case "$1" in
    --all) MODE=all; shift ;;
    --keep-recovery) MODE=keep-recovery; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --help|-h) usage; cat_safety; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 2 ;;
  esac
done
[ -n "$MODE" ] || { usage; cat_safety; exit 2; }

do_rm() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'DRY_RUN_REMOVE=%s\n' "$1"
  else
    rm -rf -- "$1"
  fi
}

remove_bashrc_block() {
  local p="$TERMUX_HOME/.bashrc"
  [ -f "$p" ] || return 0
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY_RUN_EDIT=$p remove AI_TERMUX_WADB_BUNDLE block"
    return 0
  fi
  python - "$p" <<'PY'
from pathlib import Path
import re,sys
p=Path(sys.argv[1])
s=p.read_text(errors="ignore")
s=re.sub(r'\n?# >>> AI_TERMUX_WADB_BUNDLE >>>\n.*?# <<< AI_TERMUX_WADB_BUNDLE <<<\n?', '\n', s, flags=re.S)
p.write_text(s.lstrip('\n'))
PY
}

stop_recovery_watchdog_only() {
  local p cmd
  p="$(cat "$STATE/watchdog.pid" 2>/dev/null || true)"
  [ -n "$p" ] || return 0
  cmd="$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null || true)"
  case "$cmd" in
    *wadb-mcp-watchdog*)
      if [ "$DRY_RUN" -eq 1 ]; then
        echo "DRY_RUN_STOP_RECOVERY_WATCHDOG_PID=$p"
      else
        kill "$p" 2>/dev/null || true
      fi ;;
  esac
}

restore_recovery_termux_setting() {
  local prop="$TERMUX_HOME/.termux/termux.properties"
  local prev="$STATE/allow-external-apps.previous.json"
  [ -r "$prev" ] || return 0
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY_RUN_RESTORE=allow-external-apps previous value"
    return 0
  fi
  python - "$prop" "$prev" <<'PY'
import json,re,sys
from pathlib import Path
prop=Path(sys.argv[1]); prev=Path(sys.argv[2])
data=json.loads(prev.read_text())
original=data.get("original_line")
lines=prop.read_text(errors="ignore").splitlines() if prop.exists() else []
rx=re.compile(r'^\s*(#\s*)?allow-external-apps\s*=')
lines=[line for line in lines if not rx.match(line)]
if original is not None:
    if lines and lines[-1] != "":
        lines.append("")
    lines.append(original)
prop.parent.mkdir(parents=True,exist_ok=True)
prop.write_text("\n".join(lines)+("\n" if lines else ""))
PY
  termux-reload-settings >/dev/null 2>&1 || true
}

remove_recovery_setup_only() {
  stop_recovery_watchdog_only
  restore_recovery_termux_setting
  do_rm "$STATE"
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "MCP_RECOVERY_SETUP=would_remove"
  else
    echo "MCP_RECOVERY_SETUP=removed"
  fi
  echo "DESKTOP_COMMANDER_PROCESS=unchanged"
  echo "DESKTOP_COMMANDER_LOGIN=preserved"
}

authenticated_adb_serial() {
  command -v adb >/dev/null 2>&1 || return 1
  local s
  s="$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device"{print $1;exit}')"
  [ -n "$s" ] || return 1
  adb -s "$s" shell id 2>/dev/null | grep -q 'uid=2000(shell)' || return 1
  printf '%s\n' "$s"
}

bridge_present_user0() {
  local s="$1"
  adb -s "$s" shell pm list packages --user 0 com.jaskran.wadbbridge 2>/dev/null |
    grep -qx 'package:com.jaskran.wadbbridge'
}

remove_android_bridge() {
  local s out out2
  s="$(authenticated_adb_serial 2>/dev/null || true)"
  if [ -n "$s" ]; then
    if ! bridge_present_user0 "$s"; then
      echo "ANDROID_BRIDGE=not_installed_user0"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "DRY_RUN_ANDROID_UNINSTALL=com.jaskran.wadbbridge via $s"
      echo "DRY_RUN_VERIFY=package_absent_for_user_0"
      return 0
    fi
    out="$(adb -s "$s" shell pm uninstall com.jaskran.wadbbridge 2>&1 || true)"
    sleep 1
    if bridge_present_user0 "$s"; then
      out2="$(adb -s "$s" shell pm uninstall --user 0 com.jaskran.wadbbridge 2>&1 || true)"
      sleep 1
    else
      out2=""
    fi
    if ! bridge_present_user0 "$s"; then
      echo "ANDROID_BRIDGE=removed_user0_verified"
      return 0
    fi
    echo "ANDROID_BRIDGE=automatic_remove_failed"
    [ -n "$out" ] && printf '%s\n' "$out"
    [ -n "$out2" ] && printf '%s\n' "$out2"
  else
    echo "ANDROID_BRIDGE=manual_remove_required"
    echo "REASON=Wireless_Debugging_or_authenticated_ADB_not_connected"
  fi
  echo "APP_NAME=WADB Bridge"
  echo "PACKAGE=com.jaskran.wadbbridge"
  echo "MANUAL_PATH=Android_Settings_>_Apps_>_WADB_Bridge_>_Uninstall"
  echo "NOTE=WADB_Bridge_has_no_app_drawer_icon"
}

all_commands=(
  ai-info phone-capabilities wireless-debug-on wireless-debug-off
  wireless-debug-status adb-mdns-discover wireless-adb-connect wadb-bootstrap
  wadb-local-on wadb-local-status wadb-local-off wadb-local-shell
  wadb-integrity-check
  wadb-mcp-start wadb-mcp-stop wadb-mcp-restart wadb-mcp-status wadb-mcp-log
  wadb-mcp-logout wadb-mcp-watchdog wadb-mcp-watchdog-start wadb-mcp-job wadb-notify
  wadb-mcp-github-sync wadb-mcp-github-config wadb-mcp-github-test
  wadb-mcp-recovery-setup wadb-mcp-recovery-disable wadb-toolkit-uninstall
)
recovery_commands=(
  wadb-mcp-start wadb-mcp-stop wadb-mcp-restart wadb-mcp-status wadb-mcp-log
  wadb-mcp-watchdog wadb-mcp-watchdog-start wadb-mcp-job wadb-notify
  wadb-mcp-github-sync wadb-mcp-github-config wadb-mcp-github-test
  wadb-mcp-recovery-setup wadb-mcp-recovery-disable wadb-toolkit-uninstall
)

is_recovery_command() {
  local x
  for x in "${recovery_commands[@]}"; do
    [ "$1" = "$x" ] && return 0
  done
  return 1
}

remove_commands() {
  local keep_recovery="$1" f
  for f in "${all_commands[@]}"; do
    if [ "$keep_recovery" -eq 1 ] && is_recovery_command "$f"; then
      continue
    fi
    do_rm "$PREFIX/bin/$f"
  done
}

write_recovery_readme() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY_RUN_KEEP=MCP recovery runtime and Bridge"
    return 0
  fi
  mkdir -p "$STATE"
  cat > "$STATE/README.txt" <<'TXT'
MCP recovery was intentionally preserved while the main WADB toolkit was removed.

Desktop Commander itself is NOT owned by the WADB toolkit.
Its running process and saved device login were not stopped, logged out, or deleted.

Phone-side Desktop Commander setup/restart when needed:
  pkg install nodejs npm
  npx @wonderwhy-er/desktop-commander@0.3.1 remote

The preserved MCP recovery module keeps its required recovery commands,
common library, Bridge app/cache, and recovery state.
TXT
}

stop_secure_local_bridge() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY_RUN_STOP=secure_local_uid2000_bridge_if_running"
    echo "DRY_RUN_REMOVE=$TERMUX_HOME/.ai-wadb/local-bridge.token"
    return 0
  fi
  if command -v wadb-local-shell >/dev/null 2>&1; then
    wadb-local-shell -c 'rm -f /data/local/tmp/wadb-local-bridge /data/local/tmp/wadb_loop_probe /data/local/tmp/.wadb-local-token.*' >/dev/null 2>&1 || true
  fi
  if command -v wadb-local-off >/dev/null 2>&1; then
    wadb-local-off --confirm >/dev/null 2>&1 || true
  fi
  rm -f "$TERMUX_HOME/.ai-wadb/local-bridge.token"
}

remove_common_interface() {
  remove_bashrc_block
  do_rm "$TERMUX_HOME/.ai-wadb/pairing.pending"
  do_rm "$TERMUX_HOME/.ai-wadb/local-bridge.token"
  do_rm "$TERMUX_HOME/.ai-wadb/release-integrity"
  do_rm "$TERMUX_HOME/AI_WADB_DOCS"
  do_rm "$TERMUX_HOME/AI_ENVIRONMENT.md"
  if [ -L "$TERMUX_HOME/AI_READ_ME_FIRST.md" ]; then
    do_rm "$TERMUX_HOME/AI_READ_ME_FIRST.md"
  fi
}

if [ "$MODE" = "all" ]; then
  stop_secure_local_bridge
  remove_android_bridge
  remove_recovery_setup_only
  remove_commands 0
  do_rm "$PREFIX/libexec/ai-wadb"
  remove_common_interface
  do_rm "$TERMUX_HOME/.ai-wadb/wadb-bridge.apk"
  do_rm "$TERMUX_HOME/.ai-wadb/backups"
  for f in "$TERMUX_HOME"/.ai-wadb/v*-install.log; do
    [ -e "$f" ] && do_rm "$f"
  done
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "WADB_TOOLKIT_UNINSTALL=DRY_RUN_ALL"
  else
    echo "WADB_TOOLKIT_UNINSTALL=ALL_COMPLETE"
  fi
else
  stop_secure_local_bridge
  remove_commands 1
  do_rm "$PREFIX/libexec/ai-wadb/wadb-common"
  do_rm "$PREFIX/libexec/ai-wadb/verify-installed.js"
  do_rm "$PREFIX/libexec/ai-wadb/wadb-local-bridge"
  do_rm "$PREFIX/libexec/ai-wadb/wadb-bridge.apk.sha256"
  remove_common_interface
  write_recovery_readme
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "WADB_TOOLKIT_UNINSTALL=DRY_RUN_KEEP_RECOVERY"
  else
    echo "WADB_TOOLKIT_UNINSTALL=MAIN_TOOLKIT_REMOVED_RECOVERY_PRESERVED"
  fi
fi

cat_safety
echo
echo "Desktop Commander setup/restart if ever needed:"
echo "  pkg install nodejs npm"
echo "  npx @wonderwhy-er/desktop-commander@0.3.1 remote"
echo "Then connect/enable Remote Desktop Commander in your AI client's Plugins/Apps/Connectors."
echo "No Desktop Commander logout or stop command was run."
