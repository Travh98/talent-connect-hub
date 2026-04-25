import { useState } from "react";
import { Upload, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SUGGESTED_SKILLS = [
  "Python", "SQL", "Project management", "Data analysis", "Stakeholder comms",
  "GIS", "Public speaking", "Statistics R", "Procurement", "Mentoring",
  "Tableau", "Field research", "Grant writing", "Logistics",
];

export const EmployeesPanel = () => {
  const [resume, setResume] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>(["Python", "Data analysis"]);
  const [years, setYears] = useState([5]);
  const [remote, setRemote] = useState([60]);
  const [bio, setBio] = useState("");

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const completion = Math.min(
    100,
    (resume ? 30 : 0) + Math.min(skills.length * 6, 40) + (bio.length > 40 ? 30 : Math.floor(bio.length * 0.7))
  );

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      {/* Left: upload + survey */}
      <div className="lg:col-span-7 space-y-10">
        <section>
          <p className="eyebrow mb-2">Step 01</p>
          <h2 className="font-serif text-3xl font-semibold mb-1">Lodge your résumé</h2>
          <p className="text-muted-foreground mb-5 text-sm max-w-prose">
            Drop a PDF or DOCX. We extract roles, dates and credentials, then map them onto the
            ISCO-08 occupational tree.
          </p>
          <label
            htmlFor="resume"
            className="block border-2 border-dashed border-foreground/30 hover:border-accent hover:bg-ochre-soft/30 transition-colors cursor-pointer p-10 text-center group"
          >
            {resume ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-6 w-6 text-accent" />
                <div className="text-left">
                  <div className="font-medium">{resume.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {(resume.size / 1024).toFixed(0)} KB · uploaded
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-accent ml-2" />
              </div>
            ) : (
              <>
                <Upload className="h-7 w-7 mx-auto mb-3 text-muted-foreground group-hover:text-accent" />
                <div className="font-serif text-lg">Drop résumé here</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                  PDF · DOCX · max 10 MB
                </div>
              </>
            )}
            <input
              id="resume"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setResume(f);
                  toast.success("Résumé received", { description: "Parsing skills…" });
                }
              }}
            />
          </label>
        </section>

        <section>
          <p className="eyebrow mb-2">Step 02 · Brief survey</p>
          <h2 className="font-serif text-3xl font-semibold mb-5">Build your skills profile</h2>
          <div className="space-y-7">
            <div>
              <Label className="text-sm">Select skills you can demonstrate</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((s) => {
                  const active = skills.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSkill(s)}
                      className={`px-3 py-1.5 text-sm border transition-all ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "border-foreground/25 hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <Label className="text-sm">Years of experience</Label>
                  <span className="stat-num text-xl">{years[0]}</span>
                </div>
                <Slider value={years} onValueChange={setYears} max={30} step={1} />
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <Label className="text-sm">Remote preference</Label>
                  <span className="stat-num text-xl">{remote[0]}%</span>
                </div>
                <Slider value={remote} onValueChange={setRemote} max={100} step={5} />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm">A short note on what you're looking for</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Mid-career analyst seeking public-sector data role in West Africa…"
                className="mt-2 min-h-[100px] bg-card"
              />
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

      {/* Right: live profile card */}
      <aside className="lg:col-span-5">
        <div className="sticky top-28">
          <div className="bg-card border border-foreground/15 p-7 shadow-[var(--shadow-editorial)]">
            <div className="flex items-center justify-between mb-1">
              <p className="eyebrow">Live profile</p>
              <span className="font-mono text-[11px] text-muted-foreground">ID #A-{Math.floor(10000 + completion * 13)}</span>
            </div>
            <div className="rule-top">
              <h3 className="font-serif text-2xl">Candidate dossier</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Updated as you complete the survey.
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
                <dt className="text-muted-foreground">Résumé</dt>
                <dd className="font-medium">{resume ? "Parsed ✓" : "Not yet"}</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="stat-num">{years[0]} yrs</dd>
              </div>
              <div className="flex justify-between border-b border-dashed border-foreground/15 pb-3">
                <dt className="text-muted-foreground">Remote</dt>
                <dd className="stat-num">{remote[0]}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-2">Skills declared</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {skills.length === 0 && <span className="text-xs italic text-muted-foreground">None yet</span>}
                  {skills.map((s) => (
                    <Badge key={s} variant="outline" className="rounded-none border-foreground/40 font-normal">
                      {s}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-7 pt-5 border-t border-foreground/15 text-xs text-muted-foreground italic">
              "Profiles are matched to ISCO-08 occupations and surfaced anonymously to vetted employers."
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
