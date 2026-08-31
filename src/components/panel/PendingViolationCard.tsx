import styles from './NarrationPanel.module.css';

interface PendingViolationCardProps {
  description: string;
  selector: string;
  severity: string;
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
  severity,
  onConfirm,
  onDismiss,
}: PendingViolationCardProps) {
  return (
    <div className={styles.pendingCard} role="alert">
      <div className={styles.pendingHeader}>
        <span className={styles.severityBadge} data-severity={severity}>
          {severity}
        </span>
        <code className={styles.selectorText}>{selector}</code>
      </div>
      <p className={styles.pendingDescription}>{description}</p>
      <div className={styles.pendingActions}>
        <button type="button" className={styles.confirmButton} onClick={onConfirm}>
          Confirm finding
        </button>
        <button type="button" className={styles.dismissButton} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
