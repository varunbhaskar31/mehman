"use client";

import { usePathname, useRouter } from "next/navigation";
import { isSaved, toggleSaved, useDemoState } from "@/lib/demo/store";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory";

// A heart that bookmarks a table to Saved. Visitors are asked to log in.
export function SaveButton({ tableId, title }: { tableId: string; title: string }) {
  const state = useDemoState();
  const router = useRouter();
  const pathname = usePathname();
  const saved = isSaved(state, tableId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from Saved` : `Save ${title}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const result = toggleSaved(tableId);
        if ("error" in result) router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }}
      className={`grid size-11 place-items-center rounded-full bg-pine/80 backdrop-blur transition-transform active:scale-90 ${focusRing}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <path
          d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
          fill={saved ? "#d88c6a" : "none"}
          stroke={saved ? "#d88c6a" : "#f6efdf"}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
