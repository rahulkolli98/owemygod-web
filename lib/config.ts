/**
 * Central application configuration.
 * All environment variables are validated and exported from here.
 * Import from this file instead of accessing process.env directly.
 */

/** Base URL for all API requests. Trailing slash is stripped. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

/** Branding assets — paths are relative to /public and served as static files. */
export const BRANDING = {
  /** App name shown in the navbar and page titles. */
  appName: "OweMyGod",
  /** Navbar wordmark for light mode backgrounds. */
  navLogoLight: "/branding/navbarlogo-light.png",
  /** Navbar wordmark for dark mode backgrounds. */
  navLogoDark: "/branding/navbarlogo-dark.png",
  /** Hero mascot illustration used on the landing page. */
  heroMascot: "/branding/hero-monster.png",
  /** Dark-theme explainer video output path. */
  productDemoVideoDark: "/videos/owemygod-explainer.mp4",
  /** Dark-theme explainer poster output path. */
  productDemoPosterDark: "/videos/owemygod-explainer-poster.png",
  /** Light-theme explainer video output path. */
  productDemoVideoLight: "/videos/owemygod-explainer-light.mp4",
  /** Light-theme explainer poster output path. */
  productDemoPosterLight: "/videos/owemygod-explainer-light-poster.png",
  /** Backwards-compatible default explainer video path. */
  productDemoVideo: "/videos/owemygod-explainer.mp4",
  /** Backwards-compatible default explainer poster path. */
  productDemoPoster: "/videos/owemygod-explainer-poster.png",
  /** Remote fallback while local render output is not ready. */
  productDemoVideoFallback: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  /** Remote fallback poster while local render output is not ready. */
  productDemoPosterFallback:
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1800&q=80",
} as const;
