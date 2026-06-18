/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build static export output (por ejemplo, para despliegues estáticos)
  output: 'export',

  // Evita que errores de TypeScript en dependencias externas corten el build
  typescript: { ignoreBuildErrors: true },
  // Silencia el error de Turbopack cuando existe configuración personalizada de webpack
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    const path = require('path');
    // Aplica el alias SOLO para el build del servidor para evitar que el bundler del servidor
    // intente resolver imports dinámicos de Stencil. En el cliente debe cargarse la implementación real.
    if (isServer) {
      config.resolve.alias['@stencil/core/internal/client'] = path.resolve(__dirname, 'stencil-client-stub.js');
    }
    return config;
  },
};

module.exports = nextConfig;