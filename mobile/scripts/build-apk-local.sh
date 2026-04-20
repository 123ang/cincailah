#!/usr/bin/env bash
# Local release APK.
# Requires a real release keystore for repeatable builds.
# Prerequisites on macOS:
#   1) JDK 17+: brew install --cask temurin@17  (finish the GUI installer if brew prompts for sudo)
#   2) Android Studio → install Android SDK + build-tools; note SDK path (usually ~/Library/Android/sdk)
#   3) export ANDROID_HOME="$HOME/Library/Android/sdk"  (add to ~/.zshrc)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# macOS: Temurin cask often installs before java_home picks it up. Resolve JAVA_HOME explicitly.
resolve_java_home_macos() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi
  if [[ "$(uname -s)" != "Darwin" ]] || ! command -v /usr/libexec/java_home >/dev/null 2>&1; then
    return 1
  fi
  local v out
  for v in 17 17.0; do
    out="$(/usr/libexec/java_home -v "$v" 2>/dev/null || true)"
    if [[ -n "$out" && -x "$out/bin/java" ]]; then
      echo "$out"
      return 0
    fi
  done
  local jdk
  shopt -s nullglob 2>/dev/null || true
  for jdk in /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home \
             /Library/Java/JavaVirtualMachines/temurin-17*.jdk/Contents/Home; do
    if [[ -x "$jdk/bin/java" ]]; then
      echo "$jdk"
      return 0
    fi
  done
  shopt -u nullglob 2>/dev/null || true
  return 1
}

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ -z "${JAVA_HOME:-}" ]] || [[ ! -x "${JAVA_HOME}/bin/java" ]]; then
    if resolved="$(resolve_java_home_macos)"; then
      export JAVA_HOME="$resolved"
    fi
  fi
fi

if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: java not found."
  echo ""
  echo "Temurin is installed but the JDK may not be registered yet:"
  echo "  1) Run the installer to the end (brew cask opens a GUI — enter password, don't Ctrl-C)."
  echo "  2) List JDKs:  ls /Library/Java/JavaVirtualMachines/"
  echo "  3) Then set (adjust folder name to match):"
  echo "     export JAVA_HOME=\"/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home\""
  echo "     java -version"
  echo ""
  echo "If nothing is listed, reinstall:  brew reinstall --cask temurin@17"
  exit 1
fi

if [[ -n "${JAVA_HOME:-}" && ! -d "$JAVA_HOME" ]]; then
  echo "ERROR: JAVA_HOME is not a directory: $JAVA_HOME"
  exit 1
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ ! -d "$ANDROID_HOME" ]]; then
  echo "ERROR: ANDROID_HOME not a directory: $ANDROID_HOME"
  echo "Install Android Studio, open SDK Manager, install Android SDK Platform + Build-Tools."
  echo "Then: export ANDROID_HOME=\"\$HOME/Library/Android/sdk\""
  exit 1
fi

KEYSTORE_PATH="${CINCAILAH_UPLOAD_STORE_FILE:-$ROOT/android/app/cincailah-upload-keystore.jks}"
if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "WARNING: release keystore not found at $KEYSTORE_PATH"
  echo "Gradle will sign release with the debug keystore unless CINCAILAH_* is set in android/gradle.properties (OK for sideload; not for Play Store)."
fi

if [[ ! -d android ]]; then
  echo "==> Generating android/ (expo prebuild)…"
  npx expo prebuild --platform android --no-install
fi

# Expo/RN default Gradle JVM (2G heap / 512M metaspace) often OOMs during KSP (expo-updates) + release lint on smaller machines.
ensure_android_gradle_jvm() {
  local props="$ROOT/android/gradle.properties"
  [[ -f "$props" ]] || return 0
  python3 - "$props" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8", errors="replace")
marker = "# cincailah-local-apk-jvm"
if marker in text:
    sys.exit(0)
jvm_line = (
    "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m "
    "-XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8"
)
replacement = (
    marker
    + " (marker for scripts; never put # comments on the jvmargs value line — Gradle passes them to java)\n"
    + jvm_line
)
text2, n = re.subn(
    r"^org\.gradle\.jvmargs=.*$",
    replacement,
    text,
    count=1,
    flags=re.MULTILINE,
)
if n == 0:
    text2 = text.rstrip("\n") + "\n\n" + replacement + "\n"
kd_marker = "# cincailah-local-apk-jvm-kotlin-daemon"
kd_line = "kotlin.daemon.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=768m"
if re.search(r"^kotlin\.daemon\.jvmargs=", text2, flags=re.MULTILINE) is None:
    text2 = text2.rstrip("\n") + "\n" + kd_marker + "\n" + kd_line + "\n"
path.write_text(text2 if text2.endswith("\n") else text2 + "\n", encoding="utf-8")
PY
}
ensure_android_gradle_jvm

# Release bundle + Expo config expect a NODE_ENV during Gradle (avoids "NODE_ENV required" warnings).
export NODE_ENV="${NODE_ENV:-production}"

# Local APK builds should not require Sentry org/token; @sentry/react-native's Gradle hook otherwise runs sentry-cli upload.
export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD="${SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD:-true}"

# Hermes compiler is a native binary under node_modules; macOS Gatekeeper may block it (quarantine) after npm/pnpm install.
if [[ "$(uname -s)" == "Darwin" ]]; then
  HERMESC="$ROOT/node_modules/react-native/sdks/hermesc/osx-bin/hermesc"
  if [[ -f "$HERMESC" ]]; then
    chmod +x "$HERMESC" 2>/dev/null || true
    xattr -dr com.apple.quarantine "$HERMESC" 2>/dev/null || true
  else
    echo "WARNING: Hermes compiler not found at $HERMESC — run npm install in mobile/ if the release bundle step fails." >&2
  fi
fi

echo "==> Gradle assembleRelease (this may take several minutes)…"
cd android
./gradlew --stop >/dev/null 2>&1 || true
./gradlew assembleRelease

APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK" ]]; then
  echo ""
  echo "OK: $APK"
  ls -la "$APK"
else
  echo "Build finished but APK not found at expected path. Search:"
  find "$ROOT/android/app/build/outputs" -name '*.apk' 2>/dev/null || true
  exit 1
fi
