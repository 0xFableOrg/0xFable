import Link from "next/link"
import { ConnectKitButton } from "connectkit"
import { Button } from "./ui/button"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "./ui/navigation-menu"

export const Navbar = () => {
  return (
    <NavigationMenu className="flex flex-row justify-between px-6 py-2">
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

      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/collection">
            <Button
              variant="ghost"
              className="text-xl normal-case text-white font-fable"
            >
              Collection
            </Button>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <ConnectKitButton />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
