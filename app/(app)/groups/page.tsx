import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupsClient } from "@/components/groups/GroupsClient";

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm">Manage your expense groups.</p>
        </div>
        <Link href="/groups/new" className={cn(buttonVariants())}>
          + New group
        </Link>
      </div>

      <GroupsClient />
    </div>
  );
}
