import { useEffect, useState } from "react";

import { UploadService } from "../../../shared/services/UploadService";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
}

export function AuthenticatedImage({ src, alt }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string>();

  useEffect(() => {
    let ativo = true;
    let url: string | null = null;

    async function carregar() {
      try {
        const blob = await UploadService.buscarImagemBlob(src);
        if (!ativo) return;

        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch {
        // se falhar, quem chama mantém o fallback (iniciais, placeholder etc.)
      }
    }

    setObjectUrl(undefined);
    carregar();

    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!objectUrl) return null;

  return <img src={objectUrl} alt={alt} />;
}
