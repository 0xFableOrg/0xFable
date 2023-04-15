// @ts-check

import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

/** @type {import("next").NextConfig} */
export default {
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
    // Currently broken because of Next: https://github.com/pmndrs/swc-jotai/issues/6
    // swcPlugins: [['@swc-jotai/react-refresh', {}]]
  },
  webpack(config, { dev, isServer }) {

    // why did you render
    if (dev && !isServer) {
      const originalEntry = config.entry
      config.entry = async () => {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        const wdrPath = path.resolve(__dirname, './scripts/whyDidYouRender.js')
        const entries = await originalEntry()
        if (entries['main.js'] && !entries['main.js'].includes(wdrPath)) {
          entries['main.js'].unshift(wdrPath)
        }
        return entries
      }
    }
    // This would be great, but is sadly disallowed by Next, because they hate freedom.
    // https://nextjs.org/docs/messages/improper-devtool
    // Having this would enable parsing hook names in the React DevTools.
    // config.devtool = "cheap-module-source-map"
    return config
  }
}