import { useEffect, useRef } from "react";

// mantém a tela acesa durante a aula (professor sem tempo de ficar
// tocando a tela no meio do tatame). Degrada em silêncio onde não há
// suporte (navigator.wakeLock ausente) ou se o pedido for negado.
export function useWakeLock(ativo: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;

    let cancelado = false;

    async function solicitar() {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelado) {
          sentinel.release().catch(() => {});
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // sem suporte, negado, ou aba em segundo plano — a aula continua
        // funcionando normalmente sem a tela travada ligada.
      }
    }

    solicitar();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        solicitar();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [ativo]);
}
