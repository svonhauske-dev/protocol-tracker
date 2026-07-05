// Protocol PDF — a one-page printable artifact describing the SHAPE of a
// protocol (no times, no execution data): what someone hands a doctor, texts a
// friend, or files away. Mirrors the web artifact (src/lib/pdf.js): header with
// ORIGIN wordmark, owner/status row, slot-grouped sections, per-item metadata,
// and a "not medical advice" footer. Rendered as HTML → PDF via expo-print
// (WebKit), styled "terminal on paper": white surface, near-black text,
// JetBrains Mono + Space Grotesk, hairline rules, zero radius.

import { SLOTS, IF_SLOTS } from 'shared/lib/notifications';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Date / metadata formatters (ported from src/lib/pdf.js) ──────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseLocalDate = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const fmtLong = (d) => (d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '');
const fmtShort = (d) => (d ? `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}` : '');
const trimS = (s) => (s && s.endsWith('s') ? s.slice(0, -1) : s);

function displayName(profile) {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (profile?.email) return String(profile.email).split('@')[0];
  return 'Owner';
}
function startedDate(protocol) {
  const d = parseLocalDate(protocol?.starts_at) || parseLocalDate(protocol?.created_at);
  return d ? fmtLong(d) : '';
}
function treatmentMode(protocol) {
  if (!protocol) return 'Indefinite';
  const ends = parseLocalDate(protocol.ends_at);
  if (ends) return `Through ${fmtLong(ends)}`;
  const starts = parseLocalDate(protocol.starts_at);
  if (protocol.treatment_mode === 'scheduled' && starts && !ends) return 'Scheduled';
  return 'Indefinite';
}
function dayRestriction(days) {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) return '';
  return [...days].sort((a, b) => a - b).map((d) => DAYS_SHORT[d]).join(', ');
}
// Precedence: cycle pattern → scheduled end → day restriction → notes.
function metadata(s) {
  if (s.treatment_mode === 'cycled' && s.cycle_on_value && s.cycle_off_value) {
    const on = s.cycle_on_value === 1 ? trimS(s.cycle_on_unit) : s.cycle_on_unit;
    const off = s.cycle_off_value === 1 ? trimS(s.cycle_off_unit) : s.cycle_off_unit;
    return `${s.cycle_on_value} ${on || 'days'} on, ${s.cycle_off_value} ${off || 'days'} off`;
  }
  if (s.treatment_mode === 'scheduled' && s.ends_at) {
    const d = parseLocalDate(s.ends_at);
    if (d) return `Through ${fmtShort(d)}`;
  }
  const dr = dayRestriction(s.days);
  if (dr) return dr;
  if (s.notes?.trim()) { const n = s.notes.trim(); return n.length > 40 ? `${n.slice(0, 39)}…` : n; }
  return '';
}

