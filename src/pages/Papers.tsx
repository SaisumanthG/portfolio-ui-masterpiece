import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, ExternalLink, Eye, X, ChevronDown } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";
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
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [expandedBlobUrl, setExpandedBlobUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPapers(getAllRecords("papers"));
  }, []);

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

  const toggleExpand = (paperId: string, pdf: string) => {
    if (expandedPaper === paperId) {
      setExpandedPaper(null);
      if (expandedBlobUrl) URL.revokeObjectURL(expandedBlobUrl);
      setExpandedBlobUrl(null);
    } else {
      if (expandedBlobUrl) URL.revokeObjectURL(expandedBlobUrl);
      setExpandedPaper(paperId);
      const url = getBlobUrl(pdf);
      setExpandedBlobUrl(url);
    }
  };

  useEffect(() => {
    if (!expandedPaper) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedPaper(null);
        if (expandedBlobUrl) URL.revokeObjectURL(expandedBlobUrl);
        setExpandedBlobUrl(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expandedPaper, expandedBlobUrl]);

  const handleShare = async (paper: DBRecord) => {
    const shareData: ShareData = {
      title: paper.title as string,
      text: paper.description as string,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
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
          } catch { /* fall through */ }
        }
        await navigator.share(shareData);
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${paper.title} - ${paper.description}\n${window.location.href}`);
        toast.success("Link copied to clipboard!");
      } catch { toast.error("Could not share"); }
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
      toast.error("No PDF uploaded yet");
    }
  };

  const handleEmail = (paper: DBRecord) => {
    const subject = encodeURIComponent(`Regarding: ${paper.title}`);
    let body = `Hi,\n\nI'd like to discuss the paper: "${paper.title}"\n\n${paper.description}\n\nView: ${window.location.href}`;
    if (paper.pdf) {
      body += `\n\n[PDF attached via download link]`;
    }
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div ref={containerRef}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title text-center mb-8"
      >
        Conference Papers
      </motion.h1>

      <div className="space-y-6">
        {papers.map((paper, i) => (
          <motion.div
            key={paper.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            className="glass-card overflow-hidden hover-glass"
          >
            {/* Paper image if exists */}
            {paper.image && (
              <div className="w-full h-48 md:h-56 overflow-hidden">
                <img
                  src={paper.image as string}
                  alt={paper.title as string}
                  className="w-full h-full object-cover"
                  style={paper.imageNudge ? { objectPosition: `${50 + Number((paper.imageNudge as string).split(",")[0])}% ${50 + Number((paper.imageNudge as string).split(",")[1])}%` } : undefined}
                />
              </div>
            )}

            <div className="p-6">
              <h3 className="font-heading font-bold text-foreground mb-2">{paper.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{paper.description}</p>

              <div className="flex flex-wrap items-center gap-3">
                <a href={paper.publicationUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Publication
                </a>

                {paper.pdf && (
                  <button
                    onClick={() => toggleExpand(paper.id, paper.pdf as string)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      expandedPaper === paper.id
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "glass-pill text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Paper
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedPaper === paper.id ? "rotate-180" : ""}`} />
                  </button>
                )}

                <button onClick={() => handleDownload(paper)} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-lg text-muted-foreground hover:text-primary text-sm transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>

                <button onClick={() => handleShare(paper)} className="flex items-center gap-2 glass-pill px-4 py-2 rounded-lg text-muted-foreground hover:text-primary text-sm transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>

              {/* Expandable PDF viewer */}
              <AnimatePresence>
                {expandedPaper === paper.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-lg border border-border/30 overflow-hidden relative">
                      <button
                        onClick={() => { setExpandedPaper(null); if (expandedBlobUrl) { URL.revokeObjectURL(expandedBlobUrl); setExpandedBlobUrl(null); } }}
                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {expandedBlobUrl ? (
                        <iframe src={expandedBlobUrl} className="w-full h-[60vh] md:h-[70vh]" title={paper.title as string} />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center text-muted-foreground">
                          <FileText className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
