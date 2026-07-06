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
// Schedule qualifier only (cycle / scheduled-end / day-restriction) — NOT notes.
// Notes render in full on the detail line, so they're no longer truncated here.
function scheduleQualifier(s) {
  if (s.treatment_mode === 'cycled' && s.cycle_on_value && s.cycle_off_value) {
    const on = s.cycle_on_value === 1 ? trimS(s.cycle_on_unit) : s.cycle_on_unit;
    const off = s.cycle_off_value === 1 ? trimS(s.cycle_off_unit) : s.cycle_off_unit;
    return `${s.cycle_on_value} ${on || 'days'} on, ${s.cycle_off_value} ${off || 'days'} off`;
  }
  if (s.treatment_mode === 'scheduled' && s.ends_at) {
    const d = parseLocalDate(s.ends_at);
    if (d) return `through ${fmtShort(d)}`;
  }
  return dayRestriction(s.days) || '';
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
    `For ${esc(displayName(profile))}`,
    'Active',
    startedDate(protocol) ? `Started ${esc(startedDate(protocol))}` : '',
    esc(treatmentMode(protocol)),
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const sections = groups.map((g) => {
    const items = g.supps.map((s) => {
      // Detail line: dose (emphasised) · notes/strength (in full — no truncation)
      // · schedule qualifier. Left-aligned, wraps naturally.
      const parts = [];
      if (s.dose) parts.push(`<span class="d-dose">${esc(s.dose)}</span>`);
      if (s.notes && s.notes.trim()) parts.push(esc(s.notes.trim()));
      const q = scheduleQualifier(s);
      if (q) parts.push(esc(q));
      const detail = parts.join(' &nbsp;·&nbsp; ');
      return `<div class="item">
        <div class="i-name">${esc(s.name)}</div>
        ${detail ? `<div class="i-detail">${detail}</div>` : ''}
      </div>`;
    }).join('');
    return `<section class="slot">
      <div class="slot-head"><span class="slot-label">${esc(g.label)}</span><span class="slot-count">${g.supps.length}</span></div>
      ${items}
    </section>`;
  }).join('');

  const body = count === 0
    ? `<div class="empty">$ no active items in this protocol</div>`
    : sections;

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet"/>
  <style>
    @page { margin: 56px 52px; }
    * { box-sizing: border-box; }
    body { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; color: #0d0d0d; -webkit-font-smoothing: antialiased; font-size: 12px; line-height: 1.5; }

    /* ── Masthead — stacked, left-aligned (one clean edge for everything) ── */
    .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: #0d0d0d; }
    h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 27px; letter-spacing: -0.6px; margin: 9px 0 0; line-height: 1.1; }
    .meta { font-family: 'Space Grotesk', sans-serif; font-size: 12px; color: #565656; margin-top: 10px; }
    .meta .count { color: #0d0d0d; }
    .rule { height: 2px; background: #0d0d0d; margin: 18px 0 2px; }

    /* ── Slot sections ── */
    .slot { margin-top: 26px; break-inside: avoid; }
    .slot-head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid #0d0d0d; padding-bottom: 6px; }
    .slot-label { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; }
    .slot-count { font-size: 10px; letter-spacing: 1px; color: #a0a0a0; }

    /* ── Items — two lines: name (Grotesk, the hero) + detail (mono, the data) ── */
    .item { padding: 11px 0; border-bottom: 0.75px solid #ededed; break-inside: avoid; }
    .item:last-child { border-bottom: none; }
    .i-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 14.5px; letter-spacing: -0.2px; }
    .i-detail { font-size: 11.5px; color: #666; margin-top: 4px; line-height: 1.55; }
    .i-detail .d-dose { color: #0d0d0d; font-weight: 500; }

    .empty { color: #888; padding: 48px 0; font-size: 13px; }

    /* ── Footer ── */
    .foot { margin-top: 40px; padding-top: 12px; border-top: 1px solid #0d0d0d; display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.3px; color: #999; }
  </style></head>
  <body>
    <div class="eyebrow">ORIGIN</div>
    <h1>${esc(protocol?.name || 'Untitled protocol')}</h1>
    <div class="meta">${status}<br/><span class="count">${count} ${count === 1 ? 'item' : 'items'} · ${groups.length} ${groups.length === 1 ? 'group' : 'groups'}</span></div>
    <div class="rule"></div>
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
