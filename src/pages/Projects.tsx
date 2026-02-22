import { motion } from "framer-motion";
import { FolderOpen, ExternalLink, Github, Code2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DBRecord[]>([]);

  useEffect(() => {
    setProjects(getAllRecords("projects"));
  }, []);

  // Alternate folder icon colors
  const folderColors = ["text-primary/70", "text-amber-500/70", "text-emerald-500/70", "text-rose-500/70", "text-cyan-500/70"];

  return (
    <div>
      <h1 className="page-title text-center mb-8">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 hover-glass"
          >
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className={`w-5 h-5 ${folderColors[i % folderColors.length]}`} />
              <h3 className="font-heading font-semibold text-foreground text-sm">{project.title}</h3>
            </div>

            <div className="image-placeholder w-full h-36 flex items-center justify-center mb-3">
              {project.image ? (
                <img src={project.image} alt={project.title} className="w-full h-full object-cover rounded-sm" />
              ) : (
                <Code2 className="w-10 h-10 text-muted-foreground/30" />
              )}
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(project.tech || []).map((t: string) => (
                <span key={t} className="glass-pill px-2.5 py-0.5 rounded-full text-xs text-foreground/70">{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a href="mailto:sumanthg.sai@gmail.com" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                View Project
              </a>
              <a href="mailto:sumanthg.sai@gmail.com" className="glass-pill p-2.5 rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center">
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
