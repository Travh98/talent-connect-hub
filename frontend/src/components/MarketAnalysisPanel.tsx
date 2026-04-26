import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";

// Source: /data/top_movers.json
type TopMover = { rank: number; isco_1_label: string; pct_change: number; year_first: number; year_last: number };
type TopEarner = TopMover & { earnings_value_last: number; earnings_currency: string };
const TOP_MOVERS: Record<string, { top_employment_growth_majors: TopMover[]; top_earnings_growth_majors: TopEarner[] }> = {
  BGD: {
    top_employment_growth_majors: [
      { rank: 1, isco_1_label: "Technicians and associate professionals", pct_change: 59.4, year_first: 2017, year_last: 2024 },
      { rank: 2, isco_1_label: "Plant and machine operators, and assemblers", pct_change: 44.6, year_first: 2017, year_last: 2024 },
      { rank: 3, isco_1_label: "Skilled agric., forestry and fishery workers", pct_change: 43.4, year_first: 2017, year_last: 2024 },
      { rank: 4, isco_1_label: "Professionals", pct_change: 5.3, year_first: 2017, year_last: 2024 },
      { rank: 5, isco_1_label: "Service and sales workers", pct_change: 1, year_first: 2017, year_last: 2024 },
    ],
    top_earnings_growth_majors: [
      { rank: 1, isco_1_label: "Armed forces occupations", pct_change: 91.1, year_first: 2013, year_last: 2024, earnings_value_last: 28908, earnings_currency: "BDT" },
      { rank: 2, isco_1_label: "Managers", pct_change: 89.7, year_first: 2013, year_last: 2024, earnings_value_last: 37690, earnings_currency: "BDT" },
      { rank: 3, isco_1_label: "Clerical support workers", pct_change: 68, year_first: 2013, year_last: 2024, earnings_value_last: 22678, earnings_currency: "BDT" },
      { rank: 4, isco_1_label: "Technicians and associate professionals", pct_change: 46, year_first: 2013, year_last: 2024, earnings_value_last: 22517, earnings_currency: "BDT" },
      { rank: 5, isco_1_label: "Professionals", pct_change: 41.9, year_first: 2013, year_last: 2024, earnings_value_last: 23053, earnings_currency: "BDT" },
    ],
  },
  GHA: {
    top_employment_growth_majors: [
      { rank: 1, isco_1_label: "Craft and related trades workers", pct_change: 37.7, year_first: 2013, year_last: 2017 },
      { rank: 2, isco_1_label: "Managers", pct_change: 19.7, year_first: 2013, year_last: 2017 },
      { rank: 3, isco_1_label: "Plant and machine operators, and assemblers", pct_change: 19.2, year_first: 2013, year_last: 2017 },
      { rank: 4, isco_1_label: "Clerical support workers", pct_change: 18.6, year_first: 2013, year_last: 2017 },
      { rank: 5, isco_1_label: "Professionals", pct_change: 18.5, year_first: 2013, year_last: 2017 },
    ],
    top_earnings_growth_majors: [
      { rank: 1, isco_1_label: "Service and sales workers", pct_change: 356.8, year_first: 2013, year_last: 2024, earnings_value_last: 2032, earnings_currency: "GHS" },
      { rank: 2, isco_1_label: "Technicians and associate professionals", pct_change: 319.5, year_first: 2013, year_last: 2024, earnings_value_last: 2756, earnings_currency: "GHS" },
      { rank: 3, isco_1_label: "Plant and machine operators, and assemblers", pct_change: 302.3, year_first: 2013, year_last: 2024, earnings_value_last: 2595, earnings_currency: "GHS" },
      { rank: 4, isco_1_label: "Managers", pct_change: 225, year_first: 2013, year_last: 2024, earnings_value_last: 3929, earnings_currency: "GHS" },
      { rank: 5, isco_1_label: "Clerical support workers", pct_change: 215.1, year_first: 2013, year_last: 2024, earnings_value_last: 2213, earnings_currency: "GHS" },
    ],
  },
  IND: {
    top_employment_growth_majors: [
      { rank: 1, isco_1_label: "Service and sales workers", pct_change: 57.5, year_first: 2018, year_last: 2024 },
      { rank: 2, isco_1_label: "Skilled agric., forestry and fishery workers", pct_change: 50.9, year_first: 2018, year_last: 2024 },
      { rank: 3, isco_1_label: "Plant and machine operators, and assemblers", pct_change: 39, year_first: 2018, year_last: 2024 },
      { rank: 4, isco_1_label: "Professionals", pct_change: 30.1, year_first: 2018, year_last: 2024 },
      { rank: 5, isco_1_label: "Elementary occupations", pct_change: 20.6, year_first: 2018, year_last: 2024 },
    ],
    top_earnings_growth_majors: [
      { rank: 1, isco_1_label: "Craft and related trades workers", pct_change: 19.2, year_first: 2022, year_last: 2024, earnings_value_last: 15860, earnings_currency: "INR" },
      { rank: 2, isco_1_label: "Clerical support workers", pct_change: 16.9, year_first: 2022, year_last: 2024, earnings_value_last: 24388, earnings_currency: "INR" },
      { rank: 3, isco_1_label: "Professionals", pct_change: 13.8, year_first: 2022, year_last: 2024, earnings_value_last: 36141, earnings_currency: "INR" },
      { rank: 4, isco_1_label: "Elementary occupations", pct_change: 13, year_first: 2022, year_last: 2024, earnings_value_last: 10237, earnings_currency: "INR" },
      { rank: 5, isco_1_label: "Technicians and associate professionals", pct_change: 12.4, year_first: 2022, year_last: 2024, earnings_value_last: 26037, earnings_currency: "INR" },
    ],
  },
  KEN: {
    top_employment_growth_majors: [
      { rank: 1, isco_1_label: "Skilled agric., forestry and fishery workers", pct_change: 5.4, year_first: 2019, year_last: 2022 },
      { rank: 2, isco_1_label: "Technicians and associate professionals", pct_change: 2.2, year_first: 2019, year_last: 2022 },
      { rank: 3, isco_1_label: "Armed forces occupations", pct_change: 0, year_first: 2019, year_last: 2019 },
      { rank: 4, isco_1_label: "Elementary occupations", pct_change: -31.8, year_first: 2019, year_last: 2022 },
      { rank: 5, isco_1_label: "Service and sales workers", pct_change: -39.1, year_first: 2019, year_last: 2022 },
    ],
    top_earnings_growth_majors: [
      { rank: 1, isco_1_label: "Armed forces occupations", pct_change: 0, year_first: 2019, year_last: 2019, earnings_value_last: 72033, earnings_currency: "KES" },
      { rank: 2, isco_1_label: "Managers", pct_change: 0, year_first: 2019, year_last: 2019, earnings_value_last: 58575, earnings_currency: "KES" },
      { rank: 3, isco_1_label: "Professionals", pct_change: 0, year_first: 2019, year_last: 2019, earnings_value_last: 31414, earnings_currency: "KES" },
      { rank: 4, isco_1_label: "Technicians and associate professionals", pct_change: 0, year_first: 2019, year_last: 2019, earnings_value_last: 27865, earnings_currency: "KES" },
      { rank: 5, isco_1_label: "Clerical support workers", pct_change: 0, year_first: 2019, year_last: 2019, earnings_value_last: 25366, earnings_currency: "KES" },
    ],
  },
};

