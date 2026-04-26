# Data pipeline (UNMAPPED, World Bank Youth Summit)

R pipeline that turns ESCO taxonomy and ILOSTAT labour data into two dashboard-ready outputs for four countries: Ghana, Kenya, India, Bangladesh.

## What this produces

`data/outputs/dashboard_simple_isco4.csv` — main grid data, 1,704 rows.
- 4 countries × ~426 ISCO-4 codes (real job titles like "Software developers", "Nursing professionals").
- Per row: country, ISCO 2/3/4 codes and labels, top 10 essential skills, average green/digital/transversal skill shares, employment level + 2-point delta, earnings level + 2-point delta, an `is_isco2_anchor` flag for safe rollups.

`data/outputs/kpi_summary.csv` and `kpi_summary.json` — 4 rows, one per country.
- 5 dashboard KPI tiles per country: workers level, top growing occupation, average earnings (employment-weighted, with currency), highest paid occupation, top green occupation.
- Trace-back columns include the ISCO-4 code that backs each leader claim.

## Run order

1. `R/01_data_loader.R` — loads ESCO + global ILOSTAT bulk data into memory.
2. `R/02_esco_long.R` — produces `esco_long.csv` (~126K rows, occupation × skill, gitignored).
3. `R/03_esco_occupation.R` — produces `esco_occupation.csv` (3,039 rows, gitignored).
4. `R/04_dashboard_isco4.R` — produces `dashboard_simple_isco4.csv` (1,704 rows).
5. `R/05_kpi_summary.R` — produces `kpi_summary.csv` and `.json` (4 rows).

Run scripts in order. Each one assumes the previous is already in memory.

## Required raw data (not committed)

Place these files under `data/raw/` before running the pipeline. See `data/raw/README.md` for download links.

- `EAR_EMTA_SEX_OCU_NB_A_full.csv.gz` (ILOSTAT bulk earnings, multi-year, all countries)
- `EMP_TEMP_SEX_OC2_NB_A.csv` (ILOSTAT bulk employment, multi-year, all countries)
- `Esco/ESCO/` (core ESCO files: occupations, skills, ISCOGroups, occupationSkillRelations)
- `Esco/ESCO dataset - v1.2.1 - classification - en - csv/` (extended ESCO files: hierarchy, green share, digital, transversal)

## Scripts use absolute paths

The current scripts use absolute paths to a local `CLAUDE COWORK` folder. Before running on another machine, edit the `ROOT` and `OUT_DIR` constants near the top of each script. Refactor to relative paths is on the to-do list.

## Country switch

Module is country-agnostic by design. To swap or add countries:

- For per-country signals (script 01): change `COUNTRY_ISO3` and `COUNTRY_LABEL` at the top of `01_data_loader.R`.
- For the multi-country tables (scripts 04 and 05): edit the `COUNTRIES` tribble at the top of each script.

## Two econometric signals on the cards

Each ISCO-4 row carries two real signals:

1. Employment percent change (per ISCO-2, 2-point endpoint delta, post-2013).
2. Earnings percent change (per ISCO-1, 2-point endpoint delta, post-2013, replicated to ISCO-2).

Plus a third descriptive index from ESCO: green skills share per occupation.

## KPI methodology (Path B)

Country-aggregate deltas were dropped because 2 of 4 countries have ILO methodology breaks within the post-2013 window. Per-occupation deltas remain reliable. The 5 KPI tiles use levels and per-occupation leaders only.

- Tile 1, workers level: anchor sum of latest-year employment per ISCO-2.
- Tile 2, top growing: ISCO-4 occupation with the highest employment_pct_change, filtered to |change| <= 200% to drop survey artefacts.
- Tile 3, avg earnings: employment-weighted across anchors. Currency from a hardcoded ISO3 to local currency map.
- Tile 4, top paid: ISCO-4 with the highest earnings_value_last.
- Tile 5, top green: ISCO-4 with the highest avg_green_share. Same global occupation will likely top every country because ESCO green share is country-agnostic. Documented limit.

## Known limits

- Employment is native at ISCO-2; replicated down to ISCO-4 children. Use `is_isco2_anchor` for country rollups.
- Earnings is native at ISCO-1; same replication caveat at ISCO-2.
- Green share is native at ISCO-3 in ESCO, replicated down. Country-agnostic.
- Year ranges differ by country. Ghana employment 2013-2017. India 2010-2024. Bangladesh 2013-2024. Kenya 2005-2019 (treat earnings as level only).
- 1-23 ISCO-4 rows per country lack employment data due to ILO survey gaps.
- Pre-2013 data excluded to avoid mixing ISCO-88 and ISCO-08 classifications.
- Earnings values are nominal local currency, not inflation-adjusted.

## Sources

- ESCO v1.2.1, English. https://esco.ec.europa.eu/en/use-esco/download
- ILOSTAT bulk endpoint pattern: `https://rplumber.ilo.org/data/indicator/?id=<CODE>&format=.csv.gz`
