import { useEffect, useRef, useState } from "react";

import { Button } from "../../../../../components/ui/Button";
import "./Etapa4Foto.css";
import { formatarDataExtenso } from "../../../../../utils/formatarData";

interface Etapa4FotoProps {
  totalPresentes: number;
  horarioInicio: string;
  data: string;
  onPublicar: (arquivo: File, legenda: string, visivelNaLanding: boolean) => Promise<void>;
}

function diaDaSemana(data: string) {
  return formatarDataExtenso(data, { weekday: "long" });
}

export function Etapa4Foto({ totalPresentes, horarioInicio, data, onPublicar }: Etapa4FotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legenda, setLegenda] = useState(`Treino ${horarioInicio} · ${diaDaSemana(data)}`);
  const [visivelNaLanding, setVisivelNaLanding] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivoEscolhido = e.target.files?.[0];
    if (!arquivoEscolhido) return;

    setArquivo(arquivoEscolhido);
    setEnviado(false);
    setPreview(URL.createObjectURL(arquivoEscolhido));
  }

  async function handlePublicar() {
    if (!arquivo) return;
    try {
      setEnviando(true);
      setErro("");
      await onPublicar(arquivo, legenda, visivelNaLanding);
      setEnviado(true);
    } catch {
      setErro("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="etapa-foto">
      <button type="button" className="etapa-foto-area" onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="Prévia da foto do treino" />
        ) : (
          <span className="etapa-foto-placeholder">
            <span aria-hidden="true">📷</span>
            Toque para tirar ou escolher uma foto
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="etapa-foto-input-oculto"
        onChange={handleEscolherArquivo}
      />

      <label className="etapa-foto-campo">
        <span>Legenda</span>
        <input
          type="text"
          value={legenda}
          onChange={(e) => {
            setLegenda(e.target.value);
            setEnviado(false);
          }}
        />
      </label>

      <label className="etapa-foto-checkbox">
        <input
          type="checkbox"
          checked={visivelNaLanding}
          onChange={(e) => {
            setVisivelNaLanding(e.target.checked);
            setEnviado(false);
          }}
        />
        <span>
          <strong>Publicar também na galeria pública</strong>
          <span className="etapa-foto-checkbox-apoio">
            {visivelNaLanding
              ? `Vai para a galeria da academia e para as famílias ${totalPresentes === 1 ? "do aluno presente" : `dos ${totalPresentes} alunos presentes`}.`
              : `Vai só para as famílias ${totalPresentes === 1 ? "do aluno presente" : `dos ${totalPresentes} alunos presentes`}.`}
          </span>
        </span>
      </label>

      {erro && <p className="etapa-foto-erro">{erro}</p>}

      <Button onClick={handlePublicar} disabled={!arquivo || enviando || enviado}>
        {enviado ? "Foto enviada ✓" : enviando ? "Enviando..." : "Enviar foto"}
      </Button>
    </div>
  );
}
