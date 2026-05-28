import { AppNavbar } from "@/components/AppNavbar";
import { requireServerSession } from "@/lib/auth-server";
import { headers } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const requestedPath = requestHeaders.get("next-url") ?? requestHeaders.get("x-pathname") ?? "/dashboard";
  const nextPath = requestedPath.startsWith("/") ? requestedPath : `/${requestedPath}`;

  await requireServerSession(`/login?next=${encodeURIComponent(nextPath)}`);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppNavbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
