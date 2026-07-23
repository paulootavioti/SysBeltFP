import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { UploadService } from "../../../shared/services/UploadService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

import "./styles.css";

interface ImageUploadProps {
  label: string;
  valorAtual?: string | null;
  prefixo: "alunos" | "responsaveis" | "usuarios";
  onChange?: (url: string | undefined) => void;
}

export function ImageUpload({
  label,
  valorAtual,
  prefixo,
  onChange,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    let objectUrl: string | null = null;

    async function carregarPreviewAtual() {
      if (!valorAtual) return;

      try {
        const blob = await UploadService.buscarImagemBlob(valorAtual);
        if (!ativo) return;

        objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
      } catch {
        // preview é só cosmético — se falhar, mantém o placeholder
      }
    }

    carregarPreviewAtual();

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [valorAtual]);

  async function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(undefined);
      onChange?.(undefined);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setErro("");

    try {
      setEnviando(true);
      const { url } = await UploadService.enviarFoto(file, prefixo);
      onChange?.(url);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao enviar a imagem."));
      onChange?.(undefined);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="image-upload">

      <label className="image-upload-label">
        {label}
      </label>

      <label className="image-upload-box">

        {preview ? (

          <img
            src={preview}
            alt="Preview"
          />

        ) : (

          <span>
            {enviando ? "Enviando..." : "Clique para selecionar uma imagem"}
          </span>

        )}

        <input
          type="file"
          accept="image/*"
          disabled={enviando}
          onChange={handleChange}
        />

      </label>

      {erro && <p className="image-upload-erro">{erro}</p>}

    </div>
  );
}
