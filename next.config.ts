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

      config.plugins.push(
        new workboxPlugin.GenerateSW({
          swDest: 'sw.js',
          publicPath: '/',
          skipWaiting: true,
          clientsClaim: true,

          // Runtime caching - más seguro que precaching
          runtimeCaching: [
            {
              urlPattern: /^https?.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'activos-fijos-runtime',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60, // 24 horas
                },
                cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                  // Evitar cachear requests con auth
                  if (request.headers.get('authorization')) {
                    return undefined;
                  }
                  return request.url;
                },
              },
            },
            {
              // Cache agresivo para assets estáticos
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

          // Additional manifest entries
          additionalManifestEntries: [
            {
              url: '/offline',
              revision: '1',
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
