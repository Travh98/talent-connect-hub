import { Compass } from "lucide-react";

export const SiteHeader = () => {
  return (
    <header className="border-b border-foreground/15 bg-paper/80 backdrop-blur supports-[backdrop-filter]:bg-paper/70 sticky top-0 z-40">
      <div className="container flex items-center justify-between py-5">
        <a href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 border-2 border-foreground flex items-center justify-center bg-paper">
            <Compass className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-xl font-semibold tracking-tight">
              CandidateConnect
            </div>
            <div className="eyebrow -mt-0.5">
              Match Careers to the Right People
            </div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#dashboard" className="hover:text-accent transition-colors">
            Dashboard
          </a>
          <a href="#about" className="hover:text-accent transition-colors">
            About
          </a>
          <span className="font-mono text-xs text-muted-foreground border-l border-foreground/20 pl-6">
            Vol. III · No. 2
          </span>
        </nav>
      </div>
    </header>
  );
};
