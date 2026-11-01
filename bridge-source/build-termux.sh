#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
AAPT2="${AAPT2_OVERRIDE:-/data/data/com.termux/files/usr/bin/aapt2}"

[ -f "$SDK/platforms/android-36/android.jar" ] || {
  echo "Android SDK 36 not found at: $SDK"
  echo "Set ANDROID_HOME or ANDROID_SDK_ROOT, then rerun."
  exit 2
}
[ -x "$AAPT2" ] || {
  echo "aapt2 not found at: $AAPT2"
  echo "Set AAPT2_OVERRIDE, then rerun."
  exit 3
}

printf 'sdk.dir=%s\n' "$SDK" > "$ROOT/local.properties"
trap 'rm -f "$ROOT/local.properties"' EXIT

cd "$ROOT"
gradle --no-daemon \
  -Pandroid.aapt2FromMavenOverride="$AAPT2" \
  :app:assembleRelease

echo "Unsigned release APK:"
find "$ROOT/app/build/outputs/apk/release" -type f -name '*.apk' -print
