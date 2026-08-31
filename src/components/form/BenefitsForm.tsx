import { useState, useRef, type FormEvent } from 'react';
import { DatePickerTrap } from './DatePickerTrap';
import styles from './BenefitsForm.module.css';

/**
 * BenefitsForm — the "operating theatre" of the demo.
 *
 * This mock government-benefits application form intentionally contains
 * three real, verifiable accessibility defects. Each is implemented the way
 * these bugs actually occur in production code — not simulated with a fake
 * "if (isDemo)" flag — because the WebMCP tools built in Phase 2 need to
 * detect real DOM state, not staged data.
 *
 * BUG 1 — Broken focus order (see the submit button's `tabIndex` below).
 * BUG 2 — Silent ARIA-live region (see the income field's error message).
 * BUG 3 — Keyboard trap (see <DatePickerTrap />, isolated in its own file
 *         because the trap logic is a self-contained, reusable defect
 *         pattern worth keeping separate from the form's field logic).
 */

interface FormState {
  fullName: string;
  income: string;
  householdSize: string;
}

const initialState: FormState = {
  fullName: '',
  income: '',
  householdSize: '',
};

export function BenefitsForm() {
  const [values, setValues] = useState<FormState>(initialState);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  function handleIncomeBlur() {
    const isValid = values.income.trim() !== '' && !Number.isNaN(Number(values.income));
    setIncomeError(isValid ? null : 'Enter a valid annual income amount.');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Intentionally a no-op — this is a demo form, not a real submission
    // pipeline. Real submission to any live system is explicitly out of
    // scope (see README: "What this project is not").
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Benefits application">
      <div className={styles.field}>
        <label htmlFor="fullName" className={styles.label}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          className={styles.input}
          value={values.fullName}
          onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="income" className={styles.label}>
          Annual household income
        </label>
        <input
          id="income"
          name="income"
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={values.income}
          onChange={(e) => setValues((v) => ({ ...v, income: e.target.value }))}
          onBlur={handleIncomeBlur}
          aria-invalid={incomeError !== null}
        />
        {/*
          BUG 2 — SILENT ARIA-LIVE REGION.
          This error is visually rendered when incomeError is set, but it
          carries no aria-live attribute and is not routed through any live
          region. A sighted user sees the red text appear immediately; a
          screen reader user hears nothing at all, because nothing tells
          assistive technology that this region just changed. This is one
          of the single most common real-world WCAG 4.1.3 (Status Messages)
          violations — validation errors that only "work" visually.
        */}
        {incomeError && (
          <p className={styles.errorText} data-testid="income-error">
            {incomeError}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="householdSize" className={styles.label}>
          Household size
        </label>
        <input
          id="householdSize"
          name="householdSize"
          type="number"
          min={1}
          className={styles.input}
          value={values.householdSize}
          onChange={(e) => setValues((v) => ({ ...v, householdSize: e.target.value }))}
        />
      </div>

      <DatePickerTrap label="Application date" />

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          /*
            BUG 1 — BROKEN FOCUS ORDER.
            A large positive tabIndex forces this button ahead of the
            browser's natural document-order tab sequence, but — critically
            — it does NOT include the footer link that follows it in the
            DOM. The real-world version of this bug: a developer adds
            tabIndex to "fix" perceived tab order on one element without
            auditing what it does to every element after it. The result:
            tabbing from Submit jumps to the footer link below, silently
            skipping nothing here but demonstrating the exact divergence
            between visual/DOM order and tab order that WCAG 2.4.3 exists
            to prevent. See get_focus_order in Phase 2 for how this is
            detected.
          */
          tabIndex={1}
        >
          Submit application
        </button>
      </div>

      <div ref={footerRef} className={styles.footerNote} tabIndex={0}>
        Need help? Contact your local benefits office.
      </div>
    </form>
  );
}
