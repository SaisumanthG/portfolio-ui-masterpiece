import { motion } from "framer-motion";
import { Trophy, Github, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<DBRecord[]>([]);

  useEffect(() => {
    setHackathons(getAllRecords("hackathons"));
  }, []);

  return (
    <div>
      <h1 className="page-title mb-8">Hackathons</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-lg border border-border/40 p-1 bg-secondary/10"
          >
            <div className="glass-card p-0 overflow-hidden hover-glass flex flex-col h-full">
              {/* Image area */}
              <div className="relative w-full h-52 overflow-hidden">
                {h.image ? (
                  <img src={h.image} alt={h.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-heading font-bold text-foreground text-base mb-2">{h.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-1">{h.description}</p>

                <a
                  href={h.github || "https://github.com/saisumanth-g"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors w-fit"
                >
                  <Github className="w-3.5 h-3.5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
