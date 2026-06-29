// Generate a shareable PDF of a protocol and hand it to the iOS share sheet
// (AirDrop / Messages / Mail / Files) — this is both "share as PDF" and "send".
// Styled as "terminal on paper": light, printable, JetBrains Mono, sharp rules,
// the Origin mark — authored, not a generic export.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const prettySlots = (slots) =>
  Array.isArray(slots) && slots.length ? slots.map((x) => x.replace(/_/g, ' ')).join(', ') : 'anytime';

function buildHtml(protocol, supps) {
  const rows = supps
    .map((s, i) => `
      <tr>
        <td class="idx">${String(i + 1).padStart(2, '0')}</td>
        <td class="nm">${esc(s.name)}</td>
        <td class="dose">${esc(s.dose || '—')}</td>
        <td class="when">${esc(prettySlots(s.slots))}</td>
      </tr>${s.notes ? `<tr><td></td><td colspan="3" class="notes">${esc(s.notes)}</td></tr>` : ''}`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"/>
  <style>
    @page { margin: 48px; }
    * { box-sizing: border-box; }
    body { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; color: #0d0d0d; -webkit-font-smoothing: antialiased; }
    .ey { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6b6b6b; }
    h1 { font-family: 'Space Grotesk', sans-serif; font-size: 30px; letter-spacing: -1px; margin: 4px 0 0; display: flex; align-items: center; gap: 10px; }
    .pt { width: 11px; height: 11px; background: #5fe090; display: inline-block; } /* origin mark */
    hr { border: none; border-top: 1.5px solid #0d0d0d; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 11px 8px; border-bottom: 1px solid #e3e3e3; vertical-align: top; font-size: 13px; }
    .idx { color: #b0b0b0; width: 30px; }
    .nm { font-weight: 700; }
    .dose { color: #333; white-space: nowrap; }
    .when { color: #6b6b6b; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; text-align: right; white-space: nowrap; }
    .notes { color: #6b6b6b; font-size: 12px; padding-top: 0; border-bottom: 1px solid #e3e3e3; }
    .foot { margin-top: 26px; font-size: 10px; letter-spacing: 1.5px; color: #999; text-transform: uppercase; }
  </style></head>
  <body>
    <div class="ey">// origin protocol</div>
    <h1><span class="pt"></span>${esc(protocol.name)}</h1>
    <hr/>
    <table>${rows || '<tr><td class="notes">no items in this protocol</td></tr>'}</table>
    <div class="foot">${supps.length} item${supps.length !== 1 ? 's' : ''} · exported from origin</div>
  </body></html>`;
}

export async function shareProtocolPdf(protocol, allSupps) {
  // Lazy-loaded so the native modules are only touched when the user actually
  // shares — the app still bundles/runs on a binary that predates them.
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  const supps = (allSupps || []).filter((s) => s.protocol_id === protocol.id);
  const { uri } = await Print.printToFileAsync({ html: buildHtml(protocol, supps) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${protocol.name}`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
