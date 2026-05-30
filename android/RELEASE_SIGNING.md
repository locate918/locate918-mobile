# Release signing (Google Play uploads)

The `release` build type in `app/build.gradle` uses a real **upload keystore**
when configured, and falls back to debug signing otherwise. A debug-signed AAB
**cannot** be uploaded to Google Play, so set this up before your first release.

## 1. Generate an upload keystore (once)

Keep this file safe and **out of the repo** (`.gitignore` already excludes
`*.jks`/`*.keystore` and `android/keystores/`). If you lose it you cannot ship
updates to the same app listing (unless enrolled in Play App Signing).

```bash
mkdir -p android/keystores
keytool -genkeypair -v \
  -keystore android/keystores/locate918-upload.jks \
  -alias locate918-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

## 2. Provide the secrets via global gradle properties

Put these in **`~/.gradle/gradle.properties`** (NOT `android/gradle.properties`,
which is tracked in git):

```properties
LOCATE918_UPLOAD_STORE_FILE=/absolute/path/to/android/keystores/locate918-upload.jks
LOCATE918_UPLOAD_STORE_PASSWORD=********
LOCATE918_UPLOAD_KEY_ALIAS=locate918-upload
LOCATE918_UPLOAD_KEY_PASSWORD=********
```

When `LOCATE918_UPLOAD_STORE_FILE` is present, `release` builds are signed with
this key; when absent, they fall back to debug signing (so nothing breaks
pre-setup).

## 3. Build the release bundle

```bash
cd android
./gradlew bundleRelease     # -> app/build/outputs/bundle/release/app-release.aab
# or ./gradlew assembleRelease for an APK
```

## 4. Upload

Upload the `.aab` to Play Console → Internal testing first. Recommended: enroll
in **Play App Signing** (Google manages the app signing key; your upload key
only signs uploads).

## Versioning

Bump `versionCode` (integer, must strictly increase per upload) and usually
`versionName` in `app/build.gradle` `defaultConfig` before each release.
Currently `versionCode 2`, `versionName "1.1.0"`.

## Data Safety reminder

This app sends anonymous analytics (a persisted device `anon_id` + click events;
see `src/services/analytics.ts`). Declare this in the Play Console **Data Safety**
form. The in-app disclosure is handled by `AnalyticsConsentBanner`.
