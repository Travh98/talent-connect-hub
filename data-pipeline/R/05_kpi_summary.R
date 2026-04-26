# =============================================================================
# UNMAPPED - KPI summary
# Outputs:
#   kpi_summary.csv   - 4 rows (one per country), 11 columns:
#                       country, total workers, workers delta + dates,
#                       avg earnings + currency, earnings delta + dates.
#   kpi_summary.json  - same data, nested by country code.
#   top_movers.json   - top 5 ISCO-1 majors by employment growth and by
#                       earnings growth, per country.
# Run AFTER Unmapped_DashboardIsco4_v1.R.
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(readr)
  library(tibble)
  library(stringr)
})

OUT_DIR <- "/Users/robertoguizar/Documents/CLAUDE COWORK/CLAUDE OUTPUTS/UNMAPPED-WB-Hackathon-24h"

CURRENCY_MAP <- tribble(
  ~country_iso3, ~earnings_currency,
  "GHA",         "GHS",
  "KEN",         "KES",
  "IND",         "INR",
  "BGD",         "BDT"
)

ISCO_1_LABELS <- tribble(
  ~isco_1_code, ~isco_1_label,
  "0",          "Armed forces occupations",
  "1",          "Managers",
  "2",          "Professionals",
  "3",          "Technicians and associate professionals",
  "4",          "Clerical support workers",
  "5",          "Service and sales workers",
  "6",          "Skilled agricultural, forestry and fishery workers",
  "7",          "Craft and related trades workers",
  "8",          "Plant and machine operators, and assemblers",
  "9",          "Elementary occupations"
)

EMP_DELTA_CAP  <- 2.0   # |200%|
EARN_DELTA_CAP <- 5.0   # |500%|

# ---- Load ------------------------------------------------------------------

src_path <- file.path(OUT_DIR, "dashboard_simple_isco4.csv")
df <- read_csv(src_path, show_col_types = FALSE) |>
  left_join(CURRENCY_MAP, by = "country_iso3") |>
  mutate(isco_1_code = str_sub(isco_2_code, 1, 1))

# =============================================================================
# A. Flat KPI summary - 11 columns, 4 rows.
# Workers delta uses the sum-of-endpoints across anchors (Path A).
# Earnings delta uses the employment-weighted average across anchors.
# =============================================================================

anchor_aggs <- df |>
  filter(is_isco2_anchor) |>
  group_by(country_iso3, country_label, earnings_currency) |>
  summarise(
    total_workers_k        = sum(employment_thousands_last,  na.rm = TRUE),
    total_workers_first_k  = sum(employment_thousands_first, na.rm = TRUE),
    workers_year_first     = suppressWarnings(min(employment_year_first, na.rm = TRUE)),
    workers_year_last      = suppressWarnings(max(employment_year_last,  na.rm = TRUE)),

    earnings_num_last      = sum(earnings_value_last  * employment_thousands_last,  na.rm = TRUE),
    earnings_num_first     = sum(earnings_value_first * employment_thousands_first, na.rm = TRUE),
    earnings_year_first    = suppressWarnings(min(earnings_year_first, na.rm = TRUE)),
    earnings_year_last     = suppressWarnings(max(earnings_year_last,  na.rm = TRUE)),
    .groups = "drop"
  )

kpi_summary <- anchor_aggs |>
  mutate(
    avg_earnings        = ifelse(total_workers_k > 0,
                                 round(earnings_num_last / total_workers_k, 0),
                                 NA_real_),
    avg_earnings_first  = ifelse(total_workers_first_k > 0,
                                 round(earnings_num_first / total_workers_first_k, 0),
                                 NA_real_),
    workers_delta_pct   = ifelse(total_workers_first_k > 0,
                                 round((total_workers_k - total_workers_first_k) /
                                         total_workers_first_k * 100, 1),
                                 NA_real_),
    earnings_delta_pct  = ifelse(!is.na(avg_earnings_first) & avg_earnings_first > 0,
                                 round((avg_earnings - avg_earnings_first) /
                                         avg_earnings_first * 100, 1),
                                 NA_real_),
    total_workers_k     = round(total_workers_k, 0)
  ) |>
  select(
    country_iso3, country_label,
    total_workers_k,
    workers_delta_pct, workers_year_first, workers_year_last,
    avg_earnings, earnings_currency,
    earnings_delta_pct, earnings_year_first, earnings_year_last
  ) |>
  arrange(country_iso3)

# =============================================================================
# B. Top 5 ISCO-1 majors by employment growth per country
# Aggregate ISCO-2 anchors up to ISCO-1, then compute the sum-based delta.
# =============================================================================

