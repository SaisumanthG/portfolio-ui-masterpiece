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
    <div className="flex flex-col">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title text-center mb-6"
      >
        Internships
      </motion.h1>

      <div className="relative flex flex-1">
        {/* Left numbered nav */}
        <div className="flex flex-col gap-3 mr-4">
          {internships.map((_, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setActiveIndex(i)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all ${
                activeIndex === i
                  ? "bg-primary text-primary-foreground glow-blue"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>

        {/* Content card - compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 rounded-lg border border-border/40 p-1 bg-secondary/20"
        >
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image - compact */}
              <div className="w-full h-32 sm:h-36 md:h-40 rounded-lg overflow-hidden border border-border/30">
                {current.image ? (
                  <img
                    src={current.image}
                    alt={current.company}
                    className="w-full h-full object-cover bg-secondary/30"
                    style={current.imageNudge ? { objectPosition: `${50 + Number((current.imageNudge as string).split(",")[0])}% ${50 + Number((current.imageNudge as string).split(",")[1])}%` } : undefined}
                  />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <Globe className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary/70" />
                    <h3 className="font-heading font-bold text-foreground text-base">{current.company}</h3>
                  </div>
                  <p className="text-primary text-xs font-medium mb-0.5">{current.role}</p>
                  <p className="text-muted-foreground text-[11px] mb-2">{current.period}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">{current.description}</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={current.website || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </motion.a>
                  <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={current.github || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg glass-pill text-foreground text-xs font-medium hover:border-primary/50 transition-colors">
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
