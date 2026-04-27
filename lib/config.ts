/**
 * Central application configuration.
 * All environment variables are validated and exported from here.
 * Import from this file instead of accessing process.env directly.
 */

/** Base URL for all API requests. Trailing slash is stripped. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");
