let userConfig = {}
try {
  userConfig = (await import('./v0-user-next.config.js')).default
} catch (e) {
  console.warn('⚠️ Avertissement: Aucun fichier "v0-user-next.config.js" trouvé. Utilisation de la configuration par défaut.')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Pas 'export', sinon Cloudflare aura du mal
  compress: true,
  swcMinify: true,
  productionBrowserSourceMaps: false, // Désactive les .map pour réduire la taille
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    granularChunks: true, // Réduit la taille des fichiers Webpack
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
}

// Fusionne userConfig avec nextConfig
const finalConfig = mergeConfig(nextConfig, userConfig)

function mergeConfig(baseConfig, userConfig) {
  if (!userConfig) return baseConfig

  for (const key in userConfig) {
    if (typeof baseConfig[key] === 'object' && !Array.isArray(baseConfig[key])) {
      baseConfig[key] = {
        ...baseConfig[key],
        ...userConfig[key],
      }
    } else {
      baseConfig[key] = userConfig[key]
    }
  }
  return baseConfig
}

export default finalConfig
