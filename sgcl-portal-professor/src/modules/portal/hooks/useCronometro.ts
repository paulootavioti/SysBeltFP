import { useEffect, useState } from "react";

export function useCronometro(iniciadoEm: number) {
  // parte igual a iniciadoEm (sem chamar Date.now() durante a renderização
  // — regra de pureza dos hooks) e corrige pro valor real assim que o
  // efeito roda, um tick depois.
  const [agora, setAgora] = useState(iniciadoEm);

  useEffect(() => {
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const segundosTotais = Math.max(0, Math.floor((agora - iniciadoEm) / 1000));
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
