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

          <div className="mx-auto mt-10 max-w-3xl">
            <ol className="space-y-8">
              {howItWorksSteps.map((item, index) => {
                const isLast = index === howItWorksSteps.length - 1;

                return (
                  <li key={item.step} className="relative pl-14">
                    {!isLast ? (
                      <span
                        aria-hidden="true"
                        className="absolute left-[1.08rem] top-9 h-[calc(100%+1.25rem)] w-px bg-border"
                      />
                    ) : null}

                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold tracking-[0.08em] text-[#ff6a55]"
                    >
                      {item.step}
                    </span>

                    <div className="rounded-xl border border-border bg-muted/25 p-5">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
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

      <footer className="border-t border-border bg-background text-foreground dark:border-white/10 dark:bg-neutral-950/90">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ff6a55]">OweMyGod</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Split bills, track balances, and settle up without awkward follow-ups.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#how-it-works" className="transition-colors hover:text-foreground">
                  How it works
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <Link href="/security" className="transition-colors hover:text-foreground">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Get Started</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
                Create account
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground dark:border-white/10 dark:text-white/60">
          &copy; {new Date().getFullYear()} OweMyGod! Thou shalt not forget who paid for dinner.
        </div>
      </footer>
    </div>
  );
}
