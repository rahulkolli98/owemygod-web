import { Navbar } from "@/components/Navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar hideAuthActions />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
