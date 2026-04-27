import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";

const features = [
  {
    title: "Split any way you like",
    description:
      "Equal splits, custom amounts, or percentage-based — handle any expense scenario in seconds.",
  },
  {
    title: "Always know who owes what",
    description:
      "Live balances update the moment an expense is added. No mental math required.",
  },
  {
    title: "Settle up simply",
    description:
      "Mark debts as paid with one tap. Keep a clean history of every settlement.",
  },
  {
    title: "Understand your spending",
    description:
      "Monthly charts and category breakdowns so you actually know where the money goes.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex flex-col flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-28 text-center">
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Free &amp; unlimited — forever
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Split bills.<br />
            <span className="text-primary">Skip the awkward ask.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            OweMyGod makes group expenses painless. Add an expense, see who owes
            whom, and settle up — all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Start for free
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Sign in
            </Link>
          </div>
        </section>

        {/* Features grid */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-28">
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-muted/40 p-6 space-y-2"
              >
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} OweMyGod. Free forever.
        </p>
      </footer>
    </div>
  );
}
