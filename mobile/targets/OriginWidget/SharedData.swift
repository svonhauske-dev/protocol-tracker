import Foundation

// Shared contract between the RN app and the widget, via the App Group.
//   nextDose    (app → widget)  today's next dose snapshot.
//   pendingLogs (widget → app)  quick-log taps awaiting reconcile.
//   lastLogged  (widget → app)  "date_slot" the user just logged, for instant
//                               widget confirmation before the app reconciles.
// Keep these keys + shapes in sync with mobile/lib/widget.js.

let appGroupId = "group.app.origin-protocol"
let nextDoseKey = "nextDose"
let pendingLogsKey = "pendingLogs"
let lastLoggedKey = "lastLogged"

struct NextDose: Codable {
    let slotLabel: String    // display name, e.g. "With Breakfast"
    let slotId: String       // stable slot id, e.g. "breakfast"
    let timeLabel: String    // e.g. "08:00" (empty when no resolved time)
    let items: [String]      // supplement names due at this slot
    let suppIds: [String]    // parallel ids — what a quick-log tap records
    let date: String         // "YYYY-MM-DD" this snapshot is for
    let allTakenToday: Bool  // true when nothing is left for today
}

// One quick-log tap. Appended to the pendingLogs queue; the app reconciles it
// into that date's day-row and syncs to Supabase on next foreground.
struct PendingLog: Codable {
    let date: String
    let slot: String
    let suppIds: [String]
    let at: String           // "HH:MM" the tap happened
}

func sharedDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupId)
}

func loadNextDose() -> NextDose? {
    guard let raw = sharedDefaults()?.string(forKey: nextDoseKey),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(NextDose.self, from: data)
}

// Append a tap to the queue (read-modify-write the JSON string) and drop a
// confirmation marker for the slot just logged.
func appendPendingLog(_ log: PendingLog) {
    guard let defaults = sharedDefaults() else { return }
    var queue: [PendingLog] = []
    if let raw = defaults.string(forKey: pendingLogsKey),
       let data = raw.data(using: .utf8),
       let decoded = try? JSONDecoder().decode([PendingLog].self, from: data) {
        queue = decoded
    }
    queue.append(log)
    if let encoded = try? JSONEncoder().encode(queue),
       let str = String(data: encoded, encoding: .utf8) {
        defaults.set(str, forKey: pendingLogsKey)
    }
    defaults.set("\(log.date)_\(log.slot)", forKey: lastLoggedKey)
}

// The "date_slot" the user most recently logged from the widget, if any. The
// app clears this on reconcile.
func lastLoggedKeyValue() -> String? {
    sharedDefaults()?.string(forKey: lastLoggedKey)
}

// Rendered when the App Group is empty (fresh install, or before the app has
// written a snapshot). Also used for the widget gallery placeholder.
let sampleDose = NextDose(
    slotLabel: "With Breakfast",
    slotId: "breakfast",
    timeLabel: "08:00",
    items: ["Vitamin D3", "Omega-3", "Magnesium"],
    suppIds: ["sample-1", "sample-2", "sample-3"],
    date: "2026-01-01",
    allTakenToday: false
)
