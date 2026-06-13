import Image from "next/image";

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

function getInitials(name: string): string {
  const source = name.trim();
  if (!source) return "??";

  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return ((first + second) || parts[0].slice(0, 2)).toUpperCase();
}

export function MemberAvatar({ name, avatarUrl, size = "md" }: MemberAvatarProps) {
  const initials = getInitials(name);
  const className = sizeClasses[size];

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-border bg-muted ${className}`}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${name} avatar`}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold text-muted-foreground">
          {initials}
        </div>
      )}
    </div>
  );
}