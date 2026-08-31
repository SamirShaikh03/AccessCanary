import { useViolationsStore } from '../../store/useViolationsStore';
import { useNarrationStore } from '../../store/useNarrationStore';
import { PendingViolationCard } from './PendingViolationCard';
import styles from './NarrationPanel.module.css';

/**
 * NarrationPanel — the "observer" half of the theatre layout. Shows, in
 * plain language, what each WebMCP tool call is doing as it happens, any
 * findings awaiting human confirmation, and the confirmed violation log.
 */
export function NarrationPanel() {
  const { violations, pending, confirmViolation, dismissViolation } = useViolationsStore();
  const { entries } = useNarrationStore();

  const recentEntries = [...entries].reverse().slice(0, 12);

  return (
    <div className={styles.panel}>
      {pending.length > 0 && (
        <section aria-label="Findings awaiting confirmation">
          <p className={styles.sectionLabel}>Awaiting your confirmation</p>
          <div className={styles.pendingList}>
            {pending.map((p) => (
              <PendingViolationCard
                key={p.pendingId}
                description={p.description}
                selector={p.selector}
                severity={p.severity}
                onConfirm={() => confirmViolation(p.pendingId)}
                onDismiss={() => dismissViolation(p.pendingId)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Live tool activity">
        <p className={styles.sectionLabel}>Live activity</p>
        {recentEntries.length === 0 ? (
          <p className={styles.emptyState}>
            Tab through the form to see the agent's WebMCP tool calls appear here.
          </p>
        ) : (
          <ul className={styles.feed}>
            {recentEntries.map((entry) => (
              <li key={entry.id} className={styles.feedItem} data-status={entry.status}>
                <span className={styles.feedDot} aria-hidden="true" />
                <div>
                  <code className={styles.toolName}>{entry.toolName}</code>
                  <p className={styles.feedMessage}>{entry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {violations.length > 0 && (
        <section aria-label="Confirmed violations">
          <p className={styles.sectionLabel}>Confirmed violations ({violations.length})</p>
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
