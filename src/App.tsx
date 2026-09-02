import { useEffect, useRef, useState } from 'react';
import { BenefitsForm } from './components/form/BenefitsForm';
import { FocusTraceOverlay } from './components/theatre/FocusTraceOverlay';
import { NarrationPanel } from './components/panel/NarrationPanel';
import { ViolationsProvider } from './store/ViolationsProvider';
import { NarrationProvider } from './store/NarrationProvider';
import { useAccessibilityTools } from './hooks/useAccessibilityTools';
import { initLiveRegionObserver } from './lib/liveRegionTracker';
import styles from './App.module.css';

/**
 * AppShell — registers the WebMCP tools and hosts the theatre layout.
 * Split from the outer `App` so the tools hook (which needs both
 * ViolationsProvider and NarrationProvider context) runs inside them,
 * not above them.
 */
function AppShell() {
  useAccessibilityTools();
  const theatreRef = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    initLiveRegionObserver();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.body.style.background = theme === 'light' ? '#edf4f0' : '#0b1f17';
  }, [theme]);

  return (
    <div className={styles.shell} data-theme={theme}>
      <div className={styles.topBar}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>WebMCP Accessibility Copilot</p>
          <h1 className={styles.title}>AccessCanary</h1>
          <p className={styles.subtitle}>
            Automated scanners catch roughly a third of accessibility issues. The rest only
            surface when something actually operates the page - which is what an agent can do
            here, through WebMCP.
          </p>
        </header>

        <button
          type="button"
          className={styles.themeToggle}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-pressed={theme === 'light'}
          onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        >
          <span className={styles.themeToggleIcon} aria-hidden="true">
            {theme === 'light' ? '☾' : '☀'}
          </span>
        </button>
      </div>

      <main className={styles.stage}>
        <section ref={theatreRef} className={styles.theatre} aria-label="Mock benefits application">
          <p className={styles.stageLabel}>Live form — try tabbing through it</p>
          <BenefitsForm />
          <FocusTraceOverlay containerRef={theatreRef} />
        </section>

        <aside className={styles.observerPanel} aria-label="Agent observations">
          <p className={styles.stageLabel}>Agent narration</p>
          <NarrationPanel />
        </aside>
      </main>

      <section className={styles.guide} aria-labelledby="guide-title">
        <div className={styles.guideIntro}>
          <p className={styles.stageLabel}>Field guide</p>
          <h2 id="guide-title" className={styles.guideTitle}>How this WebMCP demo works</h2>
          <p className={styles.guideSummary}>
            AccessCanary lets an agent inspect the page while a person operates it. The agent
            can observe and propose findings, but only a human can confirm a violation.
          </p>
        </div>

        <ol className={styles.workflow}>
          <li className={styles.workflowStep}>
            <span className={styles.stepNumber}>01</span>
            <div>
              <h3>Operate the form</h3>
              <p>Tab through the controls, open the date picker, and trigger the income validation state.</p>
            </div>
          </li>
          <li className={styles.workflowStep}>
            <span className={styles.stepNumber}>02</span>
            <div>
              <h3>Let WebMCP inspect live state</h3>
              <p>The agent calls browser tools to read focus order, live-region activity, roles, and focus behavior.</p>
            </div>
          </li>
          <li className={styles.workflowStep}>
            <span className={styles.stepNumber}>03</span>
            <div>
              <h3>Review before recording</h3>
              <p>Proposed findings appear in Agent narration. Confirming one adds it to the violation log.</p>
            </div>
          </li>
        </ol>

        <div className={styles.testGuide}>
          <div className={styles.testGuideHeader}>
            <p className={styles.stageLabel}>Reproduction checklist</p>
            <span className={styles.testGuideHint}>Three intentional defects</span>
          </div>
          <ol className={styles.testList}>
            <li>
              <strong>Broken focus order</strong>
              <span>Reload the page, do not click a form field, then press Tab once. Submit appears before the fields because it has a positive tab index. Clicking a field first starts Tab navigation from that field and will not reproduce this defect.</span>
            </li>
            <li>
              <strong>Silent validation message</strong>
              <span>Focus Annual household income, leave it empty, then Tab away. The error appears visually without an ARIA-live announcement.</span>
            </li>
            <li>
              <strong>Keyboard trap</strong>
              <span>Activate Choose date, then press Tab repeatedly through day, month, and year. Focus loops instead of returning to the page.</span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function App() {
  return (
    <ViolationsProvider>
      <NarrationProvider>
        <AppShell />
      </NarrationProvider>
    </ViolationsProvider>
  );
}

export default App;
