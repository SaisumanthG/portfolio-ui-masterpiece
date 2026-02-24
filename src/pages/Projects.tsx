import { motion } from "framer-motion";
import { FolderOpen, ExternalLink, Github, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DBRecord[]>([]);

  useEffect(() => {
    setProjects(getAllRecords("projects"));
  }, []);

  const folderColors = ["text-primary/70", "text-amber-500/70", "text-emerald-500/70", "text-rose-500/70", "text-cyan-500/70"];

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title text-center mb-8"
      >
        Projects
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass-card p-5 hover-glass"
          >
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className={`w-5 h-5 ${folderColors[i % folderColors.length]}`} />
              <h3 className="font-heading font-semibold text-foreground text-sm">{project.title}</h3>
            </div>

            <div className="w-full h-36 rounded-lg overflow-hidden mb-3 border border-border/20">
              {project.image ? (
                <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              ) : (
                <div className="w-full h-full image-placeholder flex items-center justify-center">
                  <Code2 className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(project.tech || []).map((t: string) => (
                <span key={t} className="glass-pill px-2.5 py-0.5 rounded-full text-xs text-foreground/70">{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a href={project.github || "https://github.com/saisumanth-g"} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                View Project
              </a>
              <a href={project.github || "https://github.com/saisumanth-g"} target="_blank" rel="noopener noreferrer" className="glass-pill p-2.5 rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center">
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
