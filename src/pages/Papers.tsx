import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Share2, ExternalLink, Eye, X, ImageIcon, Mail } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { addDownloadStat, fetchRecords, getAllRecords, subscribeToDatabaseChanges, type DBRecord } from "@/lib/database";
import { toast } from "sonner";
import { useCustomization } from "@/hooks/use-customization";
import ShareFallbackDialog from "@/components/ShareFallbackDialog";
import { tryNativeShare, type SharePayload } from "@/lib/share";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function trackDownload(paperId: string, paperTitle: string) {
  addDownloadStat(paperId, paperTitle);
}

export default function PapersPage() {
  const [papers, setPapers] = useState<DBRecord[]>([]);
  const [viewPaper, setViewPaper] = useState<DBRecord | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
  const [fallbackShare, setFallbackShare] = useState<SharePayload | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const customization = useCustomization("papers");

  useEffect(() => {
    const loadPapers = () => setPapers(getAllRecords("papers"));
    fetchRecords("papers").then(setPapers).catch(() => setPapers([]));
    return subscribeToDatabaseChanges(loadPapers);
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
    } catch {
      return null;
    }
  }, []);

  const getDownloadSource = (paper: DBRecord) => (paper.file || paper.pdf) as string;

  const openViewPaper = (paper: DBRecord) => {
    if (viewBlobUrl?.startsWith("blob:")) URL.revokeObjectURL(viewBlobUrl);
    const pdfSrc = getDownloadSource(paper);
    if (pdfSrc?.startsWith("data:")) {
      const url = getBlobUrl(pdfSrc);
      setViewBlobUrl(url);
    } else {
      setViewBlobUrl(pdfSrc || null);
    }
    setViewPaper(paper);
  };

  const closeViewPaper = () => {
    setViewPaper(null);
    if (viewBlobUrl?.startsWith("blob:")) URL.revokeObjectURL(viewBlobUrl);
    setViewBlobUrl(null);
  };

  const handleShare = async (paper: DBRecord) => {
    const payload: SharePayload = {
      title: paper.title as string,
      text: paper.description as string,
      url: (paper.publicationUrl as string) || window.location.href,
      dataUrl: getDownloadSource(paper),
      fileName: `${paper.title}.pdf`,
    };

    if (window.top !== window.self) {
      setFallbackShare(payload);
      setFallbackOpen(true);
      return;
    }

    const result = await tryNativeShare(payload);
    if (result === "unavailable") {
      setFallbackShare(payload);
      setFallbackOpen(true);
    }
  };

  const handleDownload = (paper: DBRecord) => {
    const pdfSrc = getDownloadSource(paper);
    if (!pdfSrc) {
      toast.error("No PDF uploaded yet");
      return;
    }

    let href = pdfSrc;
    if (pdfSrc.startsWith("data:")) {
      const blobUrl = getBlobUrl(pdfSrc);
      if (!blobUrl) {
        toast.error("Download failed");
        return;
      }
      href = blobUrl;
    }

    const a = document.createElement("a");
    a.href = href;
    a.download = `${paper.title}.pdf`;
    a.click();

    if (href.startsWith("blob:")) URL.revokeObjectURL(href);
    trackDownload(paper.id, paper.title as string);
    toast.success("Download started!", { description: `${paper.title}.pdf` });
  };

  const handleEmail = async (paper: DBRecord) => {
    const result = await tryNativeShare({
      title: `Send: ${paper.title}`,
      text: "Choose your email app to send this paper",
      url: (paper.publicationUrl as string) || window.location.href,
      dataUrl: getDownloadSource(paper),
      fileName: `${paper.title}.pdf`,
    });

    if (result === "shared") {
      toast.success("Select your email app from share options");
      return;
    }

    const subject = encodeURIComponent(`Regarding: ${paper.title}`);
    let body = `Hi,\n\nI'd like to discuss the paper: "${paper.title}"\n\n${paper.description}`;
    if (paper.publicationUrl) body += `\n\nPublication: ${paper.publicationUrl}`;
    if (getDownloadSource(paper)) body += `\n\nAttachment note: Please download file from the paper card if your email app does not auto-attach.`;
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  const getImageStyle = (paper: DBRecord) => {
    const nudge = paper.previewImageNudge || paper.imageNudge;
    if (!nudge) return undefined;
    const parts = (nudge as string).split(",").map(Number);
    return {
      objectPosition: `${50 + (parts[0] || 0)}% ${50 + (parts[1] || 0)}%`,
      transform: `scale(${parts[2] || 1})`,
    };
  };

  const getDisplayImage = (paper: DBRecord) => (paper.previewImage || paper.image) as string;

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

      <div className="space-y-6">
        {papers.map((paper, i) => (
          <motion.div
            key={paper.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            className="glass-card overflow-hidden hover-glass max-w-4xl mx-auto"
          >
            <div
              className="relative w-full overflow-hidden bg-secondary/30 p-2 md:p-3 flex items-center justify-center"
              style={{ height: customization.imageHeight || 224 }}
            >
              {getDisplayImage(paper) ? (
                <img
                  src={getDisplayImage(paper)}
                  alt={paper.title as string}
                  loading="lazy"
                  className="w-full h-full rounded-lg object-contain shadow-sm"
                  style={getImageStyle(paper)}
                />
              ) : (
                <div className="w-full h-full min-h-48 image-placeholder flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-primary/20" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDownload(paper)}
                  className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleShare(paper)}
                  className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleEmail(paper)}
                  className="w-9 h-9 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div style={{ padding: customization.cardPadding || 24 }}>
              <h3 className="font-heading font-bold text-foreground mb-2">{paper.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{paper.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <a
                  href={(paper.publicationUrl as string) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Publication
                </a>

                {getDownloadSource(paper) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openViewPaper(paper)}
                    className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {viewPaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closeViewPaper}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeViewPaper} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
              <div className="glass-card p-2 rounded-xl h-full flex flex-col">
                {viewBlobUrl ? (
                  <iframe src={viewBlobUrl + "#toolbar=0&navpanes=0&scrollbar=1&view=FitH"} className="w-full flex-1 rounded-lg" title={viewPaper.title as string} />
                ) : (
                  <div className="w-full flex-1 flex items-center justify-center text-muted-foreground">
                    <FileText className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="text-center py-3 space-y-1">
                  <h3 className="font-heading font-bold text-foreground text-sm">{viewPaper.title}</h3>
                  <button
                    onClick={() => handleDownload(viewPaper)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Paper
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareFallbackDialog
        open={fallbackOpen}
        onClose={() => setFallbackOpen(false)}
        payload={fallbackShare}
      />
    </div>
  );
}
