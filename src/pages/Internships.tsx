import { motion } from "framer-motion";
import { Building2, Globe, ExternalLink, Github } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function InternshipsPage() {
  const [internships, setInternships] = useState<DBRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setInternships(getAllRecords("internships"));
  }, []);

  if (internships.length === 0) return null;
  const current = internships[activeIndex];

  return (
    <div>
      <h1 className="page-title text-center mb-8">Internships</h1>

      <div className="relative flex">
        {/* Left numbered nav */}
        <div className="flex flex-col gap-3 mr-4">
          {internships.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all ${
                activeIndex === i
                  ? "bg-primary text-primary-foreground glow-blue"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Content card with outer border wrapper */}
        <div className="flex-1 rounded-lg border border-border/40 p-1 bg-secondary/20">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary/70" />
                <h3 className="font-heading font-bold text-foreground">{current.company}</h3>
              </div>
              <p className="text-primary text-sm font-medium mb-1">{current.role}</p>
              <p className="text-muted-foreground text-xs mb-4">{current.period}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>

              <div className="flex gap-3 mt-6">
                <a href="mailto:sumanthg.sai@gmail.com" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Website
                </a>
                <a href="mailto:sumanthg.sai@gmail.com" className="flex items-center gap-2 px-4 py-2 rounded-lg glass-pill text-foreground text-xs font-medium hover:border-primary/50 transition-colors">
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </a>
              </div>
            </div>

            <div className="image-placeholder w-full h-48 flex items-center justify-center">
              {current.image ? (
                <img src={current.image} alt={current.company} className="w-full h-full object-cover rounded-sm" />
              ) : (
                <Globe className="w-10 h-10 text-muted-foreground/30" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
