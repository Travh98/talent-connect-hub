# =============================================================================
# UNMAPPED - ESCO occupation-level builder
# Output: one row per ESCO occupation, with skill counts, shares, ISCO codes,
#         and the precomputed green share from ESCO.
# Run AFTER Unmapped_DataLoader_v1.R. Uses unmapped_data$esco.
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(stringr)
  library(readr)
  library(tidyr)
})

if (!exists("unmapped_data")) {
  stop("Run Unmapped_DataLoader_v1.R first to create `unmapped_data`.")
}

esco <- unmapped_data$esco

# ---- 1. Reference sets ------------------------------------------------------

transversal_uris <- esco$transversal_skills$concept_uri |> unique()
digital_uris     <- esco$digital_skills$concept_uri     |> unique()

# Green share: published at ISCO-3 group level. Key on the 3-digit code.
green_share_isco3 <- esco$green_share_occ |>
  transmute(
    isco_3_code  = str_pad(as.character(code), 3, pad = "0"),
    green_share  = green_share
  ) |>
  distinct(isco_3_code, .keep_all = TRUE)

# ISCO labels at 2-, 3-, and 4-digit levels.
isco <- esco$isco_groups |>
  transmute(
    code  = as.character(code),
    label = preferred_label
  )

isco_2 <- isco |> filter(nchar(code) == 2) |> rename(isco_2_code = code, isco_2_label = label)
isco_3 <- isco |> filter(nchar(code) == 3) |> rename(isco_3_code = code, isco_3_label = label)
isco_4 <- isco |> filter(nchar(code) == 4) |> rename(isco_4_code = code, isco_4_label = label)

# ---- 2. Occupation base frame ----------------------------------------------

occ <- esco$occupations |>
  transmute(
    occupation_uri          = concept_uri,
    occupation_label        = preferred_label,
    occupation_description  = description,
    isco_4_code             = as.character(isco_group)
  ) |>
  distinct(occupation_uri, .keep_all = TRUE) |>
  mutate(
    isco_3_code = str_sub(isco_4_code, 1, 3),
    isco_2_code = str_sub(isco_4_code, 1, 2)
  )

# ---- 3. Per-occupation skill aggregates ------------------------------------

rel <- esco$occ_skill_relations |>
  transmute(occupation_uri, skill_uri, relation_type)

# Counts.
counts <- rel |>
  group_by(occupation_uri) |>
  summarise(
    n_essential = sum(relation_type == "essential"),
    n_optional  = sum(relation_type == "optional"),
    n_total     = n(),
    .groups = "drop"
  )

# Essentials only, with flags for transversal and digital.
ess <- rel |>
  filter(relation_type == "essential") |>
  mutate(
    is_transversal = skill_uri %in% transversal_uris,
    is_digital     = skill_uri %in% digital_uris
  )

share_flags <- ess |>
  group_by(occupation_uri) |>
  summarise(
    n_essential_transversal = sum(is_transversal),
    n_essential_digital     = sum(is_digital),
    .groups = "drop"
  )

# Top 5 essential skill labels per occupation, alphabetical, comma-joined.
skill_lookup <- esco$skills |>
  distinct(concept_uri, .keep_all = TRUE) |>
  transmute(skill_uri = concept_uri, skill_label = preferred_label)

top_skills <- rel |>
  filter(relation_type == "essential") |>
  left_join(skill_lookup, by = "skill_uri") |>
  arrange(occupation_uri, skill_label) |>
  group_by(occupation_uri) |>
  summarise(
    top_essential_skills = paste(head(skill_label, 5), collapse = "; "),
    .groups = "drop"
  )

# ---- 4. Assemble the final frame -------------------------------------------

esco_occupation <- occ |>
  left_join(counts,            by = "occupation_uri") |>
  left_join(share_flags,       by = "occupation_uri") |>
  left_join(top_skills,        by = "occupation_uri") |>
  left_join(green_share_isco3, by = "isco_3_code") |>
  left_join(isco_4,            by = "isco_4_code") |>
  left_join(isco_3,            by = "isco_3_code") |>
  left_join(isco_2,            by = "isco_2_code") |>
  mutate(
    # Replace NAs from no-skill orphans with 0 so shares behave.
    n_essential             = coalesce(n_essential, 0L),
    n_optional              = coalesce(n_optional, 0L),
    n_total                 = coalesce(n_total, 0L),
    n_essential_transversal = coalesce(n_essential_transversal, 0L),
    n_essential_digital     = coalesce(n_essential_digital, 0L),
    share_transversal       = ifelse(n_essential > 0, n_essential_transversal / n_essential, NA_real_),
    share_digital           = ifelse(n_essential > 0, n_essential_digital / n_essential, NA_real_)
  ) |>
  select(
    isco_2_code, isco_2_label,
    isco_3_code, isco_3_label,
    isco_4_code, isco_4_label,
    occupation_label, occupation_description,
    n_essential, n_optional, n_total,
    n_essential_transversal, share_transversal,
    n_essential_digital,     share_digital,
    green_share,
    top_essential_skills,
    occupation_uri
  ) |>
  arrange(isco_4_code, occupation_label)

# ---- 5. Sanity output + write ----------------------------------------------

cat(sprintf("esco_occupation: %s rows x %s cols\n",
            nrow(esco_occupation), ncol(esco_occupation)))
cat(sprintf("missing isco_2_label: %s\n", sum(is.na(esco_occupation$isco_2_label))))
cat(sprintf("missing green_share:  %s of %s\n",
            sum(is.na(esco_occupation$green_share)), nrow(esco_occupation)))
cat(sprintf("median n_essential:   %s\n", median(esco_occupation$n_essential)))
cat(sprintf("median share_digital: %s\n", round(median(esco_occupation$share_digital, na.rm = TRUE), 3)))

out_path <- file.path(
  "/Users/robertoguizar/Documents/CLAUDE COWORK/CLAUDE OUTPUTS/UNMAPPED-WB-Hackathon-24h",
  "esco_occupation.csv"
)

write_csv(esco_occupation, out_path)
cat(sprintf("\nWritten to: %s\n", out_path))

head(esco_occupation, 5) |> as.data.frame()
