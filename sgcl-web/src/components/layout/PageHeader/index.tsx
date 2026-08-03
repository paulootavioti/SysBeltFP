import type { ReactNode } from "react";

import "./styles.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-texto">
        <h1>{title}</h1>

        {subtitle && (
          <p>{subtitle}</p>
        )}
      </div>

      {action && <div className="page-header-acao">{action}</div>}
    </div>
  );
}