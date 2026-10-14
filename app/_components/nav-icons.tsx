import type { ReactNode } from "react";

// Line icons shared by the phone tabs and the desktop header.
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-6",
};

export const navIcons: Record<string, ReactNode> = {
  explore: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  ),
  trips: (
    <svg {...iconProps}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  experiences: (
    <svg {...iconProps}>
      <path d="M3 13h18" />
      <path d="M5 13a7 7 0 0 1 14 0" />
      <path d="M12 6V4.5M4 17h16" />
    </svg>
  ),
  review: (
    <svg {...iconProps}>
      <path d="M9 11l2 2 4-4" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  ),
  hosts: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M18 14c1.5.7 2.6 2.5 3 5" />
    </svg>
  ),
  saved: (
    <svg {...iconProps}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  account: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  today: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  requests: (
    <svg {...iconProps}>
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
      <path d="M6 5h12l2 8v6H4v-6z" />
    </svg>
  ),
  table: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M2 5v6M2 8h1.5M22 5v14" />
    </svg>
  ),
  earnings: (
    <svg {...iconProps}>
      <path d="M7 5h10M7 9h10M9 5c4 0 5 2 5 4s-2 4-6 4l7 6" />
    </svg>
  ),
};
