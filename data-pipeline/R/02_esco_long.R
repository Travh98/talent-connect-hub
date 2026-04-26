# =============================================================================
# UNMAPPED - ESCO long-format builder
# Output: one row per occupation-skill pair, with descriptions and ISCO codes.
# Run AFTER Unmapped_DataLoader_v1.R. It uses unmapped_data$esco.
# =============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(stringr)
  library(readr)
})

# Safety: make sure the loader has been sourced first.
if (!exists("unmapped_data")) {
  stop("Run Unmapped_DataLoader_v1.R first to create `unmapped_data`.")
}

esco <- unmapped_data$esco

# ---- 1. Slim each table to only the columns we need -------------------------

occ_slim <- esco$occupations |>
  transmute(
    occupation_uri          = concept_uri,
    occupation_label        = preferred_label,
    occupation_description  = description,
    isco_4_code             = as.character(isco_group)
  ) |>
  distinct(occupation_uri, .keep_all = TRUE)   # collapse ESCO duplicate URIs

skill_slim <- esco$skills |>
  transmute(
    skill_uri               = concept_uri,
    skill_label             = preferred_label,
    skill_description       = description,
    skill_type              = skill_type,
    reuse_level             = reuse_level
  ) |>
  distinct(skill_uri, .keep_all = TRUE)         # collapse ESCO duplicate URIs

isco_slim <- esco$isco_groups |>
  transmute(
    isco_4_code             = as.character(code),
    isco_4_label            = preferred_label,
    isco_4_description      = description
  ) |>
  filter(nchar(isco_4_code) == 4)   # keep the 4-digit rows only

rel <- esco$occ_skill_relations |>
  transmute(
    occupation_uri          = occupation_uri,
    skill_uri               = skill_uri,
    relation_type           = relation_type    # essential / optional
  )

# Transversal skills live in their own collection, NOT in skills_en$reuse_level.
transversal_uris <- esco$transversal_skills$concept_uri |> unique()

# ---- 2. Join the chain ------------------------------------------------------

esco_long <- rel |>
  left_join(occ_slim,   by = "occupation_uri") |>
  left_join(skill_slim, by = "skill_uri") |>
  left_join(isco_slim,  by = "isco_4_code") |>
  mutate(
    isco_2_code     = str_sub(isco_4_code, 1, 2),
    is_transversal  = skill_uri %in% transversal_uris
  ) |>
  select(
    isco_2_code,
    isco_4_code,
    isco_4_label,
    occupation_label,
    occupation_description,
    skill_label,
    skill_description,
    skill_type,
    reuse_level,
    is_transversal,
    relation_type,
    occupation_uri,
    skill_uri
  ) |>
  arrange(isco_4_code, occupation_label, relation_type, skill_label)

# ---- 3. Sanity check + write -----------------------------------------------

cat(sprintf("esco_long: %s rows x %s cols\n", nrow(esco_long), ncol(esco_long)))
cat(sprintf("distinct occupations: %s\n", n_distinct(esco_long$occupation_uri)))
cat(sprintf("distinct skills:      %s\n", n_distinct(esco_long$skill_uri)))
cat(sprintf("rows missing ISCO label: %s\n",
            sum(is.na(esco_long$isco_4_label))))

out_path <- file.path(
  "/Users/robertoguizar/Documents/CLAUDE COWORK/CLAUDE OUTPUTS/UNMAPPED-WB-Hackathon-24h",
  "esco_long.csv"
)

write_csv(esco_long, out_path)
cat(sprintf("\nWritten to: %s\n", out_path))

# Quick peek.
head(esco_long, 5) |> as.data.frame()
