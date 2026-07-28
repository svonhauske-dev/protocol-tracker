import AppIntents
import WidgetKit
import Foundation

// Quick-log: fired by the widget's "Take" button (iOS 17+). Runs in the widget
// extension process, so it can't touch the RN app or Supabase directly. Instead
// it appends the currently-shown dose to the App Group pendingLogs queue (see
// SharedData.appendPendingLog) — the app drains that queue and syncs to the
// server on its next foreground (deferred reconcile). Reloading the timeline
// makes the widget immediately show its "✓ Logged" confirmation.
@available(iOS 16.0, *)
struct LogDoseIntent: AppIntent {
    static var title: LocalizedStringResource = "Log dose"
    static var description = IntentDescription("Mark your next supplement dose as taken.")

    func perform() async throws -> some IntentResult {
        guard let dose = loadNextDose(), !dose.allTakenToday, !dose.suppIds.isEmpty else {
            return .result()
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        let at = formatter.string(from: Date())
        appendPendingLog(PendingLog(date: dose.date, slot: dose.slotId, suppIds: dose.suppIds, at: at))
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
