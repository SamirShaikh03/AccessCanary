import { useViolationsStore } from '../../store/useViolationsStore';
import { useNarrationStore } from '../../store/useNarrationStore';
import { PendingViolationCard } from './PendingViolationCard';
import styles from './NarrationPanel.module.css';

function downloadAuditBrief(violations: ReturnType<typeof useViolationsStore>['violations']): void {
  const report = {
    product: 'AccessCanary',
    generatedAt: new Date().toISOString(),
    confirmedCount: violations.length,
    findings: violations,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `accesscanary-audit-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * NarrationPanel — the "observer" half of the theatre layout. Shows, in
 * plain language, what each WebMCP tool call is doing as it happens, any
 * findings awaiting human confirmation, and the confirmed violation log.
 */
export function NarrationPanel() {
  const { violations, pending, confirmViolation, dismissViolation } = useViolationsStore();
  const { entries, clearEntries } = useNarrationStore();

  const recentEntries = [...entries].reverse().slice(0, 12);

  return (
    <div className={styles.panel}>
      <header className={styles.headerRow}>
        <h2 className={styles.headerTitle}>Agent narration</h2>
        <button
          type="button"
          className={styles.clearButton}
          aria-label="Clear narration log"
          onClick={clearEntries}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.clearIcon}>
            <path d="M4 7h16M9 7V4h6v3m-8 0l1 13h10l1-13" />
          </svg>
          Clear log
        </button>
      </header>

      {pending.length > 0 && (
        <section aria-label="Findings awaiting confirmation" className={styles.sectionBlock}>
          <div className={styles.pendingList}>
            {pending.map((p) => (
              <PendingViolationCard
                key={p.pendingId}
                description={p.description}
                selector={p.selector}
                evidence={p.evidence}
                onConfirm={() => confirmViolation(p.pendingId)}
                onDismiss={() => dismissViolation(p.pendingId)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Live tool activity" className={styles.sectionBlock}>
        {recentEntries.length === 0 ? (
          <p className={styles.emptyState}>
            Tab through the form to see the agent's WebMCP tool calls appear here.
          </p>
        ) : (
          <ul className={styles.feed}>
            {recentEntries.map((entry) => (
              <li key={entry.id} className={styles.feedItem} data-status={entry.status}>
                <span className={styles.feedTimeline} aria-hidden="true" />
                <span className={styles.feedIcon} data-status={entry.status} aria-hidden="true" />
                <div className={styles.feedContent}>
                  <div className={styles.feedHeader}>
                    <code className={styles.toolName}>{entry.toolName}</code>
                    <time className={styles.feedTimestamp} dateTime={entry.timestamp}>
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })}
                    </time>
                  </div>
                  <p className={styles.feedMessage}>{entry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {violations.length > 0 && (
        <section aria-label="Confirmed violations" className={styles.sectionBlock}>
          <div className={styles.confirmedHeader}>
            <p className={styles.confirmedLabel}>Confirmed audit findings</p>
            <button type="button" className={styles.exportButton} onClick={() => downloadAuditBrief(violations)}>
              Export audit brief
            </button>
          </div>
          <ul className={styles.confirmedList}>
            {violations.map((v) => (
              <li key={v.id} className={styles.confirmedItem}>
                <span className={styles.severityBadge} data-severity={v.severity}>
                  {v.severity}
                </span>
                <span>{v.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
