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
  return get<CountryKPI[]>("/market/kpi-summary");
}

export async function getTopMovers(countryCode: string): Promise<CountryTopMovers> {
  return get<CountryTopMovers>(`/market/${countryCode}/top-movers`);
}
