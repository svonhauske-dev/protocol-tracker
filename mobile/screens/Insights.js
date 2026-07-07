import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share } from 'lucide-react-native';
import { dateKey, startOfDay, isActiveSupp } from 'shared/lib/time';
import { dbGetDailyLogsRange, dbGetCheckinsRange } from 'shared/lib/api';
import { Heading } from '../components';
import IconButton from '../components/IconButton';
import TabBar from '../components/TabBar';
import InlineLoader from '../components/InlineLoader';
import PdfPreviewModal from '../components/PdfPreviewModal';
import { useToast } from '../components/Toast';
import { computeReportData, healthReportHtml, sharePdfHtml } from '../lib/protocolPdf';
import Trends from './Trends';
import Interactions from './Interactions';
import { theme, spacing, icon } from '../theme';

const REPORT_WINDOW = 90; // days

// Insights — the regimen's read-only review surface. Folds the two low-frequency
// "look back" screens under one entry with a TabBar (same title + tabs pattern as
// ProtocolLibrary's active/saved). `timing` is quiet enough that it doesn't earn
// its own top-bar slot; the edit-time note + the amber home icon carry the
// urgent case, and `initialTab` opens straight to timing when a conflict exists.
const TABS = [
  { value: 'adherence', label: 'adherence' },
  { value: 'interactions', label: 'interactions' },
];

export default function Insights({ supps = [], activeSlotIds, slotDefs = [], userId, token, profile, scheduleMode, onBack, initialTab = 'adherence' }) {
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [exporting, setExporting] = useState(false);
  const [reportHtml, setReportHtml] = useState(null); // non-null → preview open
  const [sharing, setSharing] = useState(false);

  const reportName = `${(profile?.display_name || '').trim() || 'Origin'} — Origin report`;

  // Build the doctor report — the whole regimen + adherence + how-you-feel over
  // the window (same engine as the protocol PDF) — and open the preview. Fetches
  // the window's logs + check-ins and computes the summary once.
  const exportReport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const today = startOfDay(new Date());
      const start = new Date(today); start.setDate(start.getDate() - (REPORT_WINDOW - 1));
      const [logs, checkins] = await Promise.all([
        dbGetDailyLogsRange(userId, dateKey(start), dateKey(today), token).catch(() => []),
        dbGetCheckinsRange(userId, dateKey(start), dateKey(today), token).catch(() => []),
      ]);
      const report = computeReportData({ supps, logs: logs || [], checkins: checkins || [], slotDefs, activeSlotIds, windowDays: REPORT_WINDOW });
      setReportHtml(healthReportHtml(profile, supps.filter(isActiveSupp), scheduleMode, report));
    } catch (e) {
      showToast("couldn't build the report — try again", { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Share the already-built report from the preview (no recompute).
  const handleShare = async () => {
    if (sharing || !reportHtml) return;
    setSharing(true);
    try {
      await sharePdfHtml(reportHtml, reportName, 'Share your report');
    } catch (e) {
      showToast("couldn't share — try again", { tone: 'error' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface.canvas }}>
      {/* Header — drill-in nav-title with hairline; export action on the right. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Math.max(insets.top, 20), paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: theme.borderWidth.default, borderBottomColor: theme.border.subtle }}>
        <IconButton accessibilityLabel="Back" onPress={onBack}><ArrowLeft size={icon.sm} color={theme.text.secondary} /></IconButton>
        <Heading level={1} visual="body" font="body">Insights</Heading>
        <IconButton accessibilityLabel="Export report for your doctor" onPress={exportReport} disabled={exporting}>
          {exporting ? <InlineLoader /> : <Share size={icon.sm} color={theme.text.secondary} strokeWidth={1.5} />}
        </IconButton>
      </View>

      {/* Tabs — inset + lg gap under the header, matching ProtocolLibrary's active/saved. */}
      <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.md }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </View>

      {tab === 'adherence' ? (
        <Trends embedded supps={supps} activeSlotIds={activeSlotIds} slotDefs={slotDefs} userId={userId} token={token} onClose={onBack} />
      ) : (
        <Interactions embedded supps={supps} />
      )}

      {/* Report preview — see the doctor report before sending, share from here. */}
      <PdfPreviewModal
        open={!!reportHtml}
        html={reportHtml || ''}
        onShare={handleShare}
        onClose={() => setReportHtml(null)}
        sharing={sharing}
      />
    </View>
  );
}
