import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Commented out: resume upload + free-text skill bubbles ──────────────────
// import { Upload, FileText } from "lucide-react";
// import { Textarea } from "@/components/ui/textarea";
// import { Slider } from "@/components/ui/slider";
//
// const SUGGESTED_SKILLS = [
//   "Python", "SQL", "Project management", "Data analysis", "Stakeholder comms",
//   "GIS", "Public speaking", "Statistics R", "Procurement", "Mentoring",
//   "Tableau", "Field research", "Grant writing", "Logistics",
// ];
//
// Resume upload section (Step 01) and skill-bubble picker (Step 02 header)
// have been replaced by the structured questionnaire below.
// ────────────────────────────────────────────────────────────────────────────

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
  "Other",
];

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(
      selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]
    );
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 text-sm border transition-all ${
              active
                ? "bg-foreground text-background border-foreground"
                : "border-foreground/25 hover:border-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3 mt-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 text-sm border transition-all ${
            value === v
              ? "bg-foreground text-background border-foreground"
              : "border-foreground/25 hover:border-foreground"
          }`}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

export const EmployeesPanel = () => {
  // ── Context ────────────────────────────────────────────────────────────────
  const [country, setCountry] = useState("");
  const [education, setEducation] = useState("");
  const [age, setAge] = useState("");

  // ── Work & earning experience ──────────────────────────────────────────────
  const [hasWorked, setHasWorked] = useState<boolean | null>(null);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [workDuration, setWorkDuration] = useState("");

  // ── Skills ─────────────────────────────────────────────────────────────────
  const [speaksOtherLangs, setSpeaksOtherLangs] = useState<boolean | null>(null);
  const [languages, setLanguages] = useState("");
  const [usesSmartphone, setUsesSmartphone] = useState<boolean | null>(null);
  const [usesComputer, setUsesComputer] = useState<boolean | null>(null);
  const [managedResources, setManagedResources] = useState<boolean | null>(null);
  const [techSkills, setTechSkills] = useState<string[]>([]);

  // ── Constraints ────────────────────────────────────────────────────────────
  const [canTravel, setCanTravel] = useState<boolean | null>(null);
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);
  const [workSchedule, setWorkSchedule] = useState("");

  // ── Completion meter ───────────────────────────────────────────────────────
  const answered = [
    country,
    education,
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
    workSchedule,
  ].filter(Boolean).length;
  const completion = Math.round((answered / 13) * 100);

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      {/* ── Left: questionnaire ─────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-10">

        {/* Section 1 — Context */}
        <section>
          <p className="eyebrow mb-2">Step 01 · Context</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">About you</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="country" className="text-sm">What country are you in?</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Nigeria"
                className="mt-2 bg-card"
              />
            </div>

            <div>
              <Label htmlFor="education" className="text-sm">
                What is your highest level of education completed?
              </Label>
              <select
                id="education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="mt-2 w-full border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select…</option>
                {EDUCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="age" className="text-sm">
                How old are you?{" "}
                <span className="text-muted-foreground font-normal">(optional — useful for policymaker view)</span>
              </Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="mt-2 bg-card w-32"
              />
            </div>
          </div>
        </section>

        {/* Section 2 — Work & earning experience */}
        <section>
          <p className="eyebrow mb-2">Step 02 · Work &amp; earning experience</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">Your experience</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-sm">
                Have you ever done any work to earn money, even informally?
              </Label>
              <YesNo value={hasWorked} onChange={setHasWorked} />
            </div>

            {hasWorked && (
              <>
                <div>
                  <Label className="text-sm">What did you do? (select all that apply)</Label>
                  <MultiSelect
                    options={WORK_TYPE_OPTIONS}
                    selected={workTypes}
                    onChange={setWorkTypes}
                  />
                </div>

                <div>
                  <Label className="text-sm">How long have you been doing this?</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["Less than 1 year", "1–3 years", "3+ years"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setWorkDuration(opt)}
                        className={`px-4 py-1.5 text-sm border transition-all ${
                          workDuration === opt
                            ? "bg-foreground text-background border-foreground"
                            : "border-foreground/25 hover:border-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 3 — Skills */}
        <section>
          <p className="eyebrow mb-2">Step 03 · Skills</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">What you can do</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-sm">
                Do you speak any languages other than your first language?
              </Label>
              <YesNo value={speaksOtherLangs} onChange={setSpeaksOtherLangs} />
              {speaksOtherLangs && (
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. French, Hausa, English"
                  className="mt-3 bg-card"
                />
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
              <Label className="text-sm">
                Have you ever managed money, inventory, or other people?
              </Label>
              <YesNo value={managedResources} onChange={setManagedResources} />
            </div>

            <div>
              <Label className="text-sm">
                Do you have any hands-on technical skills? (select all that apply)
              </Label>
              <MultiSelect
                options={TECH_SKILL_OPTIONS}
                selected={techSkills}
                onChange={setTechSkills}
              />
            </div>
          </div>
        </section>

        {/* Section 4 — Constraints */}
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
              <Label className="text-sm">
                Are you looking for full-time, part-time, or flexible / gig work?
              </Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {["Full-time", "Part-time", "Flexible / gig"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWorkSchedule(opt)}
                    className={`px-4 py-1.5 text-sm border transition-all ${
                      workSchedule === opt
                        ? "bg-foreground text-background border-foreground"
                        : "border-foreground/25 hover:border-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => toast.success("Profile published to CandidateConnect")}
              className="bg-foreground text-background hover:bg-accent rounded-none px-6"
            >
              Publish profile
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
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
              <p className="text-sm text-muted-foreground mt-1">
                Updated as you complete the questionnaire.
              </p>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs font-mono uppercase tracking-wider mb-2">
                <span>Completion</span>
                <span className="text-accent">{completion}%</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <dl className="mt-7 space-y-4 text-sm">
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Country</dt>
                <dd className="font-medium">{country || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Education</dt>
                <dd className="font-medium text-right max-w-[55%]">{education || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Work experience</dt>
                <dd className="font-medium">
                  {hasWorked === null ? "—" : hasWorked ? workDuration || "Yes" : "None"}
                </dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Work type sought</dt>
                <dd className="font-medium">{workSchedule || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Can travel</dt>
                <dd className="font-medium">
                  {canTravel === null ? "—" : canTravel ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-2">Technical skills</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {techSkills.length === 0 && (
                    <span className="text-xs italic text-muted-foreground">None yet</span>
                  )}
                  {techSkills.map((s) => (
                    <Badge key={s} variant="outline" className="rounded-none border-foreground/40 font-normal">
                      {s}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>

            {completion === 100 && (
              <div className="mt-5 flex items-center gap-2 text-sm text-accent font-medium">
                <CheckCircle2 className="h-4 w-4" />
                All questions answered
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
