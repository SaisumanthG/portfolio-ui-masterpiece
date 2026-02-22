import { motion } from "framer-motion";
import { Trophy, Github } from "lucide-react";

const hackathons = [
  {
    title: "IDEATHON – PECTEAM 2K24",
    description: "Participated in an ideation competition focused on innovative problem-solving, presenting creative tech solutions.",
  },
  {
    title: "Infosys Springboard Ideathon",
    description: "Competed in the Infosys Springboard Ideathon, developing and pitching innovative tech solutions for real-world problems.",
  },
  {
    title: "Hackathon – XYNTRA (36 Hours)",
    description: "Built an AI-powered health monitoring system in 36 hours during the XYNTRA hackathon.",
  },
];

export default function HackathonsPage() {
  return (
    <div>
      <h1 className="page-title mb-8">Hackathons</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hackathons.map((h, i) => (
          <motion.div
            key={h.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 card-hover"
          >
            <div className="image-placeholder w-full h-40 flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 text-primary/30" />
            </div>

            <h3 className="font-heading font-bold text-foreground text-sm mb-2">{h.title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">{h.description}</p>

            <a href="mailto:sumanthg.sai@gmail.com" className="flex items-center gap-2 text-primary text-xs font-medium hover:underline">
              <Github className="w-3.5 h-3.5" />
              View on GitHub
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
