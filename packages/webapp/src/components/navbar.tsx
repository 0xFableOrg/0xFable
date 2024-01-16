import Link from "next/link"
import { useRouter } from "next/router"
import { ConnectKitButton } from "connectkit"
import { Button } from "./ui/button"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "./ui/navigation-menu"

export const Navbar = () => {
  const router = useRouter()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/">
            <Button
              variant="ghost"
              className="text-2xl normal-case text-white font-serif"
            >
              <span className="text-red-400 font-mono font-light">0x</span>
              FABLE
            </Button>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuList className="space-x-4">
        <NavigationMenuItem>
          {router.pathname !== "/collection" && (
            <Link href="/collection" className="font-bold font-fable">
              COLLECTION
            </Link>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          <ConnectKitButton />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
