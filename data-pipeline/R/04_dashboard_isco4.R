# =============================================================================
# UNMAPPED - ISCO-4 multi-country dashboard table
# Output: dashboard_simple_isco4.csv
#   ~426 ISCO-4 codes  x  4 countries  =  ~1,704 rows
# Each row carries:
#   - country
#   - ISCO-4 group (real job title, e.g., "Software developers")
#   - parent ISCO-2 + ISCO-3 codes/labels for navigation
#   - ESCO aggregates from child occupations: top 10 skills, green/digital/transversal averages
#   - ILO signals replicated from native level (employment ISCO-2, earnings ISCO-1)
#   - is_isco2_anchor flag (TRUE for one ISCO-4 row per ISCO-2 x country) for safe sums
# Run AFTER Unmapped_DataLoader_v1.R, EscoLong, EscoOccupation.
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(stringr)
  library(readr)
  library(tidyr)
  library(purrr)
})

OUT_DIR <- "/Users/robertoguizar/Documents/CLAUDE COWORK/CLAUDE OUTPUTS/UNMAPPED-WB-Hackathon-24h"

YEAR_FLOOR <- 2013

COUNTRIES <- tribble(
  ~country_iso3, ~country_label,
  "GHA",         "Ghana",
  "KEN",         "Kenya",
  "IND",         "India",
  "BGD",         "Bangladesh"
)

# ---- 0. Inputs --------------------------------------------------------------

if (!exists("unmapped_data")) stop("Run Unmapped_DataLoader_v1.R first.")

if (!exists("esco_occupation")) {
  esco_occupation <- read_csv(file.path(OUT_DIR, "esco_occupation.csv"),
                              show_col_types = FALSE)
}
if (!exists("esco_long")) {
  esco_long <- read_csv(file.path(OUT_DIR, "esco_long.csv"),
                        show_col_types = FALSE)
}

emp_global  <- unmapped_data$ilo$employment_global
earn_global <- unmapped_data$ilo$earnings_global

# ---- 1. ESCO summary at ISCO-4 (country-agnostic) ---------------------------

esco_isco4 <- esco_occupation |>
  group_by(isco_4_code, isco_4_label,
           isco_3_code, isco_3_label,
           isco_2_code, isco_2_label) |>
  summarise(
    n_occupations         = n(),
    avg_green_share       = mean(green_share, na.rm = TRUE),
    avg_share_digital     = mean(share_digital, na.rm = TRUE),
    avg_share_transversal = mean(share_transversal, na.rm = TRUE),
    .groups = "drop"
  )

# Top 10 essential skills per ISCO-4, ranked by frequency across child occupations.
top_skills_isco4 <- esco_long |>
  filter(relation_type == "essential") |>
  count(isco_4_code, skill_label, sort = TRUE) |>
  group_by(isco_4_code) |>
  slice_head(n = 10) |>
  summarise(
    top_essential_skills = paste(skill_label, collapse = "; "),
    .groups = "drop"
  )

# ---- 2. Per-country ILO signals --------------------------------------------

endpoint_delta <- function(df, group_col) {
  df |>
    arrange(.data[[group_col]], time) |>
    group_by(.data[[group_col]]) |>
    summarise(
      year_first  = first(time),
      value_first = first(value),
      year_last   = last(time),
      value_last  = last(value),
      n_years     = n_distinct(time),
      .groups     = "drop"
    ) |>
    mutate(
      years_span = year_last - year_first,
      pct_change = ifelse(value_first > 0, (value_last - value_first) / value_first, NA_real_)
    )
}

ilo_signals_for_country <- function(iso3, label) {

  emp <- emp_global |>
    filter(ref_area_label == label,
           sex_label == "Total",
           !is.na(obs_value),
           time >= YEAR_FLOOR) |>
    mutate(isco_2_code = str_match(classif1_label, ":\\s*(\\d{2})\\s*-")[, 2]) |>
    filter(!is.na(isco_2_code)) |>
    transmute(isco_2_code, time, value = obs_value)

  emp_endpoints <- if (nrow(emp) > 0) {
    endpoint_delta(emp, "isco_2_code") |>
      rename(employment_year_first      = year_first,
             employment_thousands_first = value_first,
             employment_year_last       = year_last,
             employment_thousands_last  = value_last,
             employment_n_years         = n_years,
             employment_years_span      = years_span,
             employment_pct_change      = pct_change)
  } else tibble(isco_2_code = character())

  earn <- earn_global |>
    filter(ref_area == iso3,
           !is.na(obs_value),
           time >= YEAR_FLOOR,
           str_detect(classif1, "^OCU_ISCO08_\\d$"))

  if ("sex" %in% names(earn))           earn <- earn |> filter(sex == "SEX_T")
  else if ("classif2" %in% names(earn)) earn <- earn |> filter(classif2 == "SEX_T")

  earn <- earn |>
    mutate(isco_1_code = str_match(classif1, "^OCU_ISCO08_(\\d)$")[, 2]) |>
    transmute(isco_1_code, time, value = obs_value)

  earn_endpoints <- if (nrow(earn) > 0) {
    endpoint_delta(earn, "isco_1_code") |>
      rename(earnings_year_first  = year_first,
             earnings_value_first = value_first,
             earnings_year_last   = year_last,
             earnings_value_last  = value_last,
             earnings_n_years     = n_years,
             earnings_years_span  = years_span,
             earnings_pct_change  = pct_change)
  } else tibble(isco_1_code = character())

  list(emp = emp_endpoints, earn = earn_endpoints,
       country_iso3 = iso3, country_label = label)
}

