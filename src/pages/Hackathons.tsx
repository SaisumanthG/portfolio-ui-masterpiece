import { motion } from "framer-motion";
import { Trophy, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<DBRecord[]>([]);

  useEffect(() => {
    setHackathons(getAllRecords("hackathons"));
  }, []);

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title mb-8"
      >
        Hackathons
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map((h, i) => (
          <motion.div
            key={h.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group rounded-lg border border-border/40 p-1 bg-secondary/10"
          >
            <div className="glass-card p-0 overflow-hidden hover-glass flex flex-col h-full">
              <div className="relative w-full h-52 overflow-hidden">
                {h.image ? (
                  <img src={h.image} alt={h.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-heading font-bold text-foreground text-base mb-2">{h.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-1">{h.description}</p>

                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href={h.github || "https://github.com/saisumanth-g"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors w-fit"
                >
                  <Github className="w-3.5 h-3.5" />
                  View on GitHub
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
