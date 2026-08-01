import type { InputHTMLAttributes } from "react";
import "./styles.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({
  label,
  ...props
}: InputProps) {
  return (
    <label className="input-wrapper">
      {label && <span>{label}</span>}

      <input
        className="input"
        {...props}
      />
    </label>
  );
}