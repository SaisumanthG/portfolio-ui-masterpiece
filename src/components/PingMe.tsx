import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Mail, Linkedin } from "lucide-react";

const whatsappMessage = encodeURIComponent("Hi, I came across your portfolio and would like to connect regarding ");
const whatsappNumber = "919025208253";
const openWhatsApp = () => {
  const appUrl = `whatsapp://send?phone=${whatsappNumber}&text=${whatsappMessage}`;
  const fallbackUrl = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  window.location.href = appUrl;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      if (isMobile) window.location.href = fallbackUrl;
      else window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
  }, 1200);
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

const contacts = [
  { icon: Mail, label: "Email", href: "mailto:sumanthg.sai@gmail.com", color: "bg-rose-500" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/sai-sumanth-g-9b22362b6", color: "bg-blue-600" },
  { icon: WhatsAppIcon, label: "WhatsApp", href: "#", color: "bg-emerald-500", onClick: openWhatsApp },
];

export default function PingMe() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="glass-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        Ping Me
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute right-0 top-full mt-3 flex items-center gap-4"
          >
            {contacts.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                onClick={c.onClick ? (event) => { event.preventDefault(); c.onClick(); } : undefined}
                target={c.label === "LinkedIn" ? "_blank" : undefined}
                rel={c.label === "LinkedIn" ? "noopener noreferrer" : undefined}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`${c.color} w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                  <c.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
