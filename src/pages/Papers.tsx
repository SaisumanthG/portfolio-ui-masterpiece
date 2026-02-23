import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, Mail, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function PapersPage() {
  const [papers, setPapers] = useState<DBRecord[]>([]);
  const [previewPaper, setPreviewPaper] = useState<DBRecord | null>(null);

  useEffect(() => {
    setPapers(getAllRecords("papers"));
  }, []);

  const handleShare = async (paper: DBRecord) => {
    const shareText = `${paper.title} - ${paper.description}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: paper.title, text: paper.description, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Copied to clipboard!");
      } catch {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Copied to clipboard!");
      }
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
            <div
              className="relative image-placeholder w-full h-64 md:h-80 flex items-center justify-center mb-5 cursor-pointer"
              onClick={() => paper.pdf && setPreviewPaper(paper)}
            >
              {paper.pdf ? (
                <iframe src={paper.pdf} className="w-full h-full rounded-sm pointer-events-none" title={paper.title} />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                  <span className="text-muted-foreground/40 text-sm">Research Paper Preview</span>
                </div>
              )}

              {/* Side action buttons */}
              <div className="absolute right-3 top-3 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(paper); }} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleShare(paper); }} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <a href="mailto:sumanthg.sai@gmail.com" onClick={(e) => e.stopPropagation()} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
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

      {/* Full-screen PDF preview modal */}
      <AnimatePresence>
        {previewPaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewPaper(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-4xl h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setPreviewPaper(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
              <iframe src={previewPaper.pdf} className="w-full h-full rounded-lg border border-border/50" title={previewPaper.title} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
