import { useEffect, useState, type ReactNode } from "react";
import { LuCalendarDays, LuCircleUserRound, LuFileText, LuLockKeyhole, LuShoppingBag } from "react-icons/lu";
import { AgendaTab } from "./AgendaTab";
import { ContaTab } from "./ContaTab";
import { DocumentosTab } from "./DocumentosTab";
import { LojaTab } from "./LojaTab";
import { PrivacidadeTab } from "./PrivacidadeTab";

type Destino = "loja" | "documentos" | "agenda" | "conta" | "privacidade";

const itens: Array<{ value: Destino; label: string; Icon: typeof LuShoppingBag }> = [
  { value: "loja", label: "Loja", Icon: LuShoppingBag },
  { value: "documentos", label: "Documentos", Icon: LuFileText },
  { value: "agenda", label: "Agenda", Icon: LuCalendarDays },
  { value: "conta", label: "Conta", Icon: LuCircleUserRound },
  { value: "privacidade", label: "Privacidade", Icon: LuLockKeyhole },
];

export function MaisTab({ alunoId, abrirPrivacidadeEm = 0 }: { alunoId: number; abrirPrivacidadeEm?: number }) {
  const [destino, setDestino] = useState<Destino | null>(null);
  useEffect(() => {
    if (abrirPrivacidadeEm > 0) setDestino("privacidade");
  }, [abrirPrivacidadeEm]);
  if (destino) {
    const conteudo: Record<Destino, ReactNode> = {
      loja: <LojaTab alunoId={alunoId} />,
      documentos: <DocumentosTab alunoId={alunoId} />,
      agenda: <AgendaTab alunoId={alunoId} />,
      conta: <ContaTab />,
      privacidade: <PrivacidadeTab alunoId={alunoId} />,
    };
    return <div className="mais-conteudo"><button type="button" className="mais-voltar" onClick={() => setDestino(null)}>← Mais</button>{conteudo[destino]}</div>;
  }
  return <div className="mais-menu" aria-label="Mais opções">{itens.map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => setDestino(value)}><Icon aria-hidden /><span>{label}</span><b aria-hidden>›</b></button>)}</div>;
}
