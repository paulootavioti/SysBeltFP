import type { ReactNode } from "react";
import "./styles.css";

interface CardProps {
  titulo?: string;
  valor?: string | number;
  children?: ReactNode;
  className?: string;
}

export function Card({
  titulo,
  valor,
  children,
  className,
}: CardProps) {
  return (
    <div className={`card${className ? ` ${className}` : ""}`}>
      {titulo && <p>{titulo}</p>}
      {valor !== undefined && <h2>{valor}</h2>}
      {children}
    </div>
  );
}