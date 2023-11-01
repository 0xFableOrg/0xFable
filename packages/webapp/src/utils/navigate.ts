/**
 * Utilities to navigate from one page to the next.
 *
 * @module utils/navigate
 */

import { NextRouter } from "next/router"

// =================================================================================================

/**
 * Wraps `router.push`, carrying over some query parameters from the current URL in development
 * mode.
 */
export async function navigate(router: NextRouter, url: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development") {
    const index = parseInt(router.query.index as string)
    if (index !== undefined && !isNaN(index) && 0 <= index && index <= 9)
      url = url + (url.includes("?") ? "&" : "?") + `index=${index}`
  }
  return router.push(url)
}

// =================================================================================================