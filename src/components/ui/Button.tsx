import Link from "next/link";
import clsx from "clsx";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition",
        variant === "primary" &&
          "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-deep)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]",
        variant === "ghost" && "text-[var(--ink-soft)] hover:text-[var(--ink)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-deep)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]",
        variant === "danger" &&
          "bg-[var(--danger)] text-white hover:opacity-90",
        variant === "ghost" && "text-[var(--ink-soft)] hover:bg-white/70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
