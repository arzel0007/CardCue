import SwiftUI

/// Short first-launch onboarding. Three screens, then add first card.
struct OnboardingView: View {
    @State private var page = 0
    var onFinish: () -> Void

    private let pages: [(icon: String, title: String, subtitle: String)] = [
        ("arrow.triangle.2.circlepath", "Know your cycle.", "See where each card is right now — statement, payment, and spending."),
        ("bell.badge", "Never miss what comes next.", "Quiet reminders before statements and payments."),
        ("gauge.medium", "Track spending without the spreadsheet.", "Your personal cycle limit, clearly separated from credit limit.")
    ]

    var body: some View {
        VStack(spacing: Theme.Space.x6) {
            TabView(selection: $page) {
                ForEach(pages.indices, id: \.self) { index in
                    VStack(spacing: Theme.Space.x5) {
                        Spacer()
                        Image(systemName: pages[index].icon)
                            .font(.system(size: 48, weight: .light))
                            .foregroundStyle(Theme.Colors.accent)
                        Text(pages[index].title)
                            .font(Theme.Font.title)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(Theme.Colors.ink)
                        Text(pages[index].subtitle)
                            .font(Theme.Font.body)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(Theme.Colors.inkSecondary)
                            .frame(maxWidth: 300)
                        Spacer()
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            Button(page == pages.count - 1 ? "Add your first card" : "Continue") {
                if page == pages.count - 1 {
                    onFinish()
                } else {
                    withAnimation(Theme.Motion.easeOut) {
                        page += 1
                    }
                }
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, Theme.Space.x5)
            .padding(.bottom, Theme.Space.x6)
        }
        .background(Theme.Colors.bg)
    }
}

#Preview {
    OnboardingView(onFinish: {})
}
