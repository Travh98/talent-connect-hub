import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generatePassport, runMatch } from "@/lib/api";
import type { JsonLdPassport, MatchResult, SkillClaim } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";

const EDUCATION_OPTIONS = [
  "No formal schooling",
  "Primary school (partial or complete)",
  "Lower secondary school",
  "Upper secondary / high school",
  "Vocational / technical certificate",
  "Some college / university (no degree)",
  "Bachelor's degree",
  "Master's degree or higher",
];

const WORK_TYPE_OPTIONS = [
  "Selling goods",
  "Phone / device repair",
  "Domestic work",
  "Tutoring",
  "Farming",
  "Transport",
  "Caregiving",
  "Other",
];

const TECH_SKILL_OPTIONS = [
  "Electrical repair",
  "Sewing",
  "Cooking / food prep",
  "Construction",
  "Vehicle repair",
  "Species identification",
  "Data collection",
  "Maritime safety",
  "Log / report writing",
  "Other",
];

function MultiSelect({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-3 py-1.5 text-sm border transition-all ${selected.includes(opt)
            ? "bg-foreground text-background border-foreground"
            : "border-foreground/25 hover:border-foreground"}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3 mt-2">
      {([true, false] as const).map((v) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`px-4 py-1.5 text-sm border transition-all ${value === v
            ? "bg-foreground text-background border-foreground"
            : "border-foreground/25 hover:border-foreground"}`}>
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const bars = Math.round(value * 10);
  return (
    <span className="font-mono text-xs text-muted-foreground">
      {"▇".repeat(bars)}{"░".repeat(10 - bars)} {(value).toFixed(2)}
    </span>
  );
}

function PassportCard({ passport }: { passport: JsonLdPassport }) {
  const claims = passport["passport:skillClaims"] ?? [];
  const issuedAt = new Date(passport["passport:issuedAt"]).toLocaleDateString();

  const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  return (
    <div className="bg-card border border-foreground/15 p-6 shadow-[var(--shadow-editorial)] mt-6">
      <p className="eyebrow mb-1">Skills passport · issued {issuedAt}</p>
      <div className="border-t-2 border-foreground mt-2 pt-4 space-y-2">
        {claims.map((c: SkillClaim, i: number) => (
          <div key={i} className="flex items-start justify-between gap-4 text-sm py-1 border-b border-dashed border-foreground/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground">{c["passport:isResolved"] ? "●" : "○"}</span>
              <span className={c["passport:isResolved"] ? "" : "italic text-muted-foreground"}>
                {c["passport:isResolved"]
                  ? c["skos:prefLabel"]
                  : `"${c["passport:localLabel"]}"`}
              </span>
              {c["passport:isResolved"] && (
                <Badge variant="outline" className="rounded-none text-[10px] font-mono border-foreground/30 shrink-0">
                  {c["passport:skillType"]}
                </Badge>
              )}
              {c["esco:iscoCode"] && (
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">ISCO {c["esco:iscoCode"]}</span>
              )}
            </div>
            {c["passport:isResolved"] && (
              <ConfidenceBar value={c["passport:confidence"]} />
            )}
          </div>
        ))}
      </div>
      <a href={url} download="skills-passport.jsonld.json"
        className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-accent hover:underline">
        <Download className="h-3 w-3" /> Download passport JSON-LD
      </a>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card border border-foreground/15 p-5 animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3 mb-3" />
          <div className="h-2 bg-muted rounded w-full mb-2" />
          <div className="h-2 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function MatchCard({ result }: { result: MatchResult }) {
  const { employment_growth, earnings_level } = result.signals;
  const fitBars = Math.round(result.fit_score / 10);

  return (
    <div className="bg-card border border-foreground/15 p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="font-mono text-xs text-muted-foreground">#{result.rank} · ISCO {result.isco_4_code}</span>
          <h4 className="font-serif text-lg font-semibold leading-tight">{result.isco_4_label}</h4>
        </div>
      </div>
      <div className="border-t border-foreground/15 my-3" />

      <div className="flex items-center gap-3 text-sm mb-4">
        <span className="text-muted-foreground font-mono text-xs">Fit</span>
        <span className="font-mono text-xs text-accent">
          {"▇".repeat(fitBars)}{"░".repeat(10 - fitBars)} {result.fit_score}%
        </span>
      </div>

      <div className="space-y-1.5 text-xs font-mono mb-4">
        {employment_growth ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Signal 01 · Employment growth</span>
            <span className={employment_growth.value >= 0 ? "text-teal-600" : "text-red-600"}>
              {employment_growth.value >= 0 ? "+" : ""}{employment_growth.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">(ILOSTAT, {employment_growth.year_first}–{employment_growth.year_last})</span>
          </div>
        ) : (
          <div className="text-muted-foreground italic">Employment data unavailable for this country</div>
        )}
        {earnings_level && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Signal 02 · Earnings level</span>
            <span>{earnings_level.value.toLocaleString()} USD</span>
            <span className={earnings_level.pct_change >= 0 ? "text-teal-600" : "text-red-600"}>
              {earnings_level.pct_change >= 0 ? "+" : ""}{earnings_level.pct_change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">(ILOSTAT, {earnings_level.year_last})</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 text-xs mb-4">
        {result.avg_green_share > 0.05 && (
          <span>🌿 Green share {Math.round(result.avg_green_share * 100)}%</span>
        )}
        {result.avg_share_digital > 0.10 && (
          <span>💻 Digital share {Math.round(result.avg_share_digital * 100)}%</span>
        )}
      </div>

      {result.skill_gaps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Skill gaps:</span>
          {result.skill_gaps.map((g) => (
            <Badge key={g} variant="outline" className="rounded-none text-[10px] border-foreground/30 font-normal">{g}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function assembleRawText(form: {
  country: string; education: string; age: string;
  hasWorked: boolean | null; workTypes: string[]; workDuration: string;
  speaksOtherLangs: boolean | null; languages: string;
  usesSmartphone: boolean | null; usesComputer: boolean | null;
  managedResources: boolean | null; techSkills: string[];
  canTravel: boolean | null; hasInternet: boolean | null;
  workSchedule: string; freeSkills: string;
}): string {
  const parts: string[] = [];
  if (form.country) parts.push(`I am from ${form.country}.`);
  if (form.education) parts.push(`My education level is ${form.education}.`);
  if (form.age) parts.push(`I am ${form.age} years old.`);
  if (form.hasWorked && form.workTypes.length > 0)
    parts.push(`I have worked in: ${form.workTypes.join(", ")}.`);
  if (form.hasWorked && form.workDuration)
    parts.push(`Work duration: ${form.workDuration}.`);
  if (form.speaksOtherLangs && form.languages)
    parts.push(`I speak: ${form.languages}.`);
  if (form.usesSmartphone) parts.push("I can use a smartphone confidently.");
  if (form.usesComputer) parts.push("I can use a computer confidently.");
  if (form.managedResources) parts.push("I have managed money, inventory, or people.");
  if (form.techSkills.length > 0)
    parts.push(`Technical skills: ${form.techSkills.join(", ")}.`);
  if (form.canTravel) parts.push("I can travel for work.");
  if (form.hasInternet) parts.push("I have reliable internet access.");
  if (form.workSchedule) parts.push(`Preferred schedule: ${form.workSchedule}.`);
  if (form.freeSkills) parts.push(form.freeSkills);
  return parts.join(" ");
}

function yearsFromDuration(d: string): number {
  if (d === "Less than 1 year") return 0.5;
  if (d === "1–3 years") return 2.0;
  return 4.0;
}

export const EmployeesPanel = ({
  countryCode,
  setCountryCode,
}: {
  countryCode: string;
  setCountryCode: (code: string) => void;
}) => {
  const [education, setEducation] = useState("");
  const [age, setAge] = useState("");
  const [hasWorked, setHasWorked] = useState<boolean | null>(null);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [workDuration, setWorkDuration] = useState("");
  const [speaksOtherLangs, setSpeaksOtherLangs] = useState<boolean | null>(null);
  const [languages, setLanguages] = useState("");
  const [usesSmartphone, setUsesSmartphone] = useState<boolean | null>(null);
  const [usesComputer, setUsesComputer] = useState<boolean | null>(null);
  const [managedResources, setManagedResources] = useState<boolean | null>(null);
  const [techSkills, setTechSkills] = useState<string[]>([]);
  const [canTravel, setCanTravel] = useState<boolean | null>(null);
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);
  const [workSchedule, setWorkSchedule] = useState("");
  const [freeSkills, setFreeSkills] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [passport, setPassport] = useState<JsonLdPassport | null>(null);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const prevCountryCode = useRef(countryCode);

  // Re-run match when country changes (if passport exists)
  useEffect(() => {
    if (prevCountryCode.current === countryCode) return;
    prevCountryCode.current = countryCode;
    if (!passport) return;
    setIsMatching(true);
    setMatchError(null);
    runMatch(passport, countryCode)
      .then((res) => setMatches(res.matches))
      .catch((e: Error) => setMatchError(e.message))
      .finally(() => setIsMatching(false));
  }, [countryCode, passport]);

  const answered = [
    true, education,          // country is now always set via dropdown
    hasWorked !== null,
    hasWorked ? workTypes.length > 0 : true,
    hasWorked ? workDuration : true,
    speaksOtherLangs !== null,
    speaksOtherLangs ? languages : true,
    usesSmartphone !== null,
    usesComputer !== null,
    managedResources !== null,
    canTravel !== null,
    hasInternet !== null,
    workSchedule, freeSkills,
  ].filter(Boolean).length;
  const completion = Math.round((answered / 14) * 100);

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    setMatchError(null);
    setPassport(null);
    setMatches(null);
    try {
      const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode;
      const raw_text = assembleRawText({
        country: countryName, education, age, hasWorked, workTypes, workDuration,
        speaksOtherLangs, languages, usesSmartphone, usesComputer,
        managedResources, techSkills, canTravel, hasInternet, workSchedule, freeSkills,
      });
      const issued = await generatePassport({
        raw_text,
        country_code: countryCode,
        locale: "en",
        education_level: education || undefined,
        languages: speaksOtherLangs && languages
          ? languages.split(",").map((l) => l.trim())
          : undefined,
        years_experience: workDuration ? yearsFromDuration(workDuration) : undefined,
      });
      setPassport(issued);
      setIsSubmitting(false);

      setIsMatching(true);
      const matchRes = await runMatch(issued, countryCode);
      setMatches(matchRes.matches);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (!passport) setSubmitError(msg);
      else setMatchError(msg);
    } finally {
      setIsSubmitting(false);
      setIsMatching(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      {/* ── Left: questionnaire ─────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-10">

        <section>
          <p className="eyebrow mb-2">Step 01 · Context</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">About you</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="country" className="text-sm">What country are you in?</Label>
              <select
                id="country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="mt-2 w-full border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="education" className="text-sm">Highest level of education completed?</Label>
              <select id="education" value={education} onChange={(e) => setEducation(e.target.value)}
                className="mt-2 w-full border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select…</option>
                {EDUCATION_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="age" className="text-sm">
                How old are you?{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="age" type="number" min={10} max={100} value={age}
                onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28"
                className="mt-2 bg-card w-32" />
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Step 02 · Work &amp; earning experience</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">Your experience</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-sm">Have you ever done any work to earn money, even informally?</Label>
              <YesNo value={hasWorked} onChange={setHasWorked} />
            </div>
            {hasWorked && (
              <>
                <div>
                  <Label className="text-sm">What did you do? (select all that apply)</Label>
                  <MultiSelect options={WORK_TYPE_OPTIONS} selected={workTypes} onChange={setWorkTypes} />
                </div>
                <div>
                  <Label className="text-sm">How long have you been doing this?</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["Less than 1 year", "1–3 years", "3+ years"].map((opt) => (
                      <button key={opt} type="button" onClick={() => setWorkDuration(opt)}
                        className={`px-4 py-1.5 text-sm border transition-all ${workDuration === opt
                          ? "bg-foreground text-background border-foreground"
                          : "border-foreground/25 hover:border-foreground"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Step 03 · Skills</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">What you can do</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-sm">Do you speak any languages other than your first language?</Label>
              <YesNo value={speaksOtherLangs} onChange={setSpeaksOtherLangs} />
              {speaksOtherLangs && (
                <Input value={languages} onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. French, Hausa, English" className="mt-3 bg-card" />
              )}
            </div>
            <div>
              <Label className="text-sm">Can you use a smartphone confidently?</Label>
              <YesNo value={usesSmartphone} onChange={setUsesSmartphone} />
            </div>
            <div>
              <Label className="text-sm">Can you use a computer confidently?</Label>
              <YesNo value={usesComputer} onChange={setUsesComputer} />
            </div>
            <div>
              <Label className="text-sm">Have you ever managed money, inventory, or other people?</Label>
              <YesNo value={managedResources} onChange={setManagedResources} />
            </div>
            <div>
              <Label className="text-sm">Do you have any hands-on technical skills? (select all that apply)</Label>
              <MultiSelect options={TECH_SKILL_OPTIONS} selected={techSkills} onChange={setTechSkills} />
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Step 04 · Constraints</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">Your situation</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-sm">Can you travel outside your immediate area for work?</Label>
              <YesNo value={canTravel} onChange={setCanTravel} />
            </div>
            <div>
              <Label className="text-sm">Do you have reliable internet access?</Label>
              <YesNo value={hasInternet} onChange={setHasInternet} />
            </div>
            <div>
              <Label className="text-sm">Are you looking for full-time, part-time, or flexible / gig work?</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {["Full-time", "Part-time", "Flexible / gig"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setWorkSchedule(opt)}
                    className={`px-4 py-1.5 text-sm border transition-all ${workSchedule === opt
                      ? "bg-foreground text-background border-foreground"
                      : "border-foreground/25 hover:border-foreground"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Step 05 · Anything else?</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">Free text</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="freeSkills" className="text-sm">
                Describe any other skills, abilities, or experience.
              </Label>
              <Textarea id="freeSkills" value={freeSkills} onChange={(e) => setFreeSkills(e.target.value)}
                placeholder="e.g. I can read technical manuals in English, I have experience training community health workers…"
                className="mt-2 min-h-[120px] bg-card" />
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting || isMatching}
              className="bg-foreground text-background hover:bg-accent rounded-none px-6">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing profile…</>
              ) : (
                <>Generate passport <Sparkles className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            {submitError && (
              <p className="text-sm text-red-600 font-mono">{submitError}</p>
            )}
          </div>
        </section>

        {/* Passport card */}
        {passport && <PassportCard passport={passport} />}

        {/* Match results */}
        {(passport || isMatching) && (
          <section>
            <p className="eyebrow mb-2 mt-8">
              Top matches · {countryCode}
              {isMatching && " — updating…"}
            </p>
            <h3 className="font-serif text-2xl font-semibold mb-4 rule-top">Occupation matches</h3>
            {matchError && (
              <p className="text-sm text-red-600 font-mono mb-4">{matchError}</p>
            )}
            {isMatching ? <MatchSkeleton /> : (
              <div className="space-y-3">
                {matches?.map((m) => <MatchCard key={m.rank} result={m} />)}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Right: live profile card ─────────────────────────────────────── */}
      <aside className="lg:col-span-5">
        <div className="sticky top-28">
          <div className="bg-card border border-foreground/15 p-7 shadow-[var(--shadow-editorial)]">
            <div className="flex items-center justify-between mb-1">
              <p className="eyebrow">Live profile</p>
              <span className="font-mono text-[11px] text-muted-foreground">
                ID #A-{Math.floor(10000 + completion * 13)}
              </span>
            </div>
            <div className="rule-top">
              <h3 className="font-serif text-2xl">Candidate dossier</h3>
              <p className="text-sm text-muted-foreground mt-1">Updated as you fill in the questionnaire.</p>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs font-mono uppercase tracking-wider mb-2">
                <span>Completion</span>
                <span className="text-accent">{completion}%</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <dl className="mt-7 space-y-4 text-sm">
              {[
                ["Country", country || "—"],
                ["Education", education || "—"],
                ["Work experience", hasWorked === null ? "—" : hasWorked ? workDuration || "Yes" : "None"],
                ["Work type sought", workSchedule || "—"],
                ["Can travel", canTravel === null ? "—" : canTravel ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-right max-w-[55%]">{value}</dd>
                </div>
              ))}
              <div className="border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground mb-2">Technical skills</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {techSkills.length === 0
                    ? <span className="text-xs italic text-muted-foreground">None yet</span>
                    : techSkills.map((s) => (
                      <Badge key={s} variant="outline" className="rounded-none border-foreground/40 font-normal">{s}</Badge>
                    ))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Additional skills</dt>
                <dd className="text-sm leading-snug">
                  {freeSkills
                    ? freeSkills.length > 120 ? freeSkills.slice(0, 120) + "…" : freeSkills
                    : <span className="italic text-muted-foreground">Not yet entered</span>}
                </dd>
              </div>
            </dl>

            {completion === 100 && (
              <div className="mt-5 flex items-center gap-2 text-sm text-accent font-medium">
                <CheckCircle2 className="h-4 w-4" /> All questions answered
              </div>
            )}

            <div className="mt-7 pt-5 border-t border-foreground/15 text-xs text-muted-foreground italic">
              "Profiles are matched to vetted employers under your full name and contact details — this directory is not anonymous."
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
