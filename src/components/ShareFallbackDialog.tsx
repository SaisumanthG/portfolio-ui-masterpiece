import { X, Copy, ExternalLink, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { buildPlatformShareLinks, type SharePayload } from "@/lib/share";

interface ShareFallbackDialogProps {
  open: boolean;
  onClose: () => void;
  payload: SharePayload | null;
}

const getShareHint = () => {
  if (window.top !== window.self) {
    return "Native share sheet can be limited in preview. Open this app on your phone or in a new tab for full device share options.";
  }
  return "Pick an app below to continue sharing.";
};

export default function ShareFallbackDialog({ open, onClose, payload }: ShareFallbackDialogProps) {
  if (!open || !payload) return null;

  const links = buildPlatformShareLinks(payload);

  const handleCopy = async () => {
    const text = `${payload.title}\n${payload.text || ""}\n${payload.url || window.location.href}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied share content");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-semibold text-foreground">Share</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {payload.fileName && (
          <div className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <FileText className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-foreground font-medium truncate">{payload.fileName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{payload.title}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{getShareHint()}</p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Share using</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {links.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target={item.id === "email" ? undefined : "_blank"}
                rel={item.id === "email" ? undefined : "noopener noreferrer"}
                className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-xs text-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{item.label}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy share content
        </button>
      </div>
    </div>
  );
}
