import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import "./styles.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, ...props }, ref) => {
  return (
    <label className="textarea-wrapper">
      {label && <span>{label}</span>}
      <textarea ref={ref} className="textarea" {...props} />
    </label>
  );
});

Textarea.displayName = "Textarea";
