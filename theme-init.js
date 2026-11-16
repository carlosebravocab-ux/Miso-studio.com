(() => {
  const root = document.documentElement;
  const validPreferences = ['auto', 'light', 'dark'];
  let preference = 'auto';

  try {
    const savedPreference = window.localStorage.getItem('nova-theme');
    if (validPreferences.includes(savedPreference)) {
      preference = savedPreference;
    }
  } catch (error) {
    console.warn('No se pudo leer la preferencia del tema; se usará el modo automático.', error);
  }

  const prefersDark = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === 'auto' ? (prefersDark ? 'dark' : 'light') : preference;
})();
