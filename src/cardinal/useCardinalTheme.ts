import { useEffect, useState } from 'react';

// Cardinal is mounted at the app root, OUTSIDE the Agent/Admin shell that
// carries the Stage theme. So it cannot read useStageTheme() via context and
// must not rely on the global `.dark` class alone (the global light/dark
// preference and the per-page Stage theme are independent). Mirror the same
// detection the toasts use so Cardinal always matches the page behind it.
export function getStageDark(): boolean {
  if (typeof document === 'undefined') return false;
  // Only the mounted app shell counts. Floating dropdowns are portalled to
  // document.body and carry a snapshot of the shell classes; a snapshot taken
  // during the render pass still holds the previous theme until the portal
  // re-syncs, so it must not override the shell here.
  const scope: ParentNode = document.getElementById('root') ?? document;
  // Explicit stage shell wins (this is what the page actually renders).
  if (scope.querySelector('.stage-dark')) return true;
  if (scope.querySelector('.stage-light')) return false;
  // Admin shell stays light even when a stray global `.dark` is present.
  if (scope.querySelector('.admin-theme')) return false;
  // Fallbacks: global theme, then the persisted stage preference.
  if (
    document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark')
  ) {
    return true;
  }
  try {
    return localStorage.getItem('stage-theme') === 'dark';
  } catch {
    return false;
  }
}

export function useCardinalDark(): boolean {
  const [dark, setDark] = useState<boolean>(getStageDark);

  useEffect(() => {
    const update = () => setDark(getStageDark());
    const onThemeChange = (event: Event) => {
      const theme = (event as CustomEvent).detail;
      if (theme === 'dark' || theme === 'light') {
        // The toggle payload is authoritative: the portalled dropdown scopes
        // re-sync one commit later, so the DOM may still advertise the
        // previous theme at this exact moment.
        setDark(theme === 'dark');
        return;
      }
      update();
    };
    update();
    // Global light/dark flips the class on <html>/<body>.
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // The Stage shell (agent) announces its own dark/light toggle.
    window.addEventListener('stage-theme-change', onThemeChange);
    window.addEventListener('storage', update);
    return () => {
      obs.disconnect();
      window.removeEventListener('stage-theme-change', onThemeChange);
      window.removeEventListener('storage', update);
    };
  }, []);

  return dark;
}
