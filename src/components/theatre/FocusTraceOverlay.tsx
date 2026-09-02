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
    let focusedTarget: HTMLElement | null = null;

    function updatePosition() {
      const container = containerRef.current;
      if (!container || !focusedTarget || !container.contains(focusedTarget)) {
        setPosition(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const targetRect = focusedTarget.getBoundingClientRect();
      const markerRadius = 11;
      const edgeOffset = 8;
      setPosition({
        x: Math.min(
          Math.max(targetRect.right - containerRect.left + edgeOffset, markerRadius),
          containerRect.width - markerRadius,
        ),
        y: Math.min(
          Math.max(targetRect.top - containerRect.top - edgeOffset, markerRadius),
          containerRect.height - markerRadius,
        ),
      });
    }

    function handleFocusIn(event: FocusEvent) {
      focusedTarget = event.target instanceof HTMLElement ? event.target : null;
      updatePosition();
    }

    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
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
