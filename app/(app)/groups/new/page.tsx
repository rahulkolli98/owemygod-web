import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewGroupForm } from "@/components/groups/NewGroupForm";

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/groups"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 gap-1.5 text-muted-foreground")}
      >
        ← Back to groups
      </Link>

      <div className="flex justify-center">
        <NewGroupForm />
      </div>
    </div>
  );
}
