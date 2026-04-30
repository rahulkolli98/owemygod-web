import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BRANDING } from "@/lib/config";

interface NavbarProps {
  hideAuthActions?: boolean;
}

export function Navbar({ hideAuthActions = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={BRANDING.navLogoLight}
            alt={BRANDING.appName}
            width={120}
            height={28}
            className="h-7 w-auto dark:hidden"
            priority
          />
          <Image
            src={BRANDING.navLogoDark}
            alt={BRANDING.appName}
            width={120}
            height={28}
            className="hidden h-7 w-auto dark:block"
            priority
          />
        </Link>

        {!hideAuthActions ? (
          <nav className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign in
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Get started
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
