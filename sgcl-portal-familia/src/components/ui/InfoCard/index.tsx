import type { ReactNode } from "react";

import "./styles.css";

interface InfoCardProps {
  title: string;
  value: ReactNode;
  description?: string;
}

export function InfoCard({
  title,
  value,
  description,
}: InfoCardProps) {
  return (
    <article className="sgcl-info-card">
      <span>{title}</span>

      <strong>{value}</strong>

      {description && <p>{description}</p>}
    </article>
  );
}