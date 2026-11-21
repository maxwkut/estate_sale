import Link from "next/link";

type SiteHeaderProps = {
  active?: "catalog" | "upload";
};

export function SiteHeader({ active = "catalog" }: SiteHeaderProps) {
  return (
    <header className="site-header site-shell">
      <Link href="/" className="nav-link" aria-label="Estate Sale home">
        Estate Sale
      </Link>
      <nav className="site-nav" aria-label="Primary">
        <Link
          href="/"
          className="nav-link"
          aria-current={active === "catalog" ? "page" : undefined}
        >
          Catalog
        </Link>
        {active === "upload" ? (
          <Link href="/upload" className="nav-link-strong" aria-current="page">
            Edit rooms
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
