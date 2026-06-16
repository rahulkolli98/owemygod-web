import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LandingNavbar } from "@/components/ui/saa-s-template";
import { cn } from "@/lib/utils";

const securityBasics = [
  {
    title: "Only invited people can view a group",
    description:
      "Your group activity is limited to members who are invited and signed in.",
  },
  {
    title: "Sign-in protects account access",
    description:
      "Authentication helps make sure only you can access your account and groups.",
  },
  {
    title: "Data is stored on managed infrastructure",
    description:
      "Expenses and settlements are saved on reliable hosted systems with standard safeguards.",
  },
  {
    title: "History stays transparent",
    description:
      "Edits, expenses, and settlements stay visible so groups can track what changed.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-14 md:pt-20">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to homepage
          </Link>
        </div>

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6a55]">Security overview</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Simple security, explained clearly
          </h1>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            You should not need a technical background to understand how your expense data is
            protected. Here are the basics.
          </p>
        </header>

        <section className="mt-12 grid gap-5 sm:grid-cols-2">
          {securityBasics.map((item) => (
            <article key={item.title} className="rounded-xl border border-border bg-muted/40 p-6">
              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-border bg-background/70 p-6 text-center">
          <h2 className="text-xl font-semibold">Need the full details?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            We can publish a deeper technical breakdown later. For now, this page is focused on
            practical, easy-to-understand information.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Back to homepage
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
