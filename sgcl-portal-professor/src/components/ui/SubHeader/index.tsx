import { useNavigate } from "react-router-dom";
import "./styles.css";

interface SubHeaderProps {
  titulo: string;
  subtitulo?: string;
  aoVoltar?: () => void;
}

export function SubHeader({ titulo, subtitulo, aoVoltar }: SubHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sub-header">
      <button
        type="button"
        className="sub-header-voltar"
        onClick={aoVoltar ?? (() => navigate("/home"))}
        aria-label="Voltar"
      >
        ←
      </button>
      <div className="sub-header-titulo">
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
    </header>
  );
}
