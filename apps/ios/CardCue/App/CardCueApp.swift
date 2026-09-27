import SwiftUI
import SwiftData

@main
struct CardCueApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: [CreditCard.self, Transaction.self])
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "square.grid.2x2")
                }

            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }

            CardsListView()
                .tabItem {
                    Label("Cards", systemImage: "creditcard")
                }

            TransactionsListView()
                .tabItem {
                    Label("Transactions", systemImage: "list.bullet")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
        .tint(Theme.Colors.accent)
    }
}

struct SettingsView: View {
    @AppStorage("preferredCurrency") private var currency = "PHP"
    @AppStorage("requireFaceID") private var requireFaceID = false

    var body: some View {
        NavigationStack {
            List {
                Section("Profile") {
                    LabeledContent("Currency", value: currency)
                    LabeledContent("Timezone", value: TimeZone.current.identifier)
                }
                Section("Notifications") {
                    Text("Statement & payment reminders")
                }
                Section("Security") {
                    Toggle("Face ID", isOn: $requireFaceID)
                }
                Section("Data") {
                    Text("Export CSV")
                }
                Section("About") {
                    LabeledContent("App", value: "CardCue")
                    LabeledContent("Version", value: "1.0.0")
                }
            }
            .navigationTitle("Settings")
        }
    }
}
