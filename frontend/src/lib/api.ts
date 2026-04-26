import type { CountryKPI, CountryTopMovers, JsonLdPassport, MarketData } from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export type ProfilePayload = {
  raw_text: string;
  country_code: string;
  locale: string;
  education_level?: string;
  languages?: string[];
  years_experience?: number;
};

export async function generatePassport(payload: ProfilePayload): Promise<JsonLdPassport> {
  return post<JsonLdPassport>("/passport/generate", payload);
}

export async function runMatch(
  passport: JsonLdPassport,
  countryCode: string,
  topN = 5
): Promise<{ country_code: string; matches: import("./types").MatchResult[] }> {
  return post("/match", { passport, country_code: countryCode, top_n: topN });
}

export async function getMarket(countryCode: string): Promise<MarketData> {
  return get<MarketData>(`/market/${countryCode}`);
}

export async function getKpiSummary(): Promise<CountryKPI[]> {
  const res = await fetch("/data/kpi_summary.json");
  if (!res.ok) throw new Error("Failed to load KPI data");
  return res.json() as Promise<CountryKPI[]>;
}

export async function getTopMovers(countryCode: string): Promise<CountryTopMovers> {
  const res = await fetch("/data/top_movers.json");
  if (!res.ok) throw new Error("Failed to load top movers data");
  const all = await res.json() as Record<string, CountryTopMovers>;
  const entry = all[countryCode];
  if (!entry) throw new Error(`No top-movers data for ${countryCode}`);
  return entry;
}