// ── Grouping (ported from src/lib/pdf.js groupBySlot) ────────────────────────
// A supp appears under every known slot it's assigned to; no slots → Anytime;
// only-unknown slots → Other. Active only (paused / soft-deleted excluded).
function groupBySlot(supps, scheduleMode) {
  const active = supps.filter((s) => !s.deleted_at && s.status !== 'paused' && !(!s.status && s.paused));
  const slotDefs = scheduleMode === 'fasting' ? IF_SLOTS : SLOTS;
  const known = new Set(slotDefs.map((s) => s.id));
  const buckets = new Map();
  const anytime = [];
  const orphans = [];
  for (const supp of active) {
    const slots = Array.isArray(supp.slots) ? supp.slots : [];
    if (slots.length === 0) { anytime.push(supp); continue; }
    let placed = false;
    for (const sid of slots) {
      if (!known.has(sid)) continue;
      if (!buckets.has(sid)) buckets.set(sid, []);
      buckets.get(sid).push(supp);
      placed = true;
    }
    if (!placed) orphans.push(supp);
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  const groups = [];
  for (const slot of slotDefs) {
    const b = buckets.get(slot.id);
    if (b && b.length) groups.push({ label: slot.label, supps: b.slice().sort(byName) });
  }
  if (anytime.length) groups.push({ label: 'Anytime', supps: anytime.slice().sort(byName) });
  if (orphans.length) groups.push({ label: 'Other', supps: orphans.slice().sort(byName) });
  return groups;
}

// ── HTML ─────────────────────────────────────────────────────────────────────
function buildHtml(protocol, supps, profile, scheduleMode) {
  const groups = groupBySlot(supps, scheduleMode);
  const count = groups.reduce((n, g) => n + g.supps.length, 0);

  const status = [
    `For: ${esc(displayName(profile))}`,
    'Active',
    startedDate(protocol) ? `Started ${esc(startedDate(protocol))}` : '',
    esc(treatmentMode(protocol)),
  ].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');

  const sections = groups.map((g) => {
    const rows = g.supps.map((s) => {
      const meta = metadata(s);
      return `<tr>
        <td class="nm">${esc(s.name)}</td>
        <td class="dose">${esc(s.dose || '')}</td>
        <td class="meta">${esc(meta)}</td>
      </tr>`;
    }).join('');
    return `<div class="slot">
      <div class="slot-label">${esc(g.label)}</div>
      <table>${rows}</table>
    </div>`;
  }).join('');

  const body = count === 0
    ? `<div class="empty">No active items in this protocol.</div>`
    : sections;

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet"/>
  <style>
    @page { margin: 44px; }
    * { box-sizing: border-box; }
    body { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; color: #0d0d0d; -webkit-font-smoothing: antialiased; font-size: 13px; }

    /* Header — protocol name (Grotesk) left, ORIGIN wordmark right */
    .head { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 16px; border-bottom: 1.5px solid #0d0d0d; }
    .head h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 500; font-size: 20px; margin: 0; letter-spacing: -0.3px; }
    .wordmark { font-size: 11px; letter-spacing: 3px; color: #0d0d0d; text-transform: uppercase; }

    /* Owner / status row */
    .status { font-family: 'Space Grotesk', sans-serif; font-size: 12.5px; color: #666; padding: 16px 0; border-bottom: 0.5px solid #e5e5e5; }

    /* Slot sections */
    .slot { margin-top: 22px; }
    .slot-label { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #0d0d0d; padding-bottom: 4px; border-bottom: 0.5px solid #0d0d0d; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    td { padding: 7px 0; vertical-align: top; }
    .nm { font-weight: 700; width: 46%; padding-right: 10px; }
    .dose { color: #444; width: 22%; padding-right: 10px; white-space: nowrap; }
    .meta { color: #666; width: 32%; text-align: right; }

    .empty { color: #666; text-align: center; padding: 40px 0; }

    /* Footer */
    .foot { margin-top: 34px; padding-top: 12px; border-top: 0.5px solid #e5e5e5; display: flex; justify-content: space-between; font-family: 'Space Grotesk', sans-serif; font-size: 10px; color: #888; }
  </style></head>
  <body>
    <div class="head">
      <h1>${esc(protocol?.name || 'Untitled protocol')}</h1>
      <span class="wordmark">ORIGIN</span>
    </div>
    <div class="status">${status}</div>
    ${body}
    <div class="foot">
      <span>Generated by Origin · ${esc(fmtLong(new Date()))}</span>
      <span>Personal wellness tracking · Not medical advice</span>
    </div>
  </body></html>`;
}

function suppsFor(protocol, allSupps) {
  return (allSupps || []).filter((s) => s.protocol_id === protocol.id);
}

// The rendered document HTML — used both for the in-app WebView preview and for
// the PDF file itself, so the preview matches the exported PDF exactly.
export function protocolHtml(protocol, allSupps, profile, scheduleMode) {
  return buildHtml(protocol, suppsFor(protocol, allSupps), profile, scheduleMode);
}

// Filesystem-safe filename from the protocol name → "Thyroid Protocol.pdf".
const safeFileName = (name) => `${String(name || 'protocol').replace(/[\/\\:*?"<>|]/g, '-').trim().slice(0, 80) || 'protocol'}.pdf`;

// Render the PDF, give it a human filename ("{Protocol}.pdf" — not a temp UUID),
// and open the iOS share sheet to send it (Messages / Mail / AirDrop / Files).
export async function shareProtocolPdf(protocol, allSupps, profile, scheduleMode) {
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  const { File, Paths } = await import('expo-file-system');
  const { uri } = await Print.printToFileAsync({ html: protocolHtml(protocol, allSupps, profile, scheduleMode) });

  // expo-print writes a random temp name; copy to a nicely-named file so the
  // shared attachment reads "Thyroid Protocol.pdf".
  let shareUri = uri;
  try {
    const named = new File(Paths.cache, safeFileName(protocol?.name));
    try { if (named.exists) named.delete(); } catch {}
    new File(uri).copy(named);
    shareUri = named.uri;
  } catch { /* fall back to the temp uri if the copy fails */ }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: `Share ${protocol?.name || 'protocol'}`, UTI: 'com.adobe.pdf' });
  }
  return shareUri;
}
