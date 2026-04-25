import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

const unemployment = [
  { q: "Q1 '23", rate: 6.4 }, { q: "Q2 '23", rate: 6.2 }, { q: "Q3 '23", rate: 6.0 },
  { q: "Q4 '23", rate: 5.8 }, { q: "Q1 '24", rate: 5.7 }, { q: "Q2 '24", rate: 5.9 },
  { q: "Q3 '24", rate: 6.1 }, { q: "Q4 '24", rate: 6.3 }, { q: "Q1 '25", rate: 6.5 },
  { q: "Q2 '25", rate: 6.8 }, { q: "Q3 '25", rate: 6.7 }, { q: "Q4 '25", rate: 6.4 },
];

const skillsGap = [
  { skill: "Data analysis", supply: 142, demand: 318 },
  { skill: "Healthcare", supply: 89, demand: 240 },
  { skill: "Construction", supply: 211, demand: 195 },
  { skill: "Teaching", supply: 318, demand: 142 },
  { skill: "Logistics", supply: 124, demand: 168 },
  { skill: "Renewables", supply: 47, demand: 192 },
];

const sectors = [
  { sector: "Services", growth: 3.2 }, { sector: "Industry", growth: 1.4 },
  { sector: "Agric.", growth: -0.6 }, { sector: "Public", growth: 2.1 },
  { sector: "Tech", growth: 5.8 },
];

export const MarketAnalysisPanel = () => {
  return (
    <div className="space-y-12">
      {/* Top bulletin */}
      <section className="grid lg:grid-cols-12 gap-8 pb-8 border-b border-foreground/15">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-2">Briefing for policymakers</p>
          <h2 className="font-serif text-4xl font-semibold leading-tight max-w-3xl">
            A widening gap between green-economy demand and the supply of trained
            <em className="text-accent not-italic"> renewables technicians.</em>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Synthesis of 2.4M candidate profiles and 61k vacancies, cross-referenced with
            ILOSTAT quarterly indicators across 94 economies.
          </p>
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <KPI label="Unemployment" value="6.4%" delta="-0.3" trend="down" good />
          <KPI label="Vacancy rate" value="3.1%" delta="+0.2" trend="up" good />
          <KPI label="Mismatch idx" value="0.42" delta="+0.04" trend="up" />
          <KPI label="Youth NEET" value="14.7%" delta="-0.6" trend="down" good />
        </div>
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7" eyebrow="Indicator 01" title="Unemployment rate" subtitle="Quarterly, seasonally adjusted (%)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={unemployment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="u" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="q" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" domain={[5, 7.5]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--foreground))", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#u)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-5" eyebrow="Indicator 02" title="Sector growth" subtitle="YoY employment change (%)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--foreground))", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <Bar dataKey="growth" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-12" eyebrow="Indicator 03" title="Skills mismatch atlas" subtitle="Supply of candidate profiles vs employer demand, by skill cluster">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsGap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="skill" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--foreground))", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <Bar dataKey="supply" fill="hsl(var(--primary))" name="Candidates" />
              <Bar dataKey="demand" fill="hsl(var(--accent))" name="Vacancies" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-4 text-xs font-mono">
            <span className="flex items-center gap-2"><span className="h-3 w-3 bg-primary inline-block" /> Candidate supply</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 bg-accent inline-block" /> Employer demand</span>
          </div>
        </Card>
      </section>

      {/* Policy recommendations */}
      <section>
        <p className="eyebrow mb-2">Editorial</p>
        <h3 className="font-serif text-3xl font-semibold mb-6 rule-top">Policy levers worth pulling</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Recommendation
            number="I."
            title="Subsidise renewables training"
            body="Demand for renewables technicians outstrips supply 4-to-1. A targeted credential subsidy could close half the gap within 18 months."
            tag="Energy & climate"
          />
          <Recommendation
            number="II."
            title="Re-skill primary teachers"
            body="Teaching profiles exceed vacancies by 2.2×. A bridge programme into adult education and STEM tutoring could absorb the surplus."
            tag="Education"
          />
          <Recommendation
            number="III."
            title="Rural healthcare incentives"
            body="The mismatch index is 71% sharper outside major metros. Rural posting bonuses produced a 9-point gain in the 2019 pilot."
            tag="Health"
          />
        </div>
      </section>
    </div>
  );
};

const KPI = ({ label, value, delta, trend, good }: { label: string; value: string; delta: string; trend: "up" | "down"; good?: boolean }) => {
  const Icon = trend === "up" ? TrendingUp : TrendingDown;
  const positive = good;
  return (
    <div className="bg-card border border-foreground/15 p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="stat-num text-3xl mt-1">{value}</div>
      <div className={`flex items-center gap-1 text-xs font-mono mt-1 ${positive ? "text-teal" : "text-crimson"}`}>
        <Icon className="h-3 w-3" /> {delta}
      </div>
    </div>
  );
};

const Card = ({
  children, className = "", eyebrow, title, subtitle,
}: { children: React.ReactNode; className?: string; eyebrow: string; title: string; subtitle: string }) => (
  <div className={`bg-card border border-foreground/15 p-6 shadow-[var(--shadow-editorial)] ${className}`}>
    <p className="eyebrow mb-1">{eyebrow}</p>
    <h3 className="font-serif text-xl font-semibold">{title}</h3>
    <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>
    {children}
  </div>
);

const Recommendation = ({ number, title, body, tag }: { number: string; title: string; body: string; tag: string }) => (
  <article className="border-t-2 border-foreground pt-4 group cursor-pointer">
    <div className="flex items-start justify-between mb-2">
      <span className="font-serif text-2xl text-accent">{number}</span>
      <span className="eyebrow flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {tag}</span>
    </div>
    <h4 className="font-serif text-xl font-semibold leading-tight mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    <div className="text-xs font-mono uppercase tracking-wider mt-4 flex items-center gap-1 group-hover:text-accent transition-colors">
      Read full memo <ArrowRight className="h-3 w-3" />
    </div>
  </article>
);
