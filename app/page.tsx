import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SaasTemplate from "@/components/ui/saa-s-template";

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
    <div className="flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground">
      <main className="flex flex-1 flex-col">
        <SaasTemplate />

        <section id="features" className="mx-auto w-full max-w-5xl px-6 pb-28 pt-12">
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

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Create your first group
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Login to continue
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6 text-foreground dark:border-white/10 dark:bg-neutral-950/90">
        <p className="text-center text-xs text-muted-foreground dark:text-white/60">
          &copy; {new Date().getFullYear()} OweMyGod! Thou shalt not forget who paid for dinner.
        </p>
      </footer>
    </div>
  );
}
