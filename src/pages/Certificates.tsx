import { motion, AnimatePresence } from "framer-motion";
import { Award, ImageIcon, Calendar, Share2, ExternalLink, Eye, X, Download } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";
import { toast } from "sonner";
import { useCustomization } from "@/hooks/use-customization";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<DBRecord[]>([]);
  const [viewCert, setViewCert] = useState<DBRecord | null>(null);
  const customization = useCustomization("certificates");

  useEffect(() => {
    setCertificates(getAllRecords("certificates"));
  }, []);

  const handleShare = async (cert: DBRecord) => {
    const shareData: ShareData = {
      title: cert.title as string,
      text: `${cert.title} - Issued by ${cert.issuer}`,
      url: cert.credlyUrl || window.location.href,
    };
    try {
      if (navigator.share) {
        // Try sharing with file first
        const imgSrc = cert.previewImage || cert.image;
        if (imgSrc && (imgSrc as string).startsWith("data:")) {
          try {
            const parts = (imgSrc as string).split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
            const byteString = atob(parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mime });
            const ext = mime.split("/")[1] || "jpg";
            const file = new File([blob], `${cert.title}.${ext}`, { type: mime });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
              return;
            }
          } catch { /* fall through to text share */ }
        }
        await navigator.share(shareData);
      } else {
        // Fallback: copy link to clipboard
        const text = `${cert.title} - ${cert.issuer}\n${cert.credlyUrl || window.location.href}`;
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        // User didn't cancel, try clipboard fallback
        try {
          await navigator.clipboard.writeText(`${cert.title}\n${cert.credlyUrl || window.location.href}`);
          toast.success("Copied to clipboard!");
        } catch {
          toast.error("Sharing not supported");
        }
      }
    }
  };

  const handleDownloadCert = (cert: DBRecord) => {
    // Download the file if available, otherwise the preview image
    const fileSrc = cert.file || cert.previewImage || cert.image;
    if (fileSrc && (fileSrc as string).startsWith("data:")) {
      const a = document.createElement("a");
      a.href = fileSrc as string;
      const ext = (fileSrc as string).includes("pdf") ? "pdf" : "jpg";
      a.download = `${cert.title}.${ext}`;
      a.click();
      toast.success("Download started!");
    }
  };

  // Get nudge + zoom style
  const getImageStyle = (record: DBRecord, field: string = "image") => {
    const nudgeKey = field + "Nudge";
    if (!record[nudgeKey]) return undefined;
    const parts = (record[nudgeKey] as string).split(",").map(Number);
    return {
      objectPosition: `${50 + (parts[0] || 0)}% ${50 + (parts[1] || 0)}%`,
      transform: `scale(${parts[2] || 1})`,
    };
  };

  // Determine which image to show as preview
  const getDisplayImage = (cert: DBRecord) => {
    return cert.previewImage || cert.image;
  };

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-title mb-8"
      >
        Certifications
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert, i) => (
          <motion.div
            key={cert.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
            variants={cardVariant}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group hover-glass rounded-xl border border-primary/20 bg-gradient-to-br from-secondary/30 to-secondary/10 p-1 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
          >
            <div className="glass-card rounded-lg h-full" style={{ padding: customization.cardPadding || 20 }}>
              <div className="relative w-full rounded-lg overflow-hidden mb-4 border border-border/20" style={{ height: customization.imageHeight || 224 }}>
                {getDisplayImage(cert) ? (
                  <img
                    src={getDisplayImage(cert)}
                    alt={cert.title}
                    className="w-full h-full object-contain bg-secondary/30 transition-transform duration-700 group-hover:scale-105"
                    style={getImageStyle(cert, cert.previewImage ? "previewImage" : "image")}
                  />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-primary/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleShare(cert)} className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.a whileHover={{ scale: 1.1 }} href={cert.credlyUrl as string || "#"} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors ${!cert.credlyUrl ? "opacity-40 pointer-events-none" : ""}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{cert.title}</h3>
                    <p className="text-primary text-xs font-medium">{cert.issuer}</p>
                  </div>
                  <Award className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Valid: {cert.valid || "2024–2027"}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewCert(cert)}
                    className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Certificate Modal */}
      <AnimatePresence>
        {viewCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setViewCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setViewCert(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
              <div className="glass-card p-4 rounded-xl">
                {getDisplayImage(viewCert) ? (
                  <img src={getDisplayImage(viewCert)} alt={viewCert.title} className="w-full rounded-lg mb-4 max-h-[70vh] object-contain" />
                ) : (
                  <div className="w-full h-64 image-placeholder flex items-center justify-center rounded-lg mb-4">
                    <ImageIcon className="w-16 h-16 text-primary/20" />
                  </div>
                )}
                <div className="text-center space-y-2">
                  <h3 className="font-heading font-bold text-foreground">{viewCert.title}</h3>
                  <p className="text-primary text-sm">{viewCert.issuer}</p>
                  <button
                    onClick={() => handleDownloadCert(viewCert)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors mt-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
