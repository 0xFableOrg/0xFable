// @ts-check

import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { createRequire } from "module"

const require = createRequire(import.meta.url)

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * If you have the "experimental: { appDir: true }" setting enabled, then you
   * must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Currently broken in Next 13.3.0: https://github.com/pmndrs/swc-jotai/issues/6
    // Unlike what is suggested, also broken when I downgrade to Next 13.2.3 and Next 13.1.6.
    swcPlugins: [
      // ['@swc-jotai/react-refresh', {}],
      // ["@swc-jotai/debug-label", {}]
    ]
  },
  webpack(config, { dev, isServer }) {
    // prevent node-gyp from failing because "can't resolve fs"
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      readline: false
    }

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true // enable await at top-level in modules
    }

    // This would be great, but is sadly disallowed by Next, because they hate freedom.
    // https://nextjs.org/docs/messages/improper-devtool
    // Having this would enable parsing hook names in the React DevTools.
    // config.devtool = "cheap-module-source-map"
    return config
  },
  // This hack makes it possible to use the Jotai devtools
  // Sources:
  //   https://github.com/jotaijs/jotai-devtools/issues/47
  //   https://github.com/martpie/next-transpile-modules/releases/tag/the-end
  transpilePackages: ['jotai-devtools']
}

// // This hack makes it possible to use the Jotai devtools
// // Source: https://github.com/jotaijs/jotai-devtools/issues/47
// const withTranspileModules = require("next-transpile-modules")([
//   "jotai-devtools",
// ])
// export default withTranspileModules(nextConfig)
export default nextConfig