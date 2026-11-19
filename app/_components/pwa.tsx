"use client";

import { useEffect, useState } from "react";

// The browser's install prompt event (Chrome on Android, Edge, desktop
// Chrome). Not in the DOM type library yet.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "mehman-install-dismissed";

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Private browsing: the banner may come back next visit.
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone and iPad Safari have no install prompt; people add the app from
// the Share menu instead.
function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

// Registers the service worker and offers to install Mehman: the browser's
// prompt on Android, Add to Home Screen steps on iOS.
export function PwaSetup() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
        console.error("[pwa] Service worker didn't register", error);
      });
    }
    if (isStandalone() || wasDismissed()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Give iOS visitors a moment on the page before suggesting it.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIosSafari()) {
      timer = setTimeout(() => {
        setIos(true);
        setHidden(false);
      }, 4000);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (hidden || (!prompt && !ios)) return null;

  const dismiss = () => {
    rememberDismissed();
    setHidden(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Install Mehman"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-ivory/15 bg-[#2a1c12] p-4 text-ivory shadow-[0_10px_40px_rgb(0_0_0/0.5)] md:bottom-6"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- a static icon */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Add Mehman to your home screen</p>
          {ios ? (
            <p className="mt-1 text-sm text-ivory/70">
              Tap{" "}
              <span aria-label="the Share button" className="inline-flex translate-y-0.5">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>{" "}
              Share in Safari, then <span className="font-medium text-ivory">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ivory/70">Open your bookings in one tap, like an app.</p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ivory/60 focus-visible:outline-2 focus-visible:outline-ivory"
        >
          ✕
        </button>
      </div>
      {prompt && (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            setPrompt(null);
            if (choice.outcome === "dismissed") rememberDismissed();
            setHidden(true);
          }}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-terracotta px-5 text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
        >
          Install
        </button>
      )}
    </div>
  );
}
