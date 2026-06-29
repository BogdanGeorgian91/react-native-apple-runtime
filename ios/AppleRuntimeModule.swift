import ExpoModulesCore
import UIKit

public class AppleRuntimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleRuntime")

    // Two independent runtime signals, evaluated once when the module loads:
    //
    //  - isiOSAppOnMac: ProcessInfo.processInfo.isiOSAppOnMac — true ONLY for an
    //    iPhone/iPad app running on an Apple silicon Mac ("Designed for iPad").
    //    False for Mac Catalyst and for real iOS devices.
    //
    //  - interfaceIdiom: the raw UIUserInterfaceIdiom, lower-cased. NOTE: an iOS
    //    app on a Mac reports ".pad" here, identical to a real iPad — callers
    //    combine it with isiOSAppOnMac (see isIPadOS in JS) to tell them apart.
    Constants([
      "isiOSAppOnMac": ProcessInfo.processInfo.isiOSAppOnMac,
      "interfaceIdiom": Self.idiomString(UIDevice.current.userInterfaceIdiom),
    ])
  }

  private static func idiomString(_ idiom: UIUserInterfaceIdiom) -> String {
    switch idiom {
    case .phone: return "phone"
    case .pad: return "pad"
    case .mac: return "mac"
    case .tv: return "tv"
    case .carPlay: return "carplay"
    case .vision: return "vision"
    default: return "unspecified"
    }
  }
}
