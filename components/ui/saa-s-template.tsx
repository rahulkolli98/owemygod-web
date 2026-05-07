"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, HandCoins, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BRANDING } from "@/lib/config";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

interface SaasTemplateProps {
  videoSrc?: string;
  videoPoster?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "default", size = "default", className = "", children, ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
      ghost: "text-foreground hover:bg-muted dark:text-white dark:hover:bg-white/10",
      gradient:
        "bg-gradient-to-b from-white via-white/95 to-white/70 text-black shadow-lg shadow-orange-300/20 hover:-translate-y-0.5 active:translate-y-0 dark:from-white dark:via-white/95 dark:to-white/70",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-4 text-sm",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

const Navigation = React.memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md dark:border-white/15 dark:bg-black/70">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-foreground dark:text-white">
          <span className="rounded-lg bg-muted p-1.5 dark:bg-white/10">
            <HandCoins size={18} />
          </span>
          {/* Light mode logo */}
          <Image
            src={BRANDING.navLogoLight}
            alt={BRANDING.appName}
            width={120}
            height={28}
            className="h-7 w-auto dark:hidden"
            style={{ width: 'auto' }}
            priority
          />
          {/* Dark mode logo */}
          <Image
            src={BRANDING.navLogoDark}
            alt={BRANDING.appName}
            width={120}
            height={28}
            className="hidden h-7 w-auto dark:block"
            style={{ width: 'auto' }}
            priority
          />
        </Link>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white">
            How it works
          </a>
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white">
            Features
          </a>
          <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white">
            Security
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <Button type="button" variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button type="button" variant="default" size="sm">
              Get started
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="text-foreground dark:text-white md:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background/90 dark:border-white/10 dark:bg-black/90 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4">
            <a
              href="#how-it-works"
              className="py-1 text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#features"
              className="py-1 text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#security"
              className="py-1 text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Security
            </a>
            <div className="flex flex-col gap-2 border-t border-border pt-3 dark:border-white/10">
              <ThemeToggle />
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button type="button" variant="ghost" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button type="button" variant="default" size="sm" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

const Hero = React.memo(({ videoSrc, videoPoster }: SaasTemplateProps) => {
  const [isDark, setIsDark] = React.useState(false);
  const [resolvedVideoSrc, setResolvedVideoSrc] = React.useState(videoSrc);
  const [resolvedVideoPoster, setResolvedVideoPoster] = React.useState(videoPoster);

  React.useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const preferredVideoSrc =
    videoSrc ??
    (isDark ? BRANDING.productDemoVideoDark : BRANDING.productDemoVideoLight);
  const preferredVideoPoster =
    videoPoster ??
    (isDark ? BRANDING.productDemoPosterDark : BRANDING.productDemoPosterLight);

  React.useEffect(() => {
    setResolvedVideoSrc(preferredVideoSrc);
    setResolvedVideoPoster(preferredVideoPoster);
  }, [preferredVideoPoster, preferredVideoSrc]);

  const handleVideoError = React.useCallback(() => {
    setResolvedVideoSrc(BRANDING.productDemoVideoFallback);
    setResolvedVideoPoster(BRANDING.productDemoPosterFallback);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-14 md:pb-24 md:pt-20">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="hero-monster-idle pointer-events-none absolute left-6 top-38 z-20 w-[96px] sm:left-8 sm:top-20 sm:w-[112px] md:hidden"
        >
          <Image
            src={BRANDING.heroMascot}
            alt=""
            aria-hidden="true"
            width={560}
            height={980}
            className="h-auto w-full select-none opacity-95"
            priority
          />
        </div>

        <div className="relative z-30">
          <aside className="mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 backdrop-blur-sm dark:border-white/20 dark:bg-white/5">
            <span className="text-xs text-muted-foreground dark:text-white/70">Unlimited splits · Free to start</span>
            <a
              href="#features"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground dark:text-white/80 dark:hover:text-white"
            >
              Read more
              <ArrowRight size={14} />
            </a>
          </aside>

          <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl dark:text-white">
            Split bills.
            <br />
            <span className="text-[#ff6a55] [text-shadow:0_0_22px_rgba(255,106,85,0.3)]">
              Skip the awkward ask.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg dark:text-white/75">
            OweMyGod makes group expenses painless. Add an expense, see who owes whom, and settle
            up - all in one place.
          </p>

          <div className="relative z-10 mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button type="button" variant="gradient" size="lg" className="rounded-lg">
                Start for free
              </Button>
            </Link>
            <Link href="/login">
              <Button type="button" variant="secondary" size="lg" className="rounded-lg border border-border dark:border-white/15">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mt-14 w-full max-w-5xl">
          <div
            aria-hidden="true"
            className="hero-monster-idle pointer-events-none hidden md:absolute md:-left-[100px] md:-top-[25rem] md:z-10 md:block md:w-[348px] lg:-left-[120px] lg:-top-[29rem] lg:w-[458px] xl:-left-[164px] xl:-top-[31rem] xl:w-[548px]"
          >
            <div className="absolute -bottom-1 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full bg-black/50 blur-md dark:bg-black/50" />
            <Image
              src={BRANDING.heroMascot}
              alt=""
              aria-hidden="true"
              width={560}
              height={980}
              className="h-auto w-full select-none opacity-95"
              priority
            />
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-0 h-52 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[999px]"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255, 104, 82, 0.8) 0%, rgba(255, 129, 86, 0.45) 38%, rgba(255, 84, 66, 0.2) 58%, rgba(0, 0, 0, 0) 76%)",
              filter: "blur(18px)",
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-20 h-4 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]"
            aria-hidden="true"
          />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-[#ff6a55]/35 via-[#ff8f66]/20 to-transparent blur-xl" />

          <div className="relative z-30 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl dark:border-white/15 dark:bg-neutral-950/90">
            <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3 dark:border-white/10 dark:bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground dark:text-white/60">OweMyGod Live Demo</p>
              <div className="w-14" />
            </div>

            <div className="aspect-[16/9] w-full bg-muted/20 dark:bg-black">
              <video
                className="h-full w-full object-cover"
                src={resolvedVideoSrc}
                poster={resolvedVideoPoster}
                autoPlay
                muted
                loop
                playsInline
                controls
                onError={handleVideoError}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default function SaasTemplate({
  videoSrc,
  videoPoster,
}: SaasTemplateProps) {
  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-black dark:text-white">
      <Navigation />
      <Hero videoSrc={videoSrc} videoPoster={videoPoster} />
    </main>
  );
}
