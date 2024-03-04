import Link from "next/link"

import { ConnectKitButton } from "connectkit"
import { NavigationMenu, NavigationMenuItem,NavigationMenuList } from "src/components/ui/navigation-menu"

import { Button } from "./ui/button"

export const Navbar = () => {
    return (
        <NavigationMenu className="flex flex-row justify-between px-6 py-2">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <Link href="/">
                        <Button variant="ghost" className="font-serif text-2xl normal-case text-white">
                            <span className="font-mono font-light text-red-400">0x</span>
                            FABLE
                        </Button>
                    </Link>
                </NavigationMenuItem>
            </NavigationMenuList>

            <NavigationMenuList>
                <NavigationMenuItem>
                    <Link href="/collection">
                        <Button variant="ghost" className="font-fable text-xl normal-case text-white">
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