per_country <- map(seq_len(nrow(COUNTRIES)), ~{
  ilo_signals_for_country(COUNTRIES$country_iso3[.x], COUNTRIES$country_label[.x])
})
names(per_country) <- COUNTRIES$country_iso3

cat("Per-country ILO signal coverage:\n")
walk(per_country, function(x) {
  cat(sprintf("  %s (%s): %s ISCO-2 employment rows, %s ISCO-1 earnings rows\n",
              x$country_label, x$country_iso3, nrow(x$emp), nrow(x$earn)))
})

# ---- 3. Cross-join countries x ISCO-4, replicate signals down --------------

base <- COUNTRIES |>
  cross_join(esco_isco4) |>
  left_join(top_skills_isco4, by = "isco_4_code") |>
  mutate(isco_1_code = str_sub(isco_2_code, 1, 1))

# Bring ILO signals onto each (country, ISCO-4) row.
attach_signals <- function(df, iso3) {
  pc <- per_country[[iso3]]
  df |>
    left_join(pc$emp,  by = "isco_2_code") |>
    left_join(pc$earn, by = "isco_1_code")
}

dashboard_isco4 <- base |>
  group_split(country_iso3) |>
  map_dfr(~attach_signals(.x, unique(.x$country_iso3)))

# Anchor flag: the first ISCO-4 row inside each (country, ISCO-2) carries the
# canonical, summable employment number. The rest are display copies.
dashboard_isco4 <- dashboard_isco4 |>
  arrange(country_iso3, isco_2_code, isco_4_code) |>
  group_by(country_iso3, isco_2_code) |>
  mutate(is_isco2_anchor = row_number() == 1) |>
  ungroup() |>
  select(
    country_iso3, country_label,
    isco_2_code, isco_2_label,
    isco_3_code, isco_3_label,
    isco_4_code, isco_4_label,
    n_occupations,
    avg_green_share, avg_share_digital, avg_share_transversal,
    top_essential_skills,
    employment_year_first, employment_thousands_first,
    employment_year_last,  employment_thousands_last,
    employment_pct_change,
    earnings_year_first, earnings_value_first,
    earnings_year_last,  earnings_value_last,
    earnings_pct_change,
    is_isco2_anchor
  )

# ---- 4. Sanity + write ------------------------------------------------------

cat(sprintf("\ndashboard_isco4: %s rows x %s cols\n",
            nrow(dashboard_isco4), ncol(dashboard_isco4)))

cat("\nCoverage by country (ISCO-4 grain):\n")
print(
  dashboard_isco4 |>
    group_by(country_iso3) |>
    summarise(
      isco4_rows               = n(),
      with_employment_level    = sum(!is.na(employment_thousands_last)),
      with_employment_delta    = sum(!is.na(employment_pct_change)),
      with_earnings_level      = sum(!is.na(earnings_value_last)),
      with_earnings_delta      = sum(!is.na(earnings_pct_change)),
      anchor_rows              = sum(is_isco2_anchor),
      .groups = "drop"
    )
)

cat("\nSanity: country employment using anchors only\n")
print(
  dashboard_isco4 |>
    filter(is_isco2_anchor) |>
    group_by(country_iso3, country_label) |>
    summarise(total_emp_thousands = round(sum(employment_thousands_last, na.rm = TRUE), 1),
              .groups = "drop")
)

out_path <- file.path(OUT_DIR, "dashboard_simple_isco4.csv")
write_csv(dashboard_isco4, out_path)
cat(sprintf("\nWritten: %s\n", out_path))

head(dashboard_isco4, 5) |> as.data.frame()