top_emp_majors <- df |>
  filter(is_isco2_anchor,
         !is.na(employment_thousands_first),
         !is.na(employment_thousands_last)) |>
  group_by(country_iso3, country_label, isco_1_code) |>
  summarise(
    sum_first  = sum(employment_thousands_first, na.rm = TRUE),
    sum_last   = sum(employment_thousands_last,  na.rm = TRUE),
    year_first = suppressWarnings(min(employment_year_first, na.rm = TRUE)),
    year_last  = suppressWarnings(max(employment_year_last,  na.rm = TRUE)),
    .groups = "drop"
  ) |>
  filter(sum_first > 0) |>
  mutate(pct_change = (sum_last - sum_first) / sum_first) |>
  filter(abs(pct_change) <= EMP_DELTA_CAP) |>
  group_by(country_iso3) |>
  slice_max(pct_change, n = 5, with_ties = FALSE) |>
  mutate(rank = row_number(desc(pct_change))) |>
  ungroup() |>
  left_join(ISCO_1_LABELS, by = "isco_1_code") |>
  transmute(
    country_iso3, country_label,
    rank,
    isco_1_code, isco_1_label,
    pct_change           = round(pct_change * 100, 1),
    year_first, year_last,
    workers_thousands    = round(sum_last, 0)
  ) |>
  arrange(country_iso3, rank)

# =============================================================================
# C. Top 5 ISCO-1 majors by earnings growth per country
# Earnings native at ISCO-1; dedupe to one row per (country, ISCO-1).
# =============================================================================

top_earn_majors <- df |>
  filter(is_isco2_anchor,
         !is.na(earnings_pct_change)) |>
  distinct(country_iso3, country_label, isco_1_code,
           earnings_pct_change, earnings_year_first, earnings_year_last,
           earnings_value_last, earnings_currency) |>
  filter(abs(earnings_pct_change) <= EARN_DELTA_CAP) |>
  group_by(country_iso3) |>
  slice_max(earnings_pct_change, n = 5, with_ties = FALSE) |>
  mutate(rank = row_number(desc(earnings_pct_change))) |>
  ungroup() |>
  left_join(ISCO_1_LABELS, by = "isco_1_code") |>
  transmute(
    country_iso3, country_label,
    rank,
    isco_1_code, isco_1_label,
    pct_change           = round(earnings_pct_change * 100, 1),
    year_first           = earnings_year_first,
    year_last            = earnings_year_last,
    earnings_value_last  = round(earnings_value_last, 0),
    earnings_currency
  ) |>
  arrange(country_iso3, rank)

# =============================================================================
# D. Sanity + write
# =============================================================================

cat(sprintf("kpi_summary:    %s rows x %s cols\n", nrow(kpi_summary), ncol(kpi_summary)))
print(as.data.frame(kpi_summary))

cat(sprintf("\ntop_emp_majors:   %s rows\n", nrow(top_emp_majors)))
print(as.data.frame(top_emp_majors |> select(country_iso3, rank, isco_1_label, pct_change)))

cat(sprintf("\ntop_earn_majors:  %s rows\n", nrow(top_earn_majors)))
print(as.data.frame(top_earn_majors |> select(country_iso3, rank, isco_1_label, pct_change)))

# CSV
write_csv(kpi_summary, file.path(OUT_DIR, "kpi_summary.csv"))
cat(sprintf("\nWritten: %s\n", file.path(OUT_DIR, "kpi_summary.csv")))

# JSON outputs
if (requireNamespace("jsonlite", quietly = TRUE)) {
  countries <- sort(unique(kpi_summary$country_iso3))

  # File 1: kpi_summary.json - nested by country code, 11 fields each.
  kpi_nested <- lapply(countries, function(iso3) {
    as.list(kpi_summary[kpi_summary$country_iso3 == iso3, ])
  })
  names(kpi_nested) <- countries
  jsonlite::write_json(kpi_nested,
                       file.path(OUT_DIR, "kpi_summary.json"),
                       pretty = TRUE, auto_unbox = TRUE)
  cat(sprintf("Written: %s\n", file.path(OUT_DIR, "kpi_summary.json")))

  # File 2: top_movers.json - 5 emp + 5 earnings ISCO-1 majors per country.
  movers_nested <- lapply(countries, function(iso3) {
    list(
      country_iso3  = iso3,
      country_label = kpi_summary$country_label[kpi_summary$country_iso3 == iso3],
      top_employment_growth_majors = top_emp_majors[top_emp_majors$country_iso3 == iso3, ],
      top_earnings_growth_majors   = top_earn_majors[top_earn_majors$country_iso3 == iso3, ]
    )
  })
  names(movers_nested) <- countries
  jsonlite::write_json(movers_nested,
                       file.path(OUT_DIR, "top_movers.json"),
                       pretty = TRUE, auto_unbox = TRUE)
  cat(sprintf("Written: %s\n", file.path(OUT_DIR, "top_movers.json")))
}
