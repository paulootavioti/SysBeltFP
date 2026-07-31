import type { SelectHTMLAttributes } from "react";

import "./styles.css";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: readonly SelectOption[];
}

export function Select({
  label,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <label className="select-wrapper">
      {label && <span>{label}</span>}

      <select className={`select${className ? ` ${className}` : ""}`} {...props}>
        <option value="">Selecione</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}