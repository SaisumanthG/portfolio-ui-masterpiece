import { motion } from "framer-motion";
import { Award, ImageIcon, Calendar, Share2, ExternalLink } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";
import { toast } from "sonner";

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<DBRecord[]>([]);

  useEffect(() => {
    setCertificates(getAllRecords("certificates"));
  }, []);

  const handleShare = async (cert: DBRecord) => {
    const shareData: ShareData = {
      title: cert.title as string,
      text: `${cert.title} - Issued by ${cert.issuer}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        // Try sharing with image file if available
        if (cert.image && (cert.image as string).startsWith("data:")) {
          try {
            const parts = (cert.image as string).split(",");
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
          } catch { /* fall through */ }
        }
        await navigator.share(shareData);
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${cert.title} - Issued by ${cert.issuer}\n${window.location.href}`);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Could not share");
      }
    }
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
            <div className="glass-card p-5 rounded-lg h-full">
              <div className="relative w-full h-48 md:h-56 rounded-lg overflow-hidden mb-4 border border-border/20">
                {cert.image ? (
                  <img src={cert.image} alt={cert.title} className="w-full h-full object-contain bg-secondary/30 transition-transform duration-700 group-hover:scale-105" />
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
                  <motion.a whileHover={{ scale: 1.1 }} href={cert.credlyUrl || "mailto:sumanthg.sai@gmail.com"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
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
                <div className="flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Valid: {cert.valid || "2024–2027"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
