import SwiftUI
import BillingCycleEngine

/// Semantic card status. Text + icon always accompany color.
public struct StatusChip: View {
    public let status: CardStatus
    public let text: String

    public init(status: CardStatus, text: String) {
        self.status = status
        self.text = text
    }

    public var body: some View {
        HStack(spacing: Theme.Space.x1) {
            Image(systemName: iconName)
                .font(.system(size: 11, weight: .semibold))
            Text(text)
                .font(Theme.Font.caption)
        }
        .foregroundStyle(color)
        .padding(.horizontal, Theme.Space.x2)
        .padding(.vertical, Theme.Space.x1)
        .background(color.opacity(0.12), in: Capsule())
        .accessibilityElement(children: .combine)
        .accessibilityLabel(text)
    }

    private var iconName: String {
        switch status {
        case .neutral: return "circle"
        case .upcoming: return "calendar"
        case .attention: return "clock"
        case .threshold: return "gauge.medium"
        case .complete: return "checkmark.circle"
        }
    }

    private var color: Color {
        switch status {
        case .neutral: return Theme.Colors.statusNeutral
        case .upcoming: return Theme.Colors.statusUpcoming
        case .attention: return Theme.Colors.statusAttention
        case .threshold: return Theme.Colors.statusThreshold
        case .complete: return Theme.Colors.statusComplete
        }
    }
}

/// Premium spending progress bar.
public struct SpendingProgress: View {
    public let spent: Decimal
    public let limit: Decimal?
    public let status: CardStatus

    public init(spent: Decimal, limit: Decimal?, status: CardStatus) {
        self.spent = spent
        self.limit = limit
        self.status = status
    }

    private var utilization: Double {
        guard let limit, limit > 0 else { return 0 }
        return min(1, max(0, (spent as NSDecimalNumber).doubleValue / (limit as NSDecimalNumber).doubleValue))
    }

    private var remaining: Decimal {
        guard let limit else { return 0 }
        return max(0, limit - spent)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x2) {
            HStack(alignment: .firstTextBaseline) {
                Text(spent.formatted(.currency(code: "PHP").precision(.fractionLength(0))))
                    .font(Theme.Font.moneyLarge)
                    .foregroundStyle(Theme.Colors.ink)
                    .monospacedDigit()
                if limit != nil {
                    Text("of \(limit!.formatted(.currency(code: "PHP").precision(.fractionLength(0))))")
                        .font(Theme.Font.footnote)
                        .foregroundStyle(Theme.Colors.inkSecondary)
                }
                Spacer()
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Theme.Colors.surfaceMuted)
                    Capsule()
                        .fill(fillColor)
                        .frame(width: max(4, geo.size.width * utilization))
                        .animation(Theme.Motion.easeOut, value: utilization)
                }
            }
            .frame(height: 8)
            .accessibilityLabel("\(Int(utilization * 100)) percent of personal cycle limit")

            if limit != nil {
                Text("\(remaining.formatted(.currency(code: "PHP").precision(.fractionLength(0)))) remaining")
                    .font(Theme.Font.footnote)
                    .foregroundStyle(Theme.Colors.inkSecondary)
            }
        }
    }

    private var fillColor: Color {
        switch status {
        case .complete: return Theme.Colors.statusComplete
        case .threshold: return Theme.Colors.statusThreshold
        default: return Theme.Colors.accent
        }
    }
}

/// Physical-card-inspired summary — refined, not a fake payment card.
public struct CreditCardSummary: View {
    public let nickname: String
    public let issuer: String
    public let lastFour: String
    public let cycleLabel: String
    public let statementLabel: String
    public let spent: Decimal
    public let limit: Decimal?
    public let status: CardStatus
    public let statusText: String

    public init(
        nickname: String,
        issuer: String,
        lastFour: String,
        cycleLabel: String,
        statementLabel: String,
        spent: Decimal,
        limit: Decimal?,
        status: CardStatus,
        statusText: String
    ) {
        self.nickname = nickname
        self.issuer = issuer
        self.lastFour = lastFour
        self.cycleLabel = cycleLabel
        self.statementLabel = statementLabel
        self.spent = spent
        self.limit = limit
        self.status = status
        self.statusText = statusText
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.x4) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Theme.Space.x1) {
                    Text(nickname)
                        .font(Theme.Font.headline)
                        .foregroundStyle(Theme.Colors.ink)
                    Text("\(issuer) · •••• \(lastFour)")
                        .font(Theme.Font.footnote)
                        .foregroundStyle(Theme.Colors.inkSecondary)
                }
                Spacer()
                StatusChip(status: status, text: statusText)
            }

            VStack(alignment: .leading, spacing: Theme.Space.x1) {
                Text(cycleLabel.uppercased())
                    .font(Theme.Font.caption)
                    .foregroundStyle(Theme.Colors.inkTertiary)
                Text(statementLabel)
                    .font(Theme.Font.callout)
                    .foregroundStyle(Theme.Colors.ink)
            }

            SpendingProgress(spent: spent, limit: limit, status: status)
        }
        .padding(Theme.Space.x5)
        .background(Theme.Colors.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.lg))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(Theme.Colors.divider, lineWidth: 1)
        )
    }
}

/// Quiet empty state.
public struct EmptyStateView: View {
    public let icon: String
    public let title: String
    public let message: String
    public let actionTitle: String?
    public let action: (() -> Void)?

    public init(
        icon: String,
        title: String,
        message: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.message = message
        self.actionTitle = actionTitle
        self.action = action
    }

    public var body: some View {
        VStack(spacing: Theme.Space.x4) {
            Image(systemName: icon)
                .font(.system(size: 36, weight: .light))
                .foregroundStyle(Theme.Colors.inkTertiary)
            Text(title)
                .font(Theme.Font.headline)
                .foregroundStyle(Theme.Colors.ink)
            Text(message)
                .font(Theme.Font.body)
                .foregroundStyle(Theme.Colors.inkSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 280)

            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.top, Theme.Space.x2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Space.x8)
    }
}

// MARK: - Button styles

public struct PrimaryButtonStyle: ButtonStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.Font.callout)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(Theme.Colors.accent, in: RoundedRectangle(cornerRadius: Theme.Radius.md))
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(Theme.Motion.fast, value: configuration.isPressed)
    }
}

public struct SecondaryButtonStyle: ButtonStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.Font.callout)
            .foregroundStyle(Theme.Colors.accent)
            .frame(maxWidth: .infinity, minHeight: 50)
            .background(Theme.Colors.accentSoft, in: RoundedRectangle(cornerRadius: Theme.Radius.md))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

// MARK: - Section header

public struct SectionLabel: View {
    public let text: String

    public init(_ text: String) {
        self.text = text
    }

    public var body: some View {
        Text(text.uppercased())
            .font(Theme.Font.caption)
            .foregroundStyle(Theme.Colors.inkTertiary)
            .kerning(0.6)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
