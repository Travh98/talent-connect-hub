import { useState } from "react";
import { Briefcase, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Posting = {
  id: number;
  title: string;
  isco: string;
  location: string;
  skills: string[];
  matches: number;
};

const SEED: Posting[] = [
  { id: 1, title: "Senior Data Analyst", isco: "2511", location: "Nairobi, KE", skills: ["SQL", "Python", "Tableau"], matches: 142 },
  { id: 2, title: "Civil Engineer (water)", isco: "2142", location: "Dakar, SN", skills: ["AutoCAD", "Hydrology", "Field"], matches: 47 },
  { id: 3, title: "Primary School Teacher", isco: "2341", location: "Kigali, RW", skills: ["Pedagogy", "English"], matches: 318 },
];

export const EmployersPanel = () => {
  const [postings, setPostings] = useState<Posting[]>(SEED);
  const [title, setTitle] = useState("");
  const [isco, setIsco] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [skill, setSkill] = useState("");
  const [draftSkills, setDraftSkills] = useState<string[]>([]);

  const addSkill = () => {
    const v = skill.trim();
    if (!v) return;
    if (draftSkills.includes(v)) return;
    setDraftSkills([...draftSkills, v]);
    setSkill("");
  };

  const publish = () => {
    if (!title || !isco) {
      toast.error("Title and ISCO code are required");
      return;
    }
    setPostings([
      {
        id: Date.now(),
        title,
        isco,
        location: location || "Remote",
        skills: draftSkills,
        matches: Math.floor(Math.random() * 200) + 20,
      },
      ...postings,
    ]);
    toast.success("Vacancy posted to Meridian");
    setTitle(""); setIsco(""); setLocation(""); setDesc(""); setDraftSkills([]);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      {/* Form */}
      <div className="lg:col-span-7">
        <p className="eyebrow mb-2">Vacancy notice</p>
        <h2 className="font-serif text-3xl font-semibold mb-1">Compose a job profile</h2>
        <p className="text-muted-foreground text-sm mb-7 max-w-prose">
          Pair a free-text job title with its <span className="font-mono text-foreground">ILOSTAT / ISCO-08</span> occupational
          code. The taxonomy is what lets candidates and policymakers compare like with like across borders.
        </p>

        <div className="bg-card border border-foreground/15 p-7 shadow-[var(--shadow-editorial)] space-y-6">
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Job title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hydrological technician" className="mt-2 rounded-none bg-background" />
            </div>
            <div>
              <Label htmlFor="isco">ISCO-08 code</Label>
              <Input id="isco" value={isco} onChange={(e) => setIsco(e.target.value)} placeholder="3132" className="mt-2 rounded-none bg-background font-mono" />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Accra, GH · hybrid" className="mt-2 rounded-none bg-background" />
          </div>

          <div>
            <Label htmlFor="desc">Role description</Label>
            <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What the candidate will do, who they report to, what success looks like…" className="mt-2 min-h-[100px] rounded-none bg-background" />
          </div>

          <div>
            <Label>Required skills</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
                className="rounded-none bg-background"
              />
              <Button type="button" onClick={addSkill} variant="outline" className="rounded-none border-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {draftSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {draftSkills.map((s) => (
                  <Badge key={s} className="rounded-none bg-foreground text-background hover:bg-accent gap-1 font-normal">
                    {s}
                    <button onClick={() => setDraftSkills(draftSkills.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button onClick={publish} className="bg-foreground text-background hover:bg-accent rounded-none px-6">
            Post vacancy
          </Button>
        </div>
      </div>

      {/* Postings */}
      <aside className="lg:col-span-5">
        <p className="eyebrow mb-2">Open notices</p>
        <h3 className="font-serif text-2xl font-semibold mb-5 rule-top">Currently posted</h3>
        <div className="space-y-4">
          {postings.map((p) => (
            <article key={p.id} className="bg-card border border-foreground/15 p-5 hover:border-accent transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-serif text-lg font-semibold leading-tight">{p.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 font-mono">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> ISCO {p.isco}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat-num text-2xl text-accent">{p.matches}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">matches</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {p.skills.map((s) => (
                  <Badge key={s} variant="outline" className="rounded-none border-foreground/30 font-normal text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
};
