import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, Mail, ExternalLink, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getAllRecords, addRecord, updateRecord, type DBRecord } from "@/lib/database";
import { toast } from "sonner";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function trackDownload(paperId: string, paperTitle: string) {
  const db = JSON.parse(localStorage.getItem("portfolio_db") || "{}");
  if (!db.downloadStats) db.downloadStats = [];
  db.downloadStats.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    paperId,
    paperTitle,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("portfolio_db", JSON.stringify(db));
}

export default function PapersPage() {
  const [papers, setPapers] = useState<DBRecord[]>([]);
  const [previewPaper, setPreviewPaper] = useState<DBRecord | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setPapers(getAllRecords("papers"));
  }, []);

  // Convert data URL to blob URL for PDF rendering
  const getBlobUrl = useCallback((dataUrl: string) => {
    try {
      const parts = dataUrl.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "application/pdf";
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mime });
      return URL.createObjectURL(blob);
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (previewPaper?.pdf) {
      const url = getBlobUrl(previewPaper.pdf as string);
      setPreviewBlobUrl(url);
      return () => { if (url) URL.revokeObjectURL(url); };
    } else {
      setPreviewBlobUrl(null);
    }
  }, [previewPaper, getBlobUrl]);

  const handleShare = async (paper: DBRecord) => {
    const shareData: ShareData = {
      title: paper.title as string,
      text: paper.description as string,
      url: window.location.href,
    };

    // Try native share API first (shows OS share dialog like in image 6)
    if (navigator.share) {
      try {
        // If PDF exists, try sharing as file
        if (paper.pdf) {
          try {
            const blobUrl = getBlobUrl(paper.pdf as string);
            if (blobUrl) {
              const resp = await fetch(blobUrl);
              const blob = await resp.blob();
              const file = new File([blob], `${paper.title}.pdf`, { type: "application/pdf" });
              URL.revokeObjectURL(blobUrl);
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ ...shareData, files: [file] });
                return;
              }
            }
          } catch { /* fall through to share without file */ }
        }
        await navigator.share(shareData);
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy link silently with toast
      try {
        await navigator.clipboard.writeText(`${paper.title} - ${paper.description}\n${window.location.href}`);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Could not share");
      }
    }
  };

  const handleDownload = (paper: DBRecord) => {
    if (paper.pdf) {
      const blobUrl = getBlobUrl(paper.pdf as string);
      if (blobUrl) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${paper.title}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        trackDownload(paper.id, paper.title as string);
        toast.success("Download started!", { description: `${paper.title}.pdf` });
      }
    } else {
      toast.error("No PDF uploaded yet", { description: "Upload via Admin panel." });
    }
  };

  const handleEmail = (paper: DBRecord) => {
    const subject = encodeURIComponent(`Regarding: ${paper.title}`);
    const body = encodeURIComponent(`Hi,\n\nI'd like to discuss the paper: "${paper.title}"\n\n${paper.description}\n\nView: ${window.location.href}\n\nBest regards`);
    window.location.href = `mailto:sumanthg.sai@gmail.com?subject=${subject}&body=${body}`;
  };

  // Get inline blob URLs for card preview
  const getCardBlobUrl = useCallback((pdf: string) => {
    return getBlobUrl(pdf);
  }, [getBlobUrl]);

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
        {papers.map((paper, i) => {
          const cardBlobUrl = paper.pdf ? getCardBlobUrl(paper.pdf as string) : null;
          return (
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
                className="relative w-full h-64 md:h-80 flex items-center justify-center mb-5 cursor-pointer rounded-lg overflow-hidden border border-border/30 bg-secondary/20"
                onClick={() => setPreviewPaper(paper)}
              >
                {cardBlobUrl ? (
                  <iframe src={cardBlobUrl} className="w-full h-full pointer-events-none" title={paper.title as string} />
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
                  <button onClick={(e) => { e.stopPropagation(); handleEmail(paper); }} className="glass-pill w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors" title="Email">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-heading font-bold text-foreground mb-2">{paper.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">{paper.description}</p>

              <a href={paper.publicationUrl || "mailto:sumanthg.sai@gmail.com"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
                View Publication
              </a>
            </motion.div>
          );
        })}
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
              {previewBlobUrl ? (
                <iframe src={previewBlobUrl} className="w-full h-full rounded-lg border border-border/50" title={previewPaper.title as string} />
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
