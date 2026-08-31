import { useEffect, useState, type RefObject } from 'react';
import styles from './FocusTraceOverlay.module.css';

interface FocusTraceOverlayProps {
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * FocusTraceOverlay — the project's signature visual element.
 *
 * Focus order is normally invisible: sighted mouse users never think about
 * it, and it only becomes real when you're actually operating the page by
 * keyboard. This overlay makes it visible for everyone — a glowing dot
 * that travels to wherever keyboard focus currently is, tracked live via
 * the browser's own `focusin` event. It's a deliberate, bold design
 * choice: the one place this project spends real visual effort making an
 * invisible accessibility mechanic viscerally obvious, which is the whole
 * thesis of the product made literal.
 */
export function FocusTraceOverlay({ containerRef }: FocusTraceOverlayProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      const container = containerRef.current;
      const target = event.target;
      if (!container || !(target instanceof HTMLElement) || !container.contains(target)) {
        setPosition(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setPosition({
        x: targetRect.left + targetRect.width / 2 - containerRect.left,
        y: targetRect.top + targetRect.height / 2 - containerRect.top,
      });
    }

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [containerRef]);

  if (!position) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.trace} style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
        <div className={styles.pulse} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
