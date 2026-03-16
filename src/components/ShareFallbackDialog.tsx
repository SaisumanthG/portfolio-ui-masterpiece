import { X, Copy, Share2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { buildPlatformShareLinks, type SharePayload } from "@/lib/share";

interface ShareFallbackDialogProps {
  open: boolean;
  onClose: () => void;
  payload: SharePayload | null;
}

const platformIcons: Record<string, { bg: string; icon: React.ReactNode }> = {
  whatsapp: {
    bg: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  telegram: {
    bg: "#0088cc",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  facebook: {
    bg: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  x: {
    bg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  linkedin: {
    bg: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  email: {
    bg: "#EA4335",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
  copy: {
    bg: "#6B7280",
    icon: <Copy className="w-5 h-5 text-white" />,
  },
  more: {
    bg: "#8B5CF6",
    icon: <MoreHorizontal className="w-5 h-5 text-white" />,
  },
};

// Fallback copy method that works in iframes
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}

export default function ShareFallbackDialog({ open, onClose, payload }: ShareFallbackDialogProps) {
  if (!open || !payload) return null;

  const links = buildPlatformShareLinks(payload);
  const shareUrl = payload.url || window.location.href;

  const handleCopy = async () => {
    const text = `${payload.title}\n${payload.text || ""}\n${shareUrl}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
      return;
    } catch {
      // clipboard API blocked in iframe, try fallback
    }
    if (fallbackCopy(text)) {
      toast.success("Copied to clipboard!");
    } else {
      // Last resort: show text in prompt
      window.prompt("Copy this link:", shareUrl);
    }
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.title, text: payload.text, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const allItems = [
    ...links.filter(l => l.id !== "instagram").map(l => ({
      id: l.id,
      label: l.label,
      onClick: () => window.open(l.href, l.id === "email" ? "_self" : "_blank", "noopener,noreferrer"),
    })),
    { id: "copy", label: "Copy Link", onClick: handleCopy },
    { id: "more", label: "More", onClick: handleMore },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-300"
        style={{
          background: `hsl(var(--card))`,
          border: `1px solid hsl(var(--border))`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground text-lg">Share</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File info card */}
        <div className="rounded-xl border border-border/50 bg-secondary/40 px-4 py-3">
          <p className="text-foreground font-semibold text-sm truncate">{payload.title}</p>
          <p className="text-muted-foreground text-xs truncate mt-0.5">{shareUrl}</p>
        </div>

        {/* Share grid */}
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-wider mb-3">Share using</p>
          <div className="grid grid-cols-4 gap-4">
            {allItems.map((item) => {
              const iconData = platformIcons[item.id];
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95 shadow-lg"
                    style={{ backgroundColor: iconData?.bg || "hsl(var(--primary))" }}
                  >
                    {iconData?.icon || <Share2 className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-foreground text-[11px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
