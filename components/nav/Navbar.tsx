import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="flex h-14 items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 font-bold text-base
                       hover:opacity-80 transition-opacity"
          >
            <span className="text-xl" aria-hidden>
              🎵
            </span>
            <span className="hidden sm:inline">ChartedTracks</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-sm shrink-0">
            <NavLink href="/charts/gb">🇬🇧 UK Chart</NavLink>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-muted-foreground
                 hover:text-foreground hover:bg-muted
                 transition-colors"
    >
      {children}
    </Link>
  );
}
