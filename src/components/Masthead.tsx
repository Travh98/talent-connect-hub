export const Masthead = () => {
  return (
    <section className="container pt-14 pb-10 border-b border-foreground/15">
      <div className="flex items-center justify-between mb-8 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
        <span>Edition · Spring 2026</span>
        <span className="hidden sm:inline">Geneva — Brussels — Nairobi</span>
        <span>Issue 014</span>
      </div>
      <div className="grid lg:grid-cols-12 gap-10 items-end">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-4">A unified ledger of work</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight">
            The labour market,
            <br />
            <em className="text-accent not-italic font-normal italic">read like a newspaper.</em>
          </h1>
        </div>
        <div className="lg:col-span-4 lg:border-l lg:border-foreground/20 lg:pl-8">
          <p className="text-base leading-relaxed text-muted-foreground">
            CandidateConnect is a shared dashboard for the three sides of work — the people seeking it,
            the firms offering it, and the policymakers shaping its conditions. Built on the
            ILO occupational taxonomy.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center font-mono text-[11px] uppercase tracking-wider">
            <div className="border-t-2 border-foreground pt-2">
              <div className="stat-num text-2xl">2.4M</div>
              <div className="text-muted-foreground mt-1">Profiles</div>
            </div>
            <div className="border-t-2 border-foreground pt-2">
              <div className="stat-num text-2xl">61k</div>
              <div className="text-muted-foreground mt-1">Vacancies</div>
            </div>
            <div className="border-t-2 border-accent pt-2">
              <div className="stat-num text-2xl text-accent">94</div>
              <div className="text-muted-foreground mt-1">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
