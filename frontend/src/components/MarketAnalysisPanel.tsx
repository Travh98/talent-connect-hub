import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { getMarket, getKpiSummary, getTopMovers } from "@/lib/api";
import type { CountryKPI, CountryTopMovers, MarketData } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";

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

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="space-y-3 w-full" style={{ height }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-5 bg-muted animate-pulse rounded" style={{ width: `${55 + i * 11}%` }} />
      ))}
    </div>
  );
}

export const MarketAnalysisPanel = ({
  countryCode,
  setCountryCode,
}: {
  countryCode: string;
  setCountryCode: (code: string) => void;
}) => {
  const { data: kpiData } = useQuery<CountryKPI[]>({
    queryKey: ["kpi-summary"],
    queryFn: getKpiSummary,
    staleTime: Infinity,
  });

  const { data: moversData, isLoading: moversLoading } = useQuery<CountryTopMovers>({
    queryKey: ["top-movers", countryCode],
    queryFn: () => getTopMovers(countryCode),
    staleTime: Infinity,
  });

  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery<MarketData>({
    queryKey: ["market", countryCode],
    queryFn: () => getMarket(countryCode),
    staleTime: Infinity,
  });

  const country = kpiData?.find((d) => d.country_iso3 === countryCode) ?? null;

  const barOpacity = (label: string) =>
    !country || country.country_label === label ? 1 : 0.2;

  const workforceChartData = (kpiData ?? []).map((d) => ({
    country: d.country_label,
    workers_m: +(d.total_workers_k / 1000).toFixed(1),
  }));

  const workforceGrowthData = (kpiData ?? []).map((d) => ({
    country: d.country_label,
    delta: d.workers_delta_pct,
    period: `${d.workers_year_first}–${d.workers_year_last}`,
  }));

  const earningsGrowthData = (kpiData ?? []).map((d) => ({
    country: d.country_label,
    delta: d.earnings_delta_pct,
    currency: d.earnings_currency,
    period: `${d.earnings_year_first}–${d.earnings_year_last}`,
  }));

  const avgEarningsData = (kpiData ?? []).map((d) => ({
    country: d.country_label,
    earnings: d.avg_earnings,
    currency: d.earnings_currency,
    period: `${d.earnings_year_first}–${d.earnings_year_last}`,
  }));

  const sectors = (marketData?.sector_employment ?? []).map((s) => ({
    sector: s.isco_2_label.split(" ").slice(0, 3).join(" "),
    growth: Number(s.employment_pct_change.toFixed(1)),
  }));

  const empMoversData = (moversData?.top_employment_growth_majors ?? []).map((d) => ({
    label: d.isco_1_label,
    pct: d.pct_change,
    period: `${d.year_first}–${d.year_last}`,
  }));

  const earningsMoversData = (moversData?.top_earnings_growth_majors ?? []).map((d) => ({
    label: d.isco_1_label,
    pct: d.pct_change,
    value: d.earnings_value_last,
    currency: d.earnings_currency,
    period: `${d.year_first}–${d.year_last}`,
  }));

  const totalWorkers = (kpiData ?? []).reduce((s, d) => s + d.total_workers_k, 0);
  const fastestGrowth = kpiData?.reduce((a, b) => a.workers_delta_pct > b.workers_delta_pct ? a : b);
  const slowestGrowth = kpiData?.reduce((a, b) => a.workers_delta_pct < b.workers_delta_pct ? a : b);

  return (
    <div className="space-y-12">
      {/* Country filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Country</span>
        <div className="relative">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="appearance-none border border-foreground/30 bg-card px-3 py-1.5 pr-7 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            aria-label="Country context"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Bulletin */}
      <section className="grid lg:grid-cols-12 gap-8 pb-8 border-b border-foreground/15">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-2">Briefing for policymakers</p>
          {country ? (
            <>
              <h2 className="font-serif text-4xl font-semibold leading-tight max-w-3xl">
                {country.country_label} —
                <em className="text-accent not-italic">
                  {" "}{country.workers_delta_pct >= 0 ? "growing" : "contracting"} workforce,
                  earnings {country.earnings_delta_pct >= 0 ? "up" : "down"}{" "}
                  {Math.abs(country.earnings_delta_pct)}% in {country.earnings_currency}.
                </em>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                Workers {country.workers_year_first}–{country.workers_year_last} ·
                earnings {country.earnings_year_first}–{country.earnings_year_last} ·
                green-economy share {country.avg_green_share_pct}% · Source: ILOSTAT
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-4xl font-semibold leading-tight max-w-3xl">
                Diverging labour-market trajectories across three emerging economies —
                <em className="text-accent not-italic"> from India's expanding workforce to Ghana's sharp contraction.</em>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl">
                KPI summary across {COUNTRIES.length} countries, covering workforce size,
                earnings trends, and green-economy employment share. Source: ILOSTAT.
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
                label={`Earnings (${country.earnings_currency})`}
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
                sub={`across ${COUNTRIES.length} countries`}
              />
              <KPI
                label="Avg green share"
                value={kpiData ? `${((kpiData.reduce((s, d) => s + d.avg_green_share_pct, 0)) / kpiData.length).toFixed(1)}%` : "—"}
                sub="of employment"
              />
              {fastestGrowth && (
                <KPI
                  label="Fastest growth"
                  value={`+${fastestGrowth.workers_delta_pct}%`}
                  sub={fastestGrowth.country_label}
                  positive
                />
              )}
              {slowestGrowth && (
                <KPI
                  label="Sharpest decline"
                  value={`${slowestGrowth.workers_delta_pct}%`}
                  sub={slowestGrowth.country_label}
                  negative
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* Charts row 1 — cross-country workforce */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7" eyebrow="Indicator 01" title="Workforce size"
          subtitle="Total workers tracked (millions) · ILOSTAT">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workforceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}M`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}M workers`, "Workforce"]} />
              <Bar dataKey="workers_m" name="Workers (M)">
                {workforceChartData.map((d, i) => (
                  <Cell key={i} fill={COLOR_POS} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-5" eyebrow="Indicator 02" title="Workforce growth"
          subtitle="Change in total workers over measurement period (%) · ILOSTAT">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workforceGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _n, props) => [
                  `${v > 0 ? "+" : ""}${v}%  (${props.payload.period})`, "Workforce change",
                ]}
              />
              <Bar dataKey="delta" name="Change %">
                {workforceGrowthData.map((d, i) => (
                  <Cell key={i} fill={d.delta >= 0 ? COLOR_POS : COLOR_NEG} fillOpacity={barOpacity(d.country)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Charts row 2 — sector growth (live) + earnings growth */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-5" eyebrow="Indicator 03" title="Sector employment growth"
          subtitle={marketData ? `ISCO-2 sector growth (%) · ${marketData.country_name} · ILOSTAT ${marketData.employment_year_last}` : "Loading…"}>
          {marketLoading ? (
            <div className="h-[260px] flex items-center justify-center"><ChartSkeleton /></div>
          ) : marketError ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              {(marketError as Error).message}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke={AXIS_STROKE} />
                <YAxis tick={TICK} stroke={AXIS_STROKE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="growth">
                  {sectors.map((s, i) => (
                    <Cell key={i} fill={s.growth >= 0 ? COLOR_POS : COLOR_NEG} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-7" eyebrow="Indicator 04" title="Earnings growth"
          subtitle="Change in average earnings over measurement period (%, local currency) · ILOSTAT">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={earningsGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _n, props) => [
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
            Local currency — not cross-currency comparable. GHA +458.5% spans 2013–2024; IND −3.8% covers 2022–2024 only.
          </p>
        </Card>
      </section>

      {/* Charts row 3 — average earnings */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-12" eyebrow="Indicator 05" title="Average earnings"
          subtitle="Most recent average earnings per country (local currency) · ILOSTAT">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={avgEarningsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="country" tick={TICK} stroke={AXIS_STROKE} />
              <YAxis tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _n, props) => [
                  `${v.toLocaleString()} ${props.payload.currency}  (${props.payload.period})`, "Avg earnings",
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
            Local currency — not cross-currency comparable. BDT · GHS · INR
          </p>
        </Card>
      </section>

      {/* Charts row 4 — top movers (per country) */}
      <section className="grid lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-6" eyebrow="Indicator 06" title="Top employment growth"
          subtitle={moversData ? `Top 5 ISCO major groups by employment growth — ${moversData.country_label} (%)` : "Loading…"}>
          {moversLoading ? (
            <div className="h-[280px] flex items-center justify-center"><ChartSkeleton height={280} /></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={empMoversData} margin={{ top: 5, right: 20, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" tick={TICK} stroke={AXIS_STROKE} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" width={165} tick={{ ...TICK, width: 160, textAnchor: "end" }} stroke={AXIS_STROKE} />
                <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, _n, props) => [
                    `${v > 0 ? "+" : ""}${v}%  (${props.payload.period})`, "Employment change",
                  ]}
                />
                <Bar dataKey="pct" name="Employment change %">
                  {empMoversData.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 0 ? COLOR_POS : COLOR_NEG} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-6" eyebrow="Indicator 07" title="Top earnings growth"
          subtitle={moversData ? `Top 5 ISCO major groups by earnings growth — ${moversData.country_label} (%, local currency)` : "Loading…"}>
          {moversLoading ? (
            <div className="h-[280px] flex items-center justify-center"><ChartSkeleton height={280} /></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={earningsMoversData} margin={{ top: 5, right: 20, left: 8, bottom: 0 }}>
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
                  {earningsMoversData.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 0 ? COLOR_POS : COLOR_NEG} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
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
  const colour = positive ? "text-teal-600" : negative ? "text-red-600" : "text-muted-foreground";
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
