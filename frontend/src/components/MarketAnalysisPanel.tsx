import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, ChevronDown } from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

// Source: /data/kpi_summary.json
const KPI_DATA = [
  {
    country_iso3: "BGD", country_label: "Bangladesh",
    total_workers_k: 67834, workers_delta_pct: 12,
    workers_year_first: 2017, workers_year_last: 2024,
    avg_earnings: 14582, earnings_currency: "BDT",
    earnings_delta_pct: 35.1, earnings_year_first: 2013, earnings_year_last: 2024,
    avg_green_share_pct: 4.5,
  },
  {
    country_iso3: "GHA", country_label: "Ghana",
    total_workers_k: 9448, workers_delta_pct: -18.4,
    workers_year_first: 2013, workers_year_last: 2017,
    avg_earnings: 2491, earnings_currency: "GHS",
    earnings_delta_pct: 458.5, earnings_year_first: 2013, earnings_year_last: 2024,
    avg_green_share_pct: 4.5,
  },
  {
    country_iso3: "IND", country_label: "India",
    total_workers_k: 468374, workers_delta_pct: 22.8,
    workers_year_first: 2018, workers_year_last: 2024,
    avg_earnings: 15927, earnings_currency: "INR",
    earnings_delta_pct: -3.8, earnings_year_first: 2022, earnings_year_last: 2024,
    avg_green_share_pct: 4.5,
  },
  {
    country_iso3: "KEN", country_label: "Kenya",
    total_workers_k: 14456, workers_delta_pct: -31.6,
    workers_year_first: 2019, workers_year_last: 2022,
    avg_earnings: 11676, earnings_currency: "KES",
    earnings_delta_pct: -20.5, earnings_year_first: 2019, earnings_year_last: 2019,
    avg_green_share_pct: 4.5,
  },
];

const totalWorkers = KPI_DATA.reduce((s, d) => s + d.total_workers_k, 0);
const fastestGrowth = KPI_DATA.reduce((a, b) => a.workers_delta_pct > b.workers_delta_pct ? a : b);
const avgGreenShare = (KPI_DATA.reduce((s, d) => s + d.avg_green_share_pct, 0) / KPI_DATA.length).toFixed(1);

const workforceChartData = KPI_DATA.map((d) => ({
  country: d.country_label,
  workers_m: +(d.total_workers_k / 1000).toFixed(1),
}));

const workforceGrowthData = KPI_DATA.map((d) => ({
  country: d.country_label,
  delta: d.workers_delta_pct,
  period: `${d.workers_year_first}–${d.workers_year_last}`,
}));

const earningsGrowthData = KPI_DATA.map((d) => ({
  country: d.country_label,
  delta: d.earnings_delta_pct,
  currency: d.earnings_currency,
  period: `${d.earnings_year_first}–${d.earnings_year_last}`,
}));

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--foreground))",
  borderRadius: 0,
  fontFamily: "JetBrains Mono",
  fontSize: 12,
};

const TICK = { fontSize: 11, fontFamily: "JetBrains Mono" };
const AXIS_STROKE = "hsl(var(--muted-foreground))";
const GRID_STROKE = "hsl(var(--border))";
const COLOR_POS = "hsl(var(--accent))";
const COLOR_NEG = "#c0392b";

