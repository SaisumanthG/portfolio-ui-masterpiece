import { motion } from "framer-motion";
import { Award, ImageIcon, Calendar, Download, Share2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<DBRecord[]>([]);

  useEffect(() => {
    setCertificates(getAllRecords("certificates"));
  }, []);

  const handleShare = async (cert: DBRecord) => {
    const text = `${cert.title} - Issued by ${cert.issuer}`;
    if (navigator.share) {
      try { await navigator.share({ title: cert.title, text, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div>
      <h1 className="page-title mb-8">Certifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert, i) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group hover-glass rounded-xl border border-primary/20 bg-gradient-to-br from-secondary/30 to-secondary/10 p-1 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
          >
            <div className="glass-card p-5 rounded-lg h-full">
              {/* Certificate image */}
              <div className="relative w-full h-48 md:h-56 rounded-lg overflow-hidden mb-4 border border-border/20">
                {cert.image ? (
                  <img src={cert.image} alt={cert.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full image-placeholder flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-primary/20" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Action buttons on hover */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => handleShare(cert)} className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <a href={cert.credlyUrl || "mailto:sumanthg.sai@gmail.com"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
