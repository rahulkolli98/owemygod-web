import { AppNavbar } from "@/components/AppNavbar";
import { requireServerSession } from "@/lib/auth-server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireServerSession();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppNavbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
