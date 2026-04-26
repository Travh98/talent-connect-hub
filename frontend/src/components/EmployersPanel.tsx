import { useState } from "react";
import { Briefcase, MapPin, Plus, X, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Posting = {
  id: number;
  title: string;
  isco: string;
  location: string;
  skills: string[];
  matches: number;
  pinnedCandidate?: Candidate;
};

type Candidate = {
  id: string;
  name: string;
  location: string;
  topSkills: string[];
  match: number;
};

const SEED: Posting[] = [
  {
    id: 4,
    title: "Fisheries Observer",
    isco: "3152",
    location: "Elmina, GH",
    skills: ["Species ID", "Data collection", "Maritime safety", "Log reporting"],
    matches: 31,
    pinnedCandidate: {
      id: "cand_4_pinned",
      name: "Kwame Asante",
      location: "Elmina, GH",
      topSkills: ["Species ID", "Data collection", "Maritime safety", "Log reporting"],
      match: 97,
    },
  },
  { id: 1, title: "Senior Data Analyst", isco: "2511", location: "Nairobi, KE", skills: ["SQL", "Python", "Tableau"], matches: 142 },
  { id: 2, title: "Civil Engineer (water)", isco: "2142", location: "Dakar, SN", skills: ["AutoCAD", "Hydrology", "Field"], matches: 47 },
  { id: 3, title: "Primary School Teacher", isco: "2341", location: "Kigali, RW", skills: ["Pedagogy", "English"], matches: 318 },
];

const FIRST_NAMES = ["Amina", "Kwame", "Fatou", "Thabo", "Chiamaka", "Joseph", "Ngozi", "Sipho", "Aisha", "Mohammed", "Esi", "Ifeoma", "Tendai", "Yara", "Kofi"];
const LAST_NAMES = ["Otieno", "Mensah", "Diallo", "Mokoena", "Okafor", "Mwangi", "Adeyemi", "Nkosi", "Hassan", "Traoré", "Asante", "Eze", "Moyo", "Khaled", "Boateng"];
const CITIES = ["Nairobi, KE", "Accra, GH", "Lagos, NG", "Dakar, SN", "Kigali, RW", "Cape Town, ZA", "Addis Ababa, ET", "Cairo, EG", "Kampala, UG", "Abidjan, CI"];
const EXTRA_SKILLS = ["Communication", "Project mgmt", "Excel", "GIS", "Stakeholder eng.", "Data viz", "QA/QC", "Field research"];

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const generateCandidates = (posting: Posting): Candidate[] => {
  const rand = seededRandom(posting.id * 1000);
  const count = Math.min(8, Math.max(5, Math.floor(rand() * 6) + 5));
  const list: Candidate[] = [];
  for (let i = 0; i < count; i++) {
    const fn = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    const numCore = Math.min(posting.skills.length, Math.floor(rand() * posting.skills.length) + 1);
    const core = [...posting.skills].sort(() => rand() - 0.5).slice(0, numCore);
    const extras = [...EXTRA_SKILLS].sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 2) + 1);
    const topSkills = [...core, ...extras].slice(0, 4);
    const match = Math.floor(98 - i * (5 + rand() * 4) - rand() * 3);
    list.push({
      id: `cand_${posting.id}_${i}`,
      name: `${fn} ${ln}`,
      location: city,
      topSkills,
      match: Math.max(42, match),
    });
  }
  const sorted = list.sort((a, b) => b.match - a.match);
  if (posting.pinnedCandidate) {
    return [posting.pinnedCandidate, ...sorted.filter((c) => c.id !== posting.pinnedCandidate!.id)];
  }
  return sorted;
};

export const EmployersPanel = () => {
  const [postings, setPostings] = useState<Posting[]>(SEED);
  const [title, setTitle] = useState("");
  const [isco, setIsco] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [skill, setSkill] = useState("");
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Posting | null>(null);

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

  const candidates = viewing ? generateCandidates(viewing) : [];

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
              <div className="mt-4 pt-4 border-t border-foreground/10">
                <Button
                  onClick={() => setViewing(p)}
                  variant="outline"
                  className="rounded-none border-foreground hover:bg-foreground hover:text-background w-full text-xs font-mono uppercase tracking-wider"
                >
                  <Users className="h-3.5 w-3.5" />
                  View candidates
                </Button>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-4xl rounded-none border-foreground/20 bg-card">
          <DialogHeader>
            <p className="eyebrow mb-1">Match dossier</p>
            <DialogTitle className="font-serif text-2xl font-semibold">
              {viewing?.title}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              ISCO {viewing?.isco} · {viewing?.location} · {candidates.length} ranked candidates
            </DialogDescription>
          </DialogHeader>

          <div className="border border-foreground/15 mt-2">
            <Table>
              <TableHeader>
                <TableRow className="border-foreground/15 hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider w-20">Match</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider">Location</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider">Top skills</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-wider w-32 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.id} className="border-foreground/10">
                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span className="stat-num text-xl text-accent">{c.match}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-serif font-semibold">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.topSkills.map((s) => (
                          <Badge key={s} variant="outline" className="rounded-none border-foreground/30 font-normal text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => toast.success(`Outreach sent to ${c.name}`)}
                        className="bg-foreground text-background hover:bg-accent rounded-none text-xs font-mono uppercase tracking-wider"
                      >
                        <Mail className="h-3 w-3" />
                        Contact
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