// Source: /data/kpi_summary_2.json
const KPI_DATA_2: Record<string, {
  avg_earnings: number; earnings_currency: string;
  earnings_year_first: number; earnings_year_last: number;
  country_label: string;
}> = {
  BGD: { country_label: "Bangladesh", avg_earnings: 14582, earnings_currency: "BDT", earnings_year_first: 2013, earnings_year_last: 2024 },
  GHA: { country_label: "Ghana",      avg_earnings: 2491,  earnings_currency: "GHS", earnings_year_first: 2013, earnings_year_last: 2024 },
  IND: { country_label: "India",      avg_earnings: 15927, earnings_currency: "INR", earnings_year_first: 2022, earnings_year_last: 2024 },
  KEN: { country_label: "Kenya",      avg_earnings: 11676, earnings_currency: "KES", earnings_year_first: 2019, earnings_year_last: 2019 },
};

const avgEarningsData = Object.values(KPI_DATA_2).map((d) => ({
  country: d.country_label,
  earnings: d.avg_earnings,
  currency: d.earnings_currency,
  period: `${d.earnings_year_first}–${d.earnings_year_last}`,
}));

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

      {/* Charts row 3 — kpi_summary_2 */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card
          className="lg:col-span-12"
          eyebrow="Indicator 04"
          title="Average earnings"
          subtitle="Most recent average earnings figure per country (local currency)"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgEarningsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _name, props) => [
                  `${v.toLocaleString()} ${props.payload.currency}  (${props.payload.period})`,
                  "Avg earnings",
                ]}
              />
              <Bar dataKey="earnings" name="Avg earnings">
                {avgEarningsData.map((d, i) => (
                  <Cell key={i} fill={COLOR_POS} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground font-mono mt-3">
            Note: figures are in local currency and are not cross-currency comparable.
            Currency codes: BDT · GHS · INR · KES.
          </p>
        </Card>
      </section>

      {/* Charts row 4 — top_movers */}
      {(() => {
        const iso = selectedIso3 ?? "GHA";
        const movers = TOP_MOVERS[iso];
        const countryLabel = KPI_DATA.find((d) => d.country_iso3 === iso)?.country_label ?? iso;
        const empData = movers.top_employment_growth_majors.map((d) => ({
          label: d.isco_1_label,
          pct: d.pct_change,
          period: `${d.year_first}–${d.year_last}`,
        }));
        const earningsData = movers.top_earnings_growth_majors.map((d) => ({
          label: d.isco_1_label,
          pct: d.pct_change,
          value: (d as TopEarner).earnings_value_last,
          currency: (d as TopEarner).earnings_currency,
          period: `${d.year_first}–${d.year_last}`,
        }));
        return (
          <section className="grid lg:grid-cols-12 gap-8">
            <Card
              className="lg:col-span-6"
              eyebrow="Indicator 05"
              title="Top employment growth"
              subtitle={`Top 5 ISCO major groups by employment growth — ${countryLabel} (%)`}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={empData} margin={{ top: 5, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="label" width={165} tick={{ ...TICK, width: 160, textAnchor: "end" }} stroke={AXIS_STROKE} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _n, props) => [
                      `${v > 0 ? "+" : ""}${v}%  (${props.payload.period})`,
                      "Employment change",
                    ]}
                  />
                  <Bar dataKey="pct" name="Employment change %">
                    {empData.map((d, i) => (
                      <Cell key={i} fill={d.pct >= 0 ? COLOR_POS : COLOR_NEG} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card
              className="lg:col-span-6"
              eyebrow="Indicator 06"
              title="Top earnings growth"
              subtitle={`Top 5 ISCO major groups by earnings growth — ${countryLabel} (%, local currency)`}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={earningsData} margin={{ top: 5, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="label" width={165} tick={{ ...TICK, width: 160, textAnchor: "end" }} stroke={AXIS_STROKE} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number, _n, props) => [
                      `${v > 0 ? "+" : ""}${v}%  · ${props.payload.value?.toLocaleString()} ${props.payload.currency}  (${props.payload.period})`,
                      "Earnings change",
                    ]}
                  />
                  <Bar dataKey="pct" name="Earnings change %">
                    {earningsData.map((d, i) => (
                      <Cell key={i} fill={d.pct >= 0 ? COLOR_POS : COLOR_NEG} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </section>
        );
      })()}

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

