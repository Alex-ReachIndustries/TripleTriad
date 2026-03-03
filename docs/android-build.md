# Building the Android APK (Capacitor)

The Triple Triad web app is wrapped with [Capacitor](https://capacitorjs.com/) for Android. **On this project, build the APK using Docker** (see rule in `.cursor/rules/docker-only.mdc`).

## Build APK with Docker (recommended)

From the **repo root**:

```powershell
docker compose -f docker-compose.yml -f docker-compose.android.yml build android-build
docker compose -f docker-compose.yml -f docker-compose.android.yml run --rm android-build
```

The debug APK is written to `./output/apk/app-debug.apk` (bind-mounted from the container). Ensure the image is built first (`build android-build`); the `run` step copies the APK from the image into the volume.

## Prerequisites (Docker build)

- Docker and Docker Compose. No local Node, Java, or Android SDK required.

## Local build (without Docker)

If you cannot use Docker:

- Node.js 20.19+ or 22.12+
- Android Studio (or Android SDK + build tools) and Java 17

Steps:

1. **Build the web app** (from repo root): `cd frontend && npm run build`
2. **Sync**: `npx cap sync android`
3. **Build APK**: `cd frontend/android && ./gradlew assembleDebug` (or open in Android Studio and Build → Build APK(s)).

APK output: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

## Configuration

- **App id**: `com.tripletriad.app` (in `frontend/capacitor.config.ts`)
- **Web dir**: `dist` (Vite build output). Capacitor copies `dist` into the Android assets on `cap sync`.

## Mobile UI and safe areas

- The app uses `viewport-fit=cover` and CSS `env(safe-area-inset-*)` so content is not drawn under notches, status bar, or system gestures.
- Layout is responsive (see `docs/ui-ux-guidelines.md`); breakpoints at 480px apply on mobile.

## Release APK (signed)

For a release build you must configure signing in Android Studio (Build → Generate Signed Bundle / APK) or via `android/app/build.gradle` with your keystore. See [Capacitor Android documentation](https://capacitorjs.com/docs/android) for details.
