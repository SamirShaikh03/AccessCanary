import styles from './NarrationPanel.module.css';

interface PendingViolationCardProps {
  description: string;
  selector: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * PendingViolationCard — the visible moment where the human-in-the-loop
 * mechanism becomes real. The `report_violation` tool can only propose a
 * finding; nothing gets logged until a human clicks Confirm here. This
 * card is the entire point being demonstrated, so it's given real visual
 * weight rather than being a quiet inline row.
 */
export function PendingViolationCard({
  description,
  selector,
  onConfirm,
  onDismiss,
}: PendingViolationCardProps) {
  const headline = selector ? `Focus jumped to <${selector}> — expected next field.` : 'Unexpected focus jump';

  return (
    <div className={styles.pendingCard} role="alert">
      <div className={styles.pendingHeaderRow}>
        <span className={styles.pendingBadge}>Pending violation</span>
        <time className={styles.pendingTimestamp}>Just now</time>
      </div>

      <div className={styles.pendingBody}>
        <span className={styles.pendingIcon} aria-hidden="true">
          !
        </span>

        <div className={styles.pendingContent}>
          <p className={styles.pendingHeadline}>
            {headline.split('<').map((part, index) => {
              if (index === 0) return part;
              const end = part.indexOf('>');
              if (end === -1) return `<${part}`;
              const before = part.slice(0, end);
              const after = part.slice(end + 1);
              return (
                <>
                  <code key={`code-${index}`}>{`<${before}>`}</code>
                  {after}
                </>
              );
            })}
          </p>

          <p className={styles.pendingDescription}>{description}</p>
        </div>
      </div>

      <div className={styles.pendingActions}>
        <button type="button" className={styles.dismissButton} onClick={onDismiss}>
          Dismiss
        </button>
        <button type="button" className={styles.confirmButton} onClick={onConfirm}>
          Confirm violation
        </button>
      </div>
    </div>
  );
}
