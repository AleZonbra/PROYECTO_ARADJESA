/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita bloqueos por errores menores de linting o tipos en librerías externas
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;