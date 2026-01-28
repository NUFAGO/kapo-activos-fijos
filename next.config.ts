import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Configuración para Turbopack (Next.js 16)
  turbopack: {},

  // Configuración PWA con Workbox
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600',
        },
      ],
    },
  ],

  // Configuración de Workbox para generar Service Worker
  webpack: (config, { dev, isServer }) => {
    if (!isServer && !dev) {
      const workboxPlugin = require('workbox-webpack-plugin');
      // Revision por build: invalida precache en cada deploy para que usuarios reciban versión nueva
      const BUILD_REVISION = Date.now().toString();

      config.plugins.push(
        new workboxPlugin.GenerateSW({
          swDest: 'sw.js',
          publicPath: '/',
          skipWaiting: true,
          clientsClaim: true,

          // PRECACHE: Solo páginas offline y sus subrutas (revision por build para actualizar en deploy)
          additionalManifestEntries: [
            { url: '/offline', revision: BUILD_REVISION },
            { url: '/offline/recursos-af', revision: BUILD_REVISION },
            { url: '/offline/reporte-activos-fijos', revision: BUILD_REVISION },
            { url: '/offline/gestion-reportes', revision: BUILD_REVISION },
            { url: '/manifest.json', revision: BUILD_REVISION },
            { url: '/favicon.ico', revision: BUILD_REVISION },
            { url: '/logo-negativo.webp', revision: BUILD_REVISION },
          ],

          // Runtime caching
          runtimeCaching: [
            // Páginas offline - NetworkFirst con fallback a cache
            {
              urlPattern: /^https?:\/\/[^\/]+\/offline/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'activos-fijos-offline-pages',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
                },
                networkTimeoutSeconds: 3,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Páginas ONLINE - NetworkOnly (nunca cachear)
            {
              urlPattern: /^https?:\/\/[^\/]+\/(?!offline|api|graphql|_next\/static).*$/,
              handler: 'NetworkOnly',
            },
            // Assets estáticos de Next.js (necesarios para que funcione offline)
            {
              urlPattern: /^https?:\/\/[^\/]+\/_next\/static\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'activos-fijos-static',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
                },
              },
            },
            {
              // Cache para imágenes
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'activos-fijos-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
                },
              },
            },
            {
              // Cache para fonts
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'activos-fijos-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
                },
              },
            },
            {
              // Nunca cachear APIs
              urlPattern: /\/api\/|\/graphql/,
              handler: 'NetworkOnly',
            },
          ],

          // Excluir archivos problemáticos
          exclude: [
            /^manifest.*\.js$/,
            /_next\/static\/.*\.hot-update\.js$/,
            /_next\/static\/development/,
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
