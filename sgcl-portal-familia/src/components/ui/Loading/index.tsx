import "./styles.css";

interface LoadingProps {
  message?: string;
}

export function Loading({
  message = "Carregando..."
}: LoadingProps) {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>

      <p>{message}</p>
    </div>
  );
}