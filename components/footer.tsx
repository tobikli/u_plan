import Link from "next/link";
import Logo from "@/public/uplan.svg";

export function Footer() {
  return (
    <footer className="relative z-10 border-t bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo className="h-5 w-5 text-black dark:text-white" />
          <span>
            © {new Date().getFullYear()} U_PLAN /
            <a className="ml-1 underline" href="https://tobiwn.me">
              Tobias Klingenberg
            </a>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link className="hover:text-foreground" href="/app">
            Dashboard
          </Link>
          <Link className="hover:text-foreground" href="/app/programs">
            Studies
          </Link>
          <Link className="hover:text-foreground" href="/app/courses">
            Courses
          </Link>
          /
          <Link className="hover:text-foreground" href="/privacy">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
