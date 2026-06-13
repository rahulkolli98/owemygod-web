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

const howItWorksSteps = [
  {
    step: "01",
    title: "Create your group",
    description:
      "Start a group for roommates, trips, or events and invite everyone in seconds.",
  },
  {
    step: "02",
    title: "Add shared expenses",
    description:
      "Log who paid, choose participants, and split equally or with custom amounts.",
  },
  {
    step: "03",
    title: "Track live balances",
    description:
      "See exactly who owes whom after every expense, with totals updated automatically.",
  },
  {
    step: "04",
    title: "Settle and move on",
    description:
      "Mark payments as settled and keep a transparent history for the whole group.",
  },
];

const securityHighlights = [
  {
    title: "Private by default",
    description:
      "Your groups and expenses are visible only to invited members with authenticated access.",
  },
  {
    title: "Protected sessions",
    description:
      "Secure sign-in flow and session handling keep account access controlled across devices.",
  },
  {
    title: "Reliable data storage",
    description:
      "Expense records are stored in a managed PostgreSQL-backed platform with built-in safeguards.",
  },
  {
    title: "Transparent history",
    description:
      "Every expense and settlement is tracked so your group can verify balances with confidence.",
  },
];

const faqs = [
  {
    question: "Can we split expenses unequally?",
    answer:
      "Yes. You can split equally, set custom amounts, or use percentage-based splits depending on the situation.",
  },
  {
    question: "Do balances update automatically?",
    answer:
      "They do. As soon as an expense or settlement is added, group balances recalculate so everyone sees the latest numbers.",
  },
  {
    question: "Who can see my group expenses?",
    answer:
      "Only invited members of that group can access its expenses, balances, and settlement history.",
  },
  {
    question: "What happens when someone pays back?",
    answer:
      "You can mark a settlement directly in the group, and OweMyGod updates outstanding balances immediately.",
  },
  {
    question: "Is OweMyGod suitable for trips and events?",
    answer:
      "Absolutely. It works well for roommates, travel groups, couples, and one-time events where multiple people share costs.",
  },
  {
    question: "Can I keep a history of who paid what?",
    answer:
      "Yes. Every expense and settlement is saved in your group timeline so you can review decisions anytime.",
  },
];

const useCaseProofs = [
  {
    title: "Roommates",
    situation: "Groceries, internet, and utility bills every month.",
    outcome: "No missed entries and fewer end-of-month payment arguments.",
  },
  {
    title: "Trip squads",
    situation: "Flights, hotels, and spontaneous food stops across multiple people.",
    outcome: "Everyone sees balances daily, so no one carries hidden costs.",
  },
  {
    title: "Couples and families",
    situation: "Shared household spending with recurring and one-off expenses.",
    outcome: "Clear split history helps plan budgets and avoid duplicate payments.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground dark:bg-background dark:text-foreground">
      <main className="flex flex-1 flex-col">
        <SaasTemplate />

        <section
          id="how-it-works"
          className="scroll-mt-24 mx-auto w-full max-w-5xl px-6 pb-16 pt-6 md:pb-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              From messy chats to clean balances in minutes
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              OweMyGod keeps every group expense in one place, so nobody has to guess what they
              owe.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {howItWorksSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-xl border border-border bg-muted/40 p-6 transition-colors hover:bg-muted/60"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-[#ff6a55]">Step {item.step}</p>
                <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 mx-auto w-full max-w-5xl px-6 pb-28 pt-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Everything your group needs to stay clear
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Designed for real-world shared spending, without spreadsheets or awkward reminders.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
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

        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">
              Trusted in real situations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Built for the way groups actually spend
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Not just for perfect scenarios. OweMyGod stays clear when spending gets messy.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {useCaseProofs.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-muted/40 p-6 space-y-3"
              >
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Situation: </span>
                  {item.situation}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Outcome: </span>
                  {item.outcome}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Questions people usually ask first
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Quick answers to help your group start confidently.
            </p>
          </div>

          <div className="mx-auto mb-16 grid w-full max-w-4xl gap-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border bg-muted/40 p-5"
              >
                <summary className="cursor-pointer list-none pr-8 text-left text-base font-semibold text-foreground marker:content-none">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="float-right text-lg text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="security" className="scroll-mt-24 mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">Security</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Built so your group can trust every number
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              OweMyGod is designed to keep your expense data private, protected, and auditable.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {securityHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-muted/40 p-6 space-y-2"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background/70 p-4 text-center text-sm text-muted-foreground dark:bg-background/40">
            Authentication, access controls, and clear records work together to reduce disputes and
            protect your group data.
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="rounded-2xl border border-border bg-muted/40 p-8 text-center md:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">Ready to start</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Start your first group in under a minute
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              Invite people, add your first shared expense, and let OweMyGod handle the math.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
                Create your first group
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Login to continue
              </Link>
            </div>
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
