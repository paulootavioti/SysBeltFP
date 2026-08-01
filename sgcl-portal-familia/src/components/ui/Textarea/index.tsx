import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import "./styles.css";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ label, error, ...props }, ref) => {
  return (
    <label className="textarea-group">
      <span className="textarea-label">
        {label}
      </span>

      <textarea
        ref={ref}
        className={`textarea ${
          error ? "textarea-error" : ""
        }`}
        {...props}
      />

      {error && (
        <span className="textarea-error-message">
          {error}
        </span>
      )}
    </label>
  );
});

Textarea.displayName = "Textarea";