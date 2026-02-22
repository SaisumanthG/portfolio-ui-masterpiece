import { motion } from "framer-motion";
import { FolderOpen, ExternalLink, Github, Code2 } from "lucide-react";

const projects = [
  {
    title: "Start or Scrap? – Startup Validation Game",
    description: "An interactive startup idea-validation game that simulates real-world decision-making under time pressure. Users evaluate randomly generated startup ideas using structured validation questions.",
    tech: ["Python", "Django", "React", "MySQL"],
  },
  {
    title: "MediGuardian – AI Health Detection",
    description: "An AI-based healthcare solution that analyzes voice patterns to assist in the early detection of Parkinson's disease.",
    tech: ["Python", "Flask", "React", "ML"],
  },
  {
    title: "AI-Based Interior Design Generator",
    description: "An AI-powered interior design generator developed during internship.",
    tech: ["Python", "Stable Diffusion", "React"],
  },
  {
    title: "ESP32 Smart Air Quality Monitor",
    description: "A hardware project that monitors indoor air quality using ESP32, C programming, and environmental sensors.",
    tech: ["C", "ESP32", "Sensors"],
  },
  {
    title: "Smart Shopping & Billing App",
    description: "A modern shopping website with online billing and invoice generation.",
    tech: ["HTML", "CSS", "JavaScript", "Django", "MySQL"],
  },
];

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="page-title text-center mb-8">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 card-hover"
          >
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-5 h-5 text-primary/70" />
              <h3 className="font-heading font-semibold text-foreground text-sm">{project.title}</h3>
            </div>

            <div className="image-placeholder w-full h-36 flex items-center justify-center mb-3">
              <Code2 className="w-10 h-10 text-muted-foreground/30" />
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tech.map((t) => (
                <span key={t} className="glass-pill px-2.5 py-0.5 rounded-full text-xs text-foreground/70">{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a href="mailto:sumanthg.sai@gmail.com" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                View Project
              </a>
              <a href="mailto:sumanthg.sai@gmail.com" className="glass-pill p-2 rounded-lg hover:border-primary/50 transition-colors">
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
