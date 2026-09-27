import SwiftUI

/// CardCue design tokens. Central source of truth — never hardcode values in views.
public enum Theme {
    // MARK: - Colors

    public enum Colors {
        public static let bg = Color(light: "F7F5F2", dark: "0F1114")
        public static let surface = Color(light: "FFFFFF", dark: "1A1D22")
        public static let surfaceMuted = Color(light: "EFECE8", dark: "24282E")
        public static let ink = Color(light: "1A1A1A", dark: "F5F5F7")
        public static let inkSecondary = Color(light: "6B6B6B", dark: "98989D")
        public static let inkTertiary = Color(light: "9A9A9A", dark: "6E6E73")
        public static let divider = Color(light: "E4E0DB", dark: "2C3036")
        public static let accent = Color(light: "0E6B63", dark: "3AA398")
        public static let accentSoft = Color(light: "E2F0EE", dark: "1A3331")

        public static let statusNeutral = Color(light: "6B7280", dark: "9CA3AF")
        public static let statusUpcoming = Color(light: "2563EB", dark: "60A5FA")
        public static let statusAttention = Color(light: "B45309", dark: "F59E0B")
        public static let statusThreshold = Color(light: "C2410C", dark: "FB923C")
        public static let statusComplete = Color(light: "047857", dark: "34D399")
        public static let statusCritical = Color(light: "B91C1C", dark: "F87171")
    }

    // MARK: - Spacing (8-pt)

    public enum Space {
        public static let x1: CGFloat = 4
        public static let x2: CGFloat = 8
        public static let x3: CGFloat = 12
        public static let x4: CGFloat = 16
        public static let x5: CGFloat = 24
        public static let x6: CGFloat = 32
        public static let x7: CGFloat = 40
        public static let x8: CGFloat = 48
        public static let x9: CGFloat = 64
    }

    // MARK: - Radius

    public enum Radius {
        public static let sm: CGFloat = 8
        public static let md: CGFloat = 12
        public static let lg: CGFloat = 16
        public static let xl: CGFloat = 24
        public static let full: CGFloat = 999
    }

    // MARK: - Typography

    public enum Font {
        public static let display = SwiftUI.Font.system(size: 40, weight: .semibold, design: .default)
        public static let title = SwiftUI.Font.system(size: 28, weight: .bold)
        public static let headline = SwiftUI.Font.system(size: 20, weight: .semibold)
        public static let body = SwiftUI.Font.system(size: 16, weight: .regular)
        public static let callout = SwiftUI.Font.system(size: 15, weight: .medium)
        public static let footnote = SwiftUI.Font.system(size: 13, weight: .regular)
        public static let caption = SwiftUI.Font.system(size: 12, weight: .medium)

        /// Large financial numerals — tabular figures.
        public static let moneyDisplay = SwiftUI.Font.system(size: 40, weight: .semibold)
            .width(.standard)
        public static let moneyLarge = SwiftUI.Font.system(size: 28, weight: .semibold)
        public static let moneyBody = SwiftUI.Font.system(size: 16, weight: .medium)
    }

    // MARK: - Motion

    public enum Motion {
        public static let fast: Double = 0.20
        public static let base: Double = 0.25
        public static let slow: Double = 0.35
        public static let spring = Animation.spring(response: 0.35, dampingFraction: 0.85)
        public static let easeOut = Animation.easeOut(duration: base)
    }
}

// MARK: - Color hex helper

public extension Color {
    /// Creates a color from hex strings for light and dark appearances.
    init(light: String, dark: String) {
        self.init(UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(hex: dark)
                : UIColor(hex: light)
        })
    }

    init(hex: String) {
        self.init(uiColor: UIColor(hex: hex))
    }
}

private extension UIColor {
    convenience init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)

        let a, r, g, b: UInt64
        switch cleaned.count {
        case 6:
            (a, r, g, b) = (255, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
        case 8:
            (a, r, g, b) = ((value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: CGFloat(a) / 255
        )
    }
}
