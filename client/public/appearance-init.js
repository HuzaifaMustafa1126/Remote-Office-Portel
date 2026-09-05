// Runs before styles and React so a saved appearance never flashes a light page.
(() => {
  try {
    const id = localStorage.getItem('remote-office-appearance:last-user');
    const key = `remote-office-appearance:v1:${id ?? 'guest'}`;
    const preference = JSON.parse(localStorage.getItem(key));
    const cache = JSON.parse(localStorage.getItem(`${key}:paint`));
    if (!preference || !cache) return;
    const dark = preference.mode === 'DARK' || (preference.mode === 'SYSTEM' && matchMedia('(prefers-color-scheme: dark)').matches);
    const paint = dark ? cache.dark : cache.light;
    if (!paint?.tokens) return;
    const root = document.documentElement;
    for (const [name, color] of Object.entries(paint.tokens)) {
      if (/^[a-z0-9-]+$/.test(name) && /^#[0-9a-f]{6}$/i.test(color)) root.style.setProperty(`--${name}`, color);
    }
    root.dataset.theme = paint.mode.toLowerCase();
    root.dataset.monochrome = String(paint.mono);
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.style.backgroundColor = paint.tokens.background;
    root.style.color = paint.tokens.foreground;
  } catch { /* Unavailable storage uses the default system theme. */ }
})();
