import { motion } from "framer-motion";
import { Award, ImageIcon, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRecords, type DBRecord } from "@/lib/database";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<DBRecord[]>([]);

  useEffect(() => {
    setCertificates(getAllRecords("certificates"));
  }, []);

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
            className="hover-glass rounded-lg border border-border/40 p-1 bg-secondary/10"
          >
            <div className="glass-card p-5">
              {/* Certificate image */}
              <div className="image-placeholder w-full h-48 md:h-56 flex items-center justify-center mb-4">
                {cert.image ? (
                  <img src={cert.image} alt={cert.title} className="w-full h-full object-cover rounded-sm" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-primary/30" />
                )}
              </div>

              <h3 className="font-heading font-bold text-foreground text-sm mb-1">{cert.title}</h3>
              <p className="text-primary text-xs mb-1">{cert.issuer}</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">Valid: {cert.valid || "2024–2027"}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
