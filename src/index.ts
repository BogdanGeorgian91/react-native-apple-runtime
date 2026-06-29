import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * The raw `UIUserInterfaceIdiom` reported by UIKit, lower-cased.
 *
 * Note: an iOS app running on macOS via "Designed for iPad" reports `'pad'`
 * here — identical to a real iPad. Combine it with {@link isIOSAppOnMac} to
 * tell the two apart (that is exactly what {@link isIPadOS} does).
 */
export type InterfaceIdiom =
  | 'phone'
  | 'pad'
  | 'mac'
  | 'tv'
  | 'carplay'
  | 'vision'
  | 'unspecified';

interface AppleRuntimeNativeModule {
  /** `ProcessInfo.processInfo.isiOSAppOnMac`. */
  isiOSAppOnMac?: boolean;
  /** Lower-cased `UIDevice.current.userInterfaceIdiom`. */
  interfaceIdiom?: InterfaceIdiom;
}

// ─── Native module loading ──────────────────────────────────────────

// `requireOptionalNativeModule` returns `null` when the native module is
// absent — on Android, and in unit-test environments (Jest) where there is no
// native runtime — instead of throwing. This keeps every helper inert and
// safe to call on any platform.
const AppleRuntime =
  Platform.OS === 'ios'
    ? requireOptionalNativeModule<AppleRuntimeNativeModule>('AppleRuntime')
    : null;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * The raw interface idiom of the current process.
 *
 * Returns `'unspecified'` on Android and when the native module is unavailable.
 *
 * @example
 * ```ts
 * import { getInterfaceIdiom } from 'react-native-apple-runtime';
 *
 * switch (getInterfaceIdiom()) {
 *   case 'phone': // iPhone
 *   case 'pad':   // iPad OR an iOS app on Mac (see isIOSAppOnMac)
 *   case 'mac':   // Mac Catalyst with the Mac idiom
 * }
 * ```
 */
export function getInterfaceIdiom(): InterfaceIdiom {
  if (Platform.OS !== 'ios') return 'unspecified';
  return AppleRuntime?.interfaceIdiom ?? 'unspecified';
}

/**
 * `true` only when this iOS binary is running on macOS via "Designed for iPad"
 * (an iPhone/iPad app on an Apple silicon Mac).
 *
 * Backed by Apple's authoritative `ProcessInfo.processInfo.isiOSAppOnMac`.
 * Returns `false` on real iOS/iPadOS devices, on Mac Catalyst, on Android, and
 * in tests.
 *
 * @example
 * ```ts
 * import { isIOSAppOnMac } from 'react-native-apple-runtime';
 *
 * if (isIOSAppOnMac()) {
 *   // Running on a Mac — e.g. some iOS-only URL schemes won't resolve here.
 * }
 * ```
 */
export function isIOSAppOnMac(): boolean {
  return Platform.OS === 'ios' && AppleRuntime?.isiOSAppOnMac === true;
}

/**
 * `true` only on a **real iPad** running iPadOS.
 *
 * This is `getInterfaceIdiom() === 'pad'` AND `!isIOSAppOnMac()`, because an
 * iOS app on a Mac also reports the `'pad'` idiom — so the Mac case must be
 * excluded to identify a genuine iPad. Returns `false` on iPhone, on Mac, on
 * Android, and in tests.
 *
 * @example
 * ```ts
 * import { isIPadOS } from 'react-native-apple-runtime';
 *
 * if (isIPadOS()) {
 *   // Genuine iPad — safe to enable iPad-specific layout.
 * }
 * ```
 */
export function isIPadOS(): boolean {
  return getInterfaceIdiom() === 'pad' && !isIOSAppOnMac();
}
