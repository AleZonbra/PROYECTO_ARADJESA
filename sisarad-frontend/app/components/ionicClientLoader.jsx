"use client";

// Carga Ionic dinámicamente en tiempo de ejecución (cliente) e importa CSS dinámico
export async function loadIonic() {
  const ionic = await import('@ionic/react');
  // Also import Ionic React Router helpers (client-only)
  let ionicRouter = {};
  try {
    ionicRouter = await import('@ionic/react-router');
  } catch (e) {
    // optional: if router package isn't available, continue without it
    console.warn('ionic router dynamic import failed', e);
  }
  // Import CSS dynamically to avoid top-level static css imports that Turbopack may analyze
  try {
    await Promise.all([
      import('@ionic/react/css/core.css'),
      import('@ionic/react/css/normalize.css'),
      import('@ionic/react/css/structure.css'),
      import('@ionic/react/css/typography.css'),
      import('@ionic/react/css/padding.css'),
      import('@ionic/react/css/flex-utils.css'),
      import('@ionic/react/css/display.css'),
    ]);
  } catch (e) {
    // If dynamic CSS imports fail (uncommon), ignore — app can still work without them
    // Keep silent to avoid breaking the client runtime
    console.warn('ionic css dynamic import failed', e);
  }

  if (ionic && ionic.setupIonicReact) {
    ionic.setupIonicReact();
  }
  // Merge exports so callers can access IonReactRouter if available
  return { ...ionic, ...ionicRouter };
}

export default loadIonic;
