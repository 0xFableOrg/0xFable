// @ts-check

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
}