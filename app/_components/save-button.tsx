"use client";

import { usePathname, useRouter } from "next/navigation";
import { isSaved, toggleSaved, useAppState } from "@/lib/data/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory";

// A heart that bookmarks a table to Saved. Visitors are asked to log in.
// "overlay" sits on a photo; "labelled" adds a Save word on wider screens,
// like the Save link above an Airbnb listing.
export function SaveButton({
  tableId,
  title,
  variant = "overlay",
}: {
  tableId: string;
  title: string;
  variant?: "overlay" | "labelled";
}) {
  const state = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const saved = isSaved(state, tableId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from Saved` : `Save ${title}`}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const result = await toggleSaved(tableId);
        if ("error" in result) router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }}
      className={`grid size-11 place-items-center rounded-full bg-pine/80 backdrop-blur transition-transform active:scale-90 ${focusRing} ${
        variant === "overlay"
          ? "md:bg-transparent md:backdrop-blur-none md:hover:scale-110"
          : "md:flex md:h-10 md:w-auto md:gap-2 md:bg-transparent md:px-3 md:text-sm md:font-medium md:underline md:underline-offset-4 md:hover:bg-ivory/10"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-6 ${variant === "overlay" ? "md:size-8 md:drop-shadow" : "md:size-5"}`}>
        <path
          d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
          className={saved ? "fill-terracotta-soft" : variant === "overlay" ? "fill-transparent md:fill-black/45" : "fill-transparent"}
          stroke={saved ? "#d88c6a" : "#f6efdf"}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {variant === "labelled" && <span aria-hidden="true" className="hidden md:inline">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
