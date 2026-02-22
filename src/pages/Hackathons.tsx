import { motion } from "framer-motion";
import { Trophy, Github } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hackathons.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 hover-glass"
          >
            <div className="image-placeholder w-full h-40 flex items-center justify-center mb-4">
              {h.image ? (
                <img src={h.image} alt={h.title} className="w-full h-full object-cover rounded-sm" />
              ) : (
                <Trophy className="w-12 h-12 text-primary/30" />
              )}
            </div>

            <h3 className="font-heading font-bold text-foreground text-sm mb-2">{h.title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">{h.description}</p>

            <a href="mailto:sumanthg.sai@gmail.com" className="inline-flex items-center gap-2 text-primary text-xs font-medium hover:underline">
              <Github className="w-3.5 h-3.5" />
              View on GitHub
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
