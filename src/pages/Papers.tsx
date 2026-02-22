import { motion } from "framer-motion";
import { FileText, Download, Share2, Mail, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function PapersPage() {
  const [papers, setPapers] = useState<DBRecord[]>([]);

  useEffect(() => {
    setPapers(getAllRecords("papers"));
  }, []);

  const handleShare = async (paper: DBRecord) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: paper.title, text: paper.description });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(paper.title + " - " + paper.description);
      alert("Copied to clipboard!");
    }
  };

  const handleDownload = (paper: DBRecord) => {
    if (paper.pdf) {
      const a = document.createElement("a");
      a.href = paper.pdf;
      a.download = `${paper.title}.pdf`;
      a.click();
    } else {
      alert("No PDF uploaded yet. Upload via Admin panel.");
    }
  };

  return (
    <div>
      <h1 className="page-title text-center mb-8">Conference Papers</h1>

      <div className="space-y-8">
        {papers.map((paper, i) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-6 hover-glass"
          >
            {/* Document preview area */}
            <div className="relative image-placeholder w-full h-64 md:h-80 flex items-center justify-center mb-5">
              {paper.pdf ? (
                <iframe src={paper.pdf} className="w-full h-full rounded-sm" title={paper.title} />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                  <span className="text-muted-foreground/40 text-sm">Research Paper Preview</span>
                </div>
              )}

              {/* Side action buttons */}
              <div className="absolute right-3 top-3 flex flex-col gap-2">
                <button onClick={() => handleDownload(paper)} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare(paper)} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <a href="mailto:sumanthg.sai@gmail.com" className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            <h3 className="font-heading font-bold text-foreground mb-2">{paper.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">{paper.description}</p>

            <a href="mailto:sumanthg.sai@gmail.com" className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              View Publication
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
