# Building the Android APK (Capacitor)

The Triple Triad web app is wrapped with [Capacitor](https://capacitorjs.com/) for Android. All builds use Docker.

## Build APK with Docker

From the **repo root**:

```bash
# 1. Build the frontend
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:22-slim sh -c "npm ci && npm run build"

# 2. Sync Capacitor (copies dist into android assets)
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:22-slim npx cap sync android

# 3. Build the APK (uses the Dockerfile.apk image)
docker build -t apk-builder -f frontend/Dockerfile.apk frontend/
docker run --rm -v "$(pwd)/frontend:/app" -w /app/android apk-builder bash -c "chmod +x gradlew && ./gradlew assembleDebug --no-daemon"
```

The debug APK is at: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

**Note on Windows/MSYS:** Prefix commands with `MSYS_NO_PATHCONV=1` to prevent Git Bash from mangling `/app` paths.

## Prerequisites

- Docker. No local Node, Java, or Android SDK required.
- `frontend/Dockerfile.apk` provides Eclipse Temurin JDK 21 + Android SDK (platform 36, build-tools 36.0.0).

## Configuration

- **App id**: `com.tripletriad.app` (in `frontend/capacitor.config.ts`)
- **Web dir**: `dist` (Vite build output)
- **Capacitor plugins**: `@capacitor/core`, `@capacitor/android`, `@capacitor/app` (back button handling)

## Mobile features

### Safe areas
- The app uses `viewport-fit=cover` and edge-to-edge display (transparent status/nav bars).
- `MainActivity.java` injects actual system bar heights as CSS custom properties (`--sat`, `--sab`, `--sal`, `--sar`).
- All layouts respect these via `var(--app-pt)`, `var(--sab)`, etc.

### System back button
- `@capacitor/app` `backButton` listener handles navigation:
  - Settings/HowTo → title screen
  - Game tabs (Collection, Quests, Guide) → World tab
  - Battle → cancel and return to World
  - World tab → title screen
  - Title screen → minimize app

### App icon
- AI-generated icon using SDXL-Turbo (see `artgen/generate_icon.py`).
- All mipmap sizes (mdpi through xxxhdpi) in `frontend/android/app/src/main/res/mipmap-*/`.

## Release APK (signed)

For a release build, configure signing in `android/app/build.gradle` with your keystore. See [Capacitor Android documentation](https://capacitorjs.com/docs/android).
