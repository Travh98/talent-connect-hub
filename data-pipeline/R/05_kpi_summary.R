# =============================================================================
# UNMAPPED - KPI summary (one row per country, 5 dashboard tiles)
# Path B: levels + per-occupation leaders. Avoids unreliable country-aggregate
# deltas that mix methodology breaks across survey years.
#
# Output: kpi_summary.csv and kpi_summary.json
# Each row carries the 5 dashboard KPI tiles for one country:
#   1. Workers (level)            -> total_workers_k + workers_year
#   2. Top growing occupation     -> name, ISCO-4, percent change
#   3. Avg earnings (level)       -> employment-weighted, with currency + year
#   4. Highest paid occupation    -> name, ISCO-4, value, currency
#   5. Top green occupation       -> name, ISCO-4, green share percent
# Run AFTER Unmapped_DashboardIsco4_v1.R.
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(readr)
  library(tibble)
})

OUT_DIR <- "/Users/robertoguizar/Documents/CLAUDE COWORK/CLAUDE OUTPUTS/UNMAPPED-WB-Hackathon-24h"

# Hardcoded currency map. Extend when adding countries.
CURRENCY_MAP <- tribble(
  ~country_iso3, ~earnings_currency,
  "GHA",         "GHS",
  "KEN",         "KES",
  "IND",         "INR",
  "BGD",         "BDT"
)

# Mode helper: returns the most frequent value, used to pick a representative year.
modal_year <- function(x) {
  x <- x[!is.na(x)]
  if (!length(x)) return(NA_integer_)
  tab <- sort(table(x), decreasing = TRUE)
  as.integer(names(tab)[1])
}

# ---- 1. Load source --------------------------------------------------------

src_path <- file.path(OUT_DIR, "dashboard_simple_isco4.csv")
df <- read_csv(src_path, show_col_types = FALSE) |>
  left_join(CURRENCY_MAP, by = "country_iso3")

# ---- 2. Tile 1: Workers level + representative year ------------------------

tile_workers <- df |>
  filter(is_isco2_anchor) |>
  group_by(country_iso3, country_label) |>
  summarise(
    workers_total_k = round(sum(employment_thousands_last, na.rm = TRUE), 0),
    workers_year    = modal_year(employment_year_last),
    .groups = "drop"
  )

# ---- 3. Tile 3: Avg earnings (employment-weighted) + year + currency -------

tile_earnings <- df |>
  filter(is_isco2_anchor) |>
  group_by(country_iso3, earnings_currency) |>
  summarise(
    earnings_num   = sum(earnings_value_last * employment_thousands_last, na.rm = TRUE),
    earnings_den   = sum(employment_thousands_last[!is.na(earnings_value_last)], na.rm = TRUE),
    earnings_year  = modal_year(earnings_year_last),
    .groups = "drop"
  ) |>
  mutate(
    avg_earnings = ifelse(earnings_den > 0,
                          round(earnings_num / earnings_den, 0),
                          NA_real_)
  ) |>
  select(country_iso3, avg_earnings, earnings_currency, earnings_year)

# ---- 4. Tile 2: Top growing occupation per country -------------------------
# Filter out implausible deltas (|change| > 200%) likely caused by survey breaks.

tile_top_growing <- df |>
  filter(!is.na(employment_pct_change),
         abs(employment_pct_change) <= 2.0) |>
  group_by(country_iso3) |>
  slice_max(employment_pct_change, n = 1, with_ties = FALSE) |>
  ungroup() |>
  transmute(
    country_iso3,
    top_growing_occupation = isco_4_label,
    top_growing_isco4      = isco_4_code,
    top_growing_pct        = round(employment_pct_change * 100, 1)
  )

# ---- 5. Tile 4: Highest paid occupation per country ------------------------

tile_top_paid <- df |>
  filter(!is.na(earnings_value_last)) |>
  group_by(country_iso3) |>
  slice_max(earnings_value_last, n = 1, with_ties = FALSE) |>
  ungroup() |>
  transmute(
    country_iso3,
    top_paid_occupation = isco_4_label,
    top_paid_isco4      = isco_4_code,
    top_paid_value      = round(earnings_value_last, 0)
  )

# ---- 6. Tile 5: Top green occupation per country ---------------------------
# Note: avg_green_share is country-agnostic at ISCO-3. The "top" for any country
# is whichever ISCO-4 has the highest green share. Same global occupation will
# top every country, but it is still the honest answer.

tile_top_green <- df |>
  filter(!is.na(avg_green_share)) |>
  group_by(country_iso3) |>
  slice_max(avg_green_share, n = 1, with_ties = FALSE) |>
  ungroup() |>
  transmute(
    country_iso3,
    top_green_occupation = isco_4_label,
    top_green_isco4      = isco_4_code,
    top_green_pct        = round(avg_green_share * 100, 1)
  )

# ---- 7. Assemble ------------------------------------------------------------

kpi_summary <- tile_workers |>
  left_join(tile_top_growing, by = "country_iso3") |>
  left_join(tile_earnings,    by = "country_iso3") |>
  left_join(tile_top_paid,    by = "country_iso3") |>
  left_join(tile_top_green,   by = "country_iso3") |>
  arrange(country_iso3) |>
  select(
    country_iso3, country_label,
    # Tile 1
    workers_total_k, workers_year,
    # Tile 2
    top_growing_occupation, top_growing_isco4, top_growing_pct,
    # Tile 3
    avg_earnings, earnings_currency, earnings_year,
    # Tile 4
    top_paid_occupation, top_paid_isco4, top_paid_value,
    # Tile 5
    top_green_occupation, top_green_isco4, top_green_pct
  )

# ---- 8. Sanity + write ------------------------------------------------------

cat(sprintf("kpi_summary: %s rows x %s cols\n", nrow(kpi_summary), ncol(kpi_summary)))
print(as.data.frame(kpi_summary))

csv_path  <- file.path(OUT_DIR, "kpi_summary.csv")
json_path <- file.path(OUT_DIR, "kpi_summary.json")

write_csv(kpi_summary, csv_path)
cat(sprintf("\nWritten: %s\n", csv_path))

if (requireNamespace("jsonlite", quietly = TRUE)) {
  jsonlite::write_json(kpi_summary, json_path, pretty = TRUE, auto_unbox = TRUE)
  cat(sprintf("Written: %s\n", json_path))
}
