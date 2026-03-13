export interface SharePayload {
  title: string;
  text?: string;
  url?: string;
  dataUrl?: string;
  fileName?: string;
}

export type NativeShareResult = "shared" | "cancelled" | "unavailable";

const isDataUrl = (value?: string): value is string => Boolean(value && value.startsWith("data:"));

const normalizeUrl = (url?: string) => {
  if (!url) return window.location.href;
  const input = url.trim();
  if (!input) return window.location.href;

  try {
    if (/^https?:\/\//i.test(input)) return new URL(input).toString();
    if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(input)) return new URL(`https://${input}`).toString();
    return new URL(input, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

const sanitizeFileName = (input: string) => input.replace(/[^a-z0-9-_\.]/gi, "_");

const getExtensionFromMime = (mime = "") => {
  const lower = mime.toLowerCase();
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  return "bin";
};

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta = "", base64 = ""] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], sanitizeFileName(fileName), { type: mime });
}

async function sourceToFile(source: string, payload: SharePayload): Promise<File | null> {
  try {
    if (isDataUrl(source)) {
      const ext = source.match(/^data:(.*?);/)?.[1]?.split("/")[1] || "bin";
      const name = payload.fileName || `${payload.title}.${ext}`;
      return dataUrlToFile(source, name);
    }

    const sourceUrl = source.startsWith("http") || source.startsWith("blob:")
      ? source
      : new URL(source, window.location.origin).toString();

    const response = await fetch(sourceUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.size) return null;

    const ext = getExtensionFromMime(blob.type);
    const fallbackName = `${payload.title}.${ext}`;
    const name = sanitizeFileName(payload.fileName || fallbackName);
    return new File([blob], name, { type: blob.type || "application/octet-stream" });
  } catch {
    return null;
  }
}

export async function tryNativeShare(payload: SharePayload): Promise<NativeShareResult> {
  if (!navigator.share) return "unavailable";

  const baseShare: ShareData = {
    title: payload.title,
    text: payload.text,
    url: normalizeUrl(payload.url),
  };

  try {
    if (payload.dataUrl) {
      const file = await sourceToFile(payload.dataUrl, payload);
      if (file) {
        const shareData: ShareData = { ...baseShare, files: [file] };
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
          return "shared";
        }
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
  const normalizedUrl = normalizeUrl(payload.url);
  const url = encodeURIComponent(normalizedUrl);
  const textValue = payload.text || payload.title;
  const text = encodeURIComponent(textValue);
  const joined = encodeURIComponent(`${textValue}\n${normalizedUrl}`);
  const mailSubject = encodeURIComponent(payload.title);
  const mailBody = encodeURIComponent(`${textValue}\n\n${normalizedUrl}`);

  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${joined}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${url}&text=${text}` },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${url}&text=${text}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { id: "email", label: "Email", href: `mailto:?subject=${mailSubject}&body=${mailBody}` },
  ];
}