export const MarketAnalysisPanel = () => {
  const [selectedIso3, setSelectedIso3] = useState<string | null>("GHA");
  const country = selectedIso3 ? KPI_DATA.find((d) => d.country_iso3 === selectedIso3) : null;

  // Highlight helpers — dim non-selected bars to 20% opacity when a country is active
  const barOpacity = (label: string) =>
    !country || country.country_label === label ? 1 : 0.2;

  return (
    <div className="space-y-12">
      {/* Country filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Filter by country</span>
        <div className="relative">
          <select
            value={selectedIso3 ?? ""}
            onChange={(e) => setSelectedIso3(e.target.value || null)}
            className="appearance-none border border-foreground/30 bg-card px-3 py-1.5 pr-7 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">All countries</option>
            {KPI_DATA.map((d) => (
              <option key={d.country_iso3} value={d.country_iso3}>{d.country_label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {country && (
          <button
            onClick={() => setSelectedIso3(null)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Top bulletin */}
      <section className="grid lg:grid-cols-12 gap-8 pb-8 border-b border-foreground/15">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-2">Briefing for policymakers</p>
          {country ? (
            <>
              <h2 className="font-serif text-4xl font-semibold leading-tight max-w-3xl">
                {country.country_label} —
                <em className="text-accent not-italic">
                  {" "}{country.workers_delta_pct >= 0 ? "growing" : "contracting"} workforce,
                  earnings {country.earnings_delta_pct >= 0 ? "up" : "down"} {Math.abs(country.earnings_delta_pct)}% in {country.earnings_currency}.
                </em>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                Data window: workers {country.workers_year_first}–{country.workers_year_last} ·
                earnings {country.earnings_year_first}–{country.earnings_year_last} ·
                green-economy share {country.avg_green_share_pct}%
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-4xl font-semibold leading-tight max-w-3xl">
                Diverging labour-market trajectories across four emerging economies —
                <em className="text-accent not-italic"> from India's expanding workforce to Kenya's sharp contraction.</em>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                KPI summary across {KPI_DATA.length} countries, covering workforce size,
                earnings trends, and green-economy employment share.
              </p>
            </>
          )}
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {country ? (
            <>
              <KPI
                label="Workers tracked"
                value={`${(country.total_workers_k / 1000).toFixed(1)}M`}
                sub={`${country.workers_year_first}–${country.workers_year_last}`}
              />
              <KPI
                label="Green share"
                value={`${country.avg_green_share_pct}%`}
                sub="of employment"
              />
              <KPI
                label="Workforce change"
                value={`${country.workers_delta_pct > 0 ? "+" : ""}${country.workers_delta_pct}%`}
                sub={`${country.workers_year_first}–${country.workers_year_last}`}
                positive={country.workers_delta_pct >= 0}
                negative={country.workers_delta_pct < 0}
              />
              <KPI
                label={`Earnings change (${country.earnings_currency})`}
                value={`${country.earnings_delta_pct > 0 ? "+" : ""}${country.earnings_delta_pct}%`}
                sub={`${country.earnings_year_first}–${country.earnings_year_last}`}
                positive={country.earnings_delta_pct >= 0}
                negative={country.earnings_delta_pct < 0}
              />
            </>
          ) : (
            <>
              <KPI
                label="Total workers"
                value={`${(totalWorkers / 1000).toFixed(1)}M`}
                sub={`across ${KPI_DATA.length} countries`}
              />
              <KPI
                label="Avg green share"
                value={`${avgGreenShare}%`}
                sub="of employment"
              />
              <KPI
                label="Fastest growth"
                value={`+${fastestGrowth.workers_delta_pct}%`}
                sub={fastestGrowth.country_label}
                positive
              />
              <KPI
                label="Sharpest decline"
                value={`${KPI_DATA.reduce((a, b) => a.workers_delta_pct < b.workers_delta_pct ? a : b).workers_delta_pct}%`}
                sub={KPI_DATA.reduce((a, b) => a.workers_delta_pct < b.workers_delta_pct ? a : b).country_label}
                negative
              />
            </>
          )}
        </div>
      </section>

      {/* Charts row 1 */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card
          className="lg:col-span-7"
          eyebrow="Indicator 01"
          title="Workforce size"
          subtitle="Total workers tracked (millions)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workforceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number) => [`${v}M workers`, "Workforce"]}
              />
              <Bar dataKey="workers_m" name="Workers (M)">
                {workforceChartData.map((d, i) => (
                  <Cell key={i} fill={COLOR_POS} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card
          className="lg:col-span-5"
          eyebrow="Indicator 02"
          title="Workforce growth"
          subtitle="Change in total workers over measurement period (%)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workforceGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _name, props) => [
                  `${v > 0 ? "+" : ""}${v}%  (${props.payload.period})`,
                  "Workforce change",
                ]}
              />
              <Bar dataKey="delta" name="Change %">
                {workforceGrowthData.map((d, i) => (
                  <Cell key={i} fill={d.delta >= 0 ? COLOR_POS : COLOR_NEG} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-4 text-xs font-mono">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 inline-block" style={{ background: COLOR_POS }} /> Growth
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 inline-block" style={{ background: COLOR_NEG }} /> Contraction
            </span>
          </div>
        </Card>
      </section>

      {/* Charts row 2 */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card
          className="lg:col-span-12"
          eyebrow="Indicator 03"
          title="Earnings growth"
          subtitle="Change in average earnings over measurement period (%, local currency)"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={earningsGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _name, props) => [
                  `${v > 0 ? "+" : ""}${v}%  (${props.payload.currency}, ${props.payload.period})`,
                  "Earnings change",
                ]}
              />
              <Bar dataKey="delta" name="Earnings change %">
                {earningsGrowthData.map((d, i) => (
                  <Cell key={i} fill={d.delta >= 0 ? COLOR_POS : COLOR_NEG} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground font-mono mt-3">
            Note: values are in local currency — not cross-currency comparable. Ghana's +458.5% spans 2013–2024; India's −3.8% covers 2022–2024 only.
          </p>
        </Card>
      </section>

      {/* Policy recommendations */}
      <section>
        <p className="eyebrow mb-2">Editorial</p>
        <h3 className="font-serif text-3xl font-semibold mb-6 rule-top">Policy levers worth pulling</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Recommendation
            number="I."
            title="Address Kenya's labour-market contraction"
            body="Kenya's workforce shrank 31.6% between 2019 and 2022 while earnings also fell 20.5% — a rare double-contraction signalling structural stress beyond a cyclical downturn."
            tag="Labour markets"
          />
          <Recommendation
            number="II."
            title="Investigate Ghana's productivity paradox"
            body="Ghana achieved 458.5% earnings growth between 2013 and 2024 despite an 18.4% fall in total workers. Understanding whether this reflects sectoral rebalancing or inflationary pressure is critical."
            tag="Earnings"
          />
          <Recommendation
            number="III."
            title="Scale India's green-jobs pipeline"
            body="India's workforce grew 22.8% but green-economy share remains flat at 4.5%. Given the scale of the workforce (468M), even a 1-point shift would represent millions of new green roles."
            tag="Green economy"
          />
        </div>
      </section>
    </div>
  );
};

const KPI = ({
  label, value, sub, positive, negative,
}: {
  label: string; value: string; sub: string; positive?: boolean; negative?: boolean;
}) => {
  const Icon = positive ? TrendingUp : negative ? TrendingDown : null;
  const colour = positive ? "text-teal" : negative ? "text-crimson" : "text-muted-foreground";
  return (
    <div className="bg-card border border-foreground/15 p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="stat-num text-3xl mt-1">{value}</div>
      <div className={`flex items-center gap-1 text-xs font-mono mt-1 ${colour}`}>
        {Icon && <Icon className="h-3 w-3" />}
        {sub}
      </div>
    </div>
  );
};

const Card = ({
  children, className = "", eyebrow, title, subtitle,
}: {
  children: React.ReactNode; className?: string; eyebrow: string; title: string; subtitle: string;
}) => (
  <div className={`bg-card border border-foreground/15 p-6 shadow-[var(--shadow-editorial)] ${className}`}>
    <p className="eyebrow mb-1">{eyebrow}</p>
    <h3 className="font-serif text-xl font-semibold">{title}</h3>
    <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>
    {children}
  </div>
);

const Recommendation = ({
  number, title, body, tag,
}: {
  number: string; title: string; body: string; tag: string;
}) => (
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
