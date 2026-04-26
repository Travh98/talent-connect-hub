# =============================================================================
# UNMAPPED - World Bank Youth Summit
# Data loader: ESCO taxonomy + ILOSTAT employment / earnings
# Country-agnostic by design. Switch COUNTRY_ISO3 to reconfigure.
# =============================================================================

# ---- 0. Setup ---------------------------------------------------------------

# Install missing packages once. Comment out after first run.
needed <- c("readr", "dplyr", "stringr", "fs", "janitor")
to_get <- setdiff(needed, rownames(installed.packages()))
if (length(to_get)) install.packages(to_get)

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(stringr)
  library(fs)
  library(janitor)
})

# ---- 1. Parameters ----------------------------------------------------------
# Edit these two lines to reconfigure to a different country.

COUNTRY_ISO3 <- "GHA"          # primary country: GHA, KEN, IND, BGD, GBR
COUNTRY_LABEL <- "Ghana"        # human-readable label for filters

# Root folder. Adjust to your local clone if needed.
ROOT <- "/Users/robertoguizar/Documents/CLAUDE COWORK/04252026_NATIONHACK"

ESCO_CORE_DIR <- file.path(ROOT, "Esco", "ESCO")
ESCO_FULL_DIR <- file.path(
  ROOT, "Esco", "ESCO dataset - v1.2.1 - classification - en - csv"
)
ILO_DIR <- file.path(ROOT, "ILOSTAT")

# Sanity check.
stopifnot(dir.exists(ESCO_CORE_DIR), dir.exists(ESCO_FULL_DIR), dir.exists(ILO_DIR))

# ---- 2. ESCO core (occupations, skills, ISCO crosswalk) ---------------------

read_csv_clean <- function(path) {
  readr::read_csv(path, show_col_types = FALSE, progress = FALSE) |>
    janitor::clean_names()
}

esco_occupations    <- read_csv_clean(file.path(ESCO_CORE_DIR, "occupations_en.csv"))
esco_skills         <- read_csv_clean(file.path(ESCO_CORE_DIR, "skills_en.csv"))
esco_isco_groups    <- read_csv_clean(file.path(ESCO_CORE_DIR, "ISCOGroups_en.csv"))
esco_occ_skill_rel  <- read_csv_clean(file.path(ESCO_CORE_DIR, "occupationSkillRelations_en.csv"))

# ---- 3. ESCO extended (hierarchies, green share, transversal, digital) ------

esco_skills_hierarchy <- read_csv_clean(file.path(ESCO_FULL_DIR, "skillsHierarchy_en.csv"))
esco_green_share_occ  <- read_csv_clean(file.path(ESCO_FULL_DIR, "greenShareOcc_en.csv"))
esco_digital_skills   <- read_csv_clean(file.path(ESCO_FULL_DIR, "digitalSkillsCollection_en.csv"))
esco_transversal      <- read_csv_clean(file.path(ESCO_FULL_DIR, "transversalSkillsCollection_en.csv"))
esco_skill_groups     <- read_csv_clean(file.path(ESCO_FULL_DIR, "skillGroups_en.csv"))
esco_skill_skill_rel  <- read_csv_clean(file.path(ESCO_FULL_DIR, "broaderRelationsSkillPillar_en.csv"))
esco_occ_broader      <- read_csv_clean(file.path(ESCO_FULL_DIR, "broaderRelationsOccPillar_en.csv"))

# ---- 4. ILOSTAT ------------------------------------------------------------
# Two files in this folder:
#   EMP_TEMP_SEX_OC2_NB_A-*.csv  -> employment by sex and occupation (ISCO-08, 2-digit)
#   EAR_EMTA_SEX_OCU_NB_A_*.csv  -> mean earnings by occupation (ISCO-08, 1-digit)

ilo_emp_path  <- dir_ls(ILO_DIR, glob = "*EMP_TEMP_SEX_OC2*.csv")[1]

# Prefer the multi-year bulk file. Fall back to latest-year if missing.
ilo_earn_full_path  <- dir_ls(ILO_DIR, glob = "*EAR_EMTA*full*.csv.gz")[1]
ilo_earn_short_path <- dir_ls(ILO_DIR, glob = "*EAR_EMTA*latest_year*.csv")[1]
ilo_earn_path <- if (!is.na(ilo_earn_full_path)) ilo_earn_full_path else ilo_earn_short_path

# Employment file uses *.label headers and is ~60 MB. Read fast, then filter.
ilo_employment_all <- readr::read_csv(
  ilo_emp_path,
  show_col_types = FALSE,
  progress = FALSE
) |> janitor::clean_names()

ilo_earnings_all <- readr::read_csv(
  ilo_earn_path,
  show_col_types = FALSE,
  progress = FALSE
) |> janitor::clean_names()

# ---- 5. Country filter (the reconfiguration knob) ---------------------------
# Earnings file uses ref_area (ISO3). Employment file uses ref_area_label (name).
# We support both.

ilo_employment <- ilo_employment_all |>
  filter(
    str_detect(ref_area_label, regex(COUNTRY_LABEL, ignore_case = TRUE))
  )

ilo_earnings <- ilo_earnings_all |>
  filter(ref_area == COUNTRY_ISO3)   # bulk file has only `ref_area` (ISO3), not the label column

# ---- 6. Quick sanity output -------------------------------------------------

cat("ESCO loaded:\n")
cat(sprintf("  occupations:            %s rows\n",  nrow(esco_occupations)))
cat(sprintf("  skills:                 %s rows\n",  nrow(esco_skills)))
cat(sprintf("  ISCO groups:            %s rows\n",  nrow(esco_isco_groups)))
cat(sprintf("  occ-skill relations:    %s rows\n",  nrow(esco_occ_skill_rel)))
cat(sprintf("  skills hierarchy:       %s rows\n",  nrow(esco_skills_hierarchy)))
cat(sprintf("  green share by occ:     %s rows\n",  nrow(esco_green_share_occ)))

cat(sprintf("\nILOSTAT loaded for %s (%s):\n", COUNTRY_LABEL, COUNTRY_ISO3))
cat(sprintf("  employment rows:        %s\n", nrow(ilo_employment)))
cat(sprintf("  earnings rows:          %s\n", nrow(ilo_earnings)))

# ---- 7. Bundle into a single object for downstream modules ------------------

unmapped_data <- list(
  meta = list(
    country_iso3  = COUNTRY_ISO3,
    country_label = COUNTRY_LABEL,
    loaded_at     = Sys.time()
  ),
  esco = list(
    occupations         = esco_occupations,
    skills              = esco_skills,
    isco_groups         = esco_isco_groups,
    occ_skill_relations = esco_occ_skill_rel,
    skills_hierarchy    = esco_skills_hierarchy,
    green_share_occ     = esco_green_share_occ,
    digital_skills      = esco_digital_skills,
    transversal_skills  = esco_transversal,
    skill_groups        = esco_skill_groups,
    skill_skill_rel     = esco_skill_skill_rel,
    occ_broader         = esco_occ_broader
  ),
  ilo = list(
    employment_country  = ilo_employment,
    earnings_country    = ilo_earnings,
    employment_global   = ilo_employment_all,
    earnings_global     = ilo_earnings_all
  )
)

# Optional: cache to disk to avoid re-reading 60 MB on every iteration.
# saveRDS(unmapped_data, file.path(ROOT, sprintf("unmapped_data_%s.rds", COUNTRY_ISO3)))

# Quick peek.
glimpse(unmapped_data$ilo$employment_country)
