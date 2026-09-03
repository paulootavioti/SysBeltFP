import { useEffect } from "react";

export function useAtalhoPaletaComandos() {
  useEffect(() => {
    function registrarAtalho(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        // Ponto de integração reservado para a paleta de comandos de uma fase futura.
      }
    }

    document.addEventListener("keydown", registrarAtalho);
    return () => document.removeEventListener("keydown", registrarAtalho);
  }, []);
}
