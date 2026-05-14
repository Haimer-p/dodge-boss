import { DisguiseMode } from "@/lib/types";

interface ModeIconProps {
  mode: DisguiseMode;
  className?: string;
}

export default function ModeIcon({ mode, className = "w-3.5 h-3.5" }: ModeIconProps) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (mode) {
    case "document":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="13" y2="17" />
        </svg>
      );
    case "code-editor":
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "terminal":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="6 10 10 14 6 18" />
          <line x1="12" y1="18" x2="18" y2="18" />
        </svg>
      );
    case "kanban":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="5" height="18" rx="1" />
          <rect x="10" y="3" width="5" height="12" rx="1" />
          <rect x="17" y="3" width="5" height="15" rx="1" />
        </svg>
      );
    case "spreadsheet":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      );
    case "email":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m2 7 10 7 10-3" />
          <path d="M2 7v11h20V7" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "music":
      return (
        <svg {...props}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <polygon points="10 9 16 12 10 15" fill="currentColor" stroke="none" />
        </svg>
      );
    case "google":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "caro":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "arcade":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M14 10h6M14 14h4" />
        </svg>
      );
    case "chess":
      return (
        <svg {...props}>
          <path d="M8 3h8v3H8zM7 8h10v2H7zM6 12h12v2H6zM5 16h14v3H5z" />
        </svg>
      );
    case "xiangqi":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
          <circle cx="12" cy="8" r="2" />
        </svg>
      );
    case "bowling":
      return (
        <svg {...props}>
          <circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" />
          <path d="M8 6a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0V6z" />
        </svg>
      );
    case "vocabulary":
      return (
        <svg {...props}>
          <path d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h14v2H4v-2z" />
          <path d="M18 10h2v8h-2v-8z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
