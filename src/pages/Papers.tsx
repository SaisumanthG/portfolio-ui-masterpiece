import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, Mail, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
        await navigator.share({ title: paper.title as string, text: paper.description as string, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Copied to clipboard!");
      } catch {
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
      a.href = paper.pdf as string;
      a.download = `${paper.title}.pdf`;
      a.click();
    } else {
      alert("No PDF uploaded yet. Upload via Admin panel.");
    }
  };

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title text-center mb-8"
      >
        Conference Papers
      </motion.h1>

      <div className="space-y-8">
        {papers.map((paper, i) => (
          <motion.div
            key={paper.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            className="glass-card p-6 hover-glass"
          >
            {/* Document preview area */}
            <div
              className="relative image-placeholder w-full h-64 md:h-80 flex items-center justify-center mb-5 cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setPreviewPaper(paper)}
            >
              {paper.pdf ? (
                <iframe src={paper.pdf as string} className="w-full h-full pointer-events-none" title={paper.title as string} />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                  <span className="text-muted-foreground/40 text-sm">Click to preview paper</span>
                </div>
              )}

              {/* Side action buttons */}
              <div className="absolute right-3 top-3 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDownload(paper); }} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleShare(paper); }} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" title="Share">
                  <Share2 className="w-4 h-4" />
                </button>
                <a href="mailto:sumanthg.sai@gmail.com" onClick={(e) => e.stopPropagation()} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" title="Email">
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
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center"
            onClick={() => setPreviewPaper(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-[95vw] h-[95vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setPreviewPaper(null)} className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
              {previewPaper.pdf ? (
                <iframe src={previewPaper.pdf as string} className="w-full h-full rounded-lg border border-border/50" title={previewPaper.title as string} />
              ) : (
                <div className="w-full h-full rounded-lg border border-border/50 bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-heading font-semibold mb-2">No PDF uploaded yet</p>
                  <p className="text-sm">Upload a PDF via the Admin panel at /web/admin</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
