# Plan: Replace splash screen asset with the walking-globe (TP) illustration

## Context

The user wants the app's splash screen to show the new "Tiny Planet" character — the
walking globe wearing a "TP" cap — provided at `~/Desktop/tp-splash-icon.png`.

The current splash uses `assets/splash-icon.png`, a 1024×1024 image whose background is
actually **opaque near-white** (`[250,252,251,255]`), so today it renders as a faint
white square on the cream (`#faf9f5`) splash background. The new image is **500×500 with a
truly transparent background** (corners `[0,0,0,0]`, ~85% transparent), so it will
composite cleanly over the cream backdrop — an improvement.

This is an Expo SDK 55 project using `expo-splash-screen ~55.0.8`. The splash image lives
in two places:

1. **Source asset** — `assets/splash-icon.png`, referenced by the `expo-splash-screen`
   plugin in `app.config.js` (used when `expo prebuild` regenerates native code).
2. **Native iOS assets** — `ios/TinyPlanet/Images.xcassets/SplashScreenLogo.imageset/`
   (`image.png` 250², `image@2x.png` 500², `image@3x.png` 750²), which are what the iOS
   build actually displays at runtime via `SplashScreen.storyboard`.

`ios/` is gitignored / regenerable (CNG workflow). There is no `android/` directory, so
iOS is the only native target today.

No config values need to change: `imageWidth: 250`, `resizeMode: "contain"`, and
`backgroundColor: "#faf9f5"` all remain correct for the new art.

## Approach (surgical, minimal impact)

Update both the source asset and the native iOS imageset directly, so the change is
durable across future prebuilds **and** takes effect on the current iOS build without
running a full `expo prebuild` (which would also re-run pod install). The provided 500×500
image is exactly the 2× size, which makes this clean.

### Files to change

- `assets/splash-icon.png` — replace with the new image (source of truth for prebuild).
- `ios/TinyPlanet/Images.xcassets/SplashScreenLogo.imageset/image.png` — 250×250.
- `ios/.../SplashScreenLogo.imageset/image@2x.png` — 500×500 (exact copy of source).
- `ios/.../SplashScreenLogo.imageset/image@3x.png` — 750×750.

`Contents.json`, `SplashScreen.storyboard`, and `app.config.js` are unchanged.

### Steps

1. Copy the new image into the repo as the source asset:
   `cp ~/Desktop/tp-splash-icon.png assets/splash-icon.png`
2. Regenerate the three iOS imageset PNGs from the new image with `sips`:
   - `image@2x.png` ← copy of the 500×500 source (no resize).
   - `image.png` ← `sips -z 250 250 ... ` (downscale, crisp).
   - `image@3x.png` ← `sips -z 750 750 ...` (1.5× upscale — acceptable for flat line-art).
   Each written into the imageset folder, preserving the existing filenames.
3. Leave `app.config.js` splash config as-is (`imageWidth: 250`, `resizeMode: "contain"`,
   `backgroundColor: "#faf9f5"`).

### Note on resolution

The provided source is only 500×500, so the 3× asset (750px) is a 1.5× upscale. For flat
vector-style illustration this is visually fine. If a higher-resolution export
(≥1024×1024) is available later, drop it in at `assets/splash-icon.png` and re-run step 2
for sharper 3× rendering.

## Verification

1. Confirm the four files updated and their dimensions:
   `sips -g pixelWidth -g pixelHeight assets/splash-icon.png ios/TinyPlanet/Images.xcassets/SplashScreenLogo.imageset/image*.png`
   → expect 500², 250², 500², 750².
2. Re-check transparency of the written imageset files (pngjs script already used) to
   confirm the transparent background survived the resize.
3. Run the app on iOS (`npx expo run:ios`, or rebuild in Xcode / dev client) and confirm
   the new walking-globe character appears centered on the cream background at launch,
   then fades out (`SplashScreen.setOptions({ duration: 500, fade: true })` in
   `app/_layout.tsx`) once auth/profile loads. No prebuild required.

## Out of scope

- App icon (`assets/icon.png`) and Android adaptive icon are NOT changed — only the splash.
- No Android assets, since there is no `android/` directory.
