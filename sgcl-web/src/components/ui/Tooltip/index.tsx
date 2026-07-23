import type { ReactNode } from "react";

import "./styles.css";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="tooltip">
      <span className="tooltip-trigger">{children}</span>
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
