import { motion } from "framer-motion";
import { Award, ImageIcon, Calendar } from "lucide-react";

const certificates = [
  {
    title: "Data Science",
    issuer: "NASSCOM",
  },
  {
    title: "AWS Cloud Practitioner Essentials",
    issuer: "AWS",
  },
  {
    title: "Python for Data Science",
    issuer: "NPTEL",
  },
  {
    title: "Cloud Data Management 2023",
    issuer: "Oracle",
  },
];

export default function CertificatesPage() {
  return (
    <div>
      <h1 className="page-title mb-8">Certifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert, i) => (
          <motion.div
            key={cert.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 card-hover"
          >
            {/* Certificate image placeholder */}
            <div className="image-placeholder w-full h-48 md:h-56 flex items-center justify-center mb-4">
              <ImageIcon className="w-12 h-12 text-primary/30" />
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground text-sm">{cert.title}</h3>
                <p className="text-primary text-xs">{cert.issuer}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Valid: 2024–2027</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
