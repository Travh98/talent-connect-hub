import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { Masthead } from "@/components/Masthead";
import { EmployeesPanel } from "@/components/EmployeesPanel";
import { EmployersPanel } from "@/components/EmployersPanel";
import { MarketAnalysisPanel } from "@/components/MarketAnalysisPanel";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Masthead />

        <section id="dashboard" className="container py-12">
          <Tabs defaultValue="employees" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 pb-4 border-b border-foreground/15">
              <div>
                <p className="eyebrow mb-1">The dashboard</p>
                <h2 className="font-serif text-3xl font-semibold">Three readers, one ledger</h2>
              </div>
              <TabsList className="bg-transparent p-0 h-auto gap-0 border border-foreground/30 rounded-none">
                <TabsTrigger
                  value="employees"
                  className="rounded-none px-5 py-2.5 text-sm font-mono uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background"
                >
                  Employees
                </TabsTrigger>
                <TabsTrigger
                  value="employers"
                  className="rounded-none px-5 py-2.5 text-sm font-mono uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background border-l border-foreground/30"
                >
                  Employers
                </TabsTrigger>
                <TabsTrigger
                  value="market"
                  className="rounded-none px-5 py-2.5 text-sm font-mono uppercase tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background border-l border-foreground/30"
                >
                  Market Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="employees" className="mt-0 focus-visible:outline-none">
              <EmployeesPanel />
            </TabsContent>
            <TabsContent value="employers" className="mt-0 focus-visible:outline-none">
              <EmployersPanel />
            </TabsContent>
            <TabsContent value="market" className="mt-0 focus-visible:outline-none">
              <MarketAnalysisPanel />
            </TabsContent>
          </Tabs>
        </section>

        <footer id="about" className="border-t border-foreground/15 mt-20">
          <div className="container py-10 grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-serif text-lg font-semibold">CandidateConnect</div>
              <p className="text-muted-foreground mt-1">A labour market observatory built on the ILOSTAT taxonomy.</p>
            </div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Methodology · Data sources · Privacy
            </div>
            <div className="md:text-right text-xs font-mono text-muted-foreground">
              © 2026 · ISSN 2789-0142 · Published quarterly
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
