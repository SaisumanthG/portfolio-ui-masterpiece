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
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      <h1 className="page-title text-center mb-8">Internships</h1>

      <div className="relative flex flex-1">
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

        {/* Content card - expanded */}
        <div className="flex-1 rounded-lg border border-border/40 p-1 bg-secondary/20">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 md:p-8 h-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Image first on top / left */}
              <div className="w-full h-64 md:h-full min-h-[300px] rounded-lg overflow-hidden border border-border/30">
                {current.image ? (
                  <img src={current.image} alt={current.company} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <Globe className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-6 h-6 text-primary/70" />
                    <h3 className="font-heading font-bold text-foreground text-xl">{current.company}</h3>
                  </div>
                  <p className="text-primary text-base font-medium mb-2">{current.role}</p>
                  <p className="text-muted-foreground text-sm mb-6">{current.period}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
                </div>

                <div className="flex gap-3 mt-8">
                  <a href={current.website || "https://github.com/saisumanth-g"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                  <a href={current.github || "https://github.com/saisumanth-g"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-lg glass-pill text-foreground text-sm font-medium hover:border-primary/50 transition-colors">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
