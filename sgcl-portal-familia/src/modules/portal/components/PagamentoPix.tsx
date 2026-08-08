import { useEffect, useRef, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { PortalService } from "../services/PortalService";
import type { Mensalidade, ResultadoPagamento } from "../types";
import "./PagamentoPix.css";

interface PagamentoPixProps {
  mensalidadeId: number;
  alunoId: number;
  cobranca: ResultadoPagamento;
  onPago: () => void;
}

// Depois de pagar no app do banco, quem confirma pro sistema é o webhook
// do gateway — não o navegador. Sem consultar de tempos em tempos, o pai
// pagaria e ficaria olhando uma tela parada, sem saber se deu certo.
const INTERVALO_CONSULTA_MS = 5000;

// Cinco minutos batendo no servidor já cobre o caso normal (PIX cai em
// segundos). Passou disso, provavelmente a pessoa fechou o app do banco.
const TENTATIVAS_MAXIMAS = 60;

function formatarContagem(milissegundos: number): string {
  const total = Math.max(0, Math.floor(milissegundos / 1000));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

export function PagamentoPix({ mensalidadeId, alunoId, cobranca, onPago }: PagamentoPixProps) {
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(true);

  const tentativas = useRef(0);

  // Confirmação automática: pergunta ao servidor se a mensalidade já
  // consta como paga.
  useEffect(() => {
    let ativo = true;

    const timer = setInterval(async () => {
      if (!ativo) return;

      tentativas.current += 1;

      if (tentativas.current > TENTATIVAS_MAXIMAS) {
        setVerificando(false);
        clearInterval(timer);
        return;
      }

      try {
        const mensalidades: Mensalidade[] = await PortalService.mensalidades(alunoId);
        const atual = mensalidades.find((m) => m.id === mensalidadeId);

        if (atual?.status === "PAGA" && ativo) {
          clearInterval(timer);
          onPago();
        }
      } catch {
        // falha de rede não deve derrubar a tela: o QR continua válido e
        // a próxima tentativa acontece em segundos.
      }
    }, INTERVALO_CONSULTA_MS);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [mensalidadeId, alunoId, onPago]);

  // Contagem até o código expirar.
  useEffect(() => {
    if (!cobranca.expiraEm) return;

    const limite = new Date(cobranca.expiraEm).getTime();

    const atualizar = () => setRestante(limite - Date.now());

    atualizar();
    const timer = setInterval(atualizar, 1000);

    return () => clearInterval(timer);
  }, [cobranca.expiraEm]);

  async function copiar() {
    if (!cobranca.pixCopiaECola) return;

    try {
      await navigator.clipboard.writeText(cobranca.pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Safari em contexto não seguro e alguns WebViews bloqueiam a área
      // de transferência. O código continua visível e selecionável.
      setCopiado(false);
    }
  }

  const expirado = restante !== null && restante <= 0;

  return (
    <div className="pagamento-pix">
      {expirado ? (
        <p className="pagamento-pix-expirado">
          Este código PIX expirou. Feche e gere um novo para pagar.
        </p>
      ) : (
        <>
          {cobranca.pixQrCodeBase64 && (
            <img
              className="pagamento-pix-qr"
              src={`data:image/png;base64,${cobranca.pixQrCodeBase64}`}
              alt="QR Code para pagamento via PIX"
            />
          )}

          <p className="pagamento-pix-instrucao">
            Abra o app do seu banco, escolha <strong>PIX</strong> e leia o código acima — ou
            copie e cole:
          </p>

          {cobranca.pixCopiaECola && (
            <>
              <code className="pagamento-pix-codigo">{cobranca.pixCopiaECola}</code>

              <Button type="button" onClick={copiar}>
                {copiado ? "Código copiado" : "Copiar código PIX"}
              </Button>
            </>
          )}

          {restante !== null && (
            <p className="pagamento-pix-contagem">
              Válido por mais {formatarContagem(restante)}
            </p>
          )}

          <p className="pagamento-pix-aguardando">
            {verificando
              ? "Assim que o pagamento cair, esta tela confirma sozinha."
              : "Já pagou? Feche e abra novamente para ver o status atualizado."}
          </p>
        </>
      )}
    </div>
  );
}
