// Acceso seguro a localStorage (si el navegador lo bloquea, no rompe la aplicación).
export const storage = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  remove: (key) => { try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ } },
};
