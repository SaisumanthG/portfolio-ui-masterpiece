import { motion, useScroll, useTransform } from "framer-motion";
import { User, Download, Github, Code2, Trophy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getAllRecords } from "@/lib/database";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomePage() {
  const [profile, setProfile] = useState({ name: "Sai Sumanth G", subtitle: "Full Stack Developer · AI Enthusiast · Builder", image: "", collegeImage: "", imageNudge: "", collegeImageNudge: "" });
  const [aboutText, setAboutText] = useState("");
  const [skills, setSkills] = useState<{ category: string; items: string[] }[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string; icon: string }[]>([]);
  const [collegeSlides, setCollegeSlides] = useState<{ year: string; title: string; description: string; image: string; imageNudge?: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState("1st Year");
  const [yearContentIndex, setYearContentIndex] = useState(0);
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.6]);

  useEffect(() => {
    const profileRecs = getAllRecords("homeProfile");
    if (profileRecs.length > 0) setProfile({
      name: profileRecs[0].name || "Sai Sumanth G",
      subtitle: profileRecs[0].subtitle || "",
      image: profileRecs[0].image || "",
      collegeImage: profileRecs[0].collegeImage || "",
      imageNudge: profileRecs[0].imageNudge || "",
      collegeImageNudge: profileRecs[0].collegeImageNudge || "",
    });
    const aboutRecs = getAllRecords("homeAbout");
    if (aboutRecs.length > 0) setAboutText(aboutRecs[0].content || "");
    const skillRecs = getAllRecords("homeSkills");
    setSkills(skillRecs.map(s => {
      let items: string[] = [];
      try { items = JSON.parse(s.skills); } catch { items = [s.skills]; }
      return { category: s.category, items };
    }));
    const linkRecs = getAllRecords("homeLinks");
    setLinks(linkRecs.map(l => ({ label: l.label, url: l.url, icon: l.icon })));
    const collegeRecs = getAllRecords("homeCollege");
    setCollegeSlides(collegeRecs.map(c => ({ year: c.year, title: c.title, description: c.description, image: c.image || "", imageNudge: c.imageNudge || "" })));
  }, []);

  const currentYearItems = collegeSlides.filter(s => s.year === selectedYear);
  const handleYearChange = (year: string) => { setSelectedYear(year); setYearContentIndex(0); };
  const navigateContent = (dir: number) => {
    setYearContentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return currentYearItems.length - 1;
      if (next >= currentYearItems.length) return 0;
      return next;
    });
  };

  const handleDownloadResume = () => {
    const settings = getAllRecords("settings");
    // Find the active resume, or fall back to first with value
    const active = settings.find(s => s.active === "true") || settings.find(s => s.key === "resumePdf") || settings.find(s => s.value);
    if (active?.value) {
      const a = document.createElement("a");
      a.href = active.value as string;
      a.download = `${active.key || "Resume"}.pdf`;
      a.click();
      toast.success("Resume download started!");
    } else {
      toast.error("Resume not uploaded yet. Upload via Admin panel.");
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "github": return Github;
      case "leetcode": return Code2;
      case "hackerrank": return Trophy;
      default: return Github;
    }
  };

  const getColor = (iconName: string) => {
    switch (iconName) {
      case "github": return "hover:text-foreground";
      case "leetcode": return "hover:text-amber-400";
      case "hackerrank": return "hover:text-emerald-400";
      default: return "hover:text-foreground";
    }
  };

  const getNudgeStyle = (nudge: string | undefined) => {
    if (!nudge) return undefined;
    const [x, y] = nudge.split(",").map(Number);
    return { objectPosition: `${50 + (x || 0)}% ${50 + (y || 0)}%` };
  };

  const currentSlide = currentYearItems[yearContentIndex];

  return (
    <div className="space-y-12">
      {/* Hero with parallax */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center py-8"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <motion.div
          variants={scaleIn}
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-foreground/20 flex items-center justify-center mb-6 glow-blue overflow-hidden"
          style={{ background: "radial-gradient(circle, hsl(230, 50%, 18%) 0%, hsl(225, 45%, 10%) 70%)" }}
          whileHover={{ scale: 1.05 }}
        >
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" style={getNudgeStyle(profile.imageNudge)} draggable={false} />
          ) : (
            <User className="w-16 h-16 text-muted-foreground/50" />
          )}
        </motion.div>
        <motion.h1
          variants={fadeUp}
          custom={1}
          className="text-4xl md:text-5xl font-heading font-bold text-primary glow-text mb-2"
        >
          {profile.name}
        </motion.h1>
        <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg">
          {profile.subtitle}
        </motion.p>
      </motion.section>

      {/* About */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <motion.div variants={fadeUp} custom={0} className="glass-card p-6 md:p-8" whileHover={{ scale: 1.01 }}>
          <h2 className="font-heading font-semibold text-lg text-foreground mb-3">About Me</h2>
          <p className="text-muted-foreground leading-relaxed">{aboutText}</p>
        </motion.div>
      </motion.section>

      {/* Skills */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <motion.h2 variants={fadeUp} custom={0} className="page-title mb-6">Skills</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((s, i) => (
            <motion.div key={s.category} variants={fadeUp} custom={i + 1} className="glass-card p-5" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
              <h3 className="font-heading font-semibold text-primary text-sm mb-3">{s.category}</h3>
              <div className="flex flex-wrap gap-2">
                {s.items.map((skill) => (
                  <motion.span key={skill} className="glass-pill px-3 py-1 rounded-full text-xs text-foreground/80" whileHover={{ scale: 1.08 }}>{skill}</motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Profiles */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <motion.h2 variants={fadeUp} custom={0} className="page-title mb-6">Profiles</motion.h2>
        <div className="flex flex-wrap gap-4">
          {links.map((link, i) => {
            const Icon = getIcon(link.icon);
            return (
              <motion.a
                key={link.label}
                variants={fadeUp}
                custom={i + 1}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card px-6 py-4 rounded-xl flex items-center gap-3 text-muted-foreground ${getColor(link.icon)} transition-all hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)]`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-heading font-medium text-sm">{link.label}</span>
              </motion.a>
            );
          })}
        </div>
      </motion.section>

      {/* Resume */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex justify-center">
        <motion.button
          variants={scaleIn}
          onClick={handleDownloadResume}
          className="glass-pill flex items-center gap-2 px-6 py-3 rounded-full text-primary font-medium hover:bg-primary/10 transition-colors border-primary/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          Download Resume
        </motion.button>
      </motion.section>

      {/* College Section */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
        <motion.div variants={fadeUp} custom={0} className="rounded-lg border border-border/40 p-1 bg-secondary/10">
          <div className="glass-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
              <div className="space-y-4">
                <div className="glass-card p-6 text-center">
                  <div className="w-20 h-20 rounded-full border border-muted-foreground/30 flex items-center justify-center mx-auto mb-3 overflow-hidden" style={{ background: "radial-gradient(circle, hsl(230, 40%, 18%) 0%, hsl(225, 45%, 12%) 70%)" }}>
                    {profile.collegeImage ? (
                      <img src={profile.collegeImage} alt="College" className="w-full h-full object-cover" style={getNudgeStyle(profile.collegeImageNudge)} />
                    ) : (
                      <span className="text-muted-foreground font-heading font-bold text-sm">PEC</span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm">PANIMALAR</h3>
                  <p className="text-primary text-xs font-heading">ENGINEERING COLLEGE</p>
                  <p className="text-muted-foreground text-xs mt-1">Anna University</p>
                </div>

                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-heading font-bold uppercase transition-all ${
                      selectedYear === year
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {year}
                    {selectedYear === year && <span className="text-primary">›</span>}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {currentSlide ? (
                  <>
                    <motion.div
                      key={`img-${selectedYear}-${yearContentIndex}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="image-placeholder w-full h-48 md:h-64 rounded-lg flex items-center justify-center overflow-hidden"
                    >
                      {currentSlide.image ? (
                        <img src={currentSlide.image} alt="" className="w-full h-full object-cover" style={getNudgeStyle(currentSlide.imageNudge)} />
                      ) : (
                        <span className="text-muted-foreground/40 text-sm">{selectedYear} - Slide {yearContentIndex + 1}</span>
                      )}
                    </motion.div>

                    <motion.div
                      key={`${selectedYear}-${yearContentIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="glass-card p-6 text-center border-t-2 border-primary/50"
                    >
                      <h3 className="font-heading font-bold text-foreground italic text-lg mb-1">{currentSlide.title}</h3>
                      <p className="text-primary text-xs font-heading mb-3">— {selectedYear} —</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">{currentSlide.description}</p>
                      <div className="flex justify-center gap-3 mt-5">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateContent(-1)} className="glass-pill w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:border-primary/50 transition-colors">‹</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigateContent(1)} className="glass-pill w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:border-primary/50 transition-colors">›</motion.button>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="glass-card p-6 text-center text-muted-foreground">No slides for this year yet.</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-xs border-t border-border/30">
        © 2026 Saisumanth @ ALL rights reserved
      </footer>
    </div>
  );
}
