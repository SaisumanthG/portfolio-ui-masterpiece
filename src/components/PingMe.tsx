import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Mail, Linkedin, Phone } from "lucide-react";

const contacts = [
  { icon: Mail, label: "Email", href: "mailto:sumanthg.sai@gmail.com", color: "bg-rose-500" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/sai-sumanth-g-9b22362b6", color: "bg-blue-600" },
  { icon: Phone, label: "Mobile", href: "tel:9025208253", color: "bg-emerald-500" },
];

export default function PingMe() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-50">
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
            className="absolute right-0 top-full mt-3 flex flex-col items-end gap-3"
          >
            <div className="flex items-center gap-4">
              {contacts.map((c, i) => (
                <motion.a
                  key={c.label}
                  href={c.href}
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
            </div>
            {/* Arrow nav */}
            <div className="flex gap-2">
              <div className="glass-pill w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground text-sm">‹</div>
              <div className="glass-pill w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground text-sm">›</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
