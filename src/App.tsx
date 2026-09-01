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
