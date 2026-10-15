// Buttons and keyboard shortcuts. Every control here is wired to real behaviour in App.
export function setupControls({ els, app, stageWrap }) {
  const handlers = [];
  const on = (target, ev, fn) => { target.addEventListener(ev, fn); handlers.push([target, ev, fn]); };

  on(els.start, 'click', () => app.start());
  on(els.stop, 'click', () => app.stop());
  on(els.reset, 'click', () => app.reset());
  const fsOk = !!(document.fullscreenEnabled && stageWrap.requestFullscreen);
  if (!fsOk) { els.fullscreen.disabled = true; els.fullscreen.title = 'Fullscreen is not supported in this browser'; }
  const toggleFs = () => { if (!fsOk) return; if (document.fullscreenElement) document.exitFullscreen(); else stageWrap.requestFullscreen().catch(() => app.notify('Fullscreen was blocked by the browser.', 'warn')); };
  on(els.fullscreen, 'click', toggleFs);

  on(document, 'keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
    const k = e.key.toLowerCase();
    if (k === 's') { app.state === 'stopped' ? app.start() : app.stop(); }
    else if (k === 'r') app.reset();
    else if (k === 'f') toggleFs();
    else if (k === 'k') app.settings.set('skeleton', !app.settings.values.skeleton);
  });

  return {
    sync(state) { els.start.disabled = state !== 'stopped'; els.stop.disabled = state === 'stopped'; els.start.textContent = state === 'starting' ? 'Starting…' : 'Start Camera'; },
    dispose() { handlers.forEach(([t, ev, fn]) => t.removeEventListener(ev, fn)); handlers.length = 0; },
  };
}
