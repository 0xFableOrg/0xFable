import { useRouter } from 'next/router'
import Link from "next/link"

/**
 * A Link component wrapper that appends a 'index' query parameter to the URL in development mode.
 * This is used to persist state across navigation during testing.
 */
const QueryParamLink = ({ children, href, ...props }) => {
  const router = useRouter()

  let url = href

  if (process.env.NODE_ENV === "development") {
    const index = parseInt(router.query.index as string)
    if (index !== undefined && !isNaN(index) && 0 <= index && index <= 9)
      url = url + (url.includes("?") ? "&" : "?") + `index=${index}`
  }
  return (
    <Link href={href}>
      {children}
    </Link>
    )
}

export default QueryParamLink