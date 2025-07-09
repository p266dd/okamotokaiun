import Image from "next/image";
import Link from "next/link";
import { LogoutAction } from "@/action/login";
import { LoadingIndicator } from "./loading-indicator";

// Assets
import CompanyLogo from "@/assets/company_logo.png";
import HeaderArch from "@/assets/header-arch.png";

// Shadcn
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dot, Lock } from "lucide-react";

export default async function Header() {
  return (
    <div className="relative z-40 print:hidden">
      <header className="py-10 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-8 flex gap-10 items-center justify-between">
          <div className="w-52 sm:max-w-[250px]">
            <Image src={CompanyLogo} alt="Okamoto Kaiun" />
          </div>
          <div>
            <NavigationMenu className="hidden sm:flex">
              <NavigationMenuList className="gap-4">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/">
                      <span className="flex items-center gap-1">
                        <LoadingIndicator />
                        カレンダー
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/staff">
                      <span className="flex items-center gap-1">
                        <LoadingIndicator />
                        スタッフ管理
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/payroll">
                      <span className="flex items-center gap-1">
                        <LoadingIndicator />
                        給与計算
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <form action={LogoutAction}>
                      <button type="submit" className="cursor-pointer">
                        ログアウト
                      </button>
                    </form>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger className="text-nowrap">メニュー</SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>ナビゲーション</SheetTitle>
                    <SheetDescription className="sr-only">
                      ナビゲーション
                    </SheetDescription>
                  </SheetHeader>
                  <ul className="flex flex-col gap-4 mx-4">
                    <li>
                      <Link href="/">
                        <Dot size={16} className="inline-block mr-2" /> カレンダー
                      </Link>
                    </li>
                    <li>
                      <Link href="/staff">
                        <Dot size={16} className="inline-block mr-2" /> スタッフ管理
                      </Link>
                    </li>
                    <li>
                      <Link href="/payroll">
                        <Dot size={16} className="inline-block mr-2" /> 給与計算
                      </Link>
                    </li>
                    <li className="py-9">
                      <form action={LogoutAction}>
                        <button type="submit">
                          <Lock className="inline-block mr-2" />
                          ログアウト
                        </button>
                      </form>
                    </li>
                  </ul>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <div className="mb-12 sm:mb-16">
        <Image src={HeaderArch} alt="Header Arch" className="h-10" />
      </div>
    </div>
  );
}
