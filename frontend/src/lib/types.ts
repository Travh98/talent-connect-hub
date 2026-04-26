export type EmploymentSignal = {
  value: number;
  year_first: number;
  year_last: number;
  employment_last_thousands: number;
  source: string;
} | null;

export type EarningsSignal = {
  value: number;
  pct_change: number;
  year_last: number;
  source: string;
} | null;

export type MatchResult = {
  rank: number;
  isco_4_code: string;
  isco_4_label: string;
  fit_score: number;
  avg_green_share: number;
  avg_share_digital: number;
  skill_gaps: string[];
  signals: {
    employment_growth: EmploymentSignal;
    earnings_level: EarningsSignal;
  };
};

export type SkillClaim = {
  "@type": string;
  "@id"?: string;
  "passport:localLabel": string;
  "skos:prefLabel": string;
  "passport:confidence": number;
  "passport:isResolved": boolean;
  "passport:skillType": string;
  "esco:iscoCode"?: string;
};

export type JsonLdPassport = {
  "@context": Record<string, string>;
  "@type": string;
  "@id": string;
  "passport:schemaVersion": string;
  "passport:issuedAt": string;
  "passport:country": string;
  "passport:locale": string;
  "passport:skillClaims": SkillClaim[];
};

export type SectorRow = {
  isco_2_code: string;
  isco_2_label: string;
  employment_thousands_last: number;
  employment_pct_change: number;
  earnings_value_last: number | null;
  avg_green_share: number;
};

export type MarketData = {
  country_code: string;
  country_name: string;
  employment_year_last: number;
  earnings_year_last: number;
  total_employment_thousands: number;
  sector_employment: SectorRow[];
};

export type Country = {
  code: string;
  name: string;
};

export type CountryKPI = {
  country_iso3: string;
  country_label: string;
  total_workers_k: number;
  workers_delta_pct: number;
  workers_year_first: number;
  workers_year_last: number;
  avg_earnings: number;
  earnings_currency: string;
  earnings_delta_pct: number;
  earnings_year_first: number;
  earnings_year_last: number;
  avg_green_share_pct: number;
};

export type TopMoverEntry = {
  rank: number;
  isco_1_code: string;
  isco_1_label: string;
  pct_change: number;
  year_first: number;
  year_last: number;
  workers_thousands: number | null;
};

export type TopEarnerEntry = TopMoverEntry & {
  earnings_value_last: number;
  earnings_currency: string;
};

export type CountryTopMovers = {
  country_iso3: string;
  country_label: string;
  top_employment_growth_majors: TopMoverEntry[];
  top_earnings_growth_majors: TopEarnerEntry[];
};
