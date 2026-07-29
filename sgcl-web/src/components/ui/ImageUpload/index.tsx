import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { UploadService, type PrefixoUpload } from "../../../shared/services/UploadService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

import "./styles.css";

interface ImageUploadProps {
  label: string;
  valorAtual?: string | null;
  prefixo: PrefixoUpload;
  onChange?: (url: string | undefined) => void;
}

// "financeiro" (comprovante de pagamento) e "contratos" (contrato
// assinado) também aceitam PDF — os demais prefixos continuam sendo só
// foto de perfil.
const ACCEPT_POR_PREFIXO: Record<PrefixoUpload, string> = {
  alunos: "image/*",
  responsaveis: "image/*",
  usuarios: "image/*",
  financeiro: "image/*,application/pdf",
  contratos: "image/*,application/pdf",
};

export function ImageUpload({
  label,
  valorAtual,
  prefixo,
  onChange,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>();
  const [previewEhImagem, setPreviewEhImagem] = useState(true);
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
        setPreviewEhImagem(blob.type.startsWith("image/"));
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
    setPreviewEhImagem(file.type.startsWith("image/"));
    setErro("");

    try {
      setEnviando(true);
      const { url } = await UploadService.enviarFoto(file, prefixo);
      onChange?.(url);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao enviar o arquivo."));
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
          previewEhImagem ? (
            <img
              src={preview}
              alt="Preview"
            />
          ) : (
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="image-upload-arquivo-link"
            >
              📄 Ver arquivo enviado
            </a>
          )
        ) : (

          <span>
            {enviando ? "Enviando..." : "Clique para selecionar um arquivo"}
          </span>

        )}

        <input
          type="file"
          accept={ACCEPT_POR_PREFIXO[prefixo]}
          disabled={enviando}
          onChange={handleChange}
        />

      </label>

      {erro && <p className="image-upload-erro">{erro}</p>}

    </div>
  );
}
