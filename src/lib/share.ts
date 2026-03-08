export interface SharePayload {
  title: string;
  text?: string;
  url?: string;
  dataUrl?: string;
  fileName?: string;
}

export type NativeShareResult = "shared" | "cancelled" | "unavailable";

const isDataUrl = (value?: string): value is string => Boolean(value && value.startsWith("data:"));

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

const normalizeUrl = (url?: string) => {
  if (!url) return window.location.href;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

export async function tryNativeShare(payload: SharePayload): Promise<NativeShareResult> {
  if (!navigator.share) return "unavailable";

  const baseShare: ShareData = {
    title: payload.title,
    text: payload.text,
    url: normalizeUrl(payload.url),
  };

  try {
    if (isDataUrl(payload.dataUrl)) {
      const extension = payload.dataUrl.match(/^data:(.*?);/)?.[1]?.split("/")[1] || "bin";
      const file = dataUrlToFile(payload.dataUrl, payload.fileName || `${payload.title}.${extension}`);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...baseShare, files: [file] });
        return "shared";
      }
    }

    await navigator.share(baseShare);
    return "shared";
  } catch (error: any) {
    if (error?.name === "AbortError") return "cancelled";
    return "unavailable";
  }
}

export function buildPlatformShareLinks(payload: SharePayload) {
  const url = encodeURIComponent(normalizeUrl(payload.url));
  const text = encodeURIComponent(payload.text || payload.title);
  const joined = encodeURIComponent(`${payload.text || payload.title}\n${normalizeUrl(payload.url)}`);
  const mailSubject = encodeURIComponent(payload.title);
  const mailBody = encodeURIComponent(`${payload.text || payload.title}\n\n${normalizeUrl(payload.url)}`);

  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${joined}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${url}&text=${text}` },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${url}&text=${text}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { id: "email", label: "Email", href: `mailto:?subject=${mailSubject}&body=${mailBody}` },
  ];
}
