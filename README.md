# react-native-apple-runtime

> ☕ **If this library has helped you, consider [buying me a coffee](https://buymeacoffee.com/boogdan)!** Your support keeps development going.

Authoritative Apple **runtime** detection for React Native and Expo. Tell an iOS app running on macOS (**Designed for iPad**) apart from a **real iPad**, and read the raw `UIUserInterfaceIdiom` — the things `Platform` and `expo-device` can't reliably answer. iOS only, built with the Expo Modules API.

```ts
import { isIOSAppOnMac, isIPadOS, getInterfaceIdiom } from 'react-native-apple-runtime';

isIOSAppOnMac();     // true only on a Mac (Designed for iPad)
isIPadOS();          // true only on a genuine iPad
getInterfaceIdiom(); // 'phone' | 'pad' | 'mac' | 'tv' | 'carplay' | 'vision' | 'unspecified'
```

## Why

When your iPhone/iPad app runs on an Apple silicon Mac via **Designed for iPad**, UIKit reports the interface idiom as `.pad` — exactly like a real iPad. So:

- `Platform.OS` is `'ios'` on a Mac, and `Platform.isPad` is `true` on **both** a Mac and a real iPad.
- `expo-device` exposes neither `isiOSAppOnMac` nor the interface idiom, so it can't separate the two either.

That ambiguity matters: some iOS-only URL schemes don't resolve on a Mac, haptics no-op, and you may want a different layout. The only authoritative signal is Apple's `ProcessInfo.processInfo.isiOSAppOnMac`, which is not surfaced to JavaScript by the React Native or Expo SDKs. This module bridges it — plus the raw idiom — in ~30 lines of Swift, with zero runtime cost.

|                              | `Platform` | `expo-device` | **react-native-apple-runtime** |
| ---------------------------- | :--------: | :-----------: | :----------------------------: |
| iOS-app-on-Mac (`isiOSAppOnMac`) |     ❌     |       ❌      |               ✅               |
| Real iPad vs Mac-as-iPad     |     ❌     |       ❌      |               ✅               |
| `UIUserInterfaceIdiom`       |     ❌     |       ❌      |               ✅               |

## Installation

```bash
npm install react-native-apple-runtime
# or
yarn add react-native-apple-runtime
# or
bun add react-native-apple-runtime
```

Then rebuild the native project so autolinking picks up the module:

```bash
npx expo prebuild
npx expo run:ios
```

There is **no config plugin and no entitlements** to set up — the module only reads `ProcessInfo` and `UIDevice`, so installing and rebuilding is all that's required.

### Prerequisites

- Expo `>= 51.0.0`
- React Native `>= 0.74.0`
- iOS only (Android and other platforms are safely inert — see [Platform behavior](#platform-behavior))
- A native build. The values are real on a device/simulator build; in Jest the module is absent and every helper returns its inert default.

## API Reference

```ts
import { isIOSAppOnMac, isIPadOS, getInterfaceIdiom } from 'react-native-apple-runtime';
import type { InterfaceIdiom } from 'react-native-apple-runtime';
```

### Types

```ts
type InterfaceIdiom =
  | 'phone'
  | 'pad'
  | 'mac'
  | 'tv'
  | 'carplay'
  | 'vision'
  | 'unspecified';
```

The lower-cased `UIUserInterfaceIdiom`. An iOS app running on a Mac reports `'pad'` here (same as a real iPad) — use [`isIOSAppOnMac()`](#isiosapponmac) to disambiguate.

### `isIOSAppOnMac()`

```ts
function isIOSAppOnMac(): boolean;
```

`true` only when this iOS binary is running on macOS via **Designed for iPad** (an iPhone/iPad app on an Apple silicon Mac). Backed by Apple's authoritative `ProcessInfo.processInfo.isiOSAppOnMac`. Returns `false` on real iOS/iPadOS devices, on Mac Catalyst, on Android, and in tests.

```ts
if (isIOSAppOnMac()) {
  // Running on a Mac — e.g. third-party browser URL schemes won't resolve here,
  // so fall back to the system default browser.
}
```

### `isIPadOS()`

```ts
function isIPadOS(): boolean;
```

`true` only on a **genuine iPad** running iPadOS. Defined as `getInterfaceIdiom() === 'pad' && !isIOSAppOnMac()`, because an iOS app on a Mac also reports the `'pad'` idiom and must be excluded. Returns `false` on iPhone, on Mac, on Android, and in tests.

```ts
if (isIPadOS()) {
  // Genuine iPad — safe to enable an iPad-specific multi-column layout.
}
```

### `getInterfaceIdiom()`

```ts
function getInterfaceIdiom(): InterfaceIdiom;
```

The raw interface idiom of the current process, from `UIDevice.current.userInterfaceIdiom`. Returns `'unspecified'` on Android and whenever the native module is unavailable.

```ts
switch (getInterfaceIdiom()) {
  case 'phone': /* iPhone */ break;
  case 'pad':   /* iPad OR an iOS app on Mac — check isIOSAppOnMac() */ break;
  case 'mac':   /* Mac Catalyst with the Mac idiom */ break;
}
```

## Platform behavior

| Environment                          | `isIOSAppOnMac()` | `isIPadOS()` | `getInterfaceIdiom()` |
| ------------------------------------ | :---------------: | :----------: | :-------------------: |
| iPhone                               |       `false`     |   `false`    |       `'phone'`       |
| iPad (real device)                   |       `false`     |    `true`    |        `'pad'`        |
| iOS app on Mac (Designed for iPad)   |       `true`      |   `false`    |        `'pad'`        |
| Android                              |       `false`     |   `false`    |    `'unspecified'`    |
| Jest / no native runtime             |       `false`     |   `false`    |    `'unspecified'`    |

Every helper is safe to call on any platform: on non-iOS, and when the native module is absent (such as in Jest), they return the inert defaults above instead of throwing. The native module is loaded via `requireOptionalNativeModule`, so missing-module environments never crash.

## How it works

The native module exposes two constants, evaluated once when the module loads:

- **`isiOSAppOnMac`** — `ProcessInfo.processInfo.isiOSAppOnMac`. This is Apple's own flag and the only reliable way to detect the Designed-for-iPad-on-Mac case. (`ProcessInfo.isMacCatalystApp` is `true` for *both* Mac Catalyst and Designed-for-iPad, so it can't make this distinction; `isiOSAppOnMac` can.)
- **`interfaceIdiom`** — `UIDevice.current.userInterfaceIdiom`, lower-cased to a stable string.

Because they are exposed as Expo Module **constants**, reading them from JavaScript is a synchronous property access with no bridge round-trip and no measurable runtime cost.

## License

MIT © [Bogdan Georgian Alexa](https://github.com/BogdanGeorgian91)
