import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import styles from './BenefitsForm.module.css';

interface DatePickerTrapProps {
  label: string;
}

/**
 * DatePickerTrap — a minimal custom date field with a real keyboard trap.
 *
 * BUG 3 — KEYBOARD TRAP (triggers after repeated cycling, not immediately).
 *
 * When the popover is open, Tab is meant to cycle focus between the day,
 * month, and year inputs and then release focus back to the page. The bug:
 * the wrap-around counter that's supposed to close the popover after one
 * full cycle never resets, so once `cycleCount` exceeds the number of
 * fields, the modulo logic below keeps trapping focus inside the popover
 * indefinitely instead of releasing it. This mirrors a real pattern found
 * in custom date-picker implementations that hand-roll focus cycling
 * instead of using a tested focus-trap library.
 *
 * The three internal inputs are intentionally NOT escapable via Tab once
 * this state is reached — Escape still closes it, which is realistic:
 * many real-world traps have exactly one working exit, not zero.
 */
export function DatePickerTrap({ label }: DatePickerTrapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const cycleCount = useRef(0);

  useEffect(() => {
    if (isOpen) {
      cycleCount.current = 0;
      dayRef.current?.focus();
    }
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key !== 'Tab') return;

    const fields = [dayRef.current, monthRef.current, yearRef.current];
    const currentIndex = fields.findIndex((el) => el === document.activeElement);

    // The bug: this SHOULD release focus back to the page once the user
    // has cycled through all three fields once. Instead, the counter never
    // triggers a release — it just keeps wrapping forever.
    cycleCount.current += 1;
    const nextIndex = (currentIndex + 1) % fields.length;

    event.preventDefault();
    fields[nextIndex]?.focus();
  }

  return (
    <div className={styles.field}>
      <label htmlFor="applicationDate" className={styles.label}>
        {label}
      </label>
      {!isOpen && (
        <button
          type="button"
          id="applicationDate"
          className={styles.input}
          onClick={() => setIsOpen(true)}
        >
          Select a date
        </button>
      )}
      {isOpen && (
        <div
          className={styles.datePopover}
          role="group"
          aria-label="Choose date: day, month, year. Escape to close."
          onKeyDown={handleKeyDown}
        >
          <input ref={dayRef} className={styles.dateSegment} maxLength={2} placeholder="DD" aria-label="Day" />
          <input ref={monthRef} className={styles.dateSegment} maxLength={2} placeholder="MM" aria-label="Month" />
          <input ref={yearRef} className={styles.dateSegment} maxLength={4} placeholder="YYYY" aria-label="Year" />
        </div>
      )}
    </div>
  );
}
