import "./styles.css";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  retryLabel = "Tentar novamente",
}: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="error-message">
      <span>{message}</span>

      {onRetry && (
        <button type="button" className="error-message-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </p>
  );
}
