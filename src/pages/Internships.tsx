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
              className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm transition-all ${
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
            className="glass-card p-5 md:p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Image - compact */}
              <div className="w-full h-40 sm:h-44 md:h-52 rounded-lg overflow-hidden border border-border/30">
                {current.image ? (
                  <img
                    src={current.image}
                    alt={current.company}
                    className="w-full h-full object-cover bg-secondary/30"
                    style={current.imageNudge ? { objectPosition: `${50 + Number((current.imageNudge as string).split(",")[0])}% ${50 + Number((current.imageNudge as string).split(",")[1])}%` } : undefined}
                  />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <Globe className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary/70" />
                    <h3 className="font-heading font-bold text-foreground text-lg">{current.company}</h3>
                  </div>
                  <p className="text-primary text-sm font-medium mb-1">{current.role}</p>
                  <p className="text-muted-foreground text-xs mb-3">{current.period}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">{current.description}</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={current.website || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </motion.a>
                  <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href={current.github || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-lg glass-pill text-foreground text-sm font-medium hover:border-primary/50 transition-colors">
                    <Github className="w-4 h-4" />
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
