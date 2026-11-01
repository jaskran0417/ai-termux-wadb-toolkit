# Optional / Legacy Shizuku + rish Method

This document is reference material only. The preferred portable method is WADB Bridge and does **not** require Shizuku.

An optional alternative uses:

- Shizuku 13.6,
- Shizuku's native starter launched from an already-connected ADB shell,
- `rish` and `rish_shizuku.dex`,
- an environment-aware `rish-remote`,
- `WRITE_SECURE_SETTINGS` granted to Shizuku.

The historical ADB starter pattern was conceptually:

```bash
PKG=$(pm path moe.shizuku.privileged.api | head -n1 | cut -d: -f2)
DIR=${PKG%/*}
"$DIR/lib/arm64/libshizuku.so"
```

When Shizuku was alive, `rish` could provide a privileged shell pathway and Shizuku's Android 13+ boot logic could manipulate ADB-related global settings.

Why it is optional here:

- the current WADB Bridge has already proven cold-start Wireless Debugging without Shizuku,
- Shizuku adds another app/service dependency,
- some users may prefer not to keep it installed.

This portable bundle intentionally does **not** include or install Shizuku, `rish`, or Shizuku APK files.

Do not install or activate this alternative unless the user explicitly asks for it.
