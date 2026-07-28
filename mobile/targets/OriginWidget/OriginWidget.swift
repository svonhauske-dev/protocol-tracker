import WidgetKit
import SwiftUI

// MARK: - Timeline

struct DoseEntry: TimelineEntry {
    let date: Date
    let dose: NextDose?
    let justLogged: Bool // the shown slot was just quick-logged, awaiting reconcile
}

struct Provider: TimelineProvider {
    private func makeEntry() -> DoseEntry {
        let dose = loadNextDose() ?? sampleDose
        var logged = false
        if let marker = lastLoggedKeyValue() {
            logged = marker == "\(dose.date)_\(dose.slotId)"
        }
        return DoseEntry(date: Date(), dose: dose, justLogged: logged)
    }

    func placeholder(in context: Context) -> DoseEntry {
        DoseEntry(date: Date(), dose: sampleDose, justLogged: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (DoseEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DoseEntry>) -> Void) {
        // Hourly fallback refresh. The app also nudges reloads via
        // WidgetCenter whenever the snapshot changes or a tap is reconciled.
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        completion(Timeline(entries: [makeEntry()], policy: .after(refresh)))
    }
}

// MARK: - View

// Terminal Achromatic palette. WidgetKit can't load the app's JetBrains Mono
// bundle without embedding the font in this target (follow-up), so we
// approximate with the system monospaced design for now.
private let surface = Color(red: 0.051, green: 0.051, blue: 0.051) // #0D0D0D

struct OriginWidgetView: View {
    var entry: DoseEntry

    var body: some View {
        content.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    @ViewBuilder
    private var content: some View {
        if let dose = entry.dose, !dose.allTakenToday {
            if entry.justLogged {
                loggedState(dose)
            } else {
                doseState(dose)
            }
        } else {
            emptyState
        }
    }

    // Pending dose + the quick-log button.
    private func doseState(_ dose: NextDose) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            // With a resolved time: slot name is the eyebrow, time is the
            // headline. Without one (schedule "none" / anchor not started):
            // the slot name becomes the headline and the time row is dropped.
            if dose.timeLabel.isEmpty {
                Text(dose.slotLabel.isEmpty ? "NEXT UP" : dose.slotLabel.uppercased())
                    .font(.system(size: 16, weight: .semibold, design: .monospaced))
                    .foregroundColor(.white)
            } else {
                Text(dose.slotLabel.uppercased())
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.6))
                Text(dose.timeLabel)
                    .font(.system(size: 22, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }
            ForEach(dose.items.prefix(2), id: \.self) { item in
                Text(item)
                    .font(.system(size: 13, weight: .regular, design: .monospaced))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(1)
            }
            Spacer(minLength: 4)
            takeButton
        }
    }

    // iOS 17+ interactive button. Below 17, widgets can't run App Intents, so
    // the widget stays a display-only surface (no button).
    @ViewBuilder
    private var takeButton: some View {
        if #available(iOS 17.0, *) {
            Button(intent: LogDoseIntent()) {
                Text("TAKE")
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
                    .overlay(Rectangle().stroke(Color.white, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
    }

    // Instant confirmation after a tap, before the app reconciles.
    private func loggedState(_ dose: NextDose) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("LOGGED ✓")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.6))
            Text(dose.slotLabel.isEmpty ? "Dose taken" : dose.slotLabel)
                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                .foregroundColor(.white)
            Spacer(minLength: 0)
        }
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("ALL DONE")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.6))
            Text("Nothing left today")
                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                .foregroundColor(.white)
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Widget

struct OriginWidget: Widget {
    let kind = "OriginWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                OriginWidgetView(entry: entry)
                    .padding(16)
                    .containerBackground(for: .widget) { surface }
            } else {
                OriginWidgetView(entry: entry)
                    .padding(16)
                    .background(surface)
            }
        }
        .configurationDisplayName("Next Dose")
        .description("Your next supplement slot for today — tap to log it.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct OriginWidgetBundle: WidgetBundle {
    var body: some Widget {
        OriginWidget()
    }
}
