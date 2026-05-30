"use client";

import React, { useState, useEffect } from "react";
import { Share2, Check, Link2, Mail, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import Modal from "@/components/Helpful/Buttons/Modal";

const tileContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const tileItem = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: { opacity: 1, scale: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/*  Platform definitions                                              */
/* ------------------------------------------------------------------ */

interface SharePlatform {
  name: string;
  color: string;
  buildUrl: (url: string, text: string, title: string) => string;
  icon: React.ReactNode;
}

/* ---- Primary social platforms (shown as large branded buttons) ---- */
const PRIMARY_PLATFORMS: SharePlatform[] = [
  {
    name: "Facebook",
    color: "#1877F2",
    buildUrl: (url, text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    color: "#E4405F",
    buildUrl: (url, text) =>
      `https://www.instagram.com/?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    color: "#25D366",
    buildUrl: (url, text) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "Snapchat",
    color: "#FFFC00",
    buildUrl: (url, text) =>
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.237.195-.088.39-.137.584-.137.317 0 .6.13.749.353a.73.73 0 01.052.643c-.083.24-.264.432-.523.565-.088.045-.188.089-.29.133-.509.218-1.279.55-1.498 1.08-.064.153-.062.312.008.463.158.352.487.937.892 1.41.696.818 1.456 1.261 1.78 1.367a.263.263 0 01.061.028c.254.136.392.33.415.568.036.397-.27.728-.584.948-.386.269-.812.426-1.03.496a3.43 3.43 0 01-.263.074c-.067.02-.127.041-.186.067a.822.822 0 00-.288.2c-.058.073-.098.194-.098.382a2.28 2.28 0 01-.028.302 1.05 1.05 0 01-.262.55c-.307.33-.762.468-1.188.468-.252 0-.497-.04-.681-.088-.33-.087-.619-.165-.938-.165-.136 0-.27.012-.399.038-.464.091-.924.37-1.415.662-.653.387-1.39.825-2.314.825h-.05c-.924 0-1.661-.438-2.314-.825-.491-.292-.951-.571-1.415-.662a2.59 2.59 0 00-.399-.038c-.319 0-.608.078-.938.165-.184.048-.429.088-.681.088-.426 0-.882-.138-1.188-.468a1.05 1.05 0 01-.262-.55 2.287 2.287 0 01-.028-.302c0-.188-.04-.309-.098-.382a.822.822 0 00-.288-.2c-.058-.026-.118-.047-.186-.067a3.43 3.43 0 01-.263-.074c-.218-.07-.644-.227-1.03-.496-.314-.22-.62-.551-.584-.948.023-.238.161-.432.415-.568a.263.263 0 00.061-.028c.324-.106 1.084-.549 1.78-1.367.405-.473.734-1.058.892-1.41.07-.151.072-.31.008-.463-.22-.53-.989-.862-1.498-1.08a4.166 4.166 0 01-.29-.133c-.259-.133-.44-.325-.523-.565a.73.73 0 01.052-.643c.148-.222.432-.353.749-.353.195 0 .39.049.584.137.264.118.622.22.922.237.198 0 .326-.045.401-.09a7.032 7.032 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.86 1.069 11.216.793 12.206.793z" />
      </svg>
    ),
  },
];

/* ---- Default / utility share options ---- */
const DEFAULT_OPTIONS: SharePlatform[] = [
  {
    name: "Email",
    color: "#EA4335",
    buildUrl: (url, text, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    icon: <Mail className="h-5 w-5" />,
  },
  {
    name: "X",
    color: "#000000",
    buildUrl: (url, text) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    color: "#0A66C2",
    buildUrl: (url, _text, title) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    color: "#E60023",
    buildUrl: (url, text) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  ShareButton                                                       */
/*  Two‑section popup: branded social row  +  default utilities       */
/* ------------------------------------------------------------------ */

export interface ShareButtonProps {
  /** Full URL to share (falls back to window.location.href) */
  url?: string;
  /** Pre‑filled text / description */
  text: string;
  /** Title used as the share subject / headline */
  title: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Visual variant */
  variant?: "icon" | "button" | "outline";
  /** Additional CSS class */
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  text,
  title,
  size = "md",
  variant = "button",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolve the absolute URL on the client only. Reading window.location
  // during render produced different HTML on server vs. client and
  // triggered hydration warnings on every car detail page.
  const [resolvedUrl, setResolvedUrl] = useState<string>(
    typeof url === "string" && url.startsWith("http") ? url : ""
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = url ?? window.location.href;
    if (raw.startsWith("http")) setResolvedUrl(raw);
    else setResolvedUrl(`${window.location.origin}${raw}`);
  }, [url]);

  const handleShare = (platform: SharePlatform) => {
    const shareUrl = platform.buildUrl(resolvedUrl, text, title);

    /* Instagram doesn't have a web share URL — copy link + open profile */
    if (platform.name === "Instagram") {
      navigator.clipboard
        .writeText(`${text}\n${resolvedUrl}`)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {});
      window.open(
        "https://www.instagram.com/",
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    setOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = resolvedUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ---- Size classes ---- */
  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-base gap-2",
  };

  const iconOnlySizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  /* ---- Variant classes ---- */
  const variantClasses = {
    button: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
    outline:
      "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    icon: "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100",
  };

  const isIconOnly = variant === "icon";

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share this page"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 460, damping: 22 }}
        className={`inline-flex cursor-pointer items-center justify-center rounded-xl font-medium ${
          isIconOnly
            ? `${iconOnlySizes[size]} ${variantClasses.icon}`
            : `${sizeClasses[size]} ${variantClasses[variant]}`
        }`}
      >
        <Share2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {!isIconOnly && <span>Share</span>}
      </motion.button>

      {/* ============================================================ */}
      {/*  Modal — centred on screen via the reusable Modal component  */}
      {/* ============================================================ */}
      {open && (
        <Modal onClose={() => setOpen(false)} size="sm" variant="clean">
          <div className="px-5 pt-5 pb-2">
            <h3 className="text-base font-semibold text-gray-900">
              Share this listing
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Choose a platform to share on
            </p>
          </div>

          {/* -------------------------------------------------- */}
          {/*  Section 1 — Primary social (branded buttons)      */}
          {/* -------------------------------------------------- */}
          <div className="px-5 pt-2 pb-2">
            <p className="mb-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              Share on Social
            </p>
            <motion.div
              variants={tileContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-4 gap-2"
            >
              {PRIMARY_PLATFORMS.map((platform) => (
                <motion.button
                  key={platform.name}
                  type="button"
                  onClick={() => handleShare(platform)}
                  variants={tileItem}
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 480, damping: 22 }}
                  className="flex flex-col items-center gap-2 rounded-2xl py-3 hover:bg-gray-50"
                  aria-label={`Share on ${platform.name}`}
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
                    style={{
                      backgroundColor:
                        platform.name === "Snapchat"
                          ? "#FFFC00"
                          : platform.color,
                    }}
                  >
                    <span
                      className={
                        platform.name === "Snapchat"
                          ? "text-gray-900"
                          : "text-white"
                      }
                    >
                      {platform.icon}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-gray-600">
                    {platform.name}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-gray-100" />

          {/* -------------------------------------------------- */}
          {/*  Section 2 — Default share options (utilities)      */}
          {/* -------------------------------------------------- */}
          <div className="px-5 pt-3 pb-2">
            <p className="mb-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              More Options
            </p>
            <div className="space-y-0.5">
              {DEFAULT_OPTIONS.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleShare(option)}
                  className="group/opt flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-50"
                  aria-label={`Share via ${option.name}`}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 group-hover/opt:scale-105"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = option.color;
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.color = "";
                    }}
                  >
                    {option.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover/opt:text-gray-900">
                    {option.name}
                  </span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover/opt:opacity-100" />
                </button>
              ))}

              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="group/opt flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-50"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 group-hover/opt:scale-105 ${
                    copied
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    copied
                      ? "text-emerald-600"
                      : "text-gray-700 group-hover/opt:text-gray-900"
                  }`}
                >
                  {copied ? "Link copied!" : "Copy link"}
                </span>
              </button>
            </div>
          </div>

          {/* Instagram hint toast */}
          {copied && (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>Link &amp; caption copied — paste it in your post!</span>
            </div>
          )}

          {/* Bottom spacing when no toast */}
          {!copied && <div className="h-3" />}
        </Modal>
      )}
    </div>
  );
};

export default ShareButton;
