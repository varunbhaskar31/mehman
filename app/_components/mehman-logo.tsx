// The gold doorway mark: an arched frame around an open door, with leaves
// at its threshold. Redrawn from the Explore artwork.
export function MehmanLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 94"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke="#e8c08f" strokeLinecap="round">
        <path
          d="M37 82V40c0-14 10-25 23-30 13 5 23 16 23 30v42"
          strokeWidth="2.5"
        />
        <path d="M10 82h100" strokeWidth="2.5" />
        <path d="M10 82c-3-3-1-7 3-6M110 82c3-3 1-7-3-6" strokeWidth="2" />
      </g>
      <circle cx="60" cy="8.5" r="2" fill="#e8c08f" />
      <path
        fill="#e8c08f"
        fillRule="evenodd"
        d="M44 82V45c0-9 6-16 16-24 10 8 16 15 16 24v37Zm7 0V55c0-6 4-11 9-16 5 5 9 10 9 16v27Z"
      />
      <g fill="#e8c08f">
        <ellipse cx="22" cy="74" rx="5" ry="2.2" transform="rotate(-25 22 74)" />
        <ellipse cx="27" cy="66" rx="4.5" ry="2" transform="rotate(-65 27 66)" />
        <ellipse cx="32" cy="73" rx="3.5" ry="1.6" transform="rotate(-80 32 73)" />
        <ellipse cx="98" cy="74" rx="5" ry="2.2" transform="rotate(25 98 74)" />
        <ellipse cx="93" cy="66" rx="4.5" ry="2" transform="rotate(65 93 66)" />
        <ellipse cx="88" cy="73" rx="3.5" ry="1.6" transform="rotate(80 88 73)" />
      </g>
    </svg>
  );
}
