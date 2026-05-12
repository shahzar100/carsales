"use client";
import { useEffect, useRef } from "react";

/**
 * (#17) Cloudflare Turnstile widget — invisible CAPTCHA for public forms.
 *
 * Loads the Turnstile script on mount and renders an explicit widget so
 * we control where the challenge appears. `onToken` fires with the
 * verification token; submit that token alongside the form payload and
 * verify it server-side with `verifyTurnstileToken`.
 *
 * If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set the component renders
 * nothing — keeps local dev unblocked. Server-side verification is also
 * a no-op when TURNSTILE_SECRET_KEY is missing (see turnstile.ts).
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";

let scriptLoaded = false;
let scriptLoading = false;
const pendingMounts: Array<() => void> = [];

function ensureScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve();
      return;
    }
    pendingMounts.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;
    // Global onload from the script
    (window as unknown as { onTurnstileLoad?: () => void }).onTurnstileLoad =
      () => {
        scriptLoaded = true;
        scriptLoading = false;
        pendingMounts.forEach((cb) => cb());
        pendingMounts.length = 0;
      };
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  });
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  size?: "normal" | "compact" | "flexible";
}

export default function TurnstileWidget({
  onToken,
  onExpire,
  size = "flexible",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let active = true;

    ensureScript().then(() => {
      if (!active || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onExpire?.(),
        theme: "auto",
        size,
      });
    });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget may already be gone
        }
      }
    };
  }, [siteKey, onToken, onExpire, size]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="my-3" />;
}
